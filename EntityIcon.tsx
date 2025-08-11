
import React from 'react';
import { Force } from '../types';
import { ICON_PART_MAP } from './icons';

interface EntityIconProps {
  force: Force;
  iconId: string;
  className?: string;
}

export const EntityIcon: React.FC<EntityIconProps> = ({ force, iconId, className = "w-6 h-6" }) => {
  const IconPartComponent = ICON_PART_MAP[iconId] || null;
  
  // The frame's color is determined by the force.
  const forceColorClass = force === Force.BLUE ? 'text-sky-500' : 'text-rose-500';

  // NATO APP-6 inspired frames. The `stroke="currentColor"` will pick up the forceColorClass.
  const frame = force === Force.BLUE
    // Friendly (rectangle)
    ? <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    // Hostile (diamond)
    : <path d="M 12,2 L 22,12 L 12,22 L 2,12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />;

  return (
    <svg viewBox="0 0 24 24" className={`${className} ${forceColorClass}`} fill="none">
      {/* Render the colored frame */}
      {frame}
      
      {/* Render the icon symbol itself inside a group. 
          This group resets the color to a neutral one, so the icon is not colored by the force.
          The `fill` and `stroke` will be inherited by the SVG paths inside iconData.svg */}
      <g className="text-slate-600" fill="currentColor" stroke="currentColor">
        {IconPartComponent && <IconPartComponent />}
      </g>
    </svg>
  );
};
