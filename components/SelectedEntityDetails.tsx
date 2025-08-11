

import React, { useState, useMemo, useContext } from 'react';
import type { PlacedEntity, BaseEntity, Sensor, Weapon, SystemUnit, Group, DistanceUnit } from '../types';
import { Force, EntityType } from '../types';
import { EntityIcon } from './EntityIcon';
import { PlayIcon, StopIcon, FuelIcon } from './icons';
import { AppContext } from '../state/appState';

// --- HELPERS ---
const R = 6371; // Radius of the Earth in km
const toRad = (deg: number): number => deg * (Math.PI / 180);

const forceStyles = {
    [Force.BLUE]: { 
        header: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-300', 
        button: 'bg-sky-500 hover:bg-sky-600 text-white', buttonActive: 'bg-amber-400 hover:bg-amber-500 text-slate-900' 
    },
    [Force.RED]: { 
        header: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', 
        button: 'bg-rose-500 hover:bg-rose-600 text-white', buttonActive: 'bg-amber-400 hover:bg-amber-500 text-slate-900' 
    }
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode; unit?: string }> = ({ label, value, unit }) => {
    if (value === null || typeof value === 'undefined' || value === '') return null;
    return (
        <div className="flex justify-between items-center text-sm py-1">
            <span className="text-slate-500">{label}</span>
            <span className="font-mono font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                {String(value)} {unit}
            </span>
        </div>
    );
};

const UnitDetailRow: React.FC<{label: string, data?: SystemUnit<string>}> = ({label, data}) => {
    if(!data || typeof data.value === 'undefined') return null;
    const displayValue = data.value < 10 ? data.value.toFixed(1) : Math.round(data.value);
    return <DetailRow label={label} value={displayValue} unit={data.unit} />
}

const CollapsibleSection: React.FC<{ title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, count, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-slate-200">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-2 text-md font-semibold text-slate-600 hover:bg-slate-100/50 rounded-md">
                <div className="flex items-center space-x-2">
                    <span>{title}</span>
                    {typeof count !== 'undefined' && <span className="text-xs bg-slate-200 text-slate-600 font-mono px-1.5 py-0.5 rounded-full">{count}</span>}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && <div className="pb-2 px-1 space-y-1">{children}</div>}
        </div>
    );
};

const PlatformDetails: React.FC<{ entity: BaseEntity }> = ({ entity }) => {
    const renderArmor = (armor: BaseEntity['armorMm']) => {
        if (!armor || Object.values(armor).every(v => typeof v === 'undefined')) return null;
        const parts = [
            typeof armor.front !== 'undefined' && `F:${armor.front}`, typeof armor.side !== 'undefined' && `S:${armor.side}`,
            typeof armor.rear !== 'undefined' && `R:${armor.rear}`, typeof armor.top !== 'undefined' && `T:${armor.top}`
        ].filter(Boolean).join('/');
        return parts || null;
    }
    
    return (<>
        <UnitDetailRow label="Max Speed" data={entity.maxSpeed} />
        <UnitDetailRow label="Operational Range" data={entity.operationalRange} />
        <DetailRow label="Crew" value={entity.crew} />
        {entity.type === EntityType.AIR && <>
            <UnitDetailRow label="Cruise Speed" data={entity.cruiseSpeed} />
            <UnitDetailRow label="Service Ceiling" data={entity.serviceCeiling} />
            <UnitDetailRow label="Combat Radius" data={entity.combatRadius} />
        </>}
        {(entity.type === EntityType.LAND || entity.type === EntityType.SAM) && <DetailRow label="Armor" value={renderArmor(entity.armorMm)} unit="mm" />}
        {entity.type === EntityType.SEA && <>
            <UnitDetailRow label="Endurance" data={entity.endurance} />
            <UnitDetailRow label="Max Depth" data={entity.maxDepth} />
            <DetailRow label="Displacement" value={entity.displacementTons} unit="tons" />
        </>}
        {entity.type === EntityType.SPACE && <UnitDetailRow label="Orbital Altitude" data={entity.orbitalAltitude} />}
        {entity.type === EntityType.CYBER && <>
            <UnitDetailRow label="Bandwidth" data={entity.bandwidth} />
            <UnitDetailRow label="Effective Range" data={entity.effectiveRange} />
        </>}
    </>)
}

