import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import youtubeSearch from 'youtube-search';
import youtubeDl from 'youtube-dl-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PYTHON_SCRIPT_PATH = path.join(__dirname, 'main.py');

const app = express();
const port = 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin resource sharing for audio files
  contentSecurityPolicy: false // Disable CSP to allow audio playback
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges']
}));
app.use(express.json());

// Make sure audio directory exists
const AUDIO_DIR = path.join(__dirname, '..', 'audio');
const LYRICS_DIR = path.join(__dirname, '..', 'lyrics');
// Ensure directories exist with proper permissions
try {
  fsSync.mkdirSync(AUDIO_DIR, { recursive: true, mode: 0o755 });
  fsSync.mkdirSync(LYRICS_DIR, { recursive: true, mode: 0o755 });
  console.log(`Directories created/verified:
    AUDIO_DIR: ${AUDIO_DIR}
    LYRICS_DIR: ${LYRICS_DIR}`);
} catch (error) {
  console.error('Error creating directories:', error);
}

/**
 * Checks if a file exists.
 * @param {string} filePath The path to the file.
 * @returns {Promise<boolean>} True if the file exists, false otherwise.
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Constructs a URL-friendly song name.
 * @param {string} artist The artist name.
 * @param {string} song The song name.
 * @returns {string} The URL-friendly song name.
 */
const getSongName = (artist, song) => {
    return `${artist.toLowerCase().replace(/\s+/g, '_')}_-_${song.toLowerCase().replace(/\s+/g, '_')}`;
};

/**
 * Handles requests to get audio data for a given song.
 * @param {express.Request} req The request object.
 * @param {express.Response} res The response object.
 */
