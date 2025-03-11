import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import * as fsSync from 'fs';
import { fileURLToPath } from 'url';
import youtubeSearch from 'youtube-search';
import youtubeDlExec from 'youtube-dl-exec';
import { spawn } from 'child_process';
import { ratio } from 'fuzzball';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add path to virtual environment Python
const VENV_PYTHON = path.join(__dirname, 'venv', 'Scripts', 'python.exe');

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

        // Create audio directory if it doesn't exist
        await fs.mkdir(AUDIO_DIR, { recursive: true });

        // 1. Download (using youtube-dl-exec)
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
                // Use a temporary filename first
                const tempFilePath = path.join(AUDIO_DIR, `temp_${Date.now()}.mp3`);
                
                const downloadOptions = {
                  extractAudio: true,
                  audioFormat: 'mp3',
                  audioQuality: 0,
                  output: tempFilePath,
                  noPlaylist: true,
                  verbose: true,
                  format: 'bestaudio',
                  postprocessorArgs: ['-acodec', 'mp3', '-ac', '2', '-ab', '192k'],
                };

                console.log('Download options:', downloadOptions);
                console.log(`Attempting to download to temporary file: ${tempFilePath}`);

                try {
                  const result = await youtubeDlExec(videoUrl, downloadOptions);
                  console.log('Download process output:', result);
                  
                  // Check the AUDIO_DIR for any new files
                  const files = fsSync.readdirSync(AUDIO_DIR);
                  console.log('Files in audio directory:', files);

                  // Find the downloaded file (it might have a different name)
                  const downloadedFile = files.find(f => f.startsWith('temp_'));
                  
                  if (downloadedFile) {
                    const downloadedPath = path.join(AUDIO_DIR, downloadedFile);
                    console.log(`Found downloaded file: ${downloadedPath}`);
                    
                    // Rename to final filename
                    fsSync.renameSync(downloadedPath, audioFilePath);
                    console.log(`Renamed to final path: ${audioFilePath}`);
                    
                    if (fsSync.existsSync(audioFilePath)) {
                      const stats = fsSync.statSync(audioFilePath);
                      console.log(`Final file size: ${stats.size} bytes`);
                      resolve();
                    } else {
                      reject(new Error(`Failed to rename file to ${audioFilePath}`));
                    }
                  } else {
                    console.log('No matching downloaded file found');
                    reject(new Error('Download completed but file not found'));
                  }
                } catch (dlError) {
                  console.error('Download process error:', dlError);
                  reject(dlError);
                }
              } catch (setupError) {
                console.error('Setup error:', setupError);
                reject(setupError);
              }
            }).catch(searchError => {
              console.error('YouTube search error:', searchError);
              reject(searchError);
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
  const { songName, lyrics } = req.body;

  if (!songName || !lyrics) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Get the audio file path
    const audioFiles = fsSync.readdirSync(AUDIO_DIR)
      .filter(f => f.toLowerCase().includes(songName.toLowerCase()) && f.endsWith('.mp3'));

    if (audioFiles.length === 0) {
      throw new Error('Audio file not found');
    }

    const audioFile = path.join(AUDIO_DIR, audioFiles[0]);
    
    // Wait a moment to ensure file is completely written
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify file exists and is readable
    try {
      await fs.access(audioFile, fs.constants.R_OK);
      const stats = await fs.stat(audioFile);
      console.log(`File verified: ${audioFile}, size: ${stats.size} bytes`);
    } catch (err) {
      throw new Error(`File not accessible: ${err.message}`);
    }

    const scriptPath = path.join(__dirname, 'lyrics_matcher.py');
    
    // Prepare environment variables
    const env = {
      ...process.env,
      PATH: `${process.env.PATH};C:\\Program Files\\ffmpeg\\bin`,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1'
    };
    
    console.log('Starting Python process with:');
    console.log('Python path:', VENV_PYTHON);
    console.log('Script path:', scriptPath);
    console.log('Audio file:', audioFile);
    
    const pythonArgs = [
      scriptPath,
      '--audio_path', audioFile,
      '--lyrics', JSON.stringify(lyrics)
    ];
    
    console.log('Python arguments:', pythonArgs);
    
    const pythonProcess = spawn(VENV_PYTHON, pythonArgs, {
      shell: false,
      env: env
    });

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
      errorData += data.toString();
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      errorData += error.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code:', code);
        if (code !== 0) {
          reject(new Error(`Process failed with code ${code}: ${errorData}`));
        } else {
          resolve();
        }
      });
    });

    try {
      // Parse the output from Python script
      const matchedData = JSON.parse(outputData.trim());
      
      if (matchedData.error) {
        throw new Error(matchedData.error);
      }

      res.json({ 
        matched_lyrics: matchedData,
        message: 'Audio processing and lyrics matching completed successfully'
      });
    } catch (parseError) {
      console.error('Failed to parse Python output:', outputData);
      throw new Error(`Failed to parse Python output: ${parseError.message}`);
    }

  } catch (error) {
    console.error('Error in auto matching:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});