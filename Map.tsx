


import React, { useRef, useState, useImperativeHandle, forwardRef, useCallback, useContext, useMemo } from 'react';
import { Map as PigeonMap, Overlay, ZoomControl } from 'pigeon-maps';
import { MapEntity } from './MapEntity';
import type { PlacedEntity, LibraryEntity, SystemUnit, DistanceUnit } from '../types';
import { Force } from '../types';
import { MapControls } from './MapControls';
import { EntityIcon } from './EntityIcon';
import { AppContext } from '../state/appState';

interface MapComponentProps {
  missionAnalysisWorker: Worker | null;
  onEntityRightClick: (instanceId: string, position: {x: number, y: number}) => void;
}

interface MapRef {
  centerOn: (coords: [number, number]) => void;
}

// --- HELPERS ---
const R = 6371; // Radius of the Earth in km
const toRad = (deg: number): number => deg * (Math.PI / 180);

const isValidCoord = (pos: any): pos is [number, number] =>
  Array.isArray(pos) && pos.length === 2 && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1]);

const calculateDistance = ([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number => {
  if (!isValidCoord([lat1, lon1]) || !isValidCoord([lat2, lon2])) return Infinity;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return isNaN(distance) ? Infinity : distance;
}
const convertToKm = (range: SystemUnit<DistanceUnit>): number => {
    if (!range.value || range.value <= 0) return 0;
    return range.unit === 'nm' ? range.value * 1.852 : range.value;
}

// --- SUB-COMPONENTS ---
const ExplosionEffect: React.FC = () => (
    <div className="absolute top-1/2 left-1/2 w-24 h-24" style={{ transform: 'translate(-50%, -50%)' }}>
        <div className="absolute inset-0 rounded-full animate-flash" />
        <div className="absolute inset-0 rounded-full border-amber-300 animate-shockwave" />
        <div className="absolute inset-0 rounded-full bg-slate-500/50 animate-smoke" />
    </div>
);


// --- MAIN COMPONENT ---
export const MapComponent = forwardRef<MapRef, MapComponentProps>(({
  missionAnalysisWorker,
  onEntityRightClick,
}, ref) => {
  const { state, dispatch } = useContext(AppContext);
  const { entities, projectiles, effects, linkingState, plottingWaypointsFor, targetingState, placingEntityId, libraryEntities, movingEntityId } = useMemo(() => ({
      entities: state.placedEntities,
      projectiles: state.projectiles,
      effects: state.effects,
      linkingState: state.linkingState,
      plottingWaypointsFor: state.plottingWaypointsFor,
      targetingState: state.targetingState,
      placingEntityId: state.placingEntityId,
      libraryEntities: state.libraryEntities,
      movingEntityId: state.movingEntityId,
  }), [state]);
  
  const [mapLayers, setMapLayers] = useState({
    forces: { blue: true, red: true },
    ranges: { sensors: true, weapons: true },
    links: { datalinks: true },
    paths: { waypoints: true, trails: true },
  });

  const mapRef = useRef<any>(null); // For pigeon-maps internal methods
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<[number, number]>([34.0522, -118.2437]); // Default to LA
  const [zoom, setZoom] = useState(6);
  const [mousePosition, setMousePosition] = useState<{ latLng: [number, number], pixel: [number, number] } | null>(null);

  useImperativeHandle(ref, () => ({
    centerOn: (coords) => {
      setCenter(coords);
      setZoom(12);
    }
  }));

  const onEntityClick = (id: string | null, event?: React.MouseEvent | globalThis.MouseEvent) => {
    if (movingEntityId) return;

    if (targetingState) {
        const targetEntity = entities.find(e => e.instanceId === id);
        const launcherEntity = entities.find(e => e.instanceId === targetingState.launcherId);
        if (targetEntity && launcherEntity && targetEntity.force !== launcherEntity.force) {
            dispatch({ type: 'LAUNCH_WEAPON', payload: { targetPosition: targetEntity.currentPosition || targetEntity.position, targetId: targetEntity.instanceId }});
        }
        return;
    }
    
    if (plottingWaypointsFor && id === plottingWaypointsFor) return;
    if (plottingWaypointsFor && id === null) return;
    
    if (linkingState) {
        const clickedEntity = entities.find(e => e.instanceId === id);
        if (clickedEntity) dispatch({ type: 'FINISH_LINKING', payload: clickedEntity.instanceId });
        return;
    }

    if (id === null) {
      dispatch({ type: 'CLEAR_SELECTION' });
    } else {
      dispatch({ type: 'SELECT_ENTITY', payload: { instanceId: id, isShift: !!event?.shiftKey } });
    }
  };

  const onMapClick = (latLng: [number, number]) => {
    if (placingEntityId) {
        const entityToPlace = libraryEntities.find(e => e.id === placingEntityId);
        if (entityToPlace) {
            dispatch({ type: 'ADD_ENTITY_TO_MAP', payload: { entity: entityToPlace, position: latLng } });
        }
        return;
    }
    if (movingEntityId) {
        dispatch({ type: 'MOVE_ENTITY_ON_MAP', payload: { position: latLng } });
        return;
    }
    if (targetingState) {
        dispatch({ type: 'LAUNCH_WEAPON', payload: { targetPosition: latLng } });
        return;
    }
    if (plottingWaypointsFor) {
        dispatch({ type: 'ADD_WAYPOINT', payload: latLng });
        return;
    }
    onEntityClick(null);
  }

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (targetingState && mapRef.current && mapWrapperRef.current) {
      const mapRect = mapWrapperRef.current.getBoundingClientRect();
      const x = event.clientX - mapRect.left;
      const y = event.clientY - mapRect.top;
      const pixel: [number, number] = [x, y];
      const latLng = mapRef.current.pixelToLatLng(pixel);
      setMousePosition({ latLng, pixel });
    } else if (mousePosition) {
      setMousePosition(null);
    }
  }, [targetingState, mousePosition]);

  const onAnalyzeScenario = () => {
      if (!missionAnalysisWorker) {
          console.warn("Analysis worker is not yet available.");
          dispatch({ type: 'ANALYSIS_ERROR', payload: { message: "Analysis engine is loading, please try again." } });
          return;
      }
      dispatch({ type: 'START_ANALYSIS' });
      missionAnalysisWorker.postMessage({
        entities: state.placedEntities,
        disabledSystemIds: state.disabledSystemIds
      });
  };

  const filteredEntities = entities.filter(e => {
      if (e.force === Force.BLUE && !mapLayers.forces.blue) return false;
      if (e.force === Force.RED && !mapLayers.forces.red) return false;
      return true;
  });

  const launcher = targetingState ? entities.find(e => e.instanceId === targetingState.launcherId) : null;
  const linker = linkingState ? entities.find(e => e.instanceId === linkingState.providerId) : null;
  
  const entityMap = useMemo(() => new Map(entities.map(e => [e.instanceId, e])), [entities]);

  return (
    <div 
        ref={mapWrapperRef} 
        className="w-full h-full relative" 
        style={{ backgroundColor: '#f8fafc' }}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
    >
      <PigeonMap
        ref={mapRef}
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => { setCenter(center); setZoom(zoom); }}
        onClick={({ latLng }) => onMapClick(latLng)}
        metaWheelZoom={true}
        metaWheelZoomWarning="Use META key to zoom"
      >
        <ZoomControl />

        {/* Datalink Lines */}
        {mapLayers.links.datalinks && entities.filter(e => e.linkedTo).map(consumer => {
            const provider = entityMap.get(consumer.linkedTo!.providerId);
            const consumerLivePos = consumer.currentPosition || consumer.position;
            const providerLivePos = provider?.currentPosition || provider?.position;

            if (!provider || !mapRef.current || !isValidCoord(consumerLivePos) || !isValidCoord(providerLivePos)) return null;

            const consumerPixel = mapRef.current.latLngToPixel(consumerLivePos);
            const providerPixel = mapRef.current.latLngToPixel(providerLivePos);
            
            if (!consumerPixel || !providerPixel) return null;

            return (
                 <Overlay key={`${consumer.instanceId}-link`} anchor={providerLivePos}>
                    <svg width="0" height="0" className="overflow-visible pointer-events-none">
                        <line 
                            x1={0} y1={0} 
                            x2={consumerPixel[0] - providerPixel[0]} y2={consumerPixel[1] - providerPixel[1]}
                            stroke={consumer.isConnected ? "rgba(245, 158, 11, 0.7)" : "rgba(100, 116, 139, 0.5)"} 
                            strokeWidth="2" strokeDasharray={consumer.isConnected ? "none" : "4 4"} 
                        />
                    </svg>
                </Overlay>
            )
        })}
        
        {/* Planned Waypoint Path */}
        {mapLayers.paths.waypoints && plottingWaypointsFor && (() => {
            const entity = entities.find(e => e.instanceId === plottingWaypointsFor);
            if (!entity || !entity.waypoints?.length || !mapRef.current) return null;
            const path = [entity.currentPosition || entity.position, ...entity.waypoints];
            
            const pixels = path.map(p => mapRef.current.latLngToPixel(p)).filter(p => !!p) as [number, number][];
            if (pixels.length < 2) return null;
            
            const points = pixels.map(p => `${p[0]},${p[1]}`).join(' ');
            return (
                <svg width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none">
                    <polyline points={points} fill="none" stroke="rgba(14, 165, 233, 0.8)" strokeWidth="2.5" strokeDasharray="10 10" className="animate-dash-flow" />
                </svg>
            );
        })()}

        {/* Live Targeting Line */}
        {targetingState && mousePosition && launcher && mapRef.current && (() => {
            const startPos = launcher.currentPosition || launcher.position;
            const endPos = mousePosition.latLng;
            
            const startPixel = mapRef.current.latLngToPixel(startPos);
            const endPixel = mousePosition.pixel;

            if (!startPixel) return null;
            
            const distance = calculateDistance(startPos, endPos);
            const maxRange = convertToKm(targetingState.weapon.range);
            const inRange = distance <= maxRange;
            const color = inRange ? 'rgba(239, 68, 68, 0.9)' : 'rgba(100, 116, 139, 0.7)';

            return (
                <svg width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none">
                    <line x1={startPixel[0]} y1={startPixel[1]} x2={endPixel[0]} y2={endPixel[1]} stroke={color}
                        strokeWidth="2" strokeDasharray={inRange ? "8 8" : "4 12"} className={inRange ? "animate-dash-flow" : ""} />
                </svg>
            );
        })()}

        {/* Completed Movement Trails */}
        {mapLayers.paths.trails && mapRef.current && entities.filter(e => e.movementTrail && e.movementTrail.length > 0).map(e => {
            const pixels = e.movementTrail!.map(p => mapRef.current.latLngToPixel(p)).filter(p => !!p) as [number, number][];
            if (pixels.length < 2) return null;
            const points = pixels.map(p => `${p[0]},${p[1]}`).join(' ');
            return (
                <svg key={`trail-${e.instanceId}`} width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none">
                    <polyline points={points} fill="none" stroke="rgba(100, 116, 139, 0.5)" strokeWidth="1.5" />
                </svg>
            )
        })}

        {/* Projectile Trails */}
        {mapRef.current && projectiles.map(p => {
            if (p.trail.length < 2) return null;
            const pixels = p.trail.map(pos => mapRef.current.latLngToPixel(pos)).filter(px => !!px) as [number, number][];
            if (pixels.length < 2) return null;
            const points = pixels.map(px => `${px[0]},${px[1]}`).join(' ');
            return (
                 <svg key={`trail-${p.id}`} width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none">
                    <polyline points={points} fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" />
                </svg>
            )
        })}
        
        {/* Tracer Fire Effects */}
        <svg width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none">
            {mapRef.current && effects.map(effect => {
                if (effect.type !== 'tracer') return null;
                const startPixel = mapRef.current.latLngToPixel(effect.startPosition);
                const endPixel = mapRef.current.latLngToPixel(effect.endPosition);
                if (!startPixel || !endPixel) return null;
                const angleRad = Math.atan2(endPixel[1] - startPixel[1], endPixel[0] - startPixel[0]);
                const gradientId = `tracer-gradient-${effect.id}`;
                return (
                    <React.Fragment key={effect.id}>
                        <defs><linearGradient id={gradientId} gradientTransform={`rotate(${angleRad * 180 / Math.PI})`}><stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" /><stop offset="50%" stopColor="rgba(253, 224, 71, 0.9)" /><stop offset="100%" stopColor="rgba(253, 224, 71, 0)" /></linearGradient></defs>
                        <line x1={startPixel[0]} y1={startPixel[1]} x2={endPixel[0]} y2={endPixel[1]} stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" strokeDasharray="10 200" className="animate-tracer" />
                    </React.Fragment>
                );
            })}
        </svg>

        {/* Entities & Markers */}
        {mapLayers.paths.waypoints && plottingWaypointsFor && entities.find(e => e.instanceId === plottingWaypointsFor)?.waypoints?.map((wp, i) => (
            <Overlay key={`waypoint-marker-${i}`} anchor={wp}>
                <div className="flex items-center justify-center bg-sky-500 text-white w-6 h-6 rounded-full font-bold text-sm border-2 border-white shadow-md pointer-events-none" style={{transform: 'translate(-50%, -50%)'}}>{i + 1}</div>
            </Overlay>
        ))}
        
        {filteredEntities.map((entity) => {
            const livePosition = entity.currentPosition || entity.position;
            if (!isValidCoord(livePosition)) {
                console.error(`Map.tsx: Skipping render for entity with invalid position: ${entity.name} (${entity.instanceId})`);
                return null;
            }
            const isLinkProvider = linker?.instanceId === entity.instanceId;
            const linkProviderRangeKm = isLinkProvider ? linker?.datalinks?.find(d => d.id === linkingState.datalinkId)?.range : undefined;

          return (
              <Overlay key={entity.instanceId} anchor={livePosition}>
                  <MapEntity
                    entity={entity}
                    onClick={(id, e) => onEntityClick(id, e)}
                    onRightClick={(id, e) => {
                        e.preventDefault();
                        onEntityRightClick(id, { x: e.clientX, y: e.clientY });
                    }}
                    zoom={zoom} rangeVisibility={{ sensors: mapLayers.ranges.sensors, weapons: mapLayers.ranges.weapons }}
                    isMoving={entity.instanceId === movingEntityId}
                    linkProviderRangeKm={linkProviderRangeKm}
                    isPotentialWeaponTarget={!!launcher && entity.force !== launcher.force && entity.instanceId !== launcher.instanceId}
                    isPotentialLinkTarget={!!linker && entity.force === linker.force && !entity.linkedTo && entity.instanceId !== linker.instanceId}
                  />
              </Overlay>
          )
        })}

        {/* VISUAL EFFECTS ON TOP */}
        {projectiles.map(p => (
            <Overlay key={p.id} anchor={p.currentPosition}>
                 <div style={{transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`}}><EntityIcon force={Force.RED} iconId="missile-projectile" className="w-5 h-5 opacity-90 animate-projectile-pulse" /></div>
            </Overlay>
        ))}

        {effects.map(e => {
            if (e.type === 'impact' || e.type === 'fizzle') {
                return (
                    <Overlay key={e.id} anchor={e.position}>
                        {e.type === 'impact' && <ExplosionEffect />}
                        {e.type === 'fizzle' && <div className="bg-slate-400 animate-fizzle rounded-full" style={{ width: 48, height: 48, transform: 'translate(-50%, -50%)' }}/>}
                    </Overlay>
                );
            }
            return null;
        })}

      </PigeonMap>
      <MapControls mapLayers={mapLayers} setMapLayers={setMapLayers} onAnalyzeScenario={onAnalyzeScenario} />
    </div>
  );
});