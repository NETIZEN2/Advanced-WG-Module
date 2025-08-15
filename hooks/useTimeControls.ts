import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../state/appState';

export const useTimeControls = () => {
  const { dispatch } = useContext(AppContext);
  const [timeMultiplier, setTimeMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(true);
  const animationFrameId = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(Date.now());

  const togglePause = useCallback(() => setIsPaused(p => !p), []);
  const setMultiplier = useCallback((speed: number) => {
    setTimeMultiplier(speed);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
      return;
    }
    const loop = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime.current;
      lastFrameTime.current = now;
      const scaledDeltaTime = deltaTime * timeMultiplier;
      dispatch({ type: 'TICK', payload: { scaledDeltaTime } });
      animationFrameId.current = requestAnimationFrame(loop);
    };
    lastFrameTime.current = Date.now();
    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPaused, timeMultiplier, dispatch]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePause]);

  return { isPaused, timeMultiplier, togglePause, setMultiplier };
};
