// filepath: c:\WORK_win\lyrics-syncer\backend\controllers\apiController.js
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import config from '../config/config.js';
import { fileExists, getGeminiResultsPath } from '../utils/fileUtils.js';

/**
 * Handles requests to save API keys
 */
export const saveApiKey = async (req, res) => {
  try {
    const { type, key } = req.body;
    if (!type || !key) {
      return res.status(400).json({ error: 'API key and key type are required' });
    }

    // Validate key type
    if (!config.validApiKeyTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid key type' });
    }

    let appConfig = {};
    
    if (await fileExists(config.configFilePath)) {
      const configData = await fs.readFile(config.configFilePath, 'utf-8');
      appConfig = JSON.parse(configData);
    }

    // Save the API key based on its type
    switch(type) {
      case 'genius':
        appConfig.geniusApiKey = key;
        break;
      case 'youtube':
        appConfig.youtubeApiKey = key;
        break;
      case 'gemini':
        appConfig.geminiApiKey = key;
        break;
      default:
        return res.status(400).json({ error: 'Invalid key type' });
    }

    await fs.writeFile(config.configFilePath, JSON.stringify(appConfig, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error("Error in /api/save_api_key:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Match lyrics with audio using the Python script
 */
export const matchLyrics = async (req, res) => {
  try {
    const { artist, song, audioPath, lyrics, model, forceRematch } = req.body;
    
    if (!audioPath || !lyrics) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check for existing Gemini results, unless forceRematch is true
    if (!forceRematch) {
      const resultsPath = getGeminiResultsPath(artist, song, model, config.lyricsDir);
      if (await fileExists(resultsPath)) {
        console.log(`Using cached Gemini results from ${resultsPath}`);
        const cachedResults = await fs.readFile(resultsPath, 'utf-8');
        return res.json(JSON.parse(cachedResults));
      }
    }

    // Clean the audio path by removing query parameters
    const cleanAudioPath = audioPath.split('?')[0];
    
    // Ensure the audio file exists
    const absoluteAudioPath = path.join(config.audioDir, path.basename(cleanAudioPath));
    if (!fsSync.existsSync(absoluteAudioPath)) {
      return res.status(404).json({ 
        error: `Audio file not found: ${cleanAudioPath}`,
        status: 'error'
      });
    }

    console.log('Debug info:', {
      scriptPath: config.pythonScriptPath,
      absoluteAudioPath,
      exists: fsSync.existsSync(absoluteAudioPath),
      size: fsSync.statSync(absoluteAudioPath).size
    });

    // Prepare the command with cleaned audio path
    const pythonArgs = [
      config.pythonScriptPath,
      '--mode', 'match',
      '--audio', absoluteAudioPath,
      '--lyrics', JSON.stringify(lyrics),
      '--artist', artist,
      '--song', song,
      '--model', model
    ];
    
    const pythonProcess = spawn('python', pythonArgs);

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

      (async () => {
        try {
          const result = JSON.parse(stdoutData);
          
          // Generate streaming response format
          const streamedResult = {
            type: 'result',
            matchedLyrics: result.matched_lyrics || [],
            language: result.detected_language || 'en',
            status: result.status || 'success'
          };
          
          // Save original Gemini results to file only if not forceRematch
          if (!forceRematch) {
            await fs.writeFile(resultsPath, JSON.stringify(result, null, 2), 'utf-8');
          }
          
          // Return the reformatted result for the frontend
          res.json(streamedResult);
        } catch (error) {
          console.error('Error parsing Python output:', error);
          res.status(500).json({ 
            type: 'error',
            error: 'Failed to parse matching results',
            status: 'error'
          });
        }
      })();
    });
  } catch (error) {
    console.error("Error in /api/match_lyrics:", error);
    res.status(500).json({ 
      error: error.message,
      status: 'error'
    });
  }
};

/**
 * Force rematch lyrics with audio
 */
export const forceMatchLyrics = async (req, res) => {
  try {
    const { artist, song, audioPath, lyrics, model } = req.body;
    
    // Delete existing Gemini results if they exist
    const resultsPath = getGeminiResultsPath(artist, song, model, config.lyricsDir);
    if (await fileExists(resultsPath)) {
      await fs.unlink(resultsPath);
    }

    // Use the same matchLyrics function
    return matchLyrics(req, res);
  } catch (error) {
    console.error("Error in /api/force_match:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate image prompt based on lyrics
 */
export const generateImagePrompt = async (req, res) => {
  try {
    const { lyrics, albumArtUrl, model } = req.body;
    
    if (!lyrics) {
      return res.status(400).json({ error: 'Missing lyrics' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model must be specified' });
    }

    if (!await fileExists(config.configFilePath)) {
      return res.status(400).json({ error: 'Config file not found' });
    }

    const appConfig = JSON.parse(await fs.readFile(config.configFilePath, 'utf-8'));
    if (!appConfig.geminiApiKey) {
      return res.status(400).json({ error: 'Gemini API key not set' });
    }

    const pythonArgs = [
      config.pythonScriptPath,
      '--mode', 'generate_prompt',
      '--lyrics', JSON.stringify(lyrics),
      '--model', model
    ];

    // Add song name parameter if albumArtUrl is provided
    if (albumArtUrl) {
      pythonArgs.push('--album_art');
      pythonArgs.push(albumArtUrl);
    }

    console.log('Running Python with args:', pythonArgs);

    const pythonProcess = spawn('python', pythonArgs);
    
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
          error: stderrData || 'Failed to generate prompt',
          status: 'error'
        });
      }

      try {
        const result = JSON.parse(stdoutData);
        res.json(result);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        res.status(500).json({ 
          error: 'Failed to parse prompt generation results',
          status: 'error'
        });
      }
    });
  } catch (error) {
    console.error('Error in generateImagePrompt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate image based on prompt and album art
 */
export const generateImage = async (req, res) => {
  try {
    const { prompt, albumArt, albumArtUrl, model } = req.body;
    
    // Use either albumArt or albumArtUrl (for backward compatibility)
    const artUrl = albumArt || albumArtUrl;
    
    if (!prompt || !artUrl) {
      return res.status(400).json({ error: 'Missing prompt or album art URL' });
    }

    if (!await fileExists(config.configFilePath)) {
      return res.status(400).json({ error: 'Config file not found' });
    }

    const appConfig = JSON.parse(await fs.readFile(config.configFilePath, 'utf-8'));
    if (!appConfig.geminiApiKey) {
      return res.status(400).json({ error: 'Gemini API key not set' });
    }

    // Check if the URL is a local URL (starts with http://localhost)
    let artPath = artUrl;
    if (artUrl.startsWith('http://localhost')) {
      // Extract the path part from the URL
      const urlPath = new URL(artUrl).pathname;
      // Convert from URL path to local file path
      const fileName = path.basename(urlPath);
      // The album art is likely in the album_art directory
      artPath = path.join(path.dirname(config.lyricsDir), 'album_art', fileName);
      
      // Verify that the file exists
      if (!await fileExists(artPath)) {
        return res.status(404).json({ 
          error: `Album art file not found at ${artPath}`, 
          status: 'error' 
        });
      }
    }

    console.log('Running image generation with args:', {
      mode: 'generate_image',
      prompt,
      albumArt: artPath.substring(0, 30) + '...' // Log truncated path for privacy
    });

    const pythonArgs = [
      config.pythonScriptPath,
      '--mode', 'generate_image',
      '--prompt', prompt,
      '--album_art', artPath,
      '--model', model
    ];

    const pythonProcess = spawn('python', pythonArgs);
    
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
          error: stderrData || 'Failed to generate image',
          status: 'error'
        });
      }

      try {
        const result = JSON.parse(stdoutData);
        res.json(result);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        res.status(500).json({ 
          error: 'Failed to parse image generation results',
          status: 'error'
        });
      }
    });
  } catch (error) {
    console.error('Error in generateImage:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete cache files from specified folders
 */
export const deleteCache = async (req, res) => {
  try {
    const foldersToClean = [
      { path: config.audioDir, name: 'audio' },
      { path: config.lyricsDir, name: 'lyrics' },
      { path: config.debugDir, name: 'debug' }
    ];
    
    const results = [];
    
    for (const folder of foldersToClean) {
      try {
        if (await fileExists(folder.path)) {
          const files = await fs.readdir(folder.path);
          
          // Delete each file in the folder
          for (const file of files) {
            const filePath = path.join(folder.path, file);
            // Check if it's a file and not a directory
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
              await fs.unlink(filePath);
            }
          }
          
          results.push({ folder: folder.name, status: 'success', message: `Deleted ${files.length} files` });
        } else {
          results.push({ folder: folder.name, status: 'warning', message: 'Folder does not exist' });
        }
      } catch (error) {
        results.push({ folder: folder.name, status: 'error', message: error.message });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error in /api/delete_cache:", error);
    res.status(500).json({ error: error.message });
  }
};