import sys
import json
import argparse
import whisper
import torch
import librosa
import numpy as np
from pathlib import Path
import soundfile as sf
import subprocess
import os
import shutil
import warnings

# Suppress specific Triton-related warnings
warnings.filterwarnings("ignore", message="Failed to launch Triton kernels")

def debug_print(*args, **kwargs):
    """Helper function to print debug messages to stderr"""
    print(*args, file=sys.stderr, **kwargs)

def get_device():
    """Get the best available device (CUDA GPU or CPU)."""
    if torch.cuda.is_available():
        debug_print("Using CUDA GPU")
        return "cuda"
    else:
        debug_print("WARNING: GPU not available, using CPU. This will be significantly slower.")
        return "cpu"

def check_ffmpeg():
    """Check if ffmpeg is available in the system."""
    ffmpeg_path = shutil.which('ffmpeg')
    if not ffmpeg_path:
        raise RuntimeError(
            "FFmpeg not found in system PATH. Please install FFmpeg or ensure it's in your PATH."
        )
    return ffmpeg_path

def process_audio(audio_path):
    try:
        # Check for ffmpeg first
        ffmpeg_path = check_ffmpeg()
        debug_print(f"Found FFmpeg at: {ffmpeg_path}")
        
        audio_path = Path(audio_path).resolve()  # Get absolute path
        debug_print(f"Processing audio file: {audio_path}")
        debug_print(f"File exists: {audio_path.exists()}")
        debug_print(f"File size: {audio_path.stat().st_size if audio_path.exists() else 'N/A'} bytes")
        
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # Convert MP3 to WAV first using ffmpeg
        wav_path = audio_path.with_suffix('.wav')
        debug_print(f"Converting to WAV: {wav_path}")
        
        try:
            command = [
                ffmpeg_path,
                '-i', str(audio_path),
                '-acodec', 'pcm_s16le',
                '-ac', '1',
                '-ar', '16000',
                '-y',
                str(wav_path)
            ]
            debug_print(f"Running FFmpeg command: {' '.join(command)}")
            
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                debug_print("FFmpeg stdout:", stdout)
                debug_print("FFmpeg stderr:", stderr)
                raise subprocess.CalledProcessError(
                    process.returncode, 
                    command,
                    stdout,
                    stderr
                )
            
            debug_print("FFmpeg conversion successful")
            
        except subprocess.CalledProcessError as e:
            debug_print(f"FFmpeg error: {e.stderr}")
            raise
        except Exception as e:
            debug_print(f"Unexpected error during FFmpeg conversion: {str(e)}")
            raise
        
        if not wav_path.exists():
            raise FileNotFoundError(f"WAV conversion failed: {wav_path}")
        
        debug_print(f"WAV file created successfully: {wav_path}")
        debug_print(f"WAV file size: {wav_path.stat().st_size} bytes")
        
        # Initialize Whisper model
        device = get_device()
        debug_print(f"Loading Whisper model on {device}...")
        model = whisper.load_model("base").to(device)
        
        # Get timestamps using Whisper
        debug_print("Transcribing audio...")
        result = model.transcribe(
            str(wav_path),
            language="ko",
            word_timestamps=True,
            fp16=(device == "cuda")
        )
        
        # Clean up temporary WAV file
        if wav_path.exists():
            wav_path.unlink()
            debug_print(f"Cleaned up temporary WAV file: {wav_path}")
        
        # Process segments
        processed_segments = []
        for segment in result["segments"]:
            processed_segment = {
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"],
                "confidence": segment.get("confidence", 0.0)
            }
            processed_segments.append(processed_segment)
        
        return processed_segments
    except Exception as e:
        debug_print(f"Error processing audio: {str(e)}")
        debug_print(f"Current working directory: {os.getcwd()}")
        debug_print(f"Python executable: {sys.executable}")
        debug_print(f"System PATH: {os.environ.get('PATH', '')}")
        raise

def match_lyrics(segments, lyrics):
    matched_lyrics = []
    lyrics_words = [line.strip() for line in lyrics]
    current_position = 0
    
    for segment in segments:
        if current_position < len(lyrics_words):
            matched_lyrics.append({
                "start": segment["start"],
                "end": segment["end"],
                "line": lyrics_words[current_position],
                "confidence": segment.get("confidence", 0.0)
            })
            current_position += 1
    
    return matched_lyrics

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio_path", required=True, help="Full path to the audio file")
    parser.add_argument("--lyrics", required=True, help="JSON string of lyrics")
    args = parser.parse_args()
    
    try:
        debug_print(f"Audio path received: {args.audio_path}")
        
        lyrics = json.loads(args.lyrics)
        segments = process_audio(args.audio_path)
        matched_lyrics = match_lyrics(segments, lyrics)
        
        # Output ONLY the JSON result to stdout
        print(json.dumps(matched_lyrics, ensure_ascii=False))
        sys.stdout.flush()
        
    except Exception as e:
        error_json = json.dumps({"error": str(e)}, ensure_ascii=False)
        print(error_json)
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()