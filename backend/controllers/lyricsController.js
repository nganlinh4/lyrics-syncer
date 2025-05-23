// filepath: c:\WORK_win\lyrics-syncer\backend\controllers\lyricsController.js
import fs from 'fs/promises';
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
    const { artist, song, force, youtubeArtist, youtubeSong } = req.body;

    if (!artist || !song) {
      return res.status(400).json({ error: 'Missing artist or song' });
    }

    // Check if we have YouTube artist and song values for custom album art lookup

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

    // Check if we have a metadata file to see if album art was customized
    let isCustomAlbumArt = false;
    let existingMetadata = req.body.existingMetadata || {};

    // If existingMetadata wasn't passed in the request, try to read it from the file
    if (Object.keys(existingMetadata).length === 0 && await fileExists(metadataFilePath)) {
      try {
        existingMetadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf-8'));
      } catch (metadataError) {
        console.error(`Error reading metadata file: ${metadataError.message}`);
      }
    }

    // Check if album art is custom
    isCustomAlbumArt = existingMetadata.originalAlbumArtUrl === 'custom_upload';

    // If we have YouTube artist and song values, check if there's a custom album art for those values
    if (youtubeArtist && youtubeSong && !isCustomAlbumArt) {
      const youtubeSongName = getSongName(youtubeArtist, youtubeSong);
      const youtubeMetadataFilePath = path.join(config.lyricsDir, `${youtubeSongName}_metadata.json`);

      if (await fileExists(youtubeMetadataFilePath)) {
        try {
          const youtubeMetadata = JSON.parse(await fs.readFile(youtubeMetadataFilePath, 'utf-8'));
          if (youtubeMetadata.originalAlbumArtUrl === 'custom_upload') {
            // We found a custom album art for the YouTube artist and song
            isCustomAlbumArt = true;
            existingMetadata = youtubeMetadata;
            console.log(`Found custom album art for YouTube values: ${youtubeSongName}`);

            // Use the YouTube album art file instead
            const youtubeAlbumArtFilePath = path.join(config.albumArtDir, `${youtubeSongName}.png`);
            if (await fileExists(youtubeAlbumArtFilePath)) {
              // Copy the YouTube album art file to the Genius album art file
              const albumArtData = await fs.readFile(youtubeAlbumArtFilePath);
              await fs.mkdir(path.dirname(albumArtFilePath), { recursive: true });
              await fs.writeFile(albumArtFilePath, albumArtData);
              console.log(`Copied custom album art from ${youtubeAlbumArtFilePath} to ${albumArtFilePath}`);
            }
          }
        } catch (metadataError) {
          console.error(`Error reading YouTube metadata file: ${metadataError.message}`);
        }
      }
    }

    if (isCustomAlbumArt) {
      console.log(`Album art for ${songName} is custom - will preserve it`);
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

      // Download and save the album art only if it's not a custom upload
      let serverAlbumArtUrl = `http://localhost:${config.port}/album_art/${songName}.png`;

      if (albumArtUrl && !isCustomAlbumArt) {
        console.log(`Downloading album art from: ${albumArtUrl}`);
        try {
          const response = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(albumArtFilePath, Buffer.from(response.data), 'binary');
          console.log(`Album art saved to: ${albumArtFilePath}`);
        } catch (downloadError) {
          console.error(`Error downloading album art: ${downloadError.message}`);
        }
      } else if (isCustomAlbumArt) {
        console.log(`Preserving custom album art at: ${albumArtFilePath}`);
      }

      // Server URL for album art was already defined above

      // Cache the metadata, preserving custom album art info if it exists
      const metadata = {
        ...existingMetadata,
        albumArtUrl: serverAlbumArtUrl,
        cached: new Date().toISOString()
      };

      // Only update originalAlbumArtUrl if it's not a custom upload
      if (!isCustomAlbumArt) {
        metadata.originalAlbumArtUrl = albumArtUrl;
      }

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
    // Extract only what we need for this function
    const { artist, song } = req.body;
    const songName = getSongName(artist, song);
    const lyricsFilePath = path.join(config.lyricsDir, `${songName}.txt`);
    const metadataFilePath = path.join(config.lyricsDir, `${songName}_metadata.json`);
    const albumArtFilePath = path.join(config.albumArtDir, `${songName}.png`);

    // Check if we have a metadata file to see if album art was customized
    let isCustomAlbumArt = false;
    let existingMetadata = {};
    if (await fileExists(metadataFilePath)) {
      try {
        existingMetadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf-8'));
        isCustomAlbumArt = existingMetadata.originalAlbumArtUrl === 'custom_upload';
        console.log(`Album art for ${songName} is ${isCustomAlbumArt ? 'custom' : 'from Genius'}`);
      } catch (metadataError) {
        console.error(`Error reading metadata file: ${metadataError.message}`);
      }
    }

    // Delete existing lyrics file if it exists
    if (await fileExists(lyricsFilePath)) {
      await fs.unlink(lyricsFilePath);
    }

    // Delete existing metadata file if it exists, but save its content if album art is custom
    if (await fileExists(metadataFilePath) && !isCustomAlbumArt) {
      await fs.unlink(metadataFilePath);
    }

    // Delete existing album art file if it exists, but only if it's not custom
    if (await fileExists(albumArtFilePath) && !isCustomAlbumArt) {
      await fs.unlink(albumArtFilePath);
    }

    // Update request body with force flag and existing metadata if album art is custom
    req.body.force = true;
    if (isCustomAlbumArt) {
      req.body.existingMetadata = existingMetadata;
    }

    // Make sure to pass the YouTube artist and song values to getLyrics
    // This ensures that if there's a custom album art for the YouTube values, it will be used

    // Get fresh data from Genius API
    const result = await getLyrics(req, res);

    // Generate a timestamp to force browser to refresh the image
    if (!res.headersSent) {
      const albumArtUrl = result?.albumArtUrl;
      if (albumArtUrl) {
        const timestamp = new Date().getTime();
        const refreshedUrl = `${albumArtUrl}?t=${timestamp}`;
        res.json({ ...result, albumArtUrl: refreshedUrl });
        return;
      }
    }

    // If we've reached this point, getLyrics already sent a response
    return;
  } catch (error) {
    console.error("Error in /api/force_lyrics:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
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

/**
 * Save custom lyrics
 */
export const saveCustomLyrics = async (req, res) => {
  try {
    const { artist, song, lyrics } = req.body;

    if (!artist || !song || !lyrics) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate filename in the same format as other lyrics files
    const songName = getSongName(artist, song);
    const lyricsFilePath = path.join(config.lyricsDir, `${songName}.txt`);
    const metadataFilePath = path.join(config.lyricsDir, `${songName}_metadata.json`);

    // Create lyrics directory if it doesn't exist
    await fs.mkdir(config.lyricsDir, { recursive: true });

    // Convert lyrics array to a string
    const lyricsText = Array.isArray(lyrics) ? lyrics.join('\n') : lyrics;

    // Save lyrics to file
    await fs.writeFile(lyricsFilePath, lyricsText, 'utf-8');
    console.log(`Saved custom lyrics to: ${lyricsFilePath}`);

    // Update metadata file if it exists
    if (await fileExists(metadataFilePath)) {
      try {
        const metadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf-8'));

        // Update metadata
        metadata.customLyrics = true;
        metadata.lastModified = new Date().toISOString();

        await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`Updated metadata file at: ${metadataFilePath}`);
      } catch (metadataError) {
        console.error(`Error updating metadata file: ${metadataError.message}`);
        // Continue anyway, as the lyrics upload was successful
      }
    } else {
      // Create new metadata file
      const metadata = {
        customLyrics: true,
        lastModified: new Date().toISOString()
      };
      await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
    }

    // Return success
    res.json({ success: true, lyrics: lyricsText });
  } catch (error) {
    console.error('Error in saveCustomLyrics:', error);
    res.status(500).json({ error: error.message });
  }
};