const SensorDetails: React.FC<{sensor: Sensor, isConnected?: boolean}> = ({sensor, isConnected}) => {
    const isIneffective = sensor.requiresNetwork && !isConnected;
    const renderSensorSubtext = () => {
        let subtext = `${sensor.type} / Range: ${sensor.range.value ?? 'N/A'} ${sensor.range.unit}`;
        if (sensor.type === 'Radar' && sensor.frequency && (sensor.frequency.min || sensor.frequency.max)) subtext += ` / Freq: ${sensor.frequency.min ?? '?'}-${sensor.frequency.max ?? '?'} ${sensor.frequency.unit}`;
        return subtext;
    }
    return (
        <div className={`p-2 bg-slate-100 rounded transition-opacity ${isIneffective ? 'opacity-50' : ''}`}>
            <div className="flex items-center space-x-2">
                <EntityIcon force={Force.BLUE} iconId="sensor" className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-semibold text-sm text-slate-800">{sensor.name}</p>
                    <p className="text-xs text-slate-500">{renderSensorSubtext()}</p>
                </div>
                {sensor.requiresNetwork && (
                     <div title={isIneffective ? "System offline: Requires network connection" : "System requires network connection"}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isIneffective ? 'text-amber-500' : 'text-sky-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M1.394 8.929a15 15 0 0121.212 0" /></svg>
                    </div>
                )}
            </div>
        </div>
    )
}

const WeaponDetails: React.FC<{ weapon: Weapon; entity: PlacedEntity; styles: any; isConnected?: boolean }> = ({weapon, entity, styles, isConnected}) => {
    const { state, dispatch } = useContext(AppContext);
    const { targetingState } = state;
    const isIneffective = weapon.requiresNetwork && !isConnected;
    const isTargetingThis = targetingState?.launcherId === entity.instanceId && targetingState?.weapon.id === weapon.id;
    const currentQuantity = entity.systemsState?.weapons?.[weapon.id]?.currentQuantity;
    const isOutOfAmmo = typeof currentQuantity === 'number' && currentQuantity <= 0;

    const handleTargetClick = () => {
        if (isTargetingThis) dispatch({ type: 'CANCEL_INTERACTION' });
        else dispatch({ type: 'START_TARGETING', payload: { launcherId: entity.instanceId, weapon } });
    }

    return (
        <div className={`p-2 bg-slate-100 rounded transition-opacity ${isIneffective || isOutOfAmmo ? 'opacity-50' : ''}`}>
            <div className="flex items-start space-x-2">
                <EntityIcon force={Force.BLUE} iconId="weapon" className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                    <p className="font-semibold text-sm text-slate-800">{weapon.name}</p>
                    <p className="text-xs text-slate-500">
                        {(typeof currentQuantity === 'number' && `Qty: ${currentQuantity} / ${weapon.maxQuantity ?? 'N/A'} | `) || ''}
                        {`${weapon.type} / Range: ${weapon.range.value ?? 'N/A'} ${weapon.range.unit}`}
                        {(weapon.guidance && ` / ${weapon.guidance}`) || ''}
                    </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                   {weapon.requiresNetwork && ( <div title={isIneffective ? "Offline" : "Online"}><svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isIneffective ? 'text-amber-500' : 'text-sky-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M1.394 8.929a15 15 0 0121.212 0" /></svg></div>)}
                    <button onClick={handleTargetClick} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors shadow-sm w-20 text-center ${isTargetingThis ? styles.buttonActive : (isOutOfAmmo ? 'bg-slate-300 text-slate-500' : styles.button)}`} disabled={isIneffective || isOutOfAmmo}>
                        {isOutOfAmmo ? 'Empty' : (isTargetingThis ? 'Cancel' : 'Target')}
                    </button>
                </div>
            </div>
        </div>
    )
}

const DatalinkManager: React.FC<{ entity: PlacedEntity }> = ({ entity }) => {
    const { state, dispatch } = useContext(AppContext);
    const { linkingState, placedEntities } = state;
    const styles = forceStyles[entity.force];
    const getLinkedEntities = (datalinkId: string) => placedEntities.filter(e => e.linkedTo?.providerId === entity.instanceId && e.linkedTo?.datalinkId === datalinkId);

    return (
        <CollapsibleSection title="Datalinks" count={entity.datalinks?.length} defaultOpen>
            {entity.datalinks && entity.datalinks.length > 0 ? (
                entity.datalinks.map(datalink => {
                    const isLinkingThis = linkingState?.providerId === entity.instanceId && linkingState?.datalinkId === datalink.id;
                    const linkedUnits = getLinkedEntities(datalink.id);
                    return (
                        <div key={datalink.id} className="p-2 bg-slate-100 rounded space-y-2">
                            <div className="flex justify-between items-center">
                                <div><p className="font-semibold text-slate-800">{datalink.name}</p><p className="text-xs text-slate-500">Range: {datalink.range} km</p></div>
                                <button onClick={() => dispatch({ type: 'START_LINKING', payload: { providerId: entity.instanceId, datalinkId: datalink.id } })} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors shadow-sm ${isLinkingThis ? styles.buttonActive : styles.button}`}>
                                    {isLinkingThis ? 'Cancel' : 'Link Units'}
                                </button>
                            </div>
                            {linkedUnits.length > 0 && (
                                <div className="border-t border-slate-200/50 pt-2 text-xs">
                                    <p className="font-bold text-slate-500 mb-1">Connected Units:</p>
                                    <ul className="list-disc list-inside space-y-1 pl-1">
                                    {linkedUnits.map(unit => (<li key={unit.instanceId} className={unit.isConnected ? 'text-emerald-600' : 'text-amber-600'}>{unit.name} ({unit.isConnected ? 'Online' : 'Offline'})</li>))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )
                })
            ) : <p className="text-xs text-slate-500 text-center">No datalinks defined.</p>}
        </CollapsibleSection>
    )
}

