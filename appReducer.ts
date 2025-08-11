
import { AppState, AppAction, initialState } from './appState';
import type { LibraryEntity, PlacedEntity, Group, Weapon, Projectile, Effect, SystemUnit, DistanceUnit, SpeedUnit } from '../types';
import { Force } from '../types';
import { calculateDistance, calculateBearing, calculateDestinationPoint, isEntityConnected, isValidCoord } from '../services/entityUtils';


// --- HELPERS (Hardened for Stability) ---
const convertSystemUnitToKm = (unit: SystemUnit<DistanceUnit> | undefined): number | undefined => {
    if (typeof unit?.value !== 'number') return undefined;
    if (unit.unit === 'nm') return unit.value * 1.852;
    return unit.value;
}
const convertSystemUnitToKps = (unit: SystemUnit<SpeedUnit> | undefined): number | undefined => {
    if (typeof unit?.value !== 'number') return undefined;
    if (unit.unit === 'kn') return unit.value * 1.852 / 3600;
    return unit.value / 3600;
}

const WEAPON_SPEEDS_KPS: Record<string, number> = {
    'Missile': 1, 'Torpedo': 0.1, 'Bomb': 0.3, 'Default': 1,
};


// --- TICK HELPERS ---

function tickProjectiles(projectiles: Projectile[], entityMap: Map<string, PlacedEntity>, scaledDeltaTime: number): { stillFlying: Projectile[], newEffects: Effect[] } {
    const now = Date.now();
    const stillFlying: Projectile[] = [];
    const newEffects: Effect[] = [];

    const updatedProjectiles = projectiles.map(p => {
        let currentTargetPos = p.targetPosition;
        if (p.targetId) {
            const targetEntity = entityMap.get(p.targetId);
            if (targetEntity) currentTargetPos = targetEntity.currentPosition || targetEntity.position;
        }

        const speed = WEAPON_SPEEDS_KPS[p.weapon.type] || WEAPON_SPEEDS_KPS.Default;
        const distToTravel = speed * (scaledDeltaTime / 1000);
        const bearing = calculateBearing(p.currentPosition, currentTargetPos);
        const newPosition = calculateDestinationPoint(p.currentPosition, distToTravel, bearing);
        const rotation = bearing + 90;
        const newTrail = [...p.trail, newPosition];
        if (newTrail.length > 50) newTrail.shift();
        return { ...p, targetPosition: currentTargetPos, currentPosition: newPosition, rotation, trail: newTrail };
    });

    for (const p of updatedProjectiles) {
        const distToTarget = calculateDistance(p.currentPosition, p.targetPosition);
        let hasArrived = distToTarget < 0.5;

        const totalDist = calculateDistance(p.startPosition, p.targetPosition);
        const traveledDist = calculateDistance(p.startPosition, p.currentPosition);
        if (!p.targetId && traveledDist >= totalDist) hasArrived = true;

        const maxRange = convertSystemUnitToKm(p.weapon.range) || 0;
        if (!p.willHit && traveledDist >= maxRange) {
            hasArrived = true;
            newEffects.push({ id: `effect-${p.id}`, position: p.currentPosition, startTime: now, type: 'fizzle' });
        } else if (hasArrived) {
            newEffects.push({ id: `effect-${p.id}`, position: p.targetPosition, startTime: now, type: 'impact' });
        }
        
        if (!hasArrived) {
            stillFlying.push(p);
        }
    }

    return { stillFlying, newEffects };
}

