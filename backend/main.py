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
    """Clean lyrics by removing section headers and empty lines."""
    cleaned = []
    for line in lyrics_list:
        # Skip section headers and empty lines
        if not line.strip() or line.strip().startswith('[') or line.strip().endswith(']'):
            continue
        cleaned.append(line.strip())
    return cleaned

def match_lyrics(audio_path, lyrics):
    try:
        device = get_device()
        audio_path = Path(audio_path)
        print(f"Attempting to process audio file: {audio_path}", file=sys.stderr)
        print(f"File exists: {audio_path.exists()}", file=sys.stderr)
        
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        # Clean lyrics first
        cleaned_lyrics = clean_lyrics(lyrics)
        if not cleaned_lyrics:
            raise ValueError("No valid lyrics after cleaning")
        
        # Load model and processor
        processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-large-960h")
        model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-large-960h").to(device)

        # Load and process audio
        waveform, sample_rate = load_audio(str(audio_path))
        waveform = process_audio(waveform, sample_rate)
        
        # Process in smaller chunks (5 seconds) for more accurate timing
        chunk_length = 5 * sample_rate
        matched_lyrics = []
        current_lyric_index = 0
        
        for i in range(0, waveform.shape[1], chunk_length):
            if current_lyric_index >= len(cleaned_lyrics):
                break
                
            chunk = waveform[:, i:i + chunk_length]
            
            # Process audio chunk
            inputs = processor(chunk.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = model(**inputs)
                
            # Get logits and check if there's significant audio
            logits = outputs.logits
            predictions = torch.argmax(logits, dim=-1)
            has_speech = predictions.sum() > 0
            
            if has_speech:
                start_time = i / sample_rate
                end_time = min((i + chunk.shape[1]) / sample_rate, waveform.shape[1] / sample_rate)
                
                matched_lyrics.append({
                    "start": float(start_time),
                    "end": float(end_time),
                    "text": cleaned_lyrics[current_lyric_index],
                    "confidence": float(torch.max(torch.softmax(logits, dim=-1)).cpu().numpy())
                })
                current_lyric_index += 1
        
        return matched_lyrics

    except Exception as e:
        print(f"Error processing audio: {str(e)}", file=sys.stderr)
        print(f"Current working directory: {Path.cwd()}", file=sys.stderr)
        return None

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
                    "detected_language": "en",  # Add language detection logic here
                    "status": "success"
                }))
            else:
                print(json.dumps({
                    "error": "Failed to process audio",
                    "status": "error"
                }))
        else:
            print(json.dumps({
                "error": f"Unknown mode: {args.mode}",
                "status": "error"
            }))
            
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "status": "error"
        }))

if __name__ == "__main__":
    main()