const MovementControls: React.FC<{ entity: PlacedEntity }> = ({ entity }) => {
    const { state, dispatch } = useContext(AppContext);
    const { plottingWaypointsFor } = state;
    
    if (!entity.maxSpeed?.value) return <div className="border-t border-slate-200 pt-3 flex items-center justify-center text-sm text-slate-500 italic p-3">Movement not applicable for this unit type.</div>;
    
    const isPlotting = plottingWaypointsFor === entity.instanceId;
    const pathDistance = useMemo(() => {
        if (!entity.waypoints || entity.waypoints.length === 0) return 0;
        let totalDistance = 0;
        const R = 6371; const toRad = (deg: number) => deg * Math.PI / 180;
        const path = [entity.currentPosition || entity.position, ...(entity.waypoints || [])];
        for(let i = 0; i < path.length - 1; i++) {
            const [lat1, lon1] = path[i]; const [lat2, lon2] = path[i+1];
            const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            totalDistance += 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
        }
        return totalDistance;
    }, [entity.position, entity.currentPosition, entity.waypoints]);

    const opRangeKm = useMemo(() => {
        if (!entity.operationalRange?.value) return 0;
        const { value, unit } = entity.operationalRange;
        return unit === 'nm' ? value * 1.852 : value;
    }, [entity.operationalRange]);

    const traveledDistance = entity.movingState?.distanceTraveled || 0;
    const hasSufficientRange = opRangeKm >= pathDistance;

    if (entity.isOutOfFuel) return <div className="border-t border-slate-200 pt-3 flex items-center justify-center space-x-2 text-rose-600 font-bold bg-rose-100 p-3 rounded-md"><FuelIcon className="w-6 h-6" /><span>OUT OF FUEL</span></div>;

    if (entity.movingState) {
        const { totalDistance } = entity.movingState;
        const progressPercent = totalDistance > 0 ? (traveledDistance / totalDistance) * 100 : 0;
        return (
            <div className="border-t border-slate-200 pt-3 space-y-2">
                 <div className="flex justify-between items-center"><p className="text-sm font-bold text-slate-700">Moving...</p><button onClick={() => dispatch({ type: 'STOP_MOVEMENT', payload: entity.instanceId })} className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md shadow-sm"><StopIcon className="w-5 h-5" /></button></div>
                 <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div></div>
                 <p className="text-xs text-center text-slate-500">{traveledDistance.toFixed(1)} / {totalDistance.toFixed(1)} km</p>
            </div>
        );
    }

    return (
        <div className="border-t border-slate-200 pt-3 space-y-2">
            <button onClick={() => dispatch({ type: 'START_PLOTTING_WAYPOINTS', payload: entity.instanceId })} className={`w-full text-sm font-semibold rounded-md transition-colors shadow-sm p-2 flex items-center justify-center space-x-2 ${isPlotting ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-slate-600 hover:bg-slate-700 text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                <span>{isPlotting ? "Plotting... (Esc to finish)" : "Plot Waypoints"}</span>
            </button>
            {entity.waypoints && entity.waypoints.length > 0 && (
                <div className="space-y-2 pt-2">
                     {!hasSufficientRange && <p className="text-xs text-center text-amber-600 bg-amber-100 p-2 rounded-md">Warning: Path exceeds range ({pathDistance.toFixed(1)}km / {opRangeKm.toFixed(1)}km).</p>}
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => dispatch({ type: 'CLEAR_WAYPOINTS', payload: entity.instanceId })} className="w-full text-sm font-semibold rounded-md transition-colors shadow-sm p-2 flex items-center justify-center space-x-2 bg-slate-200 hover:bg-rose-200 text-slate-700 hover:text-rose-700 disabled:bg-slate-300" disabled={isPlotting}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            <span>Clear Path</span>
                        </button>
                        <button onClick={() => dispatch({ type: 'EXECUTE_PATH', payload: entity.instanceId })} className="w-full text-sm font-semibold rounded-md transition-colors shadow-sm p-2 flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-slate-300" disabled={isPlotting}>
                            <PlayIcon className="w-5 h-5" />
                            <span>Execute Path</span>
                        </button>
                    </div>
                    <p className="text-xs text-center text-slate-500">Path Distance: {pathDistance.toFixed(1)} km</p>
                </div>
            )}
        </div>
    )
}

export const SelectedEntityDetails: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { selectedEntityId, placedEntities, groups } = state;
    const entity = useMemo(() => placedEntities.find(e => e.instanceId === selectedEntityId) || null, [selectedEntityId, placedEntities]);

    const providerEntity = useMemo(() => {
        if (!entity?.linkedTo) return null;
        return placedEntities.find(p => p.instanceId === entity.linkedTo.providerId);
    }, [entity, placedEntities]);

    const providerDatalink = useMemo(() => {
        if (!entity?.linkedTo || !providerEntity) return null;
        return providerEntity.datalinks?.find(d => d.id === entity.linkedTo!.datalinkId);
    }, [entity, providerEntity]);

    if (!entity) return null;

    const isConnected = entity.isConnected || false;
    const styles = forceStyles[entity.force];
    const group = entity.groupId ? groups[entity.groupId] : null;
    
    return (
        <div className="flex-grow flex flex-col p-4 bg-slate-50 overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-600 mb-4 flex-shrink-0">Selected Unit Details</h2>
            <div className={`p-4 rounded-lg border ${styles.border} ${styles.bg} space-y-3`}>
                <div className="flex justify-between items-start">
                    <div className={`flex items-center space-x-3 ${styles.header}`}>
                        <EntityIcon force={entity.force} iconId={entity.icon} className="w-10 h-10 flex-shrink-0" />
                        <div><p className="text-xl font-bold">{entity.name}</p><p className="text-sm font-semibold uppercase opacity-80">{entity.force} FORCE / {entity.type}</p></div>
                    </div>
                     <button onClick={() => dispatch({ type: 'REMOVE_ENTITY_FROM_MAP', payload: entity.instanceId })} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-rose-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                
                {group && <div className="border-y border-slate-200 py-2 flex justify-between items-center"><p className="text-sm text-slate-600">Part of group ({group.entityIds.length} units)</p><button onClick={() => dispatch({ type: 'UNGROUP', payload: group.id })} className="px-3 py-1 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-md text-sm font-semibold text-slate-700 transition-colors">Ungroup</button></div>}
                {entity.description && <div className="border-t border-slate-200 pt-3"><p className="text-sm text-slate-600 whitespace-pre-wrap">{entity.description}</p></div>}
                
                <MovementControls entity={entity} />
                
                {entity.linkedTo && providerEntity && (
                    <div className="border-y border-slate-200 py-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Network Status</p>
                                <p className={`font-semibold text-lg ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>{isConnected ? 'CONNECTED' : 'OFFLINE'}</p>
                                <p className="text-xs text-slate-500">Linked to {providerEntity.name} via {providerDatalink?.name || 'Unknown'}</p>
                            </div>
                            <button onClick={() => dispatch({ type: 'UNLINK_ENTITY', payload: entity.instanceId })} className="px-3 py-1 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-md text-sm font-semibold text-slate-700 transition-colors">Unlink</button>
                        </div>
                    </div>
                )}
                
                {entity.datalinks && entity.datalinks.length > 0 && <DatalinkManager entity={entity} />}
                
                <CollapsibleSection title="Platform Characteristics" defaultOpen><PlatformDetails entity={entity} /></CollapsibleSection>
                <CollapsibleSection title="Sensors" count={entity.sensors.length} defaultOpen>{entity.sensors.length > 0 ? entity.sensors.map(s => <SensorDetails key={s.id} sensor={s} isConnected={isConnected} />) : <p className="text-xs text-slate-500 text-center">No sensors.</p>}</CollapsibleSection>
                <CollapsibleSection title="Weapons" count={entity.weapons.length} defaultOpen>{entity.weapons.length > 0 ? entity.weapons.map(w => <WeaponDetails key={w.id} weapon={w} entity={entity} styles={styles} isConnected={isConnected} />) : <p className="text-xs text-slate-500 text-center">No weapons.</p>}</CollapsibleSection>
            </div>
        </div>
    )
}