function tickMovement(entities: PlacedEntity[], scaledDeltaTime: number): PlacedEntity[] {
    return entities.map(e => {
        if (!e.movingState || e.isOutOfFuel) return e;

        const { path, targetWaypointIndex } = e.movingState;
        const currentPosition = e.currentPosition || e.position;
        if (!path || targetWaypointIndex >= path.length || !isValidCoord(currentPosition)) {
            return { ...e, movingState: null, waypoints: [], position: currentPosition };
        }

        const speedKps = convertSystemUnitToKps(e.maxSpeed) || 0.05;
        let distToTravelThisTick = speedKps * (scaledDeltaTime / 1000);
        const targetPosition = path[targetWaypointIndex];

        if (!isValidCoord(targetPosition)) {
            console.error(`Invalid waypoint for entity ${e.instanceId}. Stopping movement.`);
            return { ...e, movingState: null, waypoints: [], position: currentPosition };
        }

        const distToNextWaypoint = calculateDistance(currentPosition, targetPosition);
        
        const opRangeKm = convertSystemUnitToKm(e.operationalRange);
        const traveledSoFar = e.movingState.distanceTraveled || 0;
        if (typeof opRangeKm === 'number') {
            const remainingRange = opRangeKm - traveledSoFar;
            distToTravelThisTick = Math.min(distToTravelThisTick, Math.max(0, remainingRange));
        }
        
        if (distToTravelThisTick <= 0) {
            return { ...e, isOutOfFuel: true, movingState: null, position: currentPosition };
        }

        let newPosition = currentPosition;
        let newTargetIndex = targetWaypointIndex;
        let distanceTraveledThisTick = 0;

        if (distToTravelThisTick >= distToNextWaypoint) {
            newPosition = targetPosition;
            distanceTraveledThisTick = distToNextWaypoint;
            newTargetIndex++;
        } else {
            const bearing = calculateBearing(currentPosition, targetPosition);
            newPosition = calculateDestinationPoint(currentPosition, distToTravelThisTick, bearing);
            distanceTraveledThisTick = distToTravelThisTick;
        }
        
        const newDistanceTraveled = traveledSoFar + distanceTraveledThisTick;
        const isNowOutOfFuel = typeof opRangeKm === 'number' && newDistanceTraveled >= opRangeKm;
        const hasFinishedPath = newTargetIndex >= path.length;

        const newTrail = e.movementTrail ? [...e.movementTrail, newPosition] : [e.position, newPosition];
        if (newTrail.length > 100) newTrail.shift();

        if (hasFinishedPath || isNowOutOfFuel) {
            return { ...e, currentPosition: newPosition, position: newPosition, movingState: null, waypoints: [], movementTrail: newTrail, isOutOfFuel: isNowOutOfFuel };
        }

        return {
            ...e,
            currentPosition: newPosition,
            movementTrail: newTrail,
            movingState: { ...e.movingState, targetWaypointIndex: newTargetIndex, distanceTraveled: newDistanceTraveled }
        };
    });
}


