from googleapiclient.discovery import build
import yt_dlp
from google import genai
from difflib import SequenceMatcher
import lyricsgenius
import re
import whisper_timestamped
from pydub import AudioSegment
import json
import os
from faster_whisper import WhisperModel
from rapidfuzz import fuzz, process
from dtaidistance import dtw
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import subprocess
import tempfile
import librosa
import soundfile as sf
import noisereduce as nr
import torch
import shutil
import librosa.onset
import librosa.effects
import librosa.segment
import numpy as np
import whisper

YOUTUBE_API_KEY = 'AIzaSyCbbeb0vRSJuQEXTkNiGGRAX9XdRjsaHzw'
GENIUS_API_KEY = 'I6mslHIdg8x1FSBNmfayrcqCPuZjk_jwLvaXk9gGHLdxI8TYXAhbVMg2rOsrXDy_'  # Replace with your Genius API token

def enhance_search_query(song, artist):
    client = genai.Client(api_key='AIzaSyDzVaGI51A-tt2P7Qjg7eokqLhUdMrNnWM')
    response = client.models.generate_content(
        model='gemini-2.0-flash-exp',
        contents=f"Return ONLY a simple search string to find '{song}' by {artist} on YouTube. Format: artist_name song_name MV"
    )
    clean_query = response.text.strip().replace('\n', ' ').split('**')[-1].strip()
    return clean_query if clean_query and len(clean_query) <= 100 else f"{artist} {song} MV"

def get_lyrics(song, artist):
    """Get lyrics using Genius API"""
    try:
        genius = lyricsgenius.Genius(GENIUS_API_KEY)
        genius.verbose = False  # Turn off status messages
        
        # Search for the song
        song = genius.search_song(song, artist)
        if song:
            return song.lyrics
            
        # If not found, try searching with Korean name
        song = genius.search_song(f"{artist} {song}")
        if song:
            return song.lyrics
            
        print("Lyrics not found on Genius")
        return None
        
    except Exception as e:
        print(f"Error fetching lyrics: {e}")
        return None

def save_lyrics(lyrics, song, artist):
    """Save lyrics to a text file"""
    if not lyrics:
        return False
        
    filename = f"{artist} - {song} lyrics.txt"
    try:
        # Clean up the lyrics by removing Genius annotations and extra lines
        cleaned_lyrics = lyrics.split('Lyrics')[1] if 'Lyrics' in lyrics else lyrics
        
        # Remove lines containing bracketed text using regex
        cleaned_lyrics = '\n'.join(
            line for line in cleaned_lyrics.split('\n')
            if line.strip() and not re.match(r'.*\[.*\].*', line)
        )
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(cleaned_lyrics)
        return True
    except Exception as e:
        print(f"Error saving lyrics: {e}")
        return False

def search_youtube(query, song, artist):
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    response = youtube.search().list(
        part='id,snippet',
        q=query,
        type='video',
        maxResults=5,
        relevanceLanguage='ko'
    ).execute()
    
    if not response.get('items'):
        return None
        
    scored_results = [{
        'video_id': item['id']['videoId'],
        'title': item['snippet']['title'],
        'score': (
            SequenceMatcher(None, song, item['snippet']['title'].lower()).ratio() * 0.4 +
            SequenceMatcher(None, artist, item['snippet']['title'].lower()).ratio() * 0.4 +
            (1.0 if (song in item['snippet']['title'] and artist in item['snippet']['title']) else 0.0) * 0.2
        )
    } for item in response['items']]
    
    scored_results.sort(key=lambda x: x['score'], reverse=True)
    print("\n".join(f"{idx}. {r['title']}" for idx, r in enumerate(scored_results[:3], 1)))
    
    return scored_results[0]['video_id']

def extract_vocals(audio_path):
    """Extract vocals using noisereduce and bandpass filtering"""
    try:
        # Load audio
        y, sr = librosa.load(audio_path)
        
        # Apply bandpass filter to focus on vocal frequencies (100Hz - 8000Hz)
        y_bandpass = librosa.effects.preemphasis(y)
        
        # Separate harmonics (vocal-like) from percussive
        y_harmonic, y_percussive = librosa.effects.hpss(y_bandpass)
        
        # Apply noise reduction
        vocals = nr.reduce_noise(
            y=y_harmonic,
            sr=sr,
            prop_decrease=0.95,
            n_fft=2048,
            win_length=512,
            freq_mask_smooth_hz=100,
            time_mask_smooth_ms=100
        )
        
        # Save processed audio
        temp_path = os.path.join(tempfile.mkdtemp(), "vocals.wav")
        sf.write(temp_path, vocals, sr)
        return temp_path
            
    except Exception as e:
        print(f"Error extracting vocals: {e}")
        return audio_path  # Return original audio if processing fails

