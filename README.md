# Lyrics Syncer

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
- Google Gemini API key for AI features

## Configuration

1. Copy the example config file to create your own config:
```bash
cp backend/config.example.json backend/config.json
```

2. Add your API keys to `backend/config.json`:
```json
{
    "youtubeApiKey": "YOUR_YOUTUBE_API_KEY",
    "geniusApiKey": "YOUR_GENIUS_API_KEY",
    "geminiApiKey": "YOUR_GEMINI_API_KEY"
}
```

> **Note:** The `config.json` file is ignored by Git to prevent accidentally committing your API keys to the repository.

## Setup

1. Clone the repository
2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Install Python dependencies:
```bash
cd ../backend
pip install -r requirements.txt
```

## Running the Application

1. Start the backend server:
```bash
cd backend
./venv/Scripts/activate
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000` with the backend API running at `http://localhost:3001`

## Directory Structure

```
.
├── frontend/          # React frontend application
├── backend/           # Node.js backend server and Python AI integration
├── audio/             # Downloaded audio files (not tracked in git)
├── album_art/         # Downloaded album art files (not tracked in git)
├── lyrics/            # Generated lyrics/subtitle files
└── config/            # Configuration files
```

## Key Features

### Album Art & Background Downloads
- Album art is automatically downloaded when fetching lyrics from Genius
- Album art and AI-generated backgrounds can be downloaded with a single click
- Images are saved locally for offline use

### AI-Powered Features
- Lyrics timing synchronization using Gemini models
- Background image generation based on lyrics and album art
- Customizable AI models via the settings panel

## API Endpoints

### `GET /api/audio_data/:song_name`
Retrieves audio data for a given song.

### `GET /api/lyrics_timing/:song_name`
Retrieves lyrics timing data for a given song.

### `POST /api/save_timing`
Saves lyrics timing data for a song.

### `POST /api/process`
Processes a new song (downloads audio and fetches lyrics).

### `POST /api/generate_image_prompt`
Generates a prompt for background image creation based on lyrics.

### `POST /api/generate_image`
Creates a background image using AI based on album art and prompt.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
