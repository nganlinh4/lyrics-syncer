import os
import json
import sys
from datetime import datetime
from typing import List, Dict
import requests
import io
import base64
from PIL import Image
from google import genai
from google.genai import types
from utils import clean_gemini_response, save_debug_file, get_audio_duration

def match_lyrics_with_gemini(audio_path: str, lyrics: List[str], model_name: str) -> List[Dict]:
    """Match lyrics to audio using Gemini, uploading the audio via the File API."""
    try:
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        if not config.get('geminiApiKey'):
            raise ValueError("Gemini API key not found in config")

        filtered_lyrics = [line for line in lyrics if not line.strip().startswith('[') and line.strip()]

        client = genai.Client(api_key=config['geminiApiKey'])

        prompt = f"""
Task: Analyze the provided audio and match its content with the given lyrics lines. The audio may be in any language.

Use this JSON schema for output:
LyricLine = {{'start': float, 'end': float, 'text': str, 'language': str}}
For language field, use the correct language code (e.g., 'ko' for Korean, 'en' for English, 'ja' for Japanese).
Return: list[LyricLine]

Requirements:
1. Each lyric line's timing must be derived directly from the audio. Each segment's duration cannot be too short, consider extending the end timing in many cases when there is still vocal playing.
2. Every lyric line must have corresponding start and end times. Also best practice is the end timing of the previous matches or being close to the start of the next segment's start timing, when feasible.
3. Output must be valid JSON with no extra text.
4. The 'text' field in your output MUST EXACTLY match the lines from 'Lyrics lines' below.
5. The provided audio may be in any language. Analyze the audio content to determine timing.
6. >>> CRITICAL: Detect and set the correct language code for each lyric line based on its content (e.g., 'ko' for Korean text).
7. >>> CRITICAL information: This song's duration is {get_audio_duration(audio_path)} seconds, so think carefully about the last lyrics timing, it CANNOT BE LONGER.
8. If the provided lyrics have romanized Korean, turn it to actual Korean when responding.

Lyrics lines:
{json.dumps(filtered_lyrics, indent=2, ensure_ascii=False)}

IMPORTANT: Your output must contain EXACTLY the same lines as provided in 'Lyrics lines' above, and the timing MUST come from analyzing the audio content. Return ONLY the JSON array following the schema, no other text.
"""

        try:
            myfile = client.files.upload(file=audio_path)
        except Exception as upload_error:
            raise RuntimeError(f"Error uploading file to Gemini File API: {upload_error}")

        if not model_name:
            raise ValueError("Model name is required")

        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, myfile]
        )

        response_text = response.text

        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        prompt_file = save_debug_file(f'gemini_prompt_{timestamp}.txt', prompt)
        debug_file = save_debug_file(f'gemini_response_{timestamp}.txt', response_text)
        print(f"Debug files saved: {prompt_file}, {debug_file}", file=sys.stderr)

        cleaned_response = clean_gemini_response(response_text, debug_file)
        matched_lyrics = json.loads(cleaned_response)

        cleaned_matches = []
        for match in matched_lyrics:
            cleaned_matches.append(dict(match))

        return cleaned_matches

    except Exception as e:
        print(f"Error matching lyrics with Gemini: {str(e)}", file=sys.stderr)
        raise

def generate_prompt_with_gemini(lyrics, model_name, song_name):
    """Generate image prompt from lyrics using Gemini."""
    try:
        VALID_PROMPT_MODELS = [
            'gemini-2.0-flash-lite',
            'gemini-2.5-pro-exp-03-25'
        ]

        if model_name not in VALID_PROMPT_MODELS:
            raise ValueError(f"Invalid prompt generation model. Must be one of: {', '.join(VALID_PROMPT_MODELS)}")

        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        if not config.get('geminiApiKey'):
            raise ValueError("Gemini API key not found in config")

        client = genai.Client(api_key=config['geminiApiKey'])

        prompt = f"""
song title: {song_name}

{lyrics}

generate one prompt to put in a image generator to describe the atmosphere/object of this song, should be simple but abstract because I will use this image as youtube video background for a lyrics video, return the prompt only, no extra texts
"""

        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )

        result = {
            "prompt": response.text,
            "model": model_name,
            "status": "success"
        }

        print(json.dumps(result), file=sys.stdout)

        return result

    except Exception as e:
        print(f"Error generating prompt with Gemini: {str(e)}", file=sys.stderr)
        raise

def generate_image_with_gemini(prompt, album_art_url, model_name):
    """Generate image using prompt and album art with Gemini."""
    try:
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        if not config.get('geminiApiKey'):
            raise ValueError("Gemini API key not found in config")

        client = genai.Client(api_key=config['geminiApiKey'])

        final_prompt = f"Expand the image into 16:9 ratio (landscape ratio). Then decorate my given image with {prompt}"

        if isinstance(album_art_url, str) and album_art_url.startswith('data:'):
            base64_data = album_art_url.split(',')[1]
            image_bytes = base64.b64decode(base64_data)
            image = Image.open(io.BytesIO(image_bytes))
        elif os.path.exists(album_art_url):
            print(f"Using local album art file: {album_art_url}", file=sys.stderr)
            with open(album_art_url, 'rb') as f:
                image_bytes = f.read()
                image = Image.open(io.BytesIO(image_bytes))
        else:
            try:
                print(f"Attempting to download album art from URL: {album_art_url}", file=sys.stderr)
                response = requests.get(album_art_url)
                if response.status_code != 200:
                    raise ValueError("Failed to download album art")
                image = Image.open(io.BytesIO(response.content))
            except Exception as download_error:
                print(f"Error downloading album art: {str(download_error)}", file=sys.stderr)
                raise ValueError(f"Failed to download album art: {str(download_error)}")

        response = client.models.generate_content(
            model=model_name,
            contents=[final_prompt, image],
            config=types.GenerateContentConfig(response_modalities=["Text", "Image"])
        )

        image_part = None
        if hasattr(response, 'candidates'):
            for candidate in response.candidates:
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data.mime_type.startswith('image/'):
                            image_part = part
                            break
                if image_part:
                    break

        if not image_part:
            raise ValueError("No image was generated in the response")

        image_bytes = image_part.inline_data.data
        # Don't print debug info about the image data to avoid cluttering the terminal
        return {
            "data": base64.b64encode(image_bytes).decode('utf-8'),
            "mime_type": image_part.inline_data.mime_type
        }

    except Exception as e:
        print(f"Error generating image with Gemini: {str(e)}", file=sys.stderr)
        raise