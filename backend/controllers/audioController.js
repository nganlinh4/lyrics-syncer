// filepath: c:\WORK_win\lyrics-syncer\backend\controllers\audioController.js
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import youtubeSearch from 'youtube-search';
import youtubeDl from 'youtube-dl-exec';

import config from '../config/config.js';
import { fileExists, getSongName } from '../utils/fileUtils.js';

/**
 * Handles requests to get audio data for a given song.
 */
export const getAudioData = async (req, res) => {
  try {
    const { song_name } = req.params;
    const files = await fs.readdir(config.audioDir);
    
    // Make the search case-insensitive
    const audioFiles = files.filter(f => 
      f.toLowerCase().endsWith('.mp3') && 
      f.toLowerCase().includes(song_name.toLowerCase())
    );

    if (audioFiles.length > 0) {
      const audioFilePath = path.join(config.audioDir, audioFiles[0]);
      const stats = fsSync.statSync(audioFilePath);
      
      // Form a proper URL for the audio file - include a timestamp to prevent caching
      const timestamp = Date.now();
      const audioUrl = `http://localhost:${config.port}/audio/${audioFiles[0]}?t=${timestamp}`;
      
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
 * Handles the entire song processing pipeline: download and audio processing.
 */
export const processSong = async (req, res) => {
  try {
    // Read the API key from config.json
    let appConfig = {};
    if (await fileExists(config.configFilePath)) {
      const configData = await fs.readFile(config.configFilePath, 'utf-8');
      appConfig = JSON.parse(configData);
    }
    
    if (!appConfig.youtubeApiKey) {
      return res.status(400).json({ error: 'YouTube API key not set. Please provide it through the frontend.' });
    }

    const { artist, song } = req.body;
    if (!artist || !song) {
      return res.status(400).json({ error: 'Missing artist or song' });
    }

    // Validate song and artist names more permissively
    const sanitizedSong = song.normalize('NFKC').replace(/[\/<>:"|?*\\]/g, '');
    const sanitizedArtist = artist.normalize('NFKC').replace(/[\/<>:"|?*\\]/g, '');

    if (!sanitizedSong || !sanitizedArtist) {
      return res.status(400).json({ error: 'Invalid song or artist name after sanitization.' });
    }

    const songName = getSongName(artist, song);
    const audioFilePath = path.join(config.audioDir, `${songName}.mp3`);
    const tempDir = path.join(config.audioDir, 'temp');

    // Create directories if they don't exist
    await fs.mkdir(config.audioDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });

    // Download (using youtube-dl-exec)
    if (!(await fileExists(audioFilePath))) {
      await new Promise((resolve, reject) => {
        const searchQuery = `${artist} ${song}${req.body.audioOnly ? ' audio' : ''}`;
        console.log(`Searching YouTube for: ${searchQuery}`);
        youtubeSearch(searchQuery, { maxResults: 1, key: appConfig.youtubeApiKey }).then(async searchResults => {
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
    const audioUrl = `http://localhost:${config.port}/audio/${path.basename(audioFilePath)}?t=${timestamp}`;

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

/**
 * Force re-download and process a song
 */
export const forceProcessSong = async (req, res) => {
  try {
    const { artist, song } = req.body;
    const songName = getSongName(artist, song);
    const audioFilePath = path.join(config.audioDir, `${songName}.mp3`);
    
    // Delete existing audio file if it exists
    if (await fileExists(audioFilePath)) {
      await fs.unlink(audioFilePath);
    }
    
    // Process the song as normal
    return processSong(req, res);
  } catch (error) {
    console.error("Error in /api/force_process:", error);
    res.status(500).json({ error: error.message });
  }
};