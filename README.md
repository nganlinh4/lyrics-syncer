# Lyrics Syncer

| | | |
|:-------------------------:|:-------------------------:|:-------------------------:|
|<img src="readme_assests/Screenshot%202025-03-26%20104703.png" width="250">|<img src="readme_assests/Screenshot%202025-03-26%20104723.png" width="250">|<img src="readme_assests/Screenshot%202025-03-26%20104744.png" width="250">|
|<img src="readme_assests/Screenshot%202025-03-26%20104759.png" width="250">|<img src="readme_assests/Screenshot%202025-03-26%20104807.png" width="250">|<img src="readme_assests/Screenshot%202025-03-26%20104822.png" width="250">|

A web application for synchronizing lyrics with audio files, built with React and Node.js.

## Features

- Web interface for lyrics synchronization
- YouTube video audio extraction
- Automatic lyrics fetching from Genius
- Album art download and display
- AI-generated background images using Google Gemini
- One-click downloads for album art and backgrounds
- Waveform visualization
- Real-time lyrics timing adjustment

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- FFmpeg installed and available in system PATH
- Python 3.9+ for AI features
- uv tool for Python virtual environment management
- Google Gemini API key for AI features

## Configuration

Copy the example config file to create your own config:
```bash
cp backend/config.example.json backend/config.json
```

## Setup

1. Clone the repository

2. Install uv (PowerShell in Administrator mode):
```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

3. Install all dependencies at once:
```bash
npm run install-all
```

This will:
- Install root dependencies
- Install frontend dependencies
- Install backend dependencies with YOUTUBE_DL_SKIP_PYTHON_CHECK=1 set
- Create a Python virtual environment in the backend directory
- Install Python dependencies in the virtual environment


## Running the Application

### Option 1: Run everything with a single command

```bash
npm run dev
```

This will start both the backend (with Python environment activated) and frontend concurrently.

The application will be available at `http://localhost:3000` with the backend API running at `http://localhost:3001`

## Key Features

### Album Art & Background Downloads
- Album art is automatically downloaded when fetching lyrics from Genius
- Album art and AI-generated backgrounds can be downloaded with a single click
- Images are saved locally for offline use

### AI-Powered Features
- Lyrics timing synchronization using Gemini models
- Background image generation based on lyrics and album art
- Customizable AI models via the settings panel

## License

This project is licensed under the MIT License - see the LICENSE file for details
