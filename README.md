# YouTube Video Maker

A web application for creating YouTube videos with synchronized lyrics/subtitles, built with React and Node.js.

## Features

-   Synchronized lyrics/subtitles generation
-   Web interface for video creation and management

## Setup

1.  Clone the repository
2.  Navigate to the `frontend` directory and install dependencies:

    ```bash
    cd frontend
    npm install
    ```

3.  Navigate to the `backend` directory and install dependencies:

    ```bash
    cd ../backend
    npm install
    ```

4.  Place audio files in the `audio/` directory

## Running the Application
1.  Start the backend server:
    ```
    cd backend
    npm run dev
    ```
2.  Start the frontend:
    ```
    cd ../frontend
    npm start
    ```

## Directory Structure

-   `frontend/`: React frontend application
-   `backend/`: Node.js backend server
-   `audio/`: Audio files (not tracked in git)
-   `lyrics/`: Generated lyrics/subtitle files
-   `transcriptions/`: Generated transcription files (original Python app - to be migrated)
- `models/`: Model files (original Python app - to be migrated)