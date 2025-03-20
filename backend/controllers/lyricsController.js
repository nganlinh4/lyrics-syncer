// filepath: c:\WORK_win\lyrics-syncer\backend\controllers\lyricsController.js
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import axios from 'axios';
import config from '../config/config.js';
import { fileExists, getSongName } from '../utils/fileUtils.js';

/**
 * Handles requests to get lyrics timing data for a given song.
 */
export const getLyricsTiming = async (req, res) => {
  try {
    const { song_name } = req.params;
    const jsonPath = path.join(config.lyricsDir, `${song_name} timed.json`);

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
 */
export const saveTiming = async (req, res) => {
  try {
    const { song_name, timing } = req.body;
    const jsonPath = path.join(config.lyricsDir, `${song_name} timed.json`);
    await fs.writeFile(jsonPath, JSON.stringify(timing, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error("Error in /api/save_timing:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles requests to get lyrics for a song
 */
export const getLyrics = async (req, res) => {
  try {
    const { artist, song, force } = req.body;
    
    if (!artist || !song) {
      return res.status(400).json({ error: 'Missing artist or song' });
    }

    // Check cached lyrics first unless force is true
    const songName = getSongName(artist, song);
    const lyricsFilePath = path.join(config.lyricsDir, `${songName}.txt`);
    const metadataFilePath = path.join(config.lyricsDir, `${songName}_metadata.json`);
    const albumArtFilePath = path.join(config.albumArtDir, `${songName}.png`);

    // Ensure album art directory exists
    await fs.mkdir(config.albumArtDir, { recursive: true });

    // First check if we have cached files and force is not true
    if (!force && await fileExists(lyricsFilePath) && await fileExists(albumArtFilePath) && await fileExists(metadataFilePath)) {
      console.log(`Using cached lyrics and album art for ${songName}`);
      const lyrics = await fs.readFile(lyricsFilePath, 'utf-8');
      const metadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf-8'));
      return res.json({ lyrics, albumArtUrl: metadata.albumArtUrl });
    }

    // If we get here, we either have force=true or missing cached files
    // Now we need the API key
    let appConfig = {};
    if (await fileExists(config.configFilePath)) {
      const configData = await fs.readFile(config.configFilePath, 'utf-8');
      appConfig = JSON.parse(configData);
    }

    if (!appConfig.geniusApiKey) {
      return res.status(400).json({ error: 'Genius API key not set. Please provide it through the frontend.' });
    }

    const { default: Genius } = await import('genius-lyrics');
    const geniusClient = new Genius.Client(appConfig.geniusApiKey);

    // Search for the song
    const geniusSong = await geniusClient.songs.search(`${artist} ${song}`);
    
    if (geniusSong.length > 0) {
      const geniusResult = geniusSong[0];
      
      // Fetch fresh lyrics and album art
      console.log('Fetching fresh lyrics and album art from Genius...');
      const lyrics = await geniusResult.lyrics();
      await fs.writeFile(lyricsFilePath, lyrics, 'utf-8');
    
      // Get album art URL
      const albumArtUrl = geniusResult.image || geniusResult.header_image_url || geniusResult.song_art_image_url;
      
      // Download and save the album art
      if (albumArtUrl) {
        console.log(`Downloading album art from: ${albumArtUrl}`);
        try {
          const response = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(albumArtFilePath, Buffer.from(response.data), 'binary');
          console.log(`Album art saved to: ${albumArtFilePath}`);
        } catch (downloadError) {
          console.error(`Error downloading album art: ${downloadError.message}`);
        }
      }
      
      // Create server URL for album art
      const serverAlbumArtUrl = `http://localhost:${config.port}/album_art/${songName}.png`;
      
      // Cache the metadata
      const metadata = {
        albumArtUrl: serverAlbumArtUrl,
        originalAlbumArtUrl: albumArtUrl,
        cached: new Date().toISOString()
      };
      await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
      
      console.log('Album Art URL:', serverAlbumArtUrl);
      return res.json({ lyrics, albumArtUrl: serverAlbumArtUrl });
    } else {
      res.status(404).json({ error: "Lyrics not found" });
    }
  } catch (error) {
    console.error("Error in /api/lyrics:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Force refetch lyrics for a song
 */
export const forceLyrics = async (req, res) => {
  try {
    const { artist, song } = req.body;
    const songName = getSongName(artist, song);
    const lyricsFilePath = path.join(config.lyricsDir, `${songName}.txt`);
    const metadataFilePath = path.join(config.lyricsDir, `${songName}_metadata.json`);
    const albumArtFilePath = path.join(config.albumArtDir, `${songName}.png`);

    // Delete existing lyrics file if it exists
    if (await fileExists(lyricsFilePath)) {
      await fs.unlink(lyricsFilePath);
    }
    // Delete existing metadata file if it exists
    if (await fileExists(metadataFilePath)) {
      await fs.unlink(metadataFilePath);
    }
    // Delete existing album art file if it exists
    if (await fileExists(albumArtFilePath)) {
      await fs.unlink(albumArtFilePath);
    }

    req.body.force = true;
    return getLyrics(req, res);
  } catch (error) {
    console.error("Error in /api/force_lyrics:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Auto-match lyrics with simple timing
 */
export const autoMatchLyrics = async (req, res) => {
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
};