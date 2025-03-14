import argparse
import json
import os
import shutil
import sys
from datetime import datetime
from typing import List, Dict
import re
from google import genai
import subprocess


# Suppress symlink warning
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

def check_ffmpeg():
    """Check if ffmpeg is available in the system."""
    ffmpeg_path = shutil.which('ffmpeg')
    if not ffmpeg_path:
        raise RuntimeError(
            "FFmpeg not found in system PATH. Please install FFmpeg or ensure it's in your PATH."
        )
    return ffmpeg_path


def clean_lyrics_text(text: str) -> str:
    """Remove song structure markers and clean lyrics text."""
    # Remove common song structure markers
    markers = [r'\[Verse \d+\]', r'\[Chorus\]', r'\[Refrain\]', r'\[Bridge\]', r'\[Outro\]', r'\[Intro\]']
    cleaned = text
    for marker in markers:
        cleaned = re.sub(marker, '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def convert_time_to_seconds(time_str: str) -> float:
    """Convert time string to seconds."""
    try:
        # Check if it's already in decimal format
        return float(time_str)
    except ValueError:
        # Convert MM:SS.mmm format to seconds
        minutes, seconds = time_str.split(':')
        return float(minutes) * 60 + float(seconds)

def clean_gemini_response(response_text: str, debug_file: str = None) -> str:
    """Clean Gemini response text to extract valid JSON"""
    cleaned = ''

    try:
        # Remove markdown code blocks
        cleaned = re.sub(r'```(?:json)?\s*|\s*```', '', response_text)
        cleaned = cleaned.strip()

        # Replace problematic characters
        char_replacements = {
            '"': '"',  # Smart quotes
            '"': '"',
            ''': "'",
            ''': "'",
            '–': '-',  # Em dash
            '—': '-',
            '': '',  # Zero-width space
            '': ''   # BOM
        }

        for old, new in char_replacements.items():
            if old in cleaned:
                cleaned = cleaned.replace(old, new)

        # Normalize array formatting
        cleaned = re.sub(r'}\s*,?\s*,?\s*{', '}, {', cleaned)  # Fix object separators
        cleaned = re.sub(r',\s*,', ',', cleaned)  # Remove double commas

        # Fix quote escaping in text fields, but preserve intentional escaped quotes
        def fix_text(match):
            text = match.group(1)
            # Don't replace escaped quotes (\"...\") as they may be intentional
            if '\\"' in text:
                # Keep the escaped quotes intact, but fix double escapes
                text = text.replace('\\\\"', '\\"').replace('""', '"')
            else:
                # Just fix standard escaping issues
                text = text.replace('\\\\', '\\').replace('\\\"', '\"').replace('""', '"')
            return f'"text": "{text}"'

        cleaned = re.sub(r'"text":\s*"([^"]*)"', fix_text, cleaned)

        # Normalize whitespace
        lines = []
        for line in cleaned.split('\n'):
            line = line.strip()
            if line:
                # Remove extra whitespace around colons and commas
                line = re.sub(r'\s*:\s*', ': ', line)
                line = re.sub(r'\s*,\s*', ', ', line)
                lines.append(line)

        cleaned = '\n'.join(lines)

        # Try to extract and parse all JSON objects
        try:
            # First attempt to parse the entire text as JSON
            data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"Initial JSON parsing failed: {str(e)}", file=sys.stderr)

            # More aggressive JSON repair - extract all JSON-like objects
            if debug_file:
                print(f"Attempting to repair malformed JSON from: {debug_file}", file=sys.stderr)

            # Updated pattern to handle both decimal and MM:SS.mmm formats
            time_pattern = r'(?:\d+\.\d+|\d+|\d+:\d+\.\d+)'
            pattern = (
                r'\{\s*"start"\s*:\s*(' + time_pattern + r')\s*,\s*'
                r'"end"\s*:\s*(' + time_pattern + r')\s*,\s*"text"\s*:\s*"([^"]*)"\s*\}'
            )
            matches = re.findall(pattern, cleaned)

            if not matches:
                raise ValueError("Could not extract valid JSON objects from response")

            # Reconstruct valid JSON array from extracted objects
            data = []
            for start, end, text in matches:
                data.append({
                    "start": convert_time_to_seconds(start),
                    "end": convert_time_to_seconds(end),
                    "text": text
                })

            print(f"Extracted {len(data)} valid entries from malformed JSON", file=sys.stderr)

        # Ensure we have a list
        if not isinstance(data, list):
            raise ValueError("Root element must be an array")

        # Sort entries by start time to fix out-of-order entries
        data.sort(key=lambda x: convert_time_to_seconds(str(x.get("start") or x.get("start_time", 0))))

        # Normalize all entries
        normalized = []
        for item in data:
            if not isinstance(item, dict):
                continue

            # Convert fields to expected format
            normalized.append({
                "start_time": convert_time_to_seconds(str(item.get("start") or item.get("start_time", 0))),
                "end_time": convert_time_to_seconds(str(item.get("end") or item.get("end_time", 0))),
                "text": str(item.get("text", "")).strip()
            })

        return json.dumps(normalized, indent=2)

    except Exception as e:
        print(f"Error cleaning response: {str(e)}", file=sys.stderr)

        # Last resort: try to extract data manually with regex if debug file exists
        if debug_file and os.path.exists(debug_file):
            try:
                print(f"Attempting emergency extraction from {debug_file}", file=sys.stderr)
                with open(debug_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Use same updated pattern for emergency extraction
                time_pattern = r'(?:\d+\.\d+|\d+|\d+:\d+\.\d+)'
                pattern = (
                    r'\{\s*"start"\s*:\s*(' + time_pattern + r')\s*,\s*'
                    r'"end"\s*:\s*(' + time_pattern + r')\s*,\s*"text"\s*:\s*"([^"]*)"\s*\}'
                )
                matches = re.findall(pattern, content)

                if matches:
                    data = []
                    for start, end, text in matches:
                        data.append({
                            "start_time": convert_time_to_seconds(start),
                            "end_time": convert_time_to_seconds(end),
                            "text": text
                        })

                    # Sort by start time
                    data.sort(key=lambda x: x["start_time"])
                    print(f"Emergency extraction successful: {len(data)} entries recovered", file=sys.stderr)
                    return json.dumps(data, indent=2)
            except Exception as rescue_error:
                print(f"Emergency extraction failed: {rescue_error}", file=sys.stderr)

        raise ValueError(f"Invalid JSON in response: {str(e)}")


def save_debug_file(filename: str, content: str):
    """Save debug content with proper UTF-8 encoding"""
    try:
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)

        file_path = os.path.join(debug_dir, filename)
        with open(file_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(content)
        return file_path
    except Exception as e:
        print(f"Error saving debug file: {str(e)}", file=sys.stderr)
        return None

def get_audio_duration(audio_path: str) -> float:
    """Get the duration of the audio file in seconds."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audio_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    return float(result.stdout)

def match_lyrics_with_gemini(audio_path: str, lyrics: List[str]) -> List[Dict]:
    """Match lyrics to audio using Gemini, uploading the audio via the File API."""
    try:
        # Read config file
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        if not config.get('geminiApiKey'):
            raise ValueError("Gemini API key not found in config")

        # Filter out song structure markers from lyrics
        filtered_lyrics = [line for line in lyrics if not line.strip().startswith('[') and line.strip()]

        # Configure Gemini
        client = genai.Client(api_key=config['geminiApiKey'])  # Use Client for File API

        # Prepare input for Gemini
        prompt = f"""
Task: Analyze the provided audio and match its content with the given lyrics lines.  The audio may be in any language.

Use this JSON schema for output:
LyricLine = {{'start': float, 'end': float, 'text': str, 'language': str}}
Return: list[LyricLine]

Requirements:
1. Each lyric line's timing must be derived directly from the audio.
2. Every lyric line must have corresponding start and end times.
3. Output must be valid JSON with no extra text.
4. The 'text' field in your output MUST EXACTLY match the lines from 'Lyrics lines' below.
5. The provided audio may be in any language. Analyze the audio content to determine timing.
6. >>> CRITICAL information: This song's duration is {get_audio_duration(audio_path)} seconds, so think carefully about the last lyrics timing, it CANNOT BE LONGER.
7. If the provided lyrics have romanized Korean, turn it to actual Korean when responding.

Lyrics lines:
{json.dumps(filtered_lyrics, indent=2, ensure_ascii=False)}

IMPORTANT: Your output must contain EXACTLY the same lines as provided in 'Lyrics lines' above, and the timing MUST come from analyzing the audio content. Return ONLY the JSON array following the schema, no other text.
"""

        # Upload the audio file using the File API
        try:
            myfile = client.files.upload(file=audio_path) # Upload directly
        except Exception as upload_error:
            raise RuntimeError(f"Error uploading file to Gemini File API: {upload_error}")


        # Use provided model or fallback to default
        model = config.get('model', 'gemini-2.0-flash-thinking-exp-01-21')

        # Generate response using the Client and the uploaded file
        response = client.models.generate_content(
            model=model,
            contents=[prompt, myfile]
        )

        response_text = response.text

        # Save prompt and response for debugging
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        prompt_file = save_debug_file(f'gemini_prompt_{timestamp}.txt', prompt)
        debug_file = save_debug_file(f'gemini_response_{timestamp}.txt', response_text)
        print(f"Debug files saved: {prompt_file}, {debug_file}", file=sys.stderr)

        # Clean and parse response
        cleaned_response = clean_gemini_response(response_text, debug_file)
        matched_lyrics = json.loads(cleaned_response)


        # Clean and return matches
        cleaned_matches = []
        for match in matched_lyrics:
            cleaned_matches.append({
                "start": convert_time_to_seconds(str(match.get("start") or match.get("start_time", 0))),
                "end": convert_time_to_seconds(str(match.get("end") or match.get("end_time", 0))),
                "text": str(match.get("text", "")).strip(),
                "language": match.get("language", "unknown"),
                "confidence": 0.95
            })

        return cleaned_matches

    except Exception as e:
        print(f"Error matching lyrics with Gemini: {str(e)}", file=sys.stderr)
        raise



def match_lyrics(audio_path: str, lyrics: List[str]) -> Dict:
    """Main function to process audio and match lyrics"""
    try:
        # Match lyrics using Gemini
        matched_lyrics = match_lyrics_with_gemini(audio_path, lyrics)
        if not matched_lyrics:
            raise ValueError("Failed to match lyrics")

        # Prepare result
        result = {
            "matched_lyrics": matched_lyrics,
            "detected_language": "en",  # Placeholder.
            "status": "success"
        }

        # Output result
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
    parser.add_argument('--mode', required=True, choices=['match'], help='Operation mode')
    parser.add_argument('--audio', required=True, help='Path to the audio file')
    parser.add_argument('--lyrics', required=True, help='JSON string containing lyrics')
    parser.add_argument('--model', help='Gemini model to use')
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
            lyrics = json.loads(args.lyrics)
            audio_path = os.path.abspath(args.audio)

            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")

            # Update config with model if provided
            if args.model:
                config_path = os.path.join(os.path.dirname(__file__), 'config.json')
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                config['model'] = args.model

            match_lyrics(audio_path, lyrics)

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
