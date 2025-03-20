import { useState, useRef, useCallback, useEffect } from 'react';

const useAudioControl = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Handle audio element time updates
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Start time update interval when playing
  useEffect(() => {
    if (isPlaying) {
      updateIntervalRef.current = setInterval(() => {
        handleTimeUpdate();
      }, 50); // Update every 50ms for smooth display
    } else if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isPlaying, handleTimeUpdate]);

  // Handle audio element reference
  const handleAudioRef = useCallback((element) => {
    if (element) {
      element.addEventListener('play', () => setIsPlaying(true));
      element.addEventListener('pause', () => setIsPlaying(false));
      element.addEventListener('ended', () => setIsPlaying(false));
      element.addEventListener('timeupdate', handleTimeUpdate);
      element.addEventListener('durationchange', () => {
        setAudioDuration(element.duration);
      });
      element.addEventListener('error', (e) => {
        setError(e.target.error?.message || 'Error loading audio');
      });
    }
  }, [handleTimeUpdate]);

  // Seek to specific time
  const seekTo = useCallback((time) => {
    if (audioRef.current) {
      try {
        const newTime = Math.max(0, Math.min(time, audioRef.current.duration));
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        
        // Auto-play if paused
        if (audioRef.current.paused) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => setError(`Playback failed: ${err.message}`));
        }
      } catch (err) {
        setError(`Failed to seek: ${err.message}`);
      }
    }
  }, []);

  // Play/Pause controls
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      try {
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      } catch (err) {
        setError(`Playback control failed: ${err.message}`);
      }
    }
  }, []);

  // Update audio source
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
      setCurrentTime(0);
      setError(null);
    }
  }, [audioUrl]);

  return {
    currentTime,
    audioDuration,
    audioUrl,
    fileSize,
    error,
    isPlaying,
    containerRef,
    audioRef,
    setAudioUrl,
    setFileSize,
    seekTo,
    togglePlay,
    handleAudioRef
  };
};

export default useAudioControl;
