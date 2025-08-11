
import React from 'react';
import type { LibraryEntity, PlacedEntity, Group, TargetingState, Projectile, Effect, MissionThread, Weapon } from '../types';

export interface AppState {
    libraryInitialized: boolean;
    libraryEntities: LibraryEntity[];
    placedEntities: PlacedEntity[];
    selectedEntityId: string | null;
    multiSelectedIds: string[];
    groups: Record<string, Group>;

    movingEntityId: string | null;
    placingEntityId: string | null; // ID of the library entity selected for placement
    linkingState: { providerId: string; datalinkId: string } | null;
    plottingWaypointsFor: string | null;
    targetingState: TargetingState | null;

    projectiles: Projectile[];
    effects: Effect[];

    missionThreads: MissionThread[];
    isAnalysisLoading: boolean;
    isAnalysisOverlayVisible: boolean;
    missionHighlightedEntityId: string | null;
    disabledSystemIds: Set<string>;
    analysisStatusMessage: string;

    // --- New Centralized UI State ---
    creatorModal: {
      isOpen: boolean;
      editingEntity: LibraryEntity | null;
    };
    contextMenu: {
      x: number;
      y: number;
      instanceId: string;
    } | null;
}

export const initialState: AppState = {
    libraryInitialized: false,
    libraryEntities: [],
    placedEntities: [],
    selectedEntityId: null,
    multiSelectedIds: [],
    groups: {},
    movingEntityId: null,
    placingEntityId: null,
    linkingState: null,
    plottingWaypointsFor: null,
    targetingState: null,
    projectiles: [],
    effects: [],
    missionThreads: [],
    isAnalysisLoading: false,
    isAnalysisOverlayVisible: false,
    missionHighlightedEntityId: null,
    disabledSystemIds: new Set(),
    analysisStatusMessage: '',
    creatorModal: {
      isOpen: false,
      editingEntity: null,
    },
    contextMenu: null,
};

// Discriminated union for all possible actions
export type AppAction =
  | { type: 'INITIALIZE_LIBRARY'; payload: LibraryEntity[] }
  | { type: 'SAVE_LIBRARY_ENTITY'; payload: Omit<LibraryEntity, 'id'> | LibraryEntity }
  | { type: 'START_MOVING_ENTITY'; payload: string }
  | { type: 'SET_PLACING_ENTITY'; payload: string | null }
  | { type: 'ADD_ENTITY_TO_MAP'; payload: { entity: LibraryEntity; position: [number, number] } }
  | { type: 'MOVE_ENTITY_ON_MAP'; payload: { position: [number, number] } }
  | { type: 'REMOVE_ENTITY_FROM_MAP'; payload: string }
  | { type: 'DUPLICATE_ENTITY'; payload: string }
  | { type: 'SELECT_ENTITY'; payload: { instanceId: string | null; isShift: boolean } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'START_LINKING'; payload: { providerId: string; datalinkId: string } }
  | { type: 'FINISH_LINKING'; payload: string }
  | { type: 'UNLINK_ENTITY'; payload: string }
  | { type: 'CANCEL_INTERACTION' }
  | { type: 'START_PLOTTING_WAYPOINTS'; payload: string }
  | { type: 'ADD_WAYPOINT'; payload: [number, number] }
  | { type: 'CLEAR_WAYPOINTS'; payload: string }
  | { type: 'EXECUTE_PATH'; payload: string }
  | { type: 'STOP_MOVEMENT'; payload: string }
  | { type: 'START_TARGETING'; payload: { launcherId: string; weapon: Weapon } }
  | { type: 'LAUNCH_WEAPON'; payload: { targetPosition: [number, number]; targetId?: string } }
  | { type: 'TICK'; payload: { scaledDeltaTime: number } }
  | { type: 'IMPORT_SCENARIO'; payload: { libraryEntities: LibraryEntity[]; placedEntities: PlacedEntity[]; groups: Record<string, Group> } }
  | { type: 'CREATE_GROUP'; payload: string[] }
  | { type: 'UNGROUP'; payload: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'FINISH_ANALYSIS'; payload: { threads: MissionThread[], placedEntities: PlacedEntity[] } }
  | { type: 'ANALYSIS_ERROR'; payload: { message: string } }
  | { type: 'CLOSE_ANALYSIS' }
  | { type: 'SET_MISSION_HIGHLIGHT'; payload: string | null }
  | { type: 'TOGGLE_SYSTEM_DISABLED'; payload: string }
  // --- New UI Actions ---
  | { type: 'OPEN_CREATOR_MODAL'; payload: LibraryEntity | null }
  | { type: 'CLOSE_CREATOR_MODAL' }
  | { type: 'SHOW_CONTEXT_MENU'; payload: { x: number; y: number; instanceId: string } }
  | { type: 'HIDE_CONTEXT_MENU' };


export const AppContext = React.createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});
