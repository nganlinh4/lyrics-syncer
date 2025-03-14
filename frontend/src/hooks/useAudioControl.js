import { useState, useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

const DEFAULT_VOLUME = 0.3; // 30% volume

const useAudioControl = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [fileSize, setFileSize] = useState(0);

  const wavesurferRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Force set volume whenever audio element is available
  useEffect(() => {
    const setInitialVolume = () => {
      if (audioRef.current) {
        audioRef.current.volume = DEFAULT_VOLUME;
      }
      if (wavesurferRef.current) {
        wavesurferRef.current.setVolume(DEFAULT_VOLUME);
      }
    };

    setInitialVolume();
    
    // Also set volume after a short delay to ensure it takes effect
    setTimeout(setInitialVolume, 100);
  }, []);

  useEffect(() => {
    if (containerRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        cursorColor: 'navy',
        barWidth: 3,
        height: 100,
        responsive: true,
        volume: DEFAULT_VOLUME
      });

      wavesurferRef.current.on('ready', () => {
        wavesurferRef.current.setVolume(DEFAULT_VOLUME);
        if (audioRef.current) {
          audioRef.current.volume = DEFAULT_VOLUME;
        }
      });

      wavesurferRef.current.on('error', (err) => {
        console.error('WaveSurfer error:', err);
      });

      wavesurferRef.current.on('timeupdate', (time) => {
        setCurrentTime(time);
      });

      wavesurferRef.current.on('audioprocess', (time) => {
        setCurrentTime(time);
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      console.log("Loading audio into WaveSurfer:", audioUrl);
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  const updateTime = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleSeeking = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleAudioLoaded = () => {
      if (audioElement.duration && audioElement.duration !== Infinity) {
        setAudioDuration(audioElement.duration);
      }
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('seeking', handleSeeking);
    audioElement.addEventListener('seeked', handleSeeking);
    audioElement.addEventListener('loadedmetadata', handleAudioLoaded);
    audioElement.addEventListener('durationchange', handleAudioLoaded);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('seeking', handleSeeking);
      audioElement.removeEventListener('seeked', handleSeeking);
      audioElement.removeEventListener('loadedmetadata', handleAudioLoaded);
      audioElement.removeEventListener('durationchange', handleAudioLoaded);
    };
  }, [updateTime]);

  const seekTo = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(time / wavesurferRef.current.getDuration());
    }
  }, []);

  // Add a function to handle audio element creation
  const handleAudioRef = (element) => {
    audioRef.current = element;
    if (element) {
      element.volume = DEFAULT_VOLUME;
    }
  };

  return {
    currentTime,
    audioDuration,
    audioUrl,
    fileSize,
    containerRef,
    audioRef,
    setAudioUrl,
    setFileSize,
    seekTo,
    handleAudioRef
  };
};

export default useAudioControl;
