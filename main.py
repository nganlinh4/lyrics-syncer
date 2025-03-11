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
from speechbrain.pretrained import VAD
from transformers import AutoModelForCTC, AutoProcessor
import torch
from dtaidistance import dtw
from dtaidistance import dtw_visualisation as dtwvis
import numpy as np
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings("ignore")

# Initialize models globally for better performance
print("Initializing models...")
vad_model = VAD.from_hparams(source="speechbrain/vad-crdnn-libriparty")
korean_asr_processor = AutoProcessor.from_pretrained("kresnik/wav2vec2-large-xlsr-korean")
korean_asr_model = AutoModelForCTC.from_pretrained("kresnik/wav2vec2-large-xlsr-korean")
whisper_model = whisper.load_model(
    "large-v3",
    device="cuda" if torch.cuda.is_available() else "cpu",
    download_root="./models"
)

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

def clean_lyrics(lyrics):
    """Clean lyrics by removing annotations and empty lines."""
    if not lyrics:
        return None
        
    # Split lyrics into lines
    lines = lyrics.split('\n')
    
    # Clean each line
    cleaned_lines = []
    for line in lines:
        # Skip empty lines
        if not line.strip():
            continue
            
        # Remove text within square brackets using regex
        line = re.sub(r'\[.*?\]', '', line)
        
        # Remove any remaining square brackets
        line = line.replace('[', '').replace(']', '')
        
        # Remove any leading/trailing whitespace
        line = line.strip()
        
        # Only add non-empty lines
        if line:
            cleaned_lines.append(line)
            
    return cleaned_lines

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

def extract_audio_features(audio: np.ndarray, sr: int) -> np.ndarray:
    """Extract MFCC features from audio"""
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
    mfcc_delta = librosa.feature.delta(mfcc)
    mfcc_delta2 = librosa.feature.delta(mfcc, order=2)
    return np.concatenate([mfcc, mfcc_delta, mfcc_delta2])

def detect_voice_activity(audio: np.ndarray, sr: int) -> List[Dict[str, float]]:
    """Detect voice activity segments using SpeechBrain VAD"""
    # Ensure audio is in the correct format (mono, float32)
    if len(audio.shape) > 1:
        audio = audio.mean(axis=1)
    audio = torch.FloatTensor(audio).unsqueeze(0)
    
    # Get VAD predictions
    probability = vad_model.get_speech_prob_chunk(audio)
    predictions = (probability > 0.5).float()
    
    # Convert predictions to time segments
    segments = []
    is_speech = False
    start_time = 0
    
    for i, pred in enumerate(predictions):
        if pred and not is_speech:
            start_time = i * 0.01  # VAD uses 10ms windows
            is_speech = True
        elif not pred and is_speech:
            end_time = i * 0.01
            segments.append({"start": start_time, "end": end_time})
            is_speech = False
    
    return segments