const getAudioData = async (req, res) => {
  try {
    const { song_name } = req.params;
    const files = await fs.readdir(AUDIO_DIR);
    
    // Make the search case-insensitive
    const audioFiles = files.filter(f => 
      f.toLowerCase().endsWith('.mp3') && 
      f.toLowerCase().includes(song_name.toLowerCase())
    );

    if (audioFiles.length > 0) {
        const audioFilePath = path.join(AUDIO_DIR, audioFiles[0]);
        const stats = fsSync.statSync(audioFilePath);
        
        // Form a proper URL for the audio file - include a timestamp to prevent caching
        const timestamp = Date.now();
        const audioUrl = `http://localhost:${port}/audio/${audioFiles[0]}?t=${timestamp}`;
        
        console.log(`Audio URL generated: ${audioUrl}`);
        console.log(`Audio file exists: ${fsSync.existsSync(audioFilePath)}, size: ${stats.size} bytes`);
        
        res.json({
            audio_url: audioUrl,
            duration: 100, // Use a reasonable default until proper duration detection is implemented
            size: stats.size
        });
    } else {
      console.log(`No audio file found matching: ${song_name}`);
      console.log(`Available files: ${files.join(', ')}`);
      res.status(404).json({ error: 'Audio file not found' });
    }
  } catch (error) {
    console.error("Error in /api/audio_data:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles requests to get lyrics timing data for a given song.
 * @param {express.Request} req The request object.
 * @param {express.Response} res The response object.
 */
const getLyricsTiming = async (req, res) => {
    try {
        const { song_name } = req.params;
        const jsonPath = path.join(LYRICS_DIR, `${song_name} timed.json`);

        if (await fileExists(jsonPath)) {
            const data = await fs.readFile(jsonPath, 'utf-8');
            res.json(JSON.parse(data));
        } else {
            res.status(404).json({ error: 'Lyrics timing not found' });
        }
    } catch (error) {
        console.error("Error in /api/lyrics_timing:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handles requests to save lyrics timing data.
 * @param {express.Request} req The request object.
 * @param {express.Response} res The response object.
 */
const saveTiming = async (req, res) => {
    try {
        const { song_name, timing } = req.body;
        const jsonPath = path.join(LYRICS_DIR, `${song_name} timed.json`);
        await fs.writeFile(jsonPath, JSON.stringify(timing, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (error) {
        console.error("Error in /api/save_timing:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handles the entire song processing pipeline: download and audio processing.
 * @param {express.Request} req The request object.
 * @param {express.Response} res The response object.
 */
const processSong = async (req, res) => {
    try {
        // Read the API key from config.json
        let config = {};
        const configPath = path.join(__dirname, 'config.json');
        if (await fileExists(configPath)) {
            const configData = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configData);
        }
        if (!config.youtubeApiKey) {
            return res.status(400).json({ error: 'YouTube API key not set. Please provide it through the frontend.' });
        }

        const { artist, song } = req.body;
        if (!artist || !song) {
            return res.status(400).json({ error: 'Missing artist or song' });
        }

        // Validate song and artist to prevent directory traversal
        const safeSongName = song.replace(/[^a-zA-Z0-9\s-]/g, '');
        const safeArtistName = artist.replace(/[^a-zA-Z0-9\s-]/g, '');

        if (safeSongName !== song || safeArtistName !== artist) {
            return res.status(400).json({ error: 'Invalid characters in song or artist name.' });
        }

        const songName = getSongName(artist, song);
        const audioFilePath = path.join(AUDIO_DIR, `${songName}.mp3`);
        const tempDir = path.join(AUDIO_DIR, 'temp');

        // Create directories if they don't exist
        await fs.mkdir(AUDIO_DIR, { recursive: true });
        await fs.mkdir(tempDir, { recursive: true });

        // Download (using youtube-dl-exec)
        if (!(await fileExists(audioFilePath))) {
            await new Promise((resolve, reject) => {
                console.log(`Searching YouTube for: ${artist} ${song}`);
                youtubeSearch(`${artist} ${song}`, { maxResults: 1, key: config.youtubeApiKey }).then(async searchResults => {
                    if (searchResults.results.length === 0) {
                        reject('No videos found for this song/artist combination.');
                        return;
                    }

                    const videoId = searchResults.results[0].id;
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    console.log(`Starting download process for video: ${videoUrl}`);

                    try {
                        // Use a temporary directory and let youtube-dl name the file
                        const tempFilename = `temp_${Date.now()}`;
                        const tempFilePath = path.join(tempDir, tempFilename);
                        
                        const downloadOptions = {
                            extractAudio: true,
                            audioFormat: 'mp3',
                            audioQuality: 0,
                            output: `${tempFilePath}.%(ext)s`,
                            noPlaylist: true,
                            verbose: true,
                            format: 'bestaudio',
                            postprocessorArgs: ['-acodec', 'mp3', '-ac', '2', '-ab', '192k'],
                        };

                        console.log('Download options:', downloadOptions);
                        console.log(`Attempting to download to temporary directory: ${tempDir}`);

                        // Download the file
                        await youtubeDl(videoUrl, downloadOptions);

                        // Find the downloaded file in the temp directory
                        const files = await fs.readdir(tempDir);
                        const downloadedFile = files.find(f => f.startsWith(tempFilename));

                        if (!downloadedFile) {
                            throw new Error('Downloaded file not found in temp directory');
                        }

                        const downloadedPath = path.join(tempDir, downloadedFile);
                        console.log(`Moving file from ${downloadedPath} to ${audioFilePath}`);

                        // Ensure the source file exists before attempting to move it
                        if (await fileExists(downloadedPath)) {
                            await fs.rename(downloadedPath, audioFilePath);
                        } else {
                            throw new Error(`Downloaded file not found at ${downloadedPath}`);
                        }

                        // Clean up temp directory
                        const remainingFiles = await fs.readdir(tempDir);
                        await Promise.all(
                            remainingFiles.map(file => 
                                fs.unlink(path.join(tempDir, file)).catch(console.error)
                            )
                        );

                        resolve();
                    } catch (error) {
                        console.error('Error during download:', error);
                        reject(error);
                    }
                }).catch(error => {
                    console.error('Error during YouTube search:', error);
                    reject(error);
                });
            });
        }

        // Return success response with audio file information
        const stats = await fs.stat(audioFilePath);
        const timestamp = Date.now();
        const audioUrl = `http://localhost:${port}/audio/${path.basename(audioFilePath)}?t=${timestamp}`;

        res.json({
            success: true,
            message: `Processed ${songName}`,
            audio_url: audioUrl,
            size: stats.size
        });

    } catch (error) {
        console.error("Error in /api/process:", error);
        console.error(error.stack);
        res.status(500).json({ error: error.message });
    }
};

const saveApiKey = async (req, res) => {
    try {
        const { type, key } = req.body;
        if (!type || !key) {
            return res.status(400).json({ error: 'API key and key type are required' });
        }

        const configPath = path.join(__dirname, 'config.json');
        let config = {};
        
        if (await fileExists(configPath)) {
            const configData = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configData);
        }

        switch(type) {
            case 'genius':
                config.geniusApiKey = key;
                break;
            case 'youtube':
                config.youtubeApiKey = key;
                break;
            case 'gemini':
                config.geminiApiKey = key;
                break;
            default:
                return res.status(400).json({ error: 'Invalid key type' });
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (error) {
        console.error("Error in /api/save_api_key:", error);
        res.status(500).json({ error: error.message });
    }
};

// Routes
app.get('/api/audio_data/:song_name', getAudioData);
app.get('/api/lyrics_timing/:song_name', getLyricsTiming);
app.post('/api/save_timing', saveTiming);
app.post('/api/process', processSong);
const getLyrics = async (req, res) => {
    try {
        // Read the API key from config.json
        let config = {};
        const configPath = path.join(__dirname, 'config.json');
        if (await fileExists(configPath)) {
            const configData = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configData);
        }
        
        if (!config.geniusApiKey) {
            return res.status(400).json({ error: 'Genius API key not set. Please provide it through the frontend.' });
        }

        const { default: Genius } = await import('genius-lyrics');
        const geniusClient = new Genius.Client(config.geniusApiKey);
        const { artist, song } = req.body;

        if (!artist || !song) {
            return res.status(400).json({ error: 'Missing artist or song' });
        }

        const geniusSong = await geniusClient.songs.search(`${artist} ${song}`);
        if (geniusSong.length > 0) {
            const lyrics = await geniusSong[0].lyrics();
            res.json({ lyrics });
        } else {
            res.status(404).json({ error: "Lyrics not found" });
        }

    } catch (error) {
        console.error("Error in /api/lyrics:", error);
        res.status(500).json({ error: error.message });
    }
};
app.post('/api/save_api_key', saveApiKey);

// Replace the complex static file handler with a simpler one
app.use('/audio', express.static(AUDIO_DIR, {
  setHeaders: (res, filepath) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });
    console.log(`Serving audio file: ${filepath}`);
  }
}));

app.post('/api/lyrics', getLyrics);

app.post('/api/auto_match', async (req, res) => {
    const { lyrics, artist, song } = req.body;

    if (!lyrics || !artist || !song) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Calculate time points for each lyric line
        const matchedLyrics = lyrics.map((line, index) => {
            // Simple linear distribution of lyrics across the song duration
            // You'll need to implement your own timing logic here
            return {
                text: line,
                timestamp: index // placeholder
            };
        });

        res.json({ matchedLyrics });
    } catch (error) {
        console.error('Error in auto_match:', error);
        res.status(500).json({ error: error.message });
    }
});

const matchLyrics = async (req, res) => {
    try {
        const { artist, song, audioPath, lyrics } = req.body;
        
        if (!audioPath || !lyrics) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Clean the audio path by removing query parameters
        const cleanAudioPath = audioPath.split('?')[0];
        
        // Ensure the audio file exists
        const absoluteAudioPath = path.join(AUDIO_DIR, path.basename(cleanAudioPath));
        if (!fsSync.existsSync(absoluteAudioPath)) {
            return res.status(404).json({ 
                error: `Audio file not found: ${cleanAudioPath}`,
                status: 'error'
            });
        }

        // Construct absolute path to the Python script
        const scriptPath = path.join(__dirname, 'main.py');

        console.log('Debug info:', {
            scriptPath,
            absoluteAudioPath,
            exists: fsSync.existsSync(absoluteAudioPath),
            size: fsSync.statSync(absoluteAudioPath).size
        });

        // Prepare the command with cleaned audio path
        const pythonProcess = spawn('python', [
            scriptPath,
            '--mode', 'match',
            '--audio', absoluteAudioPath,
            '--lyrics', JSON.stringify(lyrics),
            '--artist', artist,
            '--song', song
        ]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log('Python stdout:', data.toString());
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error('Python stderr:', data.toString());
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python process error:', stderrData);
                return res.status(500).json({ 
                    error: stderrData || 'Failed to process lyrics',
                    status: 'error'
                });
            }

            try {
                const result = JSON.parse(stdoutData);
                res.json(result);
            } catch (error) {
                console.error('Error parsing Python output:', error);
                res.status(500).json({ 
                    error: 'Failed to parse matching results',
                    status: 'error'
                });
            }
        });

    } catch (error) {
        console.error("Error in /api/match_lyrics:", error);
        res.status(500).json({ 
            error: error.message,
            status: 'error'
        });
    }
};

app.post('/api/match_lyrics', matchLyrics);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});