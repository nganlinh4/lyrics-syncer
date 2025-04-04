// filepath: c:\WORK_win\lyrics-syncer\backend\controllers\apiController.js
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import config from '../config/config.js';
import { fileExists, getGeminiResultsPath, getSongName } from '../utils/fileUtils.js';

// Get Python executable path from environment variable or use default
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python';

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

    // Define resultsPath here at the beginning of the function
    const resultsPath = getGeminiResultsPath(artist, song, model, config.lyricsDir);

    // Check for existing Gemini results, unless forceRematch is true
    if (!forceRematch) {
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

    const pythonProcess = spawn(PYTHON_EXECUTABLE, pythonArgs);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      // Don't log the full stdout as it may contain large amounts of data
      console.log('Python stdout received');
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      // Don't log the full stderr as it may contain large amounts of data
      console.error('Python stderr received');
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error occurred');
        return res.status(500).json({
          error: 'Failed to process lyrics',
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
    const { lyrics, albumArtUrl, albumArtData, model } = req.body;

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

    let artPath;
    if (albumArtData) {
      // Create data URL for base64 image data
      artPath = `data:${albumArtData.mimeType};base64,${albumArtData.data}`;
    } else if (albumArtUrl) {
      if (albumArtUrl.startsWith('http://localhost')) {
        // Extract the path part from the URL and decode it
        const urlPath = new URL(albumArtUrl).pathname;
        // Convert from URL path to local file path
        const fileName = decodeURIComponent(path.basename(urlPath));
        // The album art is likely in the album_art directory
        artPath = path.join(path.dirname(config.lyricsDir), 'album_art', fileName);

        // Verify that the file exists
        if (!await fileExists(artPath)) {
          return res.status(404).json({
            error: `Album art file not found at ${artPath}`,
            status: 'error'
          });
        }
      } else {
        artPath = albumArtUrl;
      }
    }

    const pythonArgs = [
      config.pythonScriptPath,
      '--mode', 'generate_prompt',
      '--lyrics', JSON.stringify(lyrics),
      '--model', model
    ];

    // Add album art path if available
    if (artPath) {
      pythonArgs.push('--album_art');
      pythonArgs.push(artPath);
    }

    console.log('Running Python with args:', {
      mode: 'generate_prompt',
      model,
      hasAlbumArt: !!artPath
    });

    const pythonProcess = spawn(PYTHON_EXECUTABLE, pythonArgs);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      // Don't log the full stdout as it may contain large amounts of data
      console.log('Python stdout received');
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      // Don't log the full stderr as it may contain large amounts of data
      console.error('Python stderr received');
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error occurred');
        return res.status(500).json({
          error: 'Failed to generate prompt',
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
    const { prompt, albumArt, albumArtUrl, albumArtData, model } = req.body;

    // Handle different ways album art can be provided
    let artPath;

    if (albumArtData) {
      // Create data URL for base64 image data
      artPath = `data:${albumArtData.mimeType};base64,${albumArtData.data}`;
    } else {
      // Use either albumArt or albumArtUrl (for backward compatibility)
      const artUrl = albumArt || albumArtUrl;

      if (!prompt || !artUrl) {
        return res.status(400).json({ error: 'Missing prompt or album art URL' });
      }

      // Check if the URL is a local URL (starts with http://localhost)
      artPath = artUrl;
      if (artUrl.startsWith('http://localhost')) {
        // Extract the path part from the URL and decode it
        const urlPath = new URL(artUrl).pathname;
        // Convert from URL path to local file path
        const fileName = decodeURIComponent(path.basename(urlPath));
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
    }

    if (!await fileExists(config.configFilePath)) {
      return res.status(400).json({ error: 'Config file not found' });
    }

    const appConfig = JSON.parse(await fs.readFile(config.configFilePath, 'utf-8'));
    if (!appConfig.geminiApiKey) {
      return res.status(400).json({ error: 'Gemini API key not set' });
    }

    console.log('Running image generation with args:', {
      mode: 'generate_image',
      prompt,
      hasAlbumArt: !!artPath
    });

    const pythonArgs = [
      config.pythonScriptPath,
      '--mode', 'generate_image',
      '--prompt', prompt,
      '--album_art', artPath,
      '--model', model
    ];

    const pythonProcess = spawn(PYTHON_EXECUTABLE, pythonArgs);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      // Don't log the full stdout as it may contain base64 image data
      console.log('Python stdout received');
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      // Don't log the full stderr as it may contain large amounts of data
      console.error('Python stderr received');
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error occurred');
        return res.status(500).json({
          error: 'Failed to generate image',
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

          // Return a translation key and file count instead of the hardcoded message
          results.push({
            folder: folder.name,
            status: 'success',
            translationKey: 'cache.results.' + folder.name,
            count: files.length
          });
        } else {
          results.push({
            folder: folder.name,
            status: 'warning',
            translationKey: 'cache.folderNotExist'
          });
        }
      } catch (error) {
        results.push({
          folder: folder.name,
          status: 'error',
          translationKey: 'errors.generic',
          errorMessage: error.message
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error in /api/delete_cache:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload album art
 */
export const uploadAlbumArt = async (req, res) => {
  try {
    const { artist, song, imageData } = req.body;

    if (!artist || !song || !imageData) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate filename in the same format as other album art files
    const filename = `${artist.toLowerCase().replace(/\s+/g, '_')}_-_${song.toLowerCase().replace(/\s+/g, '_')}.png`;
    const filePath = path.join(config.albumArtDir, filename);

    // Create album_art directory if it doesn't exist
    await fs.mkdir(config.albumArtDir, { recursive: true });

    // Check if the file already exists and delete it if it does
    if (await fileExists(filePath)) {
      console.log(`Replacing existing album art at: ${filePath}`);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error(`Error deleting existing album art: ${unlinkError.message}`);
        // Continue anyway, as we'll overwrite the file
      }
    }

    // Convert base64 to buffer and save
    const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    await fs.writeFile(filePath, buffer);
    console.log(`Saved new album art to: ${filePath}`);

    // Also update metadata file if it exists
    const metadataFilePath = path.join(config.lyricsDir, `${filename.replace('.png', '')}_metadata.json`);
    if (await fileExists(metadataFilePath)) {
      try {
        const metadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf-8'));

        // Update albumArtUrl in metadata
        const serverAlbumArtUrl = `http://localhost:${config.port}/album_art/${filename}`;
        metadata.albumArtUrl = serverAlbumArtUrl;
        metadata.originalAlbumArtUrl = 'custom_upload';
        metadata.lastModified = new Date().toISOString();

        await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`Updated metadata file at: ${metadataFilePath}`);
      } catch (metadataError) {
        console.error(`Error updating metadata file: ${metadataError.message}`);
        // Continue anyway, as the album art upload was successful
      }
    }

    // Add a timestamp parameter to force browser to refresh the image
    const timestamp = new Date().getTime();
    const serverUrl = `http://localhost:${config.port}/album_art/${filename}?t=${timestamp}`;
    res.json({ albumArtUrl: serverUrl });
  } catch (error) {
    console.error('Error in uploadAlbumArt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload custom audio file
 */
export const uploadAudio = async (req, res) => {
  try {
    const { artist, song, audioData } = req.body;

    if (!artist || !song || !audioData) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate filename in the same format as other audio files
    const songName = getSongName(artist, song);
    const filePath = path.join(config.audioDir, `${songName}.mp3`);

    // Create audio directory if it doesn't exist
    await fs.mkdir(config.audioDir, { recursive: true });

    // Check if the file already exists and delete it if it does
    if (await fileExists(filePath)) {
      console.log(`Replacing existing audio at: ${filePath}`);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error(`Error deleting existing audio: ${unlinkError.message}`);
        // Continue anyway, as we'll overwrite the file
      }
    }

    // Convert base64 to buffer and save
    const buffer = Buffer.from(audioData.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
    await fs.writeFile(filePath, buffer);
    console.log(`Saved new audio to: ${filePath}`);

    // Also update metadata file if it exists
    const metadataFilePath = path.join(config.lyricsDir, `${songName}_metadata.json`);
    if (await fileExists(metadataFilePath)) {
      try {
        const metadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf-8'));

        // Update metadata to indicate custom audio
        metadata.customAudio = true;
        metadata.lastModified = new Date().toISOString();

        await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`Updated metadata file at: ${metadataFilePath}`);
      } catch (metadataError) {
        console.error(`Error updating metadata file: ${metadataError.message}`);
        // Continue anyway, as the audio upload was successful
      }
    }

    // Add a timestamp parameter to force browser to refresh the audio cache
    const timestamp = new Date().getTime();
    const serverUrl = `http://localhost:${config.port}/audio/${songName}.mp3?t=${timestamp}`;
    res.json({ audioUrl: serverUrl });
  } catch (error) {
    console.error('Error in uploadAudio:', error);
    res.status(500).json({ error: error.message });
  }
};