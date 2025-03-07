import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const AUDIO_DIR = path.join(__dirname, '../audio');
const LYRICS_DIR = path.join(__dirname, '../lyrics');

// Helper function to check if a file exists
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

app.get('/api/audio_data/:song_name', async (req, res) => {
    try {
        const { song_name } = req.params;
        const files = await fs.readdir(AUDIO_DIR);
        const audioFiles = files.filter(f => f.endsWith('.mp3') && f.startsWith(song_name));

        if (audioFiles.length > 0) {
            res.json({
                audio_url: `/audio/${audioFiles[0]}`,
                duration: 0 // Placeholder, can be calculated later if needed
            });
        } else {
            res.status(404).json({ error: 'Audio file not found' });
        }
    } catch (error) {
        console.error("Error in /api/audio_data:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/lyrics_timing/:song_name', async (req, res) => {
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
});

app.post('/api/save_timing', async (req, res) => {
    try {
        const { song_name, timing } = req.body;
        const jsonPath = path.join(LYRICS_DIR, `${song_name} timed.json`);
        await fs.writeFile(jsonPath, JSON.stringify(timing, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (error) {
        console.error("Error in /api/save_timing:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/waveform/:song_name', async (req, res) => {
    // Placeholder for waveform generation (to be implemented later)
    res.status(501).send('Not Implemented');
});

// Serve static files from the audio directory
app.use('/audio', express.static(AUDIO_DIR));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});