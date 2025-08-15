
import React, { useState, useCallback, useRef, useEffect, useReducer } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/Map';
import { ResizeHandle } from './components/ResizeHandle';
import { ContextMenu } from './components/ContextMenu';
import type { LibraryEntity, MissionThread } from './types';
import { TimeControls } from './components/TimeControls';
import { MissionAnalysisOverlay } from './components/MissionAnalysisOverlay';
import { AppContext, initialState } from './state/appState';
import { appReducer } from './state/appReducer';
import { EntityCreatorModal } from './components/EntityCreatorModal';

const MIN_SIDEBAR_WIDTH = 320; // px
const MAX_SIDEBAR_WIDTH = 800; // px
const COLLAPSED_SIDEBAR_WIDTH = 64; // px
const LOCAL_STORAGE_KEY = 'opscanvas-library';

const App: React.FC = () => {
  // --- Centralized State ---
  const [state, dispatch] = useReducer(appReducer, initialState);

  // --- Local UI State ---
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const savedSidebarWidth = useRef(sidebarWidth);
  const isResizingRef = useRef(false);
  
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LibraryEntity | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; instanceId: string; } | null>(null);

  const [timeMultiplier, setTimeMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(true);
  const animationFrameId = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(Date.now());
  
  const mapRef = useRef<{ centerOn: (coords: [number, number]) => void }>(null);

  // --- Mission Analysis Worker ---
  const [missionAnalysisWorker, setMissionAnalysisWorker] = useState<Worker | null>(null);

  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('./services/missionAnalysis.worker.ts', import.meta.url), { type: 'module' });
      setMissionAnalysisWorker(worker);
    } catch (error) {
      console.error('Failed to create mission analysis worker:', error);
      dispatch({ type: 'ANALYSIS_ERROR', payload: { message: `Could not initialize analysis engine: ${(error as Error).message}` } });
    }
    return () => {
      worker?.terminate();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!missionAnalysisWorker) return;

    missionAnalysisWorker.onmessage = (event: MessageEvent<MissionThread[] | { error: string }>) => {
      const data = event.data;
      if (data && typeof data === 'object' && 'error' in data) {
        dispatch({ type: 'ANALYSIS_ERROR', payload: { message: `Worker error: ${data.error}` } });
      } else {
        dispatch({ type: 'FINISH_ANALYSIS', payload: { threads: data as MissionThread[], placedEntities: state.placedEntities } });
      }
    };
    missionAnalysisWorker.onerror = (error) => dispatch({ type: 'ANALYSIS_ERROR', payload: { message: `Worker failed: ${error.message}` } });
    
  }, [missionAnalysisWorker, state.placedEntities, dispatch]);

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

  // --- Re-run analysis automatically if it's already visible and a system is disabled/enabled
  useEffect(() => {
    if (state.isAnalysisOverlayVisible && missionAnalysisWorker) {
      dispatch({ type: 'START_ANALYSIS' });
      missionAnalysisWorker.postMessage({
        entities: state.placedEntities,
        disabledSystemIds: state.disabledSystemIds
      });
    }
  }, [state.disabledSystemIds, state.isAnalysisOverlayVisible, state.placedEntities, missionAnalysisWorker, dispatch]);


  // --- Time & Animation Loop ---
  const handleTogglePause = useCallback(() => setIsPaused(p => !p), []);
  const handleSetMultiplier = useCallback((speed: number) => {
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
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current) };
  }, [isPaused, timeMultiplier, dispatch]);
  
  
  // --- Global Event Listeners & Sidebar resizing ---
  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prevCollapsed => {
        const isNowCollapsing = !prevCollapsed;
        setSidebarWidth(isNowCollapsing ? COLLAPSED_SIDEBAR_WIDTH : savedSidebarWidth.current);
        return isNowCollapsing;
    });
  }, []);

  useEffect(() => {
      if ((state.selectedEntityId || state.multiSelectedIds.length > 0) && isSidebarCollapsed) {
          toggleSidebarCollapse();
      }
  }, [state.selectedEntityId, state.multiSelectedIds, isSidebarCollapsed, toggleSidebarCollapse]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isSidebarCollapsed) return;
    e.preventDefault();
    isResizingRef.current = true;
  }, [isSidebarCollapsed]);

  const handleMouseUp = useCallback(() => { isResizingRef.current = false; }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || isSidebarCollapsed) return;
    e.preventDefault();
    let newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(e.clientX, MAX_SIDEBAR_WIDTH));
    setSidebarWidth(newWidth);
    savedSidebarWidth.current = newWidth;
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => { if (isResizingRef.current) handleMouseMove(e); }
    const handleGlobalClick = () => { if (contextMenu) setContextMenu(null); }
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
     const handleKey = (e: KeyboardEvent) => {
        if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleTogglePause();
        }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('keydown', handleKey);
    };
  }, [handleMouseMove, handleMouseUp, contextMenu, state, handleTogglePause, isCreatorModalOpen]);


  const mainClasses = [
      'flex h-screen font-sans text-slate-800 bg-slate-100 overflow-hidden',
      (isResizingRef.current && !isSidebarCollapsed) ? 'cursor-col-resize select-none' : '',
      state.movingEntityId || state.targetingState ? 'cursor-crosshair' : '',
      state.placingEntityId ? 'cursor-copy' : ''
  ].join(' ');

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className={mainClasses}>
        <Sidebar
          width={sidebarWidth}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onNewEntity={handleNewEntity}
          onEditEntity={handleEditEntity}
        />
        {!isSidebarCollapsed && <ResizeHandle onMouseDown={handleMouseDown} />}
        <main className="flex-1 h-full min-w-0 relative">
          <MapComponent
            ref={mapRef}
            missionAnalysisWorker={missionAnalysisWorker}
            onEntityRightClick={handleEntityRightClick}
          />
          {state.isAnalysisOverlayVisible && <MissionAnalysisOverlay />}
          <TimeControls
            isPaused={isPaused}
            timeMultiplier={timeMultiplier}
            onTogglePause={handleTogglePause}
            onSetMultiplier={handleSetMultiplier}
          />
        </main>
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
                        if(entity) mapRef.current?.centerOn(entity.currentPosition || entity.position);
                    },
                    onDuplicate: () => dispatch({ type: 'DUPLICATE_ENTITY', payload: contextMenu.instanceId }),
                    onViewDetails: () => dispatch({ type: 'SELECT_ENTITY', payload: { instanceId: contextMenu.instanceId, isShift: false } }),
                    onDelete: () => dispatch({ type: 'REMOVE_ENTITY_FROM_MAP', payload: contextMenu.instanceId }),
                }}
            />
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
