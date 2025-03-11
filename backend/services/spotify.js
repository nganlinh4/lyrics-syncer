import SpotifyWebApi from 'spotify-web-api-node';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', 'config.json');

let spotifyApi = null;

// Add function to get synced lyrics using Python script
export async function getSyncedLyrics(trackId) {
    if (!trackId) {
        throw new Error('Track ID is required');
    }

    // Create a Python script to handle syrics
    const pythonScript = `
import sys
from syrics.api import Spotify

try:
    sp_dc = sys.argv[1]
    track_id = sys.argv[2]
    
    sp = Spotify(sp_dc)
    lyrics = sp.get_lyrics(track_id)
    
    if lyrics:
        # Convert lyrics to JSON format
        import json
        print(json.dumps(lyrics))
    else:
        print(json.dumps({"error": "No lyrics found"}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    const scriptPath = path.join(__dirname, 'get_lyrics.py');
    await fs.writeFile(scriptPath, pythonScript);

    try {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        if (!config.spotifySpDc) {
            throw new Error('Spotify SP_DC cookie not found in config');
        }

        return new Promise((resolve, reject) => {
            const process = spawn('python', [
                scriptPath,
                config.spotifySpDc,
                trackId
            ]);

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                try {
                    // Clean up the temporary script
                    fs.unlink(scriptPath).catch(console.error);

                    if (code !== 0) {
                        reject(new Error(`Python script failed: ${errorOutput}`));
                        return;
                    }

                    const result = JSON.parse(output);
                    if (result.error) {
                        reject(new Error(result.error));
                        return;
                    }

                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    } catch (error) {
        // Clean up the temporary script in case of error
        await fs.unlink(scriptPath).catch(console.error);
        throw error;
    }
}

// Modify searchTrack to include getting synced lyrics
export async function searchTrackWithLyrics(artist, song) {
    try {
        const track = await searchTrack(artist, song);
        if (!track) {
            return null;
        }

        try {
            const syncedLyrics = await getSyncedLyrics(track.id);
            return {
                ...track,
                syncedLyrics
            };
        } catch (lyricsError) {
            console.error('Failed to get synced lyrics:', lyricsError);
            return track; // Return track info even if lyrics fetch fails
        }
    } catch (error) {
        console.error('Error in searchTrackWithLyrics:', error);
        throw error;
    }
}

export async function initializeSpotify() {
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        if (!config.spotifyClientId || !config.spotifyClientSecret) {
            throw new Error('Spotify credentials are missing in config.json');
        }

        spotifyApi = new SpotifyWebApi({
            clientId: config.spotifyClientId,
            clientSecret: config.spotifyClientSecret,
            scope: 'user-read-private playlist-read-private user-read-playback-state user-read-recently-played'
        });
        
        // Get an initial access token
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        
        // Schedule token refresh
        const expiresIn = data.body['expires_in'];
        setTimeout(() => refreshSpotifyToken(), (expiresIn - 60) * 1000);
        
        console.log('Spotify API initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Spotify:', error.message);
        throw error;
    }
}

export async function refreshSpotifyToken() {
    try {
        if (!spotifyApi) {
            await initializeSpotify();
            return;
        }

        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log('Spotify token refreshed successfully');
        
        // Schedule next refresh
        const expiresIn = data.body['expires_in'];
        setTimeout(() => refreshSpotifyToken(), (expiresIn - 60) * 1000);
    } catch (error) {
        console.error('Error refreshing Spotify token:', error);
        // Retry after 1 minute
        setTimeout(() => refreshSpotifyToken(), 60000);
    }
}

export async function searchTrack(artist, song) {
    try {
        if (!spotifyApi) {
            await initializeSpotify();
        }
        
        // Construct the search query with proper encoding
        const query = `track:${encodeURIComponent(song)} artist:${encodeURIComponent(artist)}`;
        const response = await spotifyApi.searchTracks(query, { limit: 1 });
        
        if (!response.body.tracks.items.length) {
            return null;
        }
        
        return response.body.tracks.items[0];
    } catch (error) {
        if (error.statusCode === 401) {
            // Token expired, try to refresh and retry once
            await refreshSpotifyToken();
            const response = await spotifyApi.searchTracks(`track:${encodeURIComponent(song)} artist:${encodeURIComponent(artist)}`);
            return response.body.tracks.items[0] || null;
        }
        throw error;
    }
}