def korean_asr_transcribe(audio: np.ndarray, sr: int) -> List[Dict[str, any]]:
    """Transcribe using Korean ASR model"""
    inputs = korean_asr_processor(audio, sampling_rate=sr, return_tensors="pt")
    with torch.no_grad():
        logits = korean_asr_model(inputs.input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = korean_asr_processor.batch_decode(predicted_ids)
    return transcription

def get_audio_timestamps(audio_file: str) -> Dict:
    """Enhanced audio transcription with multiple models"""
    try:
        print("Processing audio...")
        
        # Load and preprocess audio
        audio, sr = librosa.load(audio_file, sr=16000)
        
        # Apply vocal isolation
        y_harmonic, y_percussive = librosa.effects.hpss(audio)
        vocals = nr.reduce_noise(
            y=y_harmonic,
            sr=sr,
            prop_decrease=0.95,
            n_fft=2048,
            win_length=512
        )
        
        # Detect voice activity segments
        print("Detecting voice activity...")
        vad_segments = detect_voice_activity(vocals, sr)
        
        # Process audio in chunks
        def process_chunk(chunk: np.ndarray) -> Tuple[List, List]:
            # Get Korean ASR transcription
            korean_trans = korean_asr_transcribe(chunk, sr)
            
            # Get Whisper transcription
            with tempfile.NamedTemporaryFile(suffix='.wav') as temp_file:
                sf.write(temp_file.name, chunk, sr)
                whisper_result = whisper_model.transcribe(
                    temp_file.name,
                    language="ko",
                    task="transcribe",
                    word_timestamps=True,
                    initial_prompt="노래 가사:",
                    temperature=0.0
                )
            
            return korean_trans, whisper_result["segments"]
        
        # Process each voice activity segment
        print("Transcribing segments...")
        all_segments = []
        for segment in vad_segments:
            start_idx = int(segment["start"] * sr)
            end_idx = int(segment["end"] * sr)
            chunk = vocals[start_idx:end_idx]
            
            if len(chunk) < sr * 0.5:  # Skip segments shorter than 0.5s
                continue
                
            korean_trans, whisper_segments = process_chunk(chunk)
            
            # Combine transcriptions using confidence scores
            for wseg in whisper_segments:
                wseg["start"] += segment["start"]
                wseg["end"] += segment["start"]
                wseg["korean_asr_text"] = korean_trans[0] if korean_trans else ""
                all_segments.append(wseg)
        
        # Extract audio features for DTW
        print("Extracting audio features...")
        audio_features = extract_audio_features(vocals, sr)
        
        # Merge close segments and align with features
        def merge_segments(segments: List[Dict], threshold: float = 0.3) -> List[Dict]:
            merged = []
            current = None
            
            for seg in sorted(segments, key=lambda x: x["start"]):
                if not current:
                    current = seg
                    continue
                
                if seg["start"] - current["end"] < threshold:
                    # Merge segments
                    current["end"] = seg["end"]
                    current["text"] = f"{current['text']} {seg['text']}"
                    current["korean_asr_text"] = f"{current['korean_asr_text']} {seg['korean_asr_text']}"
                else:
                    merged.append(current)
                    current = seg
            
            if current:
                merged.append(current)
            
            return merged
        
        print("Merging and aligning segments...")
        merged_segments = merge_segments(all_segments)
        
        # Add confidence scores based on ASR agreement
        for segment in merged_segments:
            whisper_text = segment["text"].lower()
            korean_text = segment["korean_asr_text"].lower()
            confidence = fuzz.ratio(whisper_text, korean_text) / 100.0
            segment["confidence"] = confidence
        
        # Sort segments by start time
        merged_segments.sort(key=lambda x: x["start"])
        
        return {
            "segments": merged_segments,
            "duration": len(audio) / sr,
            "vad_segments": vad_segments,
            "audio_features": audio_features.tolist()
        }
        
    except Exception as e:
        print(f"Error in enhanced transcription: {e}")
        import traceback
        traceback.print_exc()
        return None

def align_lyrics_with_audio(lyrics_lines: List[str], transcription: Dict) -> List[Dict]:
    """Align lyrics with audio using DTW and multiple transcription sources"""
    try:
        print("\nAligning lyrics with audio...")
        print(f"Processing {len(lyrics_lines)} lyrics lines")
        
        segments = transcription["segments"]
        audio_features = np.array(transcription["audio_features"])
        
        # Create features for lyrics (using length as proxy)
        lyrics_features = np.array([len(line) for line in lyrics_lines])
        
        # Perform DTW alignment
        print("Performing DTW alignment...")
        path = dtw.warping_path(audio_features[0], lyrics_features)
        
        # Match lyrics to segments based on DTW path and confidence scores
        matched_lyrics = []
        for i, lyric_line in enumerate(lyrics_lines):
            # Find corresponding audio segments from DTW path
            corresponding_segments = [
                segments[j] for j, k in path if k == i and j < len(segments)
            ]
            
            if corresponding_segments:
                # Use segment with highest confidence
                best_segment = max(corresponding_segments, key=lambda x: x.get("confidence", 0))
                
                matched_lyrics.append({
                    "line": lyric_line,
                    "start": best_segment["start"],
                    "end": best_segment["end"],
                    "confidence": best_segment.get("confidence", 0),
                    "transcribed_text": best_segment["text"],
                    "korean_asr_text": best_segment.get("korean_asr_text", "")
                })
        
        # Sort by start time and adjust overlaps
        matched_lyrics.sort(key=lambda x: x["start"])
        
        # Adjust overlapping timestamps
        for i in range(1, len(matched_lyrics)):
            if matched_lyrics[i]["start"] < matched_lyrics[i-1]["end"]:
                mid_point = (matched_lyrics[i]["start"] + matched_lyrics[i-1]["end"]) / 2
                matched_lyrics[i-1]["end"] = mid_point
                matched_lyrics[i]["start"] = mid_point
        
        return matched_lyrics
        
    except Exception as e:
        print(f"Error in lyrics alignment: {e}")
        import traceback
        traceback.print_exc()
        return None

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
            matched_lyrics = align_lyrics_with_audio(lyrics_lines, transcription)
            
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
