from flask import Flask, render_template, jsonify, request, send_from_directory, send_file
import json
import os
from pathlib import Path
import librosa
import matplotlib
matplotlib.use('Agg')  # Must be before any other matplotlib imports
import matplotlib.pyplot as plt
plt.ioff()  # Turn off interactive mode
import numpy as np

app = Flask(__name__, static_url_path='')

# Define constants
AUDIO_DIR = 'audio'
LYRICS_DIR = 'lyrics'

# Create directories if they don't exist
Path(AUDIO_DIR).mkdir(exist_ok=True)
Path(LYRICS_DIR).mkdir(exist_ok=True)

def generate_waveform(audio_path, output_path):
    try:
        # Load audio file
        y, sr = librosa.load(audio_path)
        
        # Create figure without GUI
        fig = plt.figure(figsize=(15, 3), frameon=False)
        ax = fig.add_subplot(111)
        ax.axis('off')
        
        # Plot waveform
        ax.plot(y, color='green', linewidth=0.5)
        ax.margins(0, 0)
        
        # Save with tight layout
        fig.savefig(output_path, 
                   bbox_inches='tight',
                   pad_inches=0,
                   dpi=100,
                   facecolor='black',
                   format='png',
                   backend='agg')
        
        # Clean up
        plt.close(fig)
        plt.close('all')
        
        return True
    except Exception as e:
        print(f"Error generating waveform: {e}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    if filename.endswith('.mp3'):
        return send_from_directory(AUDIO_DIR, filename)
    if filename.endswith('.png'):
        return send_from_directory(AUDIO_DIR, filename)
    return send_from_directory('.', filename)

@app.route('/get_audio_data/<song_name>')
def get_audio_data(song_name):
    try:
        # Get the mp3 file path with proper encoding
        audio_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith('.mp3') and f.startswith(song_name)]
        if audio_files:
            return jsonify({
                'audio_url': f'/static/{audio_files[0]}',
                'duration': 0
            })
        print(f"No audio file found for {song_name} in {AUDIO_DIR}")
        print(f"Available files: {os.listdir(AUDIO_DIR)}")
        return jsonify({'error': f'Audio file not found for {song_name}'})
    except Exception as e:
        print(f"Error in get_audio_data: {e}")
        return jsonify({'error': str(e)})

@app.route('/get_lyrics_timing/<song_name>')
def get_lyrics_timing(song_name):
    json_file = Path(LYRICS_DIR) / f"{song_name} timed.json"
    try:
        if json_file.exists():
            with open(json_file, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        print(f"No lyrics file found: {json_file}")
        return jsonify({'error': 'Lyrics timing not found'})
    except Exception as e:
        print(f"Error in get_lyrics_timing: {e}")
        return jsonify({'error': str(e)})

@app.route('/save_timing', methods=['POST'])
def save_timing():
    data = request.json
    with open(Path(LYRICS_DIR) / f"{data['song_name']} timed.json", 'w', encoding='utf-8') as f:
        json.dump(data['timing'], f, ensure_ascii=False, indent=2)
    return jsonify({'success': True})

@app.route('/get_waveform/<song_name>')
def get_waveform(song_name):
    try:
        # Find audio file
        audio_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith('.mp3') and f.startswith(song_name)]
        if not audio_files:
            return jsonify({'error': 'Audio file not found'})
        
        audio_file = audio_files[0]
        base_name = os.path.splitext(audio_file)[0]
        waveform_name = f"{base_name}_waveform.png"
        waveform_path = os.path.join(AUDIO_DIR, waveform_name)
        
        # Generate waveform if it doesn't exist
        if not os.path.exists(waveform_path):
            audio_path = os.path.join(AUDIO_DIR, audio_file)
            if not generate_waveform(audio_path, waveform_path):
                return jsonify({'error': 'Failed to generate waveform'})
        
        # Verify file exists after generation
        if not os.path.exists(waveform_path):
            return jsonify({'error': 'Waveform generation failed'})
            
        return jsonify({'waveform_url': f'/static/{waveform_name}'})
    except Exception as e:
        print(f"Error in get_waveform: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
