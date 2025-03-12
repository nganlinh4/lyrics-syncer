import argparse
import json
import os
import warnings
import torch
import torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import numpy as np
from pathlib import Path
import sys
import subprocess
import shutil
import whisper
import re
import google.generativeai as genai
from typing import List, Dict
from functools import lru_cache
from datetime import datetime

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

@lru_cache(maxsize=1)
def load_whisper_model():
    """Cache the Whisper model loading to avoid reloading for each request"""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading Whisper model on {device}...", file=sys.stderr)
    return whisper.load_model("base").to(device)

def get_word_timestamps(audio_path: str) -> List[Dict]:
    """Get word-level timestamps from audio using Whisper with language auto-detection"""
    try:
        model = load_whisper_model()
        
        # First detect the language
        audio = whisper.load_audio(audio_path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        _, probs = model.detect_language(mel)
        detected_lang = max(probs, key=probs.get)
        
        print(f"Detected language: {detected_lang}", file=sys.stderr)
        
        # Now transcribe with the detected language
        result = model.transcribe(
            audio_path,
            language=detected_lang,  # Use detected language
            word_timestamps=True,
            initial_prompt=None,  # Remove language-specific prompt
            temperature=0.0,
            no_speech_threshold=0.3,
            compression_ratio_threshold=2.4,
            condition_on_previous_text=True,
            fp16=torch.cuda.is_available()
        )
        
        words = []
        for segment in result["segments"]:
            if not "words" in segment:
                continue
                
            for word_info in segment["words"]:
                try:
                    text = word_info.get('word') or word_info.get('text')
                    start = float(word_info['start'])
                    end = float(word_info['end'])
                    
                    if not text or not isinstance(start, (int, float)) or not isinstance(end, (int, float)):
                        continue
                    
                    words.append({
                        "text": str(text).strip(),
                        "start": start,
                        "end": end,
                        "probability": float(word_info.get('probability', 1.0)),
                        "language": detected_lang  # Include detected language
                    })
                except Exception as word_error:
                    print(f"Error processing word {word_info}: {word_error}", file=sys.stderr)
                    continue
        
        return words
        
    except Exception as e:
        print(f"Error getting word timestamps: {str(e)}", file=sys.stderr)
        raise

def match_lyrics_parallel(lyrics: List[str], word_timestamps: List[Dict]) -> List[Dict]:
    """Match lyrics to word timestamps in parallel"""
    try:
        from lyrics_matcher import match_lyrics_parallel as matcher
        return matcher(lyrics, word_timestamps)
    except Exception as e:
        print(f"Error in parallel matching: {e}", file=sys.stderr)
        # Fallback to Gemini matching if parallel matching fails
        return match_lyrics_with_gemini(word_timestamps, lyrics)

def clean_lyrics_text(text: str) -> str:
    """Remove song structure markers and clean lyrics text"""
    # Remove common song structure markers
    markers = [r'\[Verse \d+\]', r'\[Chorus\]', r'\[Refrain\]', r'\[Bridge\]', r'\[Outro\]', r'\[Intro\]']
    cleaned = text
    for marker in markers:
        cleaned = re.sub(marker, '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

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
            
            # Extract all objects that look like valid entries
            pattern = r'\{\s*"start"\s*:\s*(\d+\.\d+|\d+)\s*,\s*"end"\s*:\s*(\d+\.\d+|\d+)\s*,\s*"text"\s*:\s*"([^"]*)"\s*\}'
            matches = re.findall(pattern, cleaned)
            
            if not matches:
                raise ValueError("Could not extract valid JSON objects from response")
            
            # Reconstruct valid JSON array from extracted objects
            data = []
            for start, end, text in matches:
                data.append({
                    "start": float(start),
                    "end": float(end),
                    "text": text
                })
            
            print(f"Extracted {len(data)} valid entries from malformed JSON", file=sys.stderr)
        
        # Ensure we have a list
        if not isinstance(data, list):
            raise ValueError("Root element must be an array")
            
        # Sort entries by start time to fix out-of-order entries
        data.sort(key=lambda x: float(x.get("start") or x.get("start_time", 0)))
        
        # Normalize all entries
        normalized = []
        for item in data:
            if not isinstance(item, dict):
                continue
                
            # Convert fields to expected format
            normalized.append({
                "start_time": float(item.get("start") or item.get("start_time", 0)),
                "end_time": float(item.get("end") or item.get("end_time", 0)),
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
                
                pattern = r'\{\s*"start"\s*:\s*(\d+\.\d+|\d+)\s*,\s*"end"\s*:\s*(\d+\.\d+|\d+)\s*,\s*"text"\s*:\s*"([^"]*)"\s*\}'
                matches = re.findall(pattern, content)
                
                if matches:
                    data = []
                    for start, end, text in matches:
                        data.append({
                            "start_time": float(start),
                            "end_time": float(end),
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

def match_lyrics_with_gemini(word_timestamps: List[Dict], lyrics: List[str]) -> List[Dict]:
    """Match lyrics to word timestamps using Gemini"""
    try:
        # Read config file
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        if not config.get('geminiApiKey'):
            raise ValueError("Gemini API key not found in config")
        
        # Clean timestamps and include language info
        cleaned_timestamps = []
        for word in word_timestamps:
            if word["probability"] > 0.1:
                cleaned_timestamps.append({
                    'text': clean_lyrics_text(word['text']),
                    'start': word['start'],
                    'end': word['end'],
                    'language': word.get('language', 'unknown')
                })

        # Filter out song structure markers from lyrics
        filtered_lyrics = [line for line in lyrics if not line.strip().startswith('[') and line.strip()]

        # Configure Gemini
        from google import genai
        client = genai.Client(api_key=config['geminiApiKey'])
        
        # Prepare input for Gemini with emphasis on exact lyrics matching
        prompt = f"""
Task: Match these word timestamps with the lyrics lines. The text may be in any language - please handle all languages appropriately.

Use this JSON schema:
LyricLine = {{'start': float, 'end': float, 'text': str, 'language': str}}
Return: list[LyricLine]

Requirements:
1. Each lyric line's timing must make sense sequentially
2. Start and end times must be floating point numbers
3. Every lyric line must have timing
4. Output must be valid JSON with no extra text
5. Handle text in any language appropriately
6. CRITICAL: The 'text' field in your output MUST EXACTLY match the lines from 'Lyrics lines' below
7. Use word timestamps ONLY for timing information, not for text content

Word timestamps:
{json.dumps(cleaned_timestamps, indent=2, ensure_ascii=False)}

Lyrics lines:
{json.dumps(filtered_lyrics, indent=2, ensure_ascii=False)}

IMPORTANT: Your output must contain EXACTLY the same lines as provided in 'Lyrics lines' above.
Return ONLY the JSON array following the schema, no other text.
"""
        # Save prompt for debugging
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save files with proper UTF-8 encoding using the helper function
        prompt_file = save_debug_file(f'gemini_prompt_{timestamp}.txt', prompt)

        # Generate response using correct Gemini API syntax
        response = client.models.generate_content(
            model="gemini-2.0-pro-exp-02-05",
            contents=prompt
        )
        response_text = response.text
        
        # Clean and parse response
        cleaned_response = clean_gemini_response(response_text)
        matched_lyrics = json.loads(cleaned_response)
        
        # Verify that returned lyrics match the input lyrics
        returned_texts = [line['text'] for line in matched_lyrics]
        if not all(lyric in returned_texts for lyric in filtered_lyrics):
            raise ValueError("Gemini response does not contain all original lyrics lines")
        
        # Clean and return matches
        cleaned_matches = []
        for match in matched_lyrics:
            cleaned_matches.append({
                "start": float(match.get("start") or match.get("start_time", 0)),
                "end": float(match.get("end") or match.get("end_time", 0)),
                "text": str(match.get("text", "")).strip(),
                "language": match.get("language", "unknown"),
                "confidence": 0.95  # High confidence since Gemini matched it
            })
        
        return cleaned_matches
        
    except Exception as e:
        print(f"Error matching lyrics with Gemini: {str(e)}", file=sys.stderr)
        raise

def match_lyrics(audio_path: str, lyrics: List[str]) -> Dict:
    """Main function to process audio and match lyrics"""
    try:
        # Get word-level timestamps
        word_timestamps = get_word_timestamps(audio_path)
        if not word_timestamps:
            raise ValueError("No words detected in audio")
            
        # Match lyrics using Gemini
        matched_lyrics = match_lyrics_with_gemini(word_timestamps, lyrics)
        if not matched_lyrics:
            raise ValueError("Failed to match lyrics")
        
        # Prepare result
        result = {
            "matched_lyrics": matched_lyrics,
            "detected_language": "en",  # English lyrics detection
            "status": "success"
        }
        
        # Output result with proper encoding
        json_result = json.dumps(result, ensure_ascii=False)
        # Ensure stdout is configured for UTF-8
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
        
        # Ensure stderr is configured for UTF-8
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
            audio_path = Path(args.audio)
            
            if not audio_path.exists():
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            match_lyrics(str(audio_path), lyrics)
            
    except Exception as e:
        error_result = {
            "error": str(e),
            "status": "error"
        }
        
        # Use UTF-8 encoding for error output
        error_json = json.dumps(error_result, ensure_ascii=False)
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr.buffer.write(error_json.encode('utf-8'))
            sys.stderr.buffer.write(b'\n')
        else:
            print(error_json, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()