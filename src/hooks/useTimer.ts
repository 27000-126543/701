import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialMinutes?: number;
  onComplete?: () => void;
  onTick?: (remainingSeconds: number) => void;
}

interface UseTimerReturn {
  isRunning: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  start: (minutes?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { initialMinutes = 10, onComplete, onTick } = options;
  
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = totalSeconds > 0 
    ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 
    : 0;

  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const newRemaining = Math.max(0, totalSeconds - elapsed);
    
    setRemainingSeconds(newRemaining);
    
    if (onTick) {
      onTick(newRemaining);
    }
    
    if (newRemaining <= 0) {
      stop();
      if (onComplete) {
        onComplete();
      }
    }
  }, [totalSeconds, onComplete, onTick]);

  const start = useCallback((minutes?: number) => {
    const seconds = minutes !== undefined ? minutes * 60 : totalSeconds;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(tick, 1000);
  }, [totalSeconds, tick]);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (isPaused) {
      const pausedDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pausedDuration;
      setIsPaused(false);
      intervalRef.current = window.setInterval(tick, 1000);
    }
  }, [isPaused, tick]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setRemainingSeconds(totalSeconds);
  }, [stop, totalSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    isPaused,
    remainingSeconds,
    totalSeconds,
    progress,
    start,
    pause,
    resume,
    stop,
    reset,
    formatTime
  };
}
