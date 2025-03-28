import os
import shutil
import re
import json
import sys
from datetime import datetime
from typing import List, Dict
import subprocess

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
    markers = [r'\[Verse \d+\]', r'\[Chorus\]', r'\[Refrain\]', r'\[Bridge\]', r'\[Outro\]', r'\[Intro\]']
    cleaned = text
    for marker in markers:
        cleaned = re.sub(marker, '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def convert_time_to_seconds(time_str: str) -> float:
    """Convert time string to seconds."""
    try:
        return float(time_str)
    except ValueError:
        minutes, seconds = time_str.split(':')
        return float(minutes) * 60 + float(seconds)

def clean_gemini_response(response_text: str, debug_file: str = None) -> str:
    """Clean Gemini response text to extract valid JSON"""
    cleaned = ''

    try:
        cleaned = re.sub(r'```(?:json)?\s*|\s*```', '', response_text)
        cleaned = cleaned.strip()

        char_replacements = {
            '"': '"',
            '"': '"',
            ''': "'",
            ''': "'",
            '–': '-',
            '—': '-',
            '': '',
            '': ''
        }

        for old, new in char_replacements.items():
            if old in cleaned:
                cleaned = cleaned.replace(old, new)

        cleaned = re.sub(r'}\s*,?\s*,?\s*{', '}, {', cleaned)
        cleaned = re.sub(r',\s*,', ',', cleaned)

        def fix_text(match):
            text = match.group(1)
            if '\\"' in text:
                text = text.replace('\\\\"', '\\"').replace('""', '"')
            else:
                text = text.replace('\\\\', '\\').replace('\\\"', '\"').replace('""', '"')
            return f'"text": "{text}"'

        cleaned = re.sub(r'"text":\s*"([^"]*)"', fix_text, cleaned)

        lines = []
        for line in cleaned.split('\n'):
            line = line.strip()
            if line:
                line = re.sub(r'\s*:\s*', ': ', line)
                line = re.sub(r'\s*,\s*', ', ', line)
                lines.append(line)

        cleaned = '\n'.join(lines)

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"Initial JSON parsing failed: {str(e)}", file=sys.stderr)

            if debug_file:
                print(f"Attempting to repair malformed JSON from: {debug_file}", file=sys.stderr)

            time_pattern = r'(?:\d+\.\d+|\d+|\d+:\d+\.\d+)'
            pattern = (
                r'\{\s*"start"\s*:\s*(' + time_pattern + r')\s*,\s*"end"\s*:\s*(' + time_pattern + r')\s*,\s*' +
                r'"text"\s*:\s*"([^"]*)"\s*,\s*"language"\s*:\s*"([^"]*)"\s*\}' 
            )
            matches = re.findall(pattern, cleaned)

            if not matches:
                raise ValueError("Could not extract valid JSON objects from response")

            data = []
            for start, end, text, language in matches:
                data.append({
                    "start": start,
                    "end": end,
                    "text": text,
                    "language": language
                })

            print(f"Extracted {len(data)} valid entries from malformed JSON", file=sys.stderr)

        if not isinstance(data, list):
            raise ValueError("Root element must be an array")

        data.sort(key=lambda x: float(x["start"]))

        normalized = []
        for item in data:
            if not isinstance(item, dict):
                continue
            normalized.append(item)

        return json.dumps(normalized, indent=2)

    except Exception as e:
        print(f"Error cleaning response: {str(e)}", file=sys.stderr)

        if debug_file and os.path.exists(debug_file):
            try:
                print(f"Attempting emergency extraction from {debug_file}", file=sys.stderr)
                with open(debug_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                time_pattern = r'(?:\d+\.\d+|\d+|\d+:\d+\.\d+)'
                pattern = (
                    r'\{\s*"start"\s*:\s*(' + time_pattern + r')\s*,\s*"end"\s*:\s*(' + time_pattern + r')\s*,\s*' +
                    r'"text"\s*:\s*"([^"]*)"\s*,\s*"language"\s*:\s*"([^"]*)"\s*\}' 
                )
                matches = re.findall(pattern, content)

                if matches:
                    data = []
                    for start, end, text, language in matches:
                        data.append({
                            "start": start,
                            "end": end,
                            "text": text,
                            "language": language
                        })

                    data.sort(key=lambda x: float(x["start"]))
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