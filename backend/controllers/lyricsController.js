// filepath: c:\WORK_win\lyrics-syncer\backend\controllers\lyricsController.js
import fs from 'fs/promises';
import path from 'path';
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
    // Read the API key from config.json
    let appConfig = {};
    const { artist, song, force } = req.body;

    if (await fileExists(config.configFilePath)) {
      const configData = await fs.readFile(config.configFilePath, 'utf-8');
      appConfig = JSON.parse(configData);
    }
    
    if (!artist || !song) {
      return res.status(400).json({ error: 'Missing artist or song' });
    }

    // Check cached lyrics first unless force is true
    const songName = getSongName(artist, song);
    const lyricsFilePath = path.join(config.lyricsDir, `${songName}.txt`);
    const metadataFilePath = path.join(config.lyricsDir, `${songName}_metadata.json`);

    if (!appConfig.geniusApiKey) {
      return res.status(400).json({ error: 'Genius API key not set. Please provide it through the frontend.' });
    }

    const { default: Genius } = await import('genius-lyrics');
    const geniusClient = new Genius.Client(appConfig.geniusApiKey);

    // Always search for the song to get metadata
    const geniusSong = await geniusClient.songs.search(`${artist} ${song}`);
    
    if (geniusSong.length > 0) {
      const geniusResult = geniusSong[0];
      
      // Get lyrics from cache or fetch new ones
      let lyrics, albumArtUrl;
      if (!force && await fileExists(lyricsFilePath)) {
        console.log(`Using cached lyrics for ${songName}`);
        lyrics = await fs.readFile(lyricsFilePath, 'utf-8');
        const metadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf-8'));
        albumArtUrl = metadata.albumArtUrl;
      } else {
        console.log('Fetching fresh lyrics from Genius...');
        lyrics = await geniusResult.lyrics();
        await fs.writeFile(lyricsFilePath, lyrics, 'utf-8');
      
        // Get fresh album art URL
        albumArtUrl = geniusResult.image || geniusResult.header_image_url || geniusResult.song_art_image_url;
        
        // Cache the metadata
        const metadata = {
          albumArtUrl,
          cached: new Date().toISOString()
        };
        await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
      }
      
      console.log('Album Art URL:', albumArtUrl);
      
      return res.json({ lyrics, albumArtUrl });
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

    // Delete existing lyrics file if it exists
    if (await fileExists(lyricsFilePath)) {
      await fs.unlink(lyricsFilePath);
    }
    // Delete existing metadata file if it exists
    if (await fileExists(metadataFilePath)) {
      await fs.unlink(metadataFilePath);
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