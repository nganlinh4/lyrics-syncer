import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import * as fsSync from 'fs';
import { fileURLToPath } from 'url';
import youtubeSearch from 'youtube-search';
// Import youtube-dl-exec for more reliable downloads
import youtubeDlExec from 'youtube-dl-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const AUDIO_DIR = path.join(__dirname, '../audio');
const LYRICS_DIR = path.join(__dirname, '../lyrics');
fsSync.mkdirSync(AUDIO_DIR, { recursive: true });
fsSync.mkdirSync(LYRICS_DIR, { recursive: true });

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
    return `${artist} - ${song}`.toLowerCase().replace(/\s+/g, '_');
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
    const audioFiles = files.filter(f => f.endsWith('.mp3') && f.startsWith(song_name));

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
 * Handles the entire song processing pipeline: download, lyrics, transcription, alignment.
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
      if (!config.geniusApiKey) {
          return res.status(400).json({ error: 'Genius API key not set. Please provide it through the frontend.' });
      }
      if (!config.youtubeApiKey) {
          return res.status(400).json({ error: 'YouTube API key not set. Please provide it through the frontend.' });
      }

        const { default: Genius } = await import('genius-lyrics');
        const geniusClient = new Genius.Client(config.geniusApiKey);
        const { artist, song } = req.body;
        if (!artist || !song) {
            return res.status(400).json({ error: 'Missing artist or song' });
        }

        // Validate song and artist to prevent directory traversal
        const safeSongName = song.replace(/[^a-zA-Z0-9\s-]/g, '');
        const safeArtistName = artist.replace(/[^a-zA-Z0-9\s-]/g, '');

        if (safeSongName !== song || safeArtistName !== artist)
        {
            return res.status(400).json({ error: 'Invalid characters in song or artist name.'});
        }

        const songName = getSongName(artist, song);
        const audioFilePath = path.join(AUDIO_DIR, `${songName}.mp3`);
        const lyricsFilePath = path.join(LYRICS_DIR, `${songName} timed.json`);

        // 1. Download (using youtube-dl-exec)
        if (!(await fileExists(audioFilePath))) {
          // Wrap download logic in a promise
          await new Promise((resolve, reject) => {
            console.log(`Searching YouTube for: ${artist} ${song}`);
            // Search YouTube for the song using youtube-search
            youtubeSearch(`${artist} ${song}`, { maxResults: 1, key: config.youtubeApiKey }).then(async searchResults => {
              console.log('YouTube search results:', searchResults);
              if (searchResults.results.length === 0) {
                reject('No videos found for this song/artist combination.');
                return;
              }

              const videoId = searchResults.results[0].id;
              if (!videoId) {
                reject('No video ID found in search results.');
                return;
              }

              console.log(`Downloading video with ID: ${videoId}`);
              const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
              
              try {
                // Remove any existing file at this path
                if (fsSync.existsSync(audioFilePath)) {
                  try {
                    fsSync.unlinkSync(audioFilePath);
                    console.log(`Removed existing file: ${audioFilePath}`);
                  } catch (err) {
                    console.error(`Failed to remove existing file: ${err}`);
                  }
                }
                
                // Using youtube-dl-exec instead of ytdl-core
                console.log(`Starting download of ${videoUrl} to ${audioFilePath}`);
                
                // Use youtube-dl-exec's binary with proper options
                const downloadProcess = youtubeDlExec(videoUrl, {
                  extractAudio: true,
                  audioFormat: 'mp3',
                  audioQuality: 0, // Best quality
                  output: audioFilePath,
                  noPlaylist: true,
                  youtubeSkipDashManifest: true,
                  addHeader: [
                    'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                  ]
                });
                
                downloadProcess.then(() => {
                  // Verify file exists and has content
                  if (fsSync.existsSync(audioFilePath)) {
                    const stats = fsSync.statSync(audioFilePath);
                    if (stats.size > 0) {
                      console.log(`Successfully downloaded ${songName}.mp3 (${stats.size} bytes)`);
                      resolve();
                    } else {
                      reject(new Error('Downloaded file has 0 bytes size'));
                    }
                  } else {
                    reject(new Error('File not found after download completed'));
                  }
                }).catch(error => {
                  console.error('Error during youtube-dl download:', error);
                  reject(error);
                });
                
              } catch (err) {
                console.error('Error setting up YouTube download:', err);
                reject(err);
              }
            }).catch(err => {
              console.error('YouTube search error:', err);
              reject(err);
            });
          });
        }

        // 2. Fetch Lyrics
        const geniusSong = await geniusClient.songs.search(`${artist} ${song}`);
        if (geniusSong.length > 0) {
          const lyrics = await geniusSong[0].lyrics();

          // 3. TODO: Generate Timestamped Transcription (Placeholder)
          const transcription = [{ start: 0, end: 10, text: "Placeholder transcription" }];

          // 4. TODO: Align Lyrics (Placeholder)
          const alignedLyrics = [{ start: 0, end: 10, line: "Placeholder lyrics" }];

          // 5. Save Timed Lyrics
          await fs.writeFile(lyricsFilePath, JSON.stringify(alignedLyrics, null, 2), 'utf-8');
          res.json({ success: true, message: `Processed ${songName}`, lyrics: lyrics });

        }
        else {
          res.status(404).json({error: "Lyrics not found"});
        }

    } catch (error) {
        console.error("Error in /api/process:", error);
        console.error(error.stack);
        res.status(500).json({ error: error.message });
    }
};

const saveApiKey = async (req, res) => {
    try {
        const { apiKey, keyType } = req.body;
        if (!apiKey || !keyType) {
            return res.status(400).json({ error: 'API key and key type are required' });
        }
        const configPath = path.join(__dirname, 'config.json');
        let config = {};
        if (await fileExists(configPath)) {
            const configData = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configData);
        }

        if (keyType === 'genius') {
            config.geniusApiKey = apiKey;
        } else if (keyType === 'youtube') {
            config.youtubeApiKey = apiKey;
        } else {
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});