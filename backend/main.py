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

def convert_to_wav(audio_path):
    """Convert MP3 to WAV using FFmpeg."""
    ffmpeg_path = check_ffmpeg()
    wav_path = audio_path.with_suffix('.wav')
    
    command = [
        ffmpeg_path,
        '-i', str(audio_path),
        '-acodec', 'pcm_s16le',
        '-ac', '1',
        '-ar', '16000',
        '-y',
        str(wav_path)
    ]
    
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"FFmpeg stdout: {stdout}", file=sys.stderr)
            print(f"FFmpeg stderr: {stderr}", file=sys.stderr)
            raise subprocess.CalledProcessError(
                process.returncode, 
                command,
                stdout,
                stderr
            )
        
        return wav_path
    except Exception as e:
        print(f"FFmpeg conversion error: {str(e)}", file=sys.stderr)
        raise

def load_audio(audio_path):
    """Load audio file, converting from MP3 to WAV if necessary."""
    try:
        # Convert MP3 to WAV first
        wav_path = convert_to_wav(Path(audio_path))
        
        # Load the WAV file
        waveform, sample_rate = torchaudio.load(str(wav_path))
        
        # Clean up temporary WAV file
        wav_path.unlink()
        
        return waveform, sample_rate
    except Exception as e:
        raise RuntimeError(f"Failed to load audio file: {str(e)}")

def process_audio(waveform, sample_rate, target_sample_rate=16000):
    if sample_rate != target_sample_rate:
        resampler = torchaudio.transforms.Resample(sample_rate, target_sample_rate)
        waveform = resampler(waveform)
    return waveform

def get_device():
    """Get the best available device (CUDA GPU or CPU)."""
    if torch.cuda.is_available():
        print("Using CUDA GPU", file=sys.stderr)
        return "cuda"
    else:
        print("WARNING: GPU not available, using CPU. This will be significantly slower.", file=sys.stderr)
        return "cpu"

def clean_lyrics(lyrics_list):
    """Clean lyrics by removing section headers and empty lines"""
    cleaned = []
    for line in lyrics_list:
        # Skip section headers and empty lines
        if not line or not isinstance(line, str):
            continue
            
        line = line.strip()
        if not line or line.startswith('[') or line.endswith(']'):
            continue
            
        # Clean up the line
        cleaned_line = re.sub(r'[\(\[\{].*?[\)\]\}]', '', line)  # Remove parentheses content
        cleaned_line = re.sub(r'\s+', ' ', cleaned_line.strip())  # Normalize whitespace
        
        if cleaned_line:
            cleaned.append(cleaned_line)
    
    print(f"Cleaned lyrics ({len(cleaned)} lines):", file=sys.stderr)
    for line in cleaned[:5]:
        print(f"  {line}", file=sys.stderr)
    
    return cleaned

def match_lyrics(audio_path, lyrics):
    try:
        device = get_device()
        audio_path = Path(audio_path)
        print(f"Attempting to process audio file: {audio_path}", file=sys.stderr)
        
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        # Clean lyrics first
        cleaned_lyrics = clean_lyrics(lyrics)
        if not cleaned_lyrics:
            raise ValueError("No valid lyrics after cleaning")
        
        # Load Whisper model with specific configuration
        model = whisper.load_model(
            "base",
            device=device,
            download_root="./models"
        )
        
        # Transcribe with more specific parameters
        result = model.transcribe(
            str(audio_path),
            language="en",
            task="transcribe",
            fp16=False,
            verbose=True,
            condition_on_previous_text=True,
            initial_prompt="This is a song with lyrics."
        )
        
        if not result or "segments" not in result:
            raise ValueError("Transcription failed to produce segments")
            
        print(f"Transcription produced {len(result['segments'])} segments", file=sys.stderr)
        
        # Process segments and align with lyrics
        matched_lyrics = []
        lyrics_idx = 0
        
        for segment in result["segments"]:
            try:
                # Ensure segment has required fields
                if not all(k in segment for k in ["start", "end", "text"]):
                    print(f"Skipping invalid segment: {segment}", file=sys.stderr)
                    continue
                
                # Clean segment text
                segment_text = segment["text"].strip().lower()
                if not segment_text:
                    continue
                
                # Find best matching lyric
                best_match = None
                best_ratio = 0
                
                # Look ahead in lyrics to find best match
                search_range = min(lyrics_idx + 3, len(cleaned_lyrics))
                for i in range(lyrics_idx, search_range):
                    lyric = cleaned_lyrics[i].lower().strip()
                    ratio = similarity_ratio(segment_text, lyric)
                    
                    print(f"Comparing: '{segment_text}' with '{lyric}' = {ratio}", file=sys.stderr)
                    
                    if ratio > best_ratio and ratio > 0.4:  # Lowered threshold
                        best_ratio = ratio
                        best_match = i
                
                if best_match is not None:
                    matched_lyrics.append({
                        "start": float(segment["start"]),
                        "end": float(segment["end"]),
                        "text": cleaned_lyrics[best_match],
                        "confidence": segment.get("confidence", 0.8)
                    })
                    lyrics_idx = best_match + 1
                    print(f"Matched: {cleaned_lyrics[best_match]}", file=sys.stderr)
            
            except Exception as seg_error:
                print(f"Error processing segment: {seg_error}", file=sys.stderr)
                continue
        
        if not matched_lyrics:
            raise ValueError("No lyrics could be matched with the audio")
        
        print(f"Successfully matched {len(matched_lyrics)} lyrics", file=sys.stderr)
        return matched_lyrics

    except Exception as e:
        print(f"Error processing audio: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return None

def similarity_ratio(s1, s2):
    """Calculate similarity ratio between two strings using a more lenient approach"""
    from rapidfuzz import fuzz
    # Use partial ratio to catch partial matches
    return fuzz.partial_ratio(s1, s2) / 100.0

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
            
            result = match_lyrics(str(audio_path), lyrics)
            
            if result:
                print(json.dumps({
                    "matched_lyrics": result,
                    "detected_language": "en",
                    "status": "success"
                }))
            else:
                print(json.dumps({
                    "error": "Failed to match lyrics with audio",
                    "status": "error"
                }), file=sys.stderr)
        else:
            print(json.dumps({
                "error": f"Unknown mode: {args.mode}",
                "status": "error"
            }))
            
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "status": "error"
        }), file=sys.stderr)

if __name__ == "__main__":
    main()