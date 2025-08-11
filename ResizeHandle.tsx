
import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * A vertical resize handle component that can be dragged to resize adjacent panels.
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({ onMouseDown }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      className="flex-shrink-0 w-2 cursor-col-resize group flex items-center justify-center bg-transparent hover:bg-slate-200 transition-colors duration-200"
      style={{ touchAction: 'none' }} // Prevents scrolling on touch devices during drag
    >
      <div className="w-px h-8 bg-slate-300 group-hover:bg-sky-500 transition-colors duration-200" />
    </div>
  );
};