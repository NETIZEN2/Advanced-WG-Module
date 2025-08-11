
import React, { useContext } from 'react';
import type { PlacedEntity, SystemUnit, DistanceUnit } from '../types';
import { EntityIcon } from './EntityIcon';
import { AppContext } from '../state/appState';

interface MapEntityProps {
  entity: PlacedEntity;
  onClick: (instanceId: string, event: React.MouseEvent) => void;
  onRightClick: (instanceId: string, event: React.MouseEvent) => void;
  zoom: number;
  rangeVisibility: {
    sensors: boolean;
    weapons: boolean;
  };
  isMoving: boolean;
  linkProviderRangeKm?: number;
  isPotentialWeaponTarget: boolean;
  isPotentialLinkTarget: boolean;
}

const sensorRangeStyle = { fill: 'rgba(14, 165, 233, 0.1)', stroke: 'rgba(14, 165, 233, 0.4)', dash: '4 4' }; // sky-500
const weaponRangeStyle = { fill: 'rgba(239, 68, 68, 0.1)', stroke: 'rgba(239, 68, 68, 0.4)', dash: 'none' }; // red-500
const datalinkRangeStyle = { fill: 'rgba(245, 158, 11, 0.1)', stroke: 'rgba(245, 158, 11, 0.4)', dash: '2 8' }; // amber-500


const metersPerPixel = (latitude: number, zoom: number): number => {
    const clampedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
    return (40075016.686 * Math.abs(Math.cos(clampedLatitude * Math.PI / 180))) / Math.pow(2, zoom + 8);
}

const convertToKm = (range: SystemUnit<DistanceUnit>): number => {
    if (!range.value || range.value <= 0 || !isFinite(range.value)) return 0;
    return range.unit === 'nm' ? range.value * 1.852 : range.value;
}

export const MapEntity: React.FC<MapEntityProps> = (props) => {
  const { 
      entity, onClick, onRightClick, zoom, 
      rangeVisibility, isMoving,
      linkProviderRangeKm,
      isPotentialLinkTarget, isPotentialWeaponTarget
  } = props;
  
  const livePosition = entity.currentPosition || entity.position;

  // --- CRITICAL GUARD: Prevent rendering if position is invalid to avoid crashing the app ---
  if (!livePosition || !Array.isArray(livePosition) || !isFinite(livePosition[0]) || !isFinite(livePosition[1])) {
    console.error(`MapEntity: Rendering skipped for entity with invalid position: ${entity.name} (${entity.instanceId})`);
    return null;
  }
  
  const { state } = useContext(AppContext);
  const { selectedEntityId, multiSelectedIds, plottingWaypointsFor, linkingState, targetingState, missionHighlightedEntityId } = state;
  
  const isSelected = entity.instanceId === selectedEntityId;
  const isMultiSelected = multiSelectedIds.includes(entity.instanceId);
  const isPlotting = !!plottingWaypointsFor;
  const isLinking = !!linkingState;
  const isTargeting = !!targetingState;
  const isMissionHighlighted = entity.instanceId === missionHighlightedEntityId;

  // --- Hardened Calculations for Stability ---
  const mpp = metersPerPixel(livePosition[0], zoom);
  const canDrawRanges = isFinite(mpp) && mpp > 0;

  const getRadiusInPixels = (rangeInKm: number) => {
    if (!canDrawRanges) return 0;
    const radius = (rangeInKm * 1000) / mpp;
    return isFinite(radius) ? radius : 0;
  }
  
  const allRanges: {radius: number, style: typeof sensorRangeStyle}[] = [];

  if(isSelected) {
    if (rangeVisibility.sensors) {
        entity.sensors.forEach(sensor => {
          allRanges.push({ radius: getRadiusInPixels(convertToKm(sensor.range)), style: sensorRangeStyle });
        });
    }
    if (rangeVisibility.weapons) {
        entity.weapons.forEach(weapon => {
          allRanges.push({ radius: getRadiusInPixels(convertToKm(weapon.range)), style: weaponRangeStyle });
        });
    }
  }

  if (linkProviderRangeKm && linkProviderRangeKm > 0) {
    allRanges.push({ radius: getRadiusInPixels(linkProviderRangeKm), style: datalinkRangeStyle });
  }

  allRanges.sort((a, b) => b.radius - a.radius);

  const maxRadius = allRanges.length > 0 ? Math.max(0, ...allRanges.map(r => r.radius)) : 0;
  const size = (isFinite(maxRadius) ? Math.max(maxRadius, 40) : 40) * 2;
  const center = size / 2;

  const getCursorStyle = () => {
    if (isMoving) return 'pointer-events-none';
    if (isTargeting) return isPotentialWeaponTarget ? 'crosshair' : 'not-allowed';
    if (isPlotting) return 'copy';
    if (isLinking) return isPotentialLinkTarget ? 'crosshair' : 'not-allowed';
    return 'pointer';
  }
  
  const selectionClasses = [
      isSelected ? 'bg-white/95 scale-125 shadow-lg' : 'bg-white/80 shadow',
      isMultiSelected ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-white' : '',
      isMoving ? 'animate-pulse-slow' : '',
  ].join(' ');

  const highlightRingClass = isPotentialWeaponTarget
    ? 'border-rose-500'
    : isPotentialLinkTarget
    ? 'border-amber-500'
    : '';

  const missionHighlightClass = 'border-emerald-400';

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
      }}
      className="relative flex items-center justify-center pointer-events-none"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible absolute pointer-events-none">
        {allRanges.map((range, index) => {
          if (range.radius <= 0) return null;
          return (
            <g key={index}>
              <circle cx={center} cy={center} r={range.radius} fill={range.style.fill} stroke={range.style.stroke} strokeWidth="1.5" strokeDasharray={range.style.dash} className={isLinking ? 'animate-pulse-slow' : ''}/>
            </g>
          )
        })}
      </svg>
      
      {highlightRingClass && !isMissionHighlighted && (
           <div 
            className={`absolute w-16 h-16 rounded-full border-4 animate-pulse-ring ${highlightRingClass}`} 
            style={{ pointerEvents: 'none' }}
           />
      )}
      
      {isMissionHighlighted && (
           <div 
            className={`absolute w-20 h-20 rounded-full border-4 animate-pulse-ring ${missionHighlightClass}`} 
            style={{ pointerEvents: 'none', animationDuration: '1.2s' }}
           />
      )}

      <div
        style={{
          pointerEvents: 'auto', // Make the icon itself interactive again.
          cursor: getCursorStyle(),
          opacity: isMoving ? 0.7 : 1,
        }}
        onClick={(e) => { e.stopPropagation(); onClick(entity.instanceId, e); }}
        onContextMenu={(e) => { e.stopPropagation(); onRightClick(entity.instanceId, e); }}
      >
        <div className={`flex flex-col items-center justify-center p-1 rounded-full bg-white/80 backdrop-blur-sm transition-all duration-200 ${selectionClasses}`}>
             <EntityIcon force={entity.force} iconId={entity.icon} />
        </div>
      </div>
       {isSelected && (
          <div className="absolute text-center pointer-events-none w-max" style={{top: '50%', left: '50%', transform: `translate(-50%, ${20}px)`}}>
             <span className="text-xs font-bold text-slate-800 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full whitespace-nowrap shadow">{entity.name}</span>
          </div>
       )}
    </div>
  );
};
