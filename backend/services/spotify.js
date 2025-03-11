import SpotifyWebApi from 'spotify-web-api-node';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', 'config.json');

let spotifyApi = null;

export async function initializeSpotify() {
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        if (!config.spotifyClientId || !config.spotifyClientSecret) {
            throw new Error('Spotify credentials are missing in config.json');
        }

        spotifyApi = new SpotifyWebApi({
            clientId: config.spotifyClientId,
            clientSecret: config.spotifyClientSecret
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

export async function getAudioAnalysis(trackId) {
    try {
        if (!spotifyApi) {
            await initializeSpotify();
        }
        
        const analysis = await spotifyApi.getAudioAnalysis(trackId);
        return analysis.body;
    } catch (error) {
        if (error.statusCode === 401) {
            // Token expired, try to refresh and retry once
            await refreshSpotifyToken();
            const analysis = await spotifyApi.getAudioAnalysis(trackId);
            return analysis.body;
        }
        throw error;
    }
}
