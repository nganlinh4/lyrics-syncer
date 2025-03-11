import argparse
import json
import sys
from typing import List, Dict
from main import get_audio_timestamps, align_lyrics_with_audio

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--song_name', required=True)
    parser.add_argument('--lyrics', required=True)
    args = parser.parse_args()

    try:
        # Get the audio file path
        audio_file = f"audio/{args.song_name}.mp3"
        
        # Parse lyrics
        lyrics_lines = json.loads(args.lyrics)
        
        # Get transcription
        transcription = get_audio_timestamps(audio_file)
        if not transcription:
            raise Exception("Failed to get audio timestamps")

        # Align lyrics with audio
        matched_lyrics = align_lyrics_with_audio(lyrics_lines, transcription)
        if not matched_lyrics:
            raise Exception("Failed to align lyrics")

        # Output the results as JSON
        print(json.dumps(matched_lyrics))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()