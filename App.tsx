
import React, { useState, useRef, useEffect, useReducer } from 'react';
import { MapComponent } from './components/Map';
import { ContextMenu } from './components/ContextMenu';
import type { LibraryEntity } from './types';
import { TimeControls } from './components/TimeControls';
import { MissionAnalysisOverlay } from './components/MissionAnalysisOverlay';
import { AppContext, initialState } from './state/appState';
import { appReducer } from './state/appReducer';
import { EntityCreatorModal } from './components/EntityCreatorModal';
import { SidebarLayout } from './components/SidebarLayout';
import { useMissionAnalysisWorker } from './hooks/useMissionAnalysisWorker';

const LOCAL_STORAGE_KEY = 'opscanvas-library';

const App: React.FC = () => {
  // --- Centralized State ---
  const [state, dispatch] = useReducer(appReducer, initialState);

  // --- Local UI State ---
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LibraryEntity | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; instanceId: string; } | null>(null);
  const mapRef = useRef<{ centerOn: (coords: [number, number]) => void }>(null);

  // --- Mission Analysis Worker ---
  const { missionAnalysisWorker, workerInitFailed } = useMissionAnalysisWorker(state, dispatch);

  // --- PERSISTENCE ---
  useEffect(() => {
    try {
      const storedLibrary = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedLibrary) {
        dispatch({ type: 'INITIALIZE_LIBRARY', payload: JSON.parse(storedLibrary) });
      } else {
        dispatch({ type: 'INITIALIZE_LIBRARY', payload: [] });
      }
    } catch (error) { console.error("Failed to load library", error); }
  }, []);

  useEffect(() => {
    if (state.libraryInitialized) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.libraryEntities));
    }
  }, [state.libraryEntities, state.libraryInitialized]);
  
  // --- UI Handlers ---
  const handleNewEntity = () => {
    setEditingEntity(null);
    setIsCreatorModalOpen(true);
  };

  const handleEditEntity = (entity: LibraryEntity) => {
    setEditingEntity(entity);
    setIsCreatorModalOpen(true);
  };
  
  const handleSaveEntity = (entityData: Omit<LibraryEntity, 'id'> | LibraryEntity) => {
    dispatch({ type: 'SAVE_LIBRARY_ENTITY', payload: entityData });
    setIsCreatorModalOpen(false);
  };

  const handleEntityRightClick = (instanceId: string, position: {x: number, y: number}) => {
    setContextMenu({ ...position, instanceId });
  };
  useEffect(() => {
    const handleGlobalClick = () => { if (contextMenu) setContextMenu(null); };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (contextMenu) setContextMenu(null);
        if (state.movingEntityId || state.linkingState || state.plottingWaypointsFor || state.targetingState || state.placingEntityId) {
          dispatch({ type: 'CANCEL_INTERACTION' });
        }
        if (state.multiSelectedIds.length > 0 || state.selectedEntityId) dispatch({ type: 'CLEAR_SELECTION' });
        if (state.isAnalysisOverlayVisible) dispatch({ type: 'CLOSE_ANALYSIS' });
        if (isCreatorModalOpen) setIsCreatorModalOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu, state, dispatch, isCreatorModalOpen]);

  const cursorClasses = [
    state.movingEntityId || state.targetingState ? 'cursor-crosshair' : '',
    state.placingEntityId ? 'cursor-copy' : ''
  ].join(' ');

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <SidebarLayout
        onNewEntity={handleNewEntity}
        onEditEntity={handleEditEntity}
        className={cursorClasses}
      >
        {workerInitFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-800 z-10">
            Analysis engine unavailable.
          </div>
        )}
        <MapComponent
          ref={mapRef}
          missionAnalysisWorker={missionAnalysisWorker}
          onEntityRightClick={handleEntityRightClick}
        />
        {state.isAnalysisOverlayVisible && <MissionAnalysisOverlay />}
        <TimeControls />
      </SidebarLayout>
      {isCreatorModalOpen && (
        <EntityCreatorModal
          isOpen={isCreatorModalOpen}
          onClose={() => setIsCreatorModalOpen(false)}
          onSave={handleSaveEntity}
          entity={editingEntity}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          actions={{
            onMove: () => dispatch({ type: 'START_MOVING_ENTITY', payload: contextMenu.instanceId }),
            onPlotWaypoints: () => dispatch({ type: 'START_PLOTTING_WAYPOINTS', payload: contextMenu.instanceId }),
            onCenter: () => {
              const entity = state.placedEntities.find(e => e.instanceId === contextMenu.instanceId);
              if (entity) mapRef.current?.centerOn(entity.currentPosition || entity.position);
            },
            onDuplicate: () => dispatch({ type: 'DUPLICATE_ENTITY', payload: contextMenu.instanceId }),
            onViewDetails: () => dispatch({ type: 'SELECT_ENTITY', payload: { instanceId: contextMenu.instanceId, isShift: false } }),
            onDelete: () => dispatch({ type: 'REMOVE_ENTITY_FROM_MAP', payload: contextMenu.instanceId }),
          }}
        />
      )}
    </AppContext.Provider>
  );
};

export default App;