// --- REDUCER ---
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE_LIBRARY':
      return { ...state, libraryEntities: action.payload, libraryInitialized: true };

    case 'SAVE_LIBRARY_ENTITY': {
      const entityData = action.payload;
      if ('id' in entityData && entityData.id) {
        const updatedEntity = entityData as LibraryEntity;
        const newLibrary = state.libraryEntities.map(e => e.id === updatedEntity.id ? updatedEntity : e);
        const newPlaced = state.placedEntities.map(pe => {
          if (pe.id === updatedEntity.id) {
            const { instanceId, position, currentPosition, linkedTo, waypoints, groupId, movingState, isOutOfFuel, movementTrail, systemsState: oldSystemsState } = pe;
            const newSystemsState = {
              weapons: (updatedEntity.weapons || []).reduce((acc, weapon) => {
                  const oldAmmo = oldSystemsState?.weapons?.[weapon.id]?.currentQuantity;
                  const maxAmmo = weapon.maxQuantity || 0;
                  const currentQuantity = typeof oldAmmo === 'number' ? Math.min(oldAmmo, maxAmmo) : maxAmmo;
                  acc[weapon.id] = { currentQuantity };
                  return acc;
              }, {} as PlacedEntity['systemsState']['weapons'])
            };
            return { ...updatedEntity, instanceId, position, currentPosition, linkedTo, waypoints, groupId, movingState, isOutOfFuel, movementTrail, systemsState: newSystemsState };
          }
          return pe;
        });
        return { ...state, libraryEntities: newLibrary, placedEntities: newPlaced };
      } else {
        const newEntity: LibraryEntity = {
          ...(entityData as Omit<LibraryEntity, 'id'>),
          id: `lib-${Date.now()}`,
        };
        return { ...state, libraryEntities: [...state.libraryEntities, newEntity] };
      }
    }
    
    case 'START_MOVING_ENTITY':
        return {
            ...state,
            movingEntityId: action.payload,
            selectedEntityId: action.payload,
            multiSelectedIds: [],
            linkingState: null,
            targetingState: null,
            plottingWaypointsFor: null,
            placingEntityId: null,
        };

    case 'SET_PLACING_ENTITY': {
        const entityId = action.payload;
        // If the same entity is clicked again, deselect it. Otherwise, select the new one.
        const newPlacingEntityId = state.placingEntityId === entityId ? null : entityId;
        return {
            ...state,
            placingEntityId: newPlacingEntityId,
            movingEntityId: null,
            linkingState: null,
            targetingState: null,
            plottingWaypointsFor: null,
        };
    }

    case 'ADD_ENTITY_TO_MAP': {
        const { entity, position } = action.payload;
        const newPlacedEntity: PlacedEntity = {
            ...entity,
            instanceId: `map-${Date.now()}`,
            position,
            currentPosition: position,
            waypoints: [],
            movementTrail: [],
            movingState: null,
            systemsState: {
                weapons: (entity.weapons || []).reduce((acc, weapon) => {
                acc[weapon.id] = { currentQuantity: weapon.maxQuantity || 0 };
                return acc;
                }, {} as PlacedEntity['systemsState']['weapons'])
            }
        };
        return { 
            ...state, 
            placedEntities: [...state.placedEntities, newPlacedEntity], 
            selectedEntityId: newPlacedEntity.instanceId, 
            multiSelectedIds: [],
            placingEntityId: null, // Clear placing state after successful placement
        };
    }

    case 'MOVE_ENTITY_ON_MAP': {
        const { position } = action.payload;
        const { movingEntityId } = state;
        if (!movingEntityId) return state;

        const movedEntity = state.placedEntities.find(e => e.instanceId === movingEntityId);
        if (!movedEntity) return { ...state, movingEntityId: null };

        let newPlaced: PlacedEntity[];

        if (movedEntity.groupId && state.groups[movedEntity.groupId]) {
            const group = state.groups[movedEntity.groupId];
            const dx = position[1] - movedEntity.position[1];
            const dy = position[0] - movedEntity.position[0];
            const groupMemberIds = new Set(group.entityIds);
            newPlaced = state.placedEntities.map(e => {
                if (groupMemberIds.has(e.instanceId)) {
                    const newPos: [number, number] = e.instanceId === movingEntityId ? position : [e.position[0] + dy, e.position[1] + dx];
                    return { ...e, position: newPos, currentPosition: newPos, movementTrail: [], movingState: null, waypoints: [] };
                }
                return e;
            });
        } else {
            newPlaced = state.placedEntities.map(e => e.instanceId === movingEntityId ? { ...e, position, currentPosition: position, movementTrail: [], movingState: null, waypoints: [] } : e);
        }
        return { ...state, placedEntities: newPlaced, movingEntityId: null };
    }
    
    case 'REMOVE_ENTITY_FROM_MAP': {
        const instanceId = action.payload;
        const entityToRemove = state.placedEntities.find(e => e.instanceId === instanceId);
        if (!entityToRemove) return state;

        let newGroups = { ...state.groups };

        if (entityToRemove.groupId && state.groups[entityToRemove.groupId]) {
            const group = state.groups[entityToRemove.groupId];
            const newEntityIds = group.entityIds.filter(id => id !== instanceId);
            if (newEntityIds.length > 1) { // A group must have at least 2 entities
                newGroups[group.id] = { ...group, entityIds: newEntityIds };
            } else {
                delete newGroups[group.id];
            }
        }

        const newPlaced = state.placedEntities
            .filter(e => e.instanceId !== instanceId)
            .map(e => {
                let updatedEntity = e;
                if (e.linkedTo?.providerId === instanceId) {
                    updatedEntity = { ...updatedEntity, linkedTo: undefined, isConnected: false };
                }
                if (entityToRemove.groupId && updatedEntity.groupId === entityToRemove.groupId && !newGroups[entityToRemove.groupId]) {
                    // Group was dissolved
                    updatedEntity = { ...updatedEntity, groupId: undefined };
                }
                return updatedEntity;
            });

        // Clean up interaction state
        let { linkingState, plottingWaypointsFor, targetingState, selectedEntityId, multiSelectedIds, movingEntityId } = state;
        if (linkingState?.providerId === instanceId) linkingState = null;
        if (plottingWaypointsFor === instanceId) plottingWaypointsFor = null;
        if (targetingState?.launcherId === instanceId) targetingState = null;
        if (movingEntityId === instanceId) movingEntityId = null;
        if (selectedEntityId === instanceId) selectedEntityId = null;
        if (multiSelectedIds.includes(instanceId)) {
            multiSelectedIds = multiSelectedIds.filter(id => id !== instanceId);
        }

        return {
            ...state,
            groups: newGroups,
            placedEntities: newPlaced,
            selectedEntityId,
            multiSelectedIds,
            linkingState,
            plottingWaypointsFor,
            targetingState,
            movingEntityId,
        };
    }

    case 'DUPLICATE_ENTITY': {
        const original = state.placedEntities.find(e => e.instanceId === action.payload);
        if (!original) return state;
        const { instanceId: _, position, ...rest } = original;
        const newPosition: [number, number] = [position[0] + 0.01, position[1] + 0.01];
        const newEntity: PlacedEntity = {
            ...rest,
            position: newPosition,
            currentPosition: newPosition,
            instanceId: `map-${Date.now()}`,
            linkedTo: undefined, waypoints: [], groupId: undefined, movingState: null,
            systemsState: {
                weapons: (rest.weapons || []).reduce((acc, weapon) => {
                    acc[weapon.id] = { currentQuantity: weapon.maxQuantity || 0 };
                    return acc;
                }, {} as PlacedEntity['systemsState']['weapons'])
            }
        };
        return { ...state, placedEntities: [...state.placedEntities, newEntity], selectedEntityId: newEntity.instanceId, multiSelectedIds: [] };
    }

    case 'SELECT_ENTITY': {
        const { instanceId, isShift } = action.payload;
        if (!instanceId) return { ...state, selectedEntityId: null, multiSelectedIds: [] };
        if (isShift) {
            const newSelection = state.multiSelectedIds.includes(instanceId) ? state.multiSelectedIds.filter(id => id !== instanceId) : [...state.multiSelectedIds, instanceId];
            return { ...state, multiSelectedIds: newSelection, selectedEntityId: null };
        }
        return { ...state, selectedEntityId: instanceId, multiSelectedIds: [] };
    }
    
    case 'CLEAR_SELECTION':
      return { ...state, selectedEntityId: null, multiSelectedIds: [] };

    case 'START_LINKING':
      return { ...state, linkingState: action.payload, movingEntityId: null, targetingState: null, plottingWaypointsFor: null, placingEntityId: null };
      
    case 'FINISH_LINKING': {
        const consumerInstanceId = action.payload;
        const linkingProvider = state.placedEntities.find(e => e.instanceId === state.linkingState?.providerId);
        const clickedEntity = state.placedEntities.find(e => e.instanceId === consumerInstanceId);
        
        if (linkingProvider && clickedEntity && clickedEntity.force === linkingProvider.force && !clickedEntity.linkedTo && clickedEntity.instanceId !== linkingProvider.instanceId) {
            const newPlaced = state.placedEntities.map(e => e.instanceId === consumerInstanceId ? { ...e, linkedTo: state.linkingState } : e);
            return { ...state, placedEntities: newPlaced, linkingState: null };
        }
        return { ...state, linkingState: null };
    }
    
    case 'UNLINK_ENTITY':
      return { ...state, placedEntities: state.placedEntities.map(e => e.instanceId === action.payload ? { ...e, linkedTo: undefined, isConnected: false } : e) };

    case 'CANCEL_INTERACTION':
      return { ...state, linkingState: null, plottingWaypointsFor: null, targetingState: null, placingEntityId: null, movingEntityId: null, contextMenu: null, creatorModal: { isOpen: false, editingEntity: null } };

    case 'START_PLOTTING_WAYPOINTS':
        return {
            ...state,
            plottingWaypointsFor: state.plottingWaypointsFor === action.payload ? null : action.payload,
            movingEntityId: null,
            linkingState: null,
            targetingState: null,
            placingEntityId: null,
        };
    
    case 'ADD_WAYPOINT': {
        if (!state.plottingWaypointsFor) return state;
        const newPlaced = state.placedEntities.map(e => {
            if (e.instanceId === state.plottingWaypointsFor) {
                return { ...e, waypoints: [...(e.waypoints || []), action.payload] };
            }
            return e;
        });
        return { ...state, placedEntities: newPlaced };
    }

    case 'CLEAR_WAYPOINTS': {
      const newPlaced = state.placedEntities.map(e => e.instanceId === action.payload ? { ...e, waypoints: [], movementTrail: [] } : e);
      return { ...state, placedEntities: newPlaced, plottingWaypointsFor: state.plottingWaypointsFor === action.payload ? null : state.plottingWaypointsFor };
    }

    case 'EXECUTE_PATH': {
        const newPlaced = state.placedEntities.map(e => {
            if (e.instanceId === action.payload && e.waypoints && e.waypoints.length > 0 && !e.movingState) {
                const path = [e.currentPosition || e.position, ...e.waypoints];
                let totalDistance = 0;
                for (let i = 0; i < path.length - 1; i++) totalDistance += calculateDistance(path[i], path[i+1]);
                return { ...e, movingState: { path, progress: 0, totalDistance, targetWaypointIndex: 1, distanceTraveled: 0 }, movementTrail: [e.currentPosition || e.position] };
            }
            return e;
        });
        return { ...state, placedEntities: newPlaced, plottingWaypointsFor: state.plottingWaypointsFor === action.payload ? null : state.plottingWaypointsFor };
    }

    case 'STOP_MOVEMENT': {
        const newPlaced = state.placedEntities.map(e => {
            if (e.instanceId === action.payload && e.movingState) {
                return { ...e, position: e.currentPosition || e.position, movingState: null };
            }
            return e;
        });
        return { ...state, placedEntities: newPlaced };
    }

    case 'START_TARGETING':
        return { ...state, targetingState: action.payload, movingEntityId: null, linkingState: null, plottingWaypointsFor: null, placingEntityId: null };
    
    case 'LAUNCH_WEAPON': {
        if (!state.targetingState) return state;
        const launcher = state.placedEntities.find(e => e.instanceId === state.targetingState!.launcherId);
        if (!launcher) return state;

        const { weapon } = state.targetingState;
        const ammoState = launcher.systemsState?.weapons?.[weapon.id];
        if (!ammoState || ammoState.currentQuantity <= 0) return { ...state, targetingState: null };

        const startPosition = launcher.currentPosition || launcher.position;
        const now = Date.now();
        let newProjectiles = state.projectiles;
        let newEffects = state.effects;

        if (weapon.type === 'Gun') {
            newEffects = [...state.effects,
                { id: `tracer-${now}`, type: 'tracer', startTime: now, startPosition, endPosition: action.payload.targetPosition },
                { id: `impact-${now}`, type: 'impact', startTime: now, position: action.payload.targetPosition }
            ];
        } else {
            const totalDist = calculateDistance(startPosition, action.payload.targetPosition);
            const maxRangeKm = convertSystemUnitToKm(weapon.range) || 0;
            const willHit = totalDist <= maxRangeKm;

            const newProjectile: Projectile = {
                id: `proj-${now}`, weapon, launcherId: launcher.instanceId, targetId: action.payload.targetId,
                startPosition, targetPosition: action.payload.targetPosition, currentPosition: startPosition,
                startTime: now, rotation: 0, willHit, trail: [startPosition],
            };
            newProjectiles = [...state.projectiles, newProjectile];
        }

        const newPlaced = state.placedEntities.map(e => {
            if (e.instanceId === launcher.instanceId) {
                const newSystemsState = JSON.parse(JSON.stringify(e.systemsState));
                if (newSystemsState.weapons && newSystemsState.weapons[weapon.id]) {
                    newSystemsState.weapons[weapon.id].currentQuantity -= 1;
                }
                return { ...e, systemsState: newSystemsState };
            }
            return e;
        });

        return { ...state, projectiles: newProjectiles, effects: newEffects, placedEntities: newPlaced, targetingState: null };
    }
    
    case 'TICK': {
        const { scaledDeltaTime } = action.payload;
        const now = Date.now();
        
        const originalEntityMap = new Map(state.placedEntities.map(e => [e.instanceId, e]));
        const { stillFlying, newEffects } = tickProjectiles(state.projectiles, originalEntityMap, scaledDeltaTime);

        const movedEntities = tickMovement(state.placedEntities, scaledDeltaTime);
        const movedEntityMap = new Map(movedEntities.map(e => [e.instanceId, e]));

        const finalEntities = movedEntities.map(entity => {
            if (!entity.linkedTo) {
                return { ...entity, isConnected: false };
            }

            const provider = movedEntityMap.get(entity.linkedTo.providerId);
            
            // Unlink if provider or its datalink is gone.
            const datalink = provider?.datalinks?.find(d => d.id === entity.linkedTo!.datalinkId);
            if (!provider || !datalink) {
                const newEntity = { ...entity };
                delete newEntity.linkedTo;
                newEntity.isConnected = false;
                return newEntity;
            }

            const connected = isEntityConnected(entity, provider, state.disabledSystemIds);
            return { ...entity, isConnected: connected };
        });

        const updatedEffects = [...state.effects, ...newEffects].filter(e => now - e.startTime < 2000);

        return { ...state, projectiles: stillFlying, effects: updatedEffects, placedEntities: finalEntities };
    }

    case 'IMPORT_SCENARIO': {
        const { libraryEntities, placedEntities, groups } = action.payload;

        const sanitizedPlacedEntities: PlacedEntity[] = [];
        if (Array.isArray(placedEntities)) {
            for (const e of placedEntities) {
                const position = isValidCoord(e.position) ? e.position : null;
                if (!position) {
                    console.warn("Skipping imported entity with invalid position:", e);
                    continue;
                }
                const currentPosition = isValidCoord(e.currentPosition) ? e.currentPosition : position;
                
                const weaponsState = (e.weapons || []).reduce((acc, weapon) => {
                    const importedAmmo = e.systemsState?.weapons?.[weapon.id]?.currentQuantity;
                    const maxAmmo = weapon.maxQuantity ?? 0;
                    const currentQuantity = typeof importedAmmo === 'number' ? Math.min(importedAmmo, maxAmmo) : maxAmmo;
                    acc[weapon.id] = { currentQuantity };
                    return acc;
                }, {} as PlacedEntity['systemsState']['weapons']);

                sanitizedPlacedEntities.push({
                    ...e,
                    position,
                    currentPosition,
                    waypoints: Array.isArray(e.waypoints) ? e.waypoints.filter(isValidCoord) : [],
                    movementTrail: Array.isArray(e.movementTrail) ? e.movementTrail.filter(isValidCoord) : [],
                    movingState: e.movingState && Array.isArray(e.movingState.path) && e.movingState.path.every(isValidCoord) ? e.movingState : null,
                    systemsState: { weapons: weaponsState },
                });
            }
        }

        return {
            ...initialState,
            libraryEntities: libraryEntities || [],
            placedEntities: sanitizedPlacedEntities,
            groups: groups || {},
            libraryInitialized: true
        };
    }

    case 'CREATE_GROUP': {
        const newGroupId = `grp-${Date.now()}`;
        const newGroup: Group = { id: newGroupId, entityIds: action.payload };
        const newGroups = {...state.groups, [newGroupId]: newGroup };
        const newPlaced = state.placedEntities.map(e => action.payload.includes(e.instanceId) ? {...e, groupId: newGroupId} : e);
        return { ...state, groups: newGroups, placedEntities: newPlaced, multiSelectedIds: [], selectedEntityId: null };
    }

    case 'UNGROUP': {
        const groupId = action.payload;
        const newPlaced = state.placedEntities.map(e => e.groupId === groupId ? {...e, groupId: undefined} : e);
        const newGroups = {...state.groups};
        delete newGroups[groupId];
        return { ...state, placedEntities: newPlaced, groups: newGroups, selectedEntityId: null, multiSelectedIds: [] };
    }
    
    case 'START_ANALYSIS':
        return { ...state, isAnalysisLoading: true, isAnalysisOverlayVisible: true, analysisStatusMessage: '' };

    case 'FINISH_ANALYSIS': {
      const { threads, placedEntities } = action.payload;
      let statusMessage = state.analysisStatusMessage;
      if (threads.length === 0) {
        const hasBlue = placedEntities.some(e => e.force === Force.BLUE);
        const hasRed = placedEntities.some(e => e.force === Force.RED);
        if (!hasBlue || !hasRed) statusMessage = "Analysis requires at least one RED and one BLUE force on the map.";
        else statusMessage = "No valid mission threads found between forces.";
      }
      return { ...state, missionThreads: threads, isAnalysisLoading: false, analysisStatusMessage: statusMessage };
    }
    
    case 'ANALYSIS_ERROR':
        return { ...state, isAnalysisLoading: false, missionThreads: [], analysisStatusMessage: action.payload.message };

    case 'CLOSE_ANALYSIS':
        return { ...state, isAnalysisOverlayVisible: false, missionThreads: [], missionHighlightedEntityId: null, analysisStatusMessage: '' };

    case 'SET_MISSION_HIGHLIGHT':
        return { ...state, missionHighlightedEntityId: action.payload };
        
    case 'TOGGLE_SYSTEM_DISABLED': {
        const newSet = new Set(state.disabledSystemIds);
        if (newSet.has(action.payload)) newSet.delete(action.payload);
        else newSet.add(action.payload);
        return { ...state, disabledSystemIds: newSet };
    }

    case 'OPEN_CREATOR_MODAL':
      return { ...state, creatorModal: { isOpen: true, editingEntity: action.payload } };

    case 'CLOSE_CREATOR_MODAL':
      return { ...state, creatorModal: { isOpen: false, editingEntity: null } };
      
    case 'SHOW_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };

    case 'HIDE_CONTEXT_MENU':
      return { ...state, contextMenu: null };

    default:
      return state;
  }
};
