# YouTube Video Maker

A web application for creating YouTube videos with synchronized lyrics/subtitles, built with React and Node.js.

## Features

- Web interface for video creation and management
- YouTube video audio extraction
- Automatic lyrics fetching from Genius
- Waveform visualization

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- FFmpeg installed and available in system PATH

## Configuration

1. Create `backend/config.json` with your API keys:
```json
{
    "youtubeApiKey": "YOUR_YOUTUBE_API_KEY",
    "geniusApiKey": "YOUR_GENIUS_API_KEY"
}
```

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

## Running the Application

1. Start the backend server:
```bash
cd backend
./venv/Scripts/activate

# For CUDA support (replace XX with your CUDA version, e.g., 11.8, 12.1)
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install other dependencies
pip install transformers numpy faster-whisper

# Start the development server
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Directory Structure

```
.
├── frontend/           # React frontend application
├── backend/           # Node.js backend server
├── audio/            # Downloaded audio files (not tracked in git)
├── lyrics/           # Generated lyrics/subtitle files
└── config/           # Configuration files
```

## API Endpoints

### `GET /api/audio_data/:song_name`
Retrieves audio data for a given song.

### `GET /api/lyrics_timing/:song_name`
Retrieves lyrics timing data for a given song.

### `POST /api/save_timing`
Saves lyrics timing data for a song.

### `POST /api/process`
Processes a new song (downloads audio and fetches lyrics).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
