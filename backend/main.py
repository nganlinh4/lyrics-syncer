import argparse
import json
import torch
import torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import numpy as np
from pathlib import Path
import sys

def setup_argparse():
    parser = argparse.ArgumentParser(description='Lyrics Matching Script')
    parser.add_argument('--mode', type=str, required=True, help='Operation mode')
    parser.add_argument('--audio', type=str, required=True, help='Path to audio file')
    parser.add_argument('--lyrics', type=str, required=True, help='Lyrics JSON string')
    parser.add_argument('--artist', type=str, required=True, help='Artist name')
    parser.add_argument('--song', type=str, required=True, help='Song name')
    return parser.parse_args()

def load_audio(audio_path):
    waveform, sample_rate = torchaudio.load(audio_path)
    return waveform, sample_rate

def process_audio(waveform, sample_rate, target_sample_rate=16000):
    if sample_rate != target_sample_rate:
        resampler = torchaudio.transforms.Resample(sample_rate, target_sample_rate)
        waveform = resampler(waveform)
    return waveform

def match_lyrics(audio_path, lyrics):
    try:
        audio_path = Path(audio_path)
        print(f"Attempting to process audio file: {audio_path}", file=sys.stderr)
        print(f"File exists: {audio_path.exists()}", file=sys.stderr)
        
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        if not audio_path.is_file():
            raise ValueError(f"Path is not a file: {audio_path}")
            
        # Print file size for debugging
        print(f"File size: {audio_path.stat().st_size} bytes", file=sys.stderr)

        # Load model and processor
        processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-large-960h")
        model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-large-960h")

        # Load and process audio
        try:
            waveform, sample_rate = load_audio(str(audio_path))
        except Exception as e:
            raise RuntimeError(f"Failed to load audio file: {e}")

        waveform = process_audio(waveform, sample_rate)
        
        # Process in chunks to handle memory
        chunk_length = 30 * sample_rate  # 30 seconds chunks
        matched_lyrics = []
        
        for i in range(0, waveform.shape[1], chunk_length):
            chunk = waveform[:, i:i + chunk_length]
            
            # Process audio chunk
            inputs = processor(chunk.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")
            with torch.no_grad():
                outputs = model(**inputs)
            
            # Get logits and align with lyrics
            logits = outputs.logits
            # Add your alignment logic here
            
            # For now, we'll just create dummy timing data
            start_time = i / sample_rate
            end_time = (i + chunk.shape[1]) / sample_rate
            
            matched_lyrics.append({
                "start": float(start_time),
                "end": float(end_time),
                "text": lyrics[len(matched_lyrics) % len(lyrics)],
                "confidence": 0.95
            })
        
        return matched_lyrics

    except Exception as e:
        print(f"Error processing audio: {str(e)}", file=sys.stderr)
        print(f"Current working directory: {Path.cwd()}", file=sys.stderr)
        return None

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