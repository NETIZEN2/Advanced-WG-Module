
import React from 'react';
import { TimePlayIcon, TimePauseIcon } from './icons';

interface TimeControlsProps {
  isPaused: boolean;
  timeMultiplier: number;
  onTogglePause: () => void;
  onSetMultiplier: (speed: number) => void;
}

const SPEEDS = [1, 2, 4, 8, 16];

export const TimeControls: React.FC<TimeControlsProps> = ({ isPaused, timeMultiplier, onTogglePause, onSetMultiplier }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg z-10 flex items-center p-1.5 space-x-2 animate-fade-in">
      <button
        onClick={onTogglePause}
        className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
        aria-label={isPaused ? "Play" : "Pause"}
      >
        {isPaused ? <TimePlayIcon className="w-6 h-6" /> : <TimePauseIcon className="w-6 h-6" />}
      </button>
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md">
        {SPEEDS.map(speed => (
          <button
            key={speed}
            onClick={() => onSetMultiplier(speed)}
            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors w-12 ${
              !isPaused && timeMultiplier === speed
                ? 'bg-sky-500 text-white shadow'
                : 'bg-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
};
