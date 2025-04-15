import argparse
import os
import sys
import json
from typing import List, Dict
from utils import check_ffmpeg, clean_lyrics_text
from gemini_service import (
    match_lyrics_with_gemini,
    generate_prompt_with_gemini,
    generate_image_with_gemini
)

def match_lyrics(audio_path: str, lyrics: List[str], model: str) -> Dict:
    """Main function to process audio and match lyrics"""
    try:
        matched_lyrics = match_lyrics_with_gemini(audio_path, lyrics, model)
        if not matched_lyrics:
            raise ValueError("Failed to match lyrics")

        result = {
            "matched_lyrics": matched_lyrics,
            "detected_language": "en",
            "status": "success"
        }

        json_result = json.dumps(result, ensure_ascii=False, indent=2)
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout.buffer.write(json_result.encode('utf-8'))
            sys.stdout.buffer.write(b'\n')
            sys.stdout.buffer.flush()
        else:
            print(json_result)
            sys.stdout.flush()

    except Exception as e:
        error_result = {
            "error": str(e),
            "status": "error"
        }
        error_json = json.dumps(error_result, ensure_ascii=False)

        if hasattr(sys.stderr, 'buffer'):
            sys.stderr.buffer.write(error_json.encode('utf-8'))
            sys.stderr.buffer.write(b'\n')
            sys.stderr.buffer.flush()
        else:
            print(error_json, file=sys.stderr)
        sys.exit(1)

def setup_argparse():
    """Set up command line argument parsing."""
    parser = argparse.ArgumentParser(description='Process audio files and match lyrics.')
    parser.add_argument('--mode', required=True, choices=['match', 'generate_prompt', 'generate_image'], help='Operation mode')
    parser.add_argument('--audio', required=False, help='Path to the audio file')
    parser.add_argument('--lyrics', required=False, help='JSON string containing lyrics')
    parser.add_argument('--prompt', required=False, help='Generated prompt for image')
    parser.add_argument('--album_art', required=False, help='Album art URL')
    parser.add_argument('--model', required=False, help='Gemini model to use')
    parser.add_argument('--artist', required=False, help='Artist name')
    parser.add_argument('--song', required=False, help='Song name')
    return parser.parse_args()

def main():
    # Configure UTF-8 for stdin/stdout on Windows
    if sys.platform == 'win32':
        import os, msvcrt
        msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
        msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)

    args = setup_argparse()

    try:
        if args.mode == "match":
            if not args.audio or not args.lyrics:
                raise ValueError("Both audio and lyrics parameters are required for matching mode")

            lyrics = json.loads(args.lyrics)
            audio_path = os.path.abspath(args.audio)
            model = args.model

            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")

            if not model:
                raise ValueError("Model parameter is required")

            print(f"Using model: {model}", file=sys.stderr)

            match_lyrics(audio_path, lyrics, model)

        elif args.mode == "generate_prompt":
            if not args.lyrics:
                raise ValueError("Lyrics parameter is required for prompt generation")

            lyrics = json.loads(args.lyrics)
            model = args.model
            song_name = args.song or "Unknown Song"

            if not model:
                raise ValueError("Model parameter is required for prompt generation")

            print(f"Using model: {model}", file=sys.stderr)
            try:
                result = generate_prompt_with_gemini(lyrics, model, song_name)
                # Ensure we have a valid result
                if not result or not result.get("prompt"):
                    raise ValueError("No prompt was generated")
            except Exception as e:
                print(f"Error in generate_prompt: {str(e)}", file=sys.stderr)
                raise

        elif args.mode == "generate_image":
            if not args.prompt or not args.album_art:
                raise ValueError("Both prompt and album_art parameters are required for image generation")

            prompt = args.prompt
            album_art = args.album_art
            model = args.model

            print(f"Using model: {model}", file=sys.stderr)
            image_result = generate_image_with_gemini(prompt, album_art, model)
            # Don't print the full base64 image data to avoid cluttering the terminal
            # Instead, print a placeholder and include the actual data in the JSON
            data_length = len(image_result["data"]) if "data" in image_result else 0
            print(f"Generated image data (length: {data_length} bytes)", file=sys.stderr)

            result = {
                "status": "success",
                "data": image_result["data"],
                "mime_type": image_result["mime_type"]
            }
            # Use sys.stdout.buffer to write binary data without printing to console
            if hasattr(sys.stdout, 'buffer'):
                sys.stdout.buffer.write(json.dumps(result).encode('utf-8'))
                sys.stdout.buffer.write(b'\n')
                sys.stdout.buffer.flush()
            else:
                print(json.dumps(result))

    except Exception as e:
        error_result = {
            "error": str(e),
            "status": "error"
        }

        error_json = json.dumps(error_result, ensure_ascii=False)
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr.buffer.write(error_json.encode('utf-8'))
            sys.stderr.buffer.write(b'\n')
        else:
            print(error_json, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
