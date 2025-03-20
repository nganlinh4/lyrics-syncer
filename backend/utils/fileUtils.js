// filepath: c:\WORK_win\lyrics-syncer\backend\utils\fileUtils.js
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';

/**
 * Checks if a file exists.
 * @param {string} filePath The path to the file.
 * @returns {Promise<boolean>} True if the file exists, false otherwise.
 */
export async function fileExists(filePath) {
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
export const getSongName = (artist, song) => {
  // Handle all Unicode characters safely
  const sanitize = (str) => {
    return str
      .normalize('NFKC')  // Normalize Unicode characters
      .replace(/[\/<>:"|?*\\]/g, '')  // Remove invalid filename characters
      .replace(/\s+/g, '_');  // Replace spaces with underscores
  };
  return `${sanitize(artist)}_-_${sanitize(song)}`;
};

/**
 * Ensures required directories exist
 * @param {Object} dirs An object containing directory paths to ensure
 * @returns {void}
 */
export const ensureDirectories = (dirs) => {
  Object.entries(dirs).forEach(([name, dirPath]) => {
    try {
      fsSync.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
      console.log(`Directory created/verified: ${name}: ${dirPath}`);
    } catch (error) {
      console.error(`Error creating directory ${name}:`, error);
    }
  });
};

/**
 * Get Gemini results path
 * @param {string} artist Artist name
 * @param {string} song Song name
 * @param {string} model Model name
 * @param {string} lyricsDir Path to lyrics directory
 * @returns {string} Path to the Gemini results file
 */
export const getGeminiResultsPath = (artist, song, model, lyricsDir) => {
  const songName = getSongName(artist, song);
  return path.join(lyricsDir, `${songName}_${model}_gemini.json`);
};