def get_audio_timestamps(audio_file):
    """Get timestamped transcription using Whisper"""
    try:
        print("Loading Whisper model...")
        # Use smaller model and enable better memory management
        import torch
        torch.cuda.empty_cache()
        
        model = whisper.load_model(
            "medium",  # Use medium model instead of large
            device="cuda" if torch.cuda.is_available() else "cpu",
            download_root="./models"
        )
        
        # Split audio into chunks to prevent memory issues
        def process_audio_chunk(chunk_file, offset=0):
            result = model.transcribe(
                chunk_file,
                language="ko",
                task="transcribe",
                fp16=False,
                initial_prompt="노래 가사:",  # Korean prompt for lyrics
                verbose=False
            )
            # Adjust timestamps for chunk
            for seg in result["segments"]:
                seg["start"] += offset
                seg["end"] += offset
            return result["segments"]
        
        print("Processing audio in chunks...")
        chunk_duration = 30  # seconds per chunk
        audio = AudioSegment.from_wav(audio_file)
        total_duration = len(audio) / 1000  # convert to seconds
        
        all_segments = []
        for start in range(0, len(audio), chunk_duration * 1000):
            chunk = audio[start:start + chunk_duration * 1000]
            chunk_file = tempfile.mktemp('.wav')
            chunk.export(chunk_file, format='wav')
            
            try:
                segments = process_audio_chunk(chunk_file, start / 1000)
                all_segments.extend(segments)
                os.remove(chunk_file)
                print(f"Processed chunk {start//1000} - {(start + chunk_duration)//1000}s")
            except Exception as e:
                print(f"Error processing chunk: {e}")
                continue
        
        # Convert segments to our format
        words_with_timing = []
        for segment in all_segments:
            words_with_timing.append({
                "text": segment["text"].strip(),
                "start": segment["start"],
                "end": segment["end"],
                "probability": segment.get("confidence", 0.0)
            })
        
        # Save transcription output to file
        transcription_output = {
            "segments": words_with_timing,
            "duration": total_duration
        }
        
        # Create transcriptions directory if it doesn't exist
        os.makedirs('transcriptions', exist_ok=True)
        
        # Save raw transcription with timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join('transcriptions', f'transcription_{timestamp}.json')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(transcription_output, f, ensure_ascii=False, indent=2)
        
        print(f"\nSaved raw transcription to: {output_file}")
        print(f"Transcribed {len(words_with_timing)} segments")
        print("Sample transcriptions:")
        for seg in words_with_timing[:3]:
            print(f"{seg['start']:.2f}s - {seg['end']:.2f}s: {seg['text']}")
        
        return transcription_output
        
    except Exception as e:
        print(f"Error in transcription: {e}")
        import traceback
        traceback.print_exc()
        return None

def align_lyrics_with_transcription(lyrics_lines, transcription):
    """Match clean lyrics with transcribed segments using fuzzy matching"""
    print("\nStarting lyrics alignment...")
    print(f"Got {len(lyrics_lines)} lyrics lines")
    print(f"Got {len(transcription['segments'])} transcribed segments")
    
    matched_lyrics = []
    segments = transcription["segments"]
    
    for lyric_line in lyrics_lines:
        print(f"\nMatching lyric: {lyric_line}")
        
        # Find best matching segment
        best_match = process.extractOne(
            lyric_line,
            [seg["text"] for seg in segments],
            scorer=fuzz.ratio,
            score_cutoff=30
        )
        
        if best_match:
            matched_text, score, idx = best_match
            segment = segments[idx]
            print(f"Found match ({score}%): {matched_text}")
            print(f"Timing: {segment['start']:.2f}s - {segment['end']:.2f}s")
            
            matched_lyrics.append({
                "line": lyric_line,
                "start": segment["start"],
                "end": segment["end"],
                "confidence": score / 100.0,
                "transcribed": matched_text
            })
        else:
            print("No good match found - using time estimate")
            # Estimate position based on surrounding matches
            if matched_lyrics:
                last_end = matched_lyrics[-1]["end"]
                duration_left = transcription["duration"] - last_end
                est_duration = duration_left / (len(lyrics_lines) - len(matched_lyrics))
                matched_lyrics.append({
                    "line": lyric_line,
                    "start": last_end + 0.1,
                    "end": last_end + est_duration,
                    "confidence": 0.3,
                    "transcribed": "estimated"
                })
            else:
                # First line with no match
                est_duration = transcription["duration"] / len(lyrics_lines)
                matched_lyrics.append({
                    "line": lyric_line,
                    "start": 0.0,
                    "end": est_duration,
                    "confidence": 0.3,
                    "transcribed": "estimated"
                })
    
    print("\nAlignment Results:")
    for match in matched_lyrics[:5]:
        print(f"{match['start']:.2f}s - {match['end']:.2f}s: {match['line']}")
        print(f"  Transcribed as: {match['transcribed']} ({match['confidence']:.2f})")
    
    return matched_lyrics

def save_timed_lyrics(matched_lyrics, song, artist):
    """Save timed lyrics in both SRT and JSON formats"""
    if not matched_lyrics:
        print("No matched lyrics to save!")
        return False
        
    base_filename = f"{artist} - {song}"
    lyrics_dir = 'lyrics'  # Make sure this directory exists
    os.makedirs(lyrics_dir, exist_ok=True)
    
    try:
        # Save as JSON with full path
        json_path = os.path.join(lyrics_dir, f"{base_filename} timed.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(matched_lyrics, f, ensure_ascii=False, indent=2)
        print(f"\nSaved timing data to {os.path.abspath(json_path)}")
        
        # Save as SRT with full path
        srt_path = os.path.join(lyrics_dir, f"{base_filename}.srt")
        with open(srt_path, 'w', encoding='utf-8') as f:
            for i, match in enumerate(matched_lyrics, 1):
                f.write(f"{i}\n")
                f.write(f"{format_time(match['start'])} --> {format_time(match['end'])}\n")
                f.write(f"{match['line']}\n\n")
        print(f"Saved SRT file to {os.path.abspath(srt_path)}")
        
        # Verify files were created
        if os.path.exists(json_path) and os.path.exists(srt_path):
            print("Files successfully created and verified")
            return True
        else:
            print("File verification failed!")
            return False
            
    except Exception as e:
        print(f"Error saving timed lyrics: {e}")
        import traceback
        traceback.print_exc()
        return False

def format_time(seconds):
    """Convert seconds to SRT time format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = seconds % 60
    milliseconds = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{int(seconds):02d},{milliseconds:03d}"

def read_lyrics_file(filename):
    """Read lyrics from saved file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f.readlines() if line.strip()]
    except Exception as e:
        print(f"Error reading lyrics file: {e}")
        return None

def download_music(song, artist):
    try:
        search_query = enhance_search_query(song, artist)
        video_id = search_youtube(search_query, song, artist)
        if not video_id:
            return "No videos found"
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': '%(title)s.%(ext)s',
            'quiet': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://youtube.com/watch?v={video_id}", download=True)
            
            # Move downloaded audio to audio directory
            audio_dir = 'audio'
            os.makedirs(audio_dir, exist_ok=True)
            source_path = f"{info['title']}.mp3"
            dest_path = os.path.join(audio_dir, f"{info['title']}.mp3")
            
            if os.path.exists(source_path):
                shutil.move(source_path, dest_path)
                print(f"Moved audio file to: {dest_path}")
            
            # After successful download, get and save lyrics
            print("\nFetching lyrics...")
            lyrics = get_lyrics(song, artist)
            if lyrics and save_lyrics(lyrics, song, artist):
                print(f"Lyrics saved to: {artist} - {song} lyrics.txt")
            else:
                print("Could not save lyrics")
                
            # After successful download, process lyrics timing
            print("\nProcessing lyrics timing...")
            lyrics_file = f"{artist} - {song} lyrics.txt"
            
            # Convert downloaded mp3 to wav for whisper
            print(f"\nConverting {info['title']}.mp3 to WAV format...")
            audio = AudioSegment.from_mp3(dest_path)
            wav_path = f"{info['title']}_temp.wav"
            audio.export(wav_path, format="wav")
            print(f"WAV file created at: {wav_path}")
            
            if not os.path.exists(wav_path):
                print("WAV conversion failed!")
                return "WAV conversion failed"
            
            # Get transcription timestamps
            print("\nStarting transcription process...")
            transcription = get_audio_timestamps(wav_path)
            
            try:
                os.remove(wav_path)
                print("Temporary WAV file cleaned up")
            except Exception as e:
                print(f"Warning: Could not clean up WAV file: {e}")
            
            if not transcription:
                print("Transcription process failed - no data returned")
                return "Transcription failed"
                
            print(f"Transcription completed with {len(transcription['segments'])} segments")
            
            # Read and process lyrics
            lyrics_lines = read_lyrics_file(lyrics_file)
            
            if not lyrics_lines:
                print(f"No lyrics found in {lyrics_file}")
                return "Lyrics file empty or not found"
                
            print(f"\nFound {len(lyrics_lines)} lines of lyrics")
            print("First few lines:", lyrics_lines[:3])
            
            # Match lyrics with timestamps
            print("\nMatching lyrics with timestamps...")
            matched_lyrics = align_lyrics_with_transcription(lyrics_lines, transcription)
            
            if not matched_lyrics:
                print("Failed to match lyrics with timing!")
                return "Lyrics matching failed"
                
            # Save the results
            if save_timed_lyrics(matched_lyrics, song, artist):
                print("\nLyrics timing process completed successfully")
            else:
                print("\nFailed to save timed lyrics!")
            
        return f"Successfully processed: {info['title']}"
            
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return f"Error occurred: {str(e)}"

if __name__ == "__main__":
    song, artist = "가자", "안예은"
    print(f"Downloading: {song} by {artist}")
    print(download_music(song, artist))
