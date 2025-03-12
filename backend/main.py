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
import datetime

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
    """Get word-level timestamps from audio using Whisper"""
    try:
        model = load_whisper_model()
        result = model.transcribe(
            audio_path,
            language="ko",
            word_timestamps=True,
            initial_prompt="노래 가사:",
            temperature=0.0,
            no_speech_threshold=0.3,
            compression_ratio_threshold=2.4,
            condition_on_previous_text=True,
            fp16=torch.cuda.is_available()
        )
        
        words = []
        for segment in result["segments"]:
            print(f"Processing segment: {segment}", file=sys.stderr)
            
            if not "words" in segment:
                print(f"No words in segment: {segment}", file=sys.stderr)
                continue
                
            for word_info in segment["words"]:
                try:
                    print(f"Processing word: {word_info}", file=sys.stderr)
                    
                    # Handle both possible key formats ('word' or 'text')
                    text = word_info.get('word') or word_info.get('text')
                    start = float(word_info['start'])
                    end = float(word_info['end'])
                    
                    if not text or not isinstance(start, (int, float)) or not isinstance(end, (int, float)):
                        print(f"Invalid word data: {word_info}", file=sys.stderr)
                        continue
                    
                    words.append({
                        "text": str(text).strip(),
                        "start": start,
                        "end": end,
                        "probability": float(word_info.get('probability', 1.0))
                    })
                except Exception as word_error:
                    print(f"Error processing word {word_info}: {word_error}", file=sys.stderr)
                    continue
        
        if not words:
            raise ValueError("No valid words were extracted from the audio")
            
        # Filter out words with very low probability
        words = [w for w in words if w["probability"] > 0.1]
        
        # Sort by start time
        words.sort(key=lambda x: x["start"])
        
        print(f"Successfully extracted {len(words)} words", file=sys.stderr)
        return words
        
    except Exception as e:
        print(f"Error getting word timestamps: {str(e)}", file=sys.stderr)
        print(f"Full error details: {type(e).__name__}", file=sys.stderr)
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

def clean_gemini_response(response_text: str) -> str:
    """Clean Gemini response text to extract valid JSON"""
    # Remove any markdown code block indicators
    cleaned = re.sub(r'```(?:json)?\n?|\n?```', '', response_text)
    
    # Remove any leading/trailing whitespace
    cleaned = cleaned.strip()
    
    # Replace problematic Unicode characters
    char_replacements = {
        '"': '"',  # Smart quotes
        '"': '"',
        ''': "'",
        ''': "'",
        '–': '-',  # Em dash
        '—': '-',
        '\u200b': '',  # Zero-width space
        '\ufeff': ''   # BOM
    }
    
    # Handle escaped quotes in text content
    cleaned = re.sub(r'\\+"', '"', cleaned)  # Replace multiple backslashes before quotes
    cleaned = re.sub(r'(?<!\\)"', '\\"', cleaned)  # Escape unescaped quotes
    
    for old, new in char_replacements.items():
        cleaned = cleaned.replace(old, new)
    
    # Find the JSON array
    try:
        # First try to parse as-is
        json.loads(cleaned)
        return cleaned
    except json.JSONDecodeError:
        # If that fails, try to extract the array portion
        array_match = re.search(r'\[[\s\S]*\]', cleaned)
        if array_match:
            try:
                array_text = array_match.group(0)
                # Validate it's proper JSON
                parsed = json.loads(array_text)
                if not isinstance(parsed, list):
                    raise ValueError("Extracted content is not a JSON array")
                # Verify expected structure
                for item in parsed:
                    if not all(k in item for k in ('start_time', 'end_time', 'text')):
                        raise ValueError(f"Missing required fields in item: {item}")
                    # Validate numeric fields
                    if not isinstance(item['start_time'], (int, float)) or not isinstance(item['end_time'], (int, float)):
                        raise ValueError(f"Invalid timestamp format in item: {item}")
                    item['text'] = str(item['text'])  # Ensure text is string
                return array_text
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON in extracted array: {str(e)}")
            except Exception as e:
                raise ValueError(f"Error validating response structure: {str(e)}")
    
    raise ValueError("Could not find valid JSON array in response")
    
def encode_file_content(content: str) -> str:
    """Encode content to handle special characters properly"""
    return content.encode('utf-8', errors='replace').decode('utf-8')

def match_lyrics_with_gemini(word_timestamps: List[Dict], lyrics: List[str]) -> List[Dict]:
    """Use Gemini to match word timestamps with lyrics"""
    try:
        # Read config file
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        if not config.get('geminiApiKey'):
            raise ValueError("Gemini API key not found in config")

        # Configure Gemini with new syntax
        from google import genai
        client = genai.Client(api_key=config['geminiApiKey'])
        
        # Prepare input for Gemini
        prompt = f"""
Task: Match these word timestamps with the lyrics lines.
Return ONLY a JSON array where each object has: start_time, end_time, and text (lyric line).
Make sure:
1. Each lyric line's timing makes sense sequentially
2. Start and end times are floating point numbers
3. Every lyric line must have timing
4. Output must be valid JSON

Word timestamps:
{json.dumps(word_timestamps, indent=2, ensure_ascii=False)}

Lyrics lines:
{json.dumps(lyrics, indent=2, ensure_ascii=False)}

Return ONLY the JSON array, no other text.
"""
        # Save prompt for debugging
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save files with proper UTF-8 encoding
        prompt_file = os.path.join(debug_dir, f'gemini_prompt_{timestamp}.txt')
        with open(prompt_file, 'w', encoding='utf-8') as f:
            f.write(encode_file_content(prompt))

        # Generate response
        response = client.models.generate_content(
            model="gemini-2.0-pro-exp-02-05",
            contents=prompt
        )

        # Save raw response for debugging
        response_file = os.path.join(debug_dir, f'gemini_response_{timestamp}.txt')
        with open(response_file, 'w', encoding='utf-8') as f:
            f.write(encode_file_content(response.text))

        print(f"Debug files saved:\nPrompt: {prompt_file}\nResponse: {response_file}", file=sys.stderr)

        # Clean and parse the response
        cleaned_response = clean_gemini_response(response.text)
        matched_lyrics = json.loads(cleaned_response)
        
        # Validate and clean the response
        cleaned_matches = []
        for match in matched_lyrics:
            cleaned_matches.append({
                "start": float(match["start_time"]),
                "end": float(match["end_time"]),
                "text": str(match["text"]),
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
            "detected_language": "ko",  # Update based on actual detection
            "status": "success"
        }
        
        # Output result
        print(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "status": "error"
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
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
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()