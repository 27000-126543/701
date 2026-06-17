import { useState, useRef, useCallback, useEffect } from 'react';
import { validateAudioFile } from '../utils/validators';

interface UseAudioReturn {
  isPlaying: boolean;
  currentAudio: { name: string; url: string } | null;
  volume: number;
  customAudios: { name: string; url: string }[];
  play: (name: string, url: string) => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  uploadCustomAudio: (file: File) => Promise<{ success: boolean; message?: string }>;
  removeCustomAudio: (index: number) => void;
}

export function useAudio(): UseAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<{ name: string; url: string } | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [customAudios, setCustomAudios] = useState<{ name: string; url: string }[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedAudios = localStorage.getItem('customAudios');
    if (savedAudios) {
      try {
        setCustomAudios(JSON.parse(savedAudios));
      } catch (e) {
        console.error('Failed to load custom audios:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback((name: string, url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }

    if (currentAudio?.url !== url) {
      audioRef.current.src = url;
      setCurrentAudio({ name, url });
    }

    audioRef.current.play().catch(e => {
      console.error('Audio playback error:', e);
    });
    setIsPlaying(true);
  }, [currentAudio, volume]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const handleSetVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
  }, []);

  const uploadCustomAudio = useCallback(async (file: File): Promise<{ success: boolean; message?: string }> => {
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newAudio = { name: file.name.replace('.mp3', ''), url };
        const updated = [...customAudios, newAudio];
        setCustomAudios(updated);
        localStorage.setItem('customAudios', JSON.stringify(updated));
        resolve({ success: true });
      };
      reader.onerror = () => {
        resolve({ success: false, message: '文件读取失败' });
      };
      reader.readAsDataURL(file);
    });
  }, [customAudios]);

  const removeCustomAudio = useCallback((index: number) => {
    const updated = customAudios.filter((_, i) => i !== index);
    setCustomAudios(updated);
    localStorage.setItem('customAudios', JSON.stringify(updated));
  }, [customAudios]);

  return {
    isPlaying,
    currentAudio,
    volume,
    customAudios,
    play,
    pause,
    stop,
    setVolume: handleSetVolume,
    uploadCustomAudio,
    removeCustomAudio
  };
}
