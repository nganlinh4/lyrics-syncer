# YouTube Video Maker

A Python application for creating YouTube videos with synchronized lyrics/subtitles.

## Features

- Transcription using Faster Whisper
- Synchronized lyrics/subtitles generation
- Web interface for video creation and management

## Requirements

- Python 3.8+
- Flask
- faster-whisper

## Setup

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Download the required Faster Whisper model files
4. Place audio files in the `audio/` directory
5. Run the application:
```bash
python app.py
```

## Configuration

The application uses a web interface accessed through Flask. The default port is 5000.

## Directory Structure

- `app.py`: Main Flask application
- `main.py`: Core video creation logic
- `templates/`: HTML templates
- `static/`: Static files
- `audio/`: Audio files (not tracked in git)
- `models/`: Model files (not tracked in git)
- `transcriptions/`: Generated transcription files
- `lyrics/`: Generated lyrics/subtitle files