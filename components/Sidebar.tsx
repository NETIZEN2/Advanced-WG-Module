
import React, { useRef, useContext, useEffect } from 'react';
import { EntityLibrary } from './EntityLibrary';
import { SelectedEntityDetails } from './SelectedEntityDetails';
import { AppContext } from '../state/appState';
import { EntityIcon } from './EntityIcon';
import type { LibraryEntity } from '../types';

interface SidebarProps {
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewEntity: () => void;
  onEditEntity: (entity: LibraryEntity) => void;
}

const Logo: React.FC = () => (
  <div className="flex items-center space-x-3 flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0-6V7m0 6h6m-6 0L3 10m6 6l6-3m6 3l-6-3m0 0V7l5.447-2.724A1 1 0 0121 5.618v10.764a1 1 0 01-.553.894L15 20m0-6h-6" />
    </svg>
    <h1 className="text-xl font-bold tracking-wider text-slate-800">OpsCanvas</h1>
  </div>
);

const MainControls: React.FC<{ onNewEntity: () => void; }> = ({ onNewEntity }) => {
    const { dispatch } = useContext(AppContext);
    const importRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const stateToExport = (window as any).__OPCANVAS_APP_STATE__;
        if (!stateToExport) {
            alert("Could not find application state to export.");
            return;
        }
        const scenario = {
            libraryEntities: stateToExport.libraryEntities,
            placedEntities: stateToExport.placedEntities,
            groups: stateToExport.groups
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `opscanvas_scenario_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not a string");
                const scenario = JSON.parse(text);
                if (scenario.libraryEntities && scenario.placedEntities) {
                    dispatch({ type: 'IMPORT_SCENARIO', payload: {
                        libraryEntities: scenario.libraryEntities,
                        placedEntities: scenario.placedEntities,
                        groups: scenario.groups || {}
                    }});
                } else {
                    alert("Invalid scenario file format.");
                }
            } catch (err) {
                console.error("Failed to import scenario:", err);
                alert("Error importing scenario file. Please check console.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="p-4 border-b border-slate-200 space-y-3">
             <button onClick={onNewEntity} className="w-full text-sm flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-md font-semibold hover:bg-sky-600 transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                <span>Create New Entity</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
                <input type="file" ref={importRef} onChange={handleImport} accept=".json" className="hidden" />
                <button onClick={() => importRef.current?.click()} className="w-full text-sm flex items-center justify-center space-x-2 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-medium hover:bg-slate-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span>Import</span>
                </button>
                <button onClick={handleExport} className="w-full text-sm flex items-center justify-center space-x-2 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-medium hover:bg-slate-300 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Export</span>
                </button>
            </div>
        </div>
    );
};

const MultiSelectPanel: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { multiSelectedIds, placedEntities } = state;
    const selectedEntities = placedEntities.filter(e => multiSelectedIds.includes(e.instanceId));
    
    return (
        <div className="flex-grow flex flex-col p-4 bg-slate-50 overflow-y-auto">
             <h2 className="text-lg font-semibold text-slate-600 mb-4 flex-shrink-0">{multiSelectedIds.length} Units Selected</h2>
             <div className="p-4 rounded-lg border border-slate-300 bg-slate-100 space-y-3">
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedEntities.map(e => (
                        <li key={e.instanceId} className="flex items-center space-x-2 p-2 bg-white rounded-md text-sm">
                           <EntityIcon force={e.force} iconId={e.icon} />
                           <span className="font-semibold text-slate-700">{e.name}</span>
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => dispatch({ type: 'CREATE_GROUP', payload: multiSelectedIds })}
                    className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-md font-semibold hover:bg-sky-600 disabled:bg-slate-300 transition-colors shadow-sm"
                >
                    <span>Group Units</span>
                </button>
             </div>
        </div>
    )
}

const ActiveContent: React.FC<{ onEditEntity: (entity: LibraryEntity) => void; }> = ({ onEditEntity }) => {
    const { state } = useContext(AppContext);
    
    if (state.multiSelectedIds.length > 1) {
        return <MultiSelectPanel />;
    }
    if (state.selectedEntityId) {
        return <SelectedEntityDetails />;
    }
    return <EntityLibrary onEditEntity={onEditEntity} />;
}

const CollapsedSidebarContent: React.FC<{
    onToggleCollapse: () => void;
    onNewEntity: () => void;
}> = ({ onToggleCollapse, onNewEntity }) => {
    const importRef = useRef<HTMLInputElement>(null);
    const { dispatch } = useContext(AppContext);

    const handleExport = () => {
        const stateToExport = (window as any).__OPCANVAS_APP_STATE__;
        if (!stateToExport) {
            alert("Could not find application state to export.");
            return;
        }
        const scenario = {
            libraryEntities: stateToExport.libraryEntities,
            placedEntities: stateToExport.placedEntities,
            groups: stateToExport.groups
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `opscanvas_scenario_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not a string");
                const scenario = JSON.parse(text);
                if (scenario.libraryEntities && scenario.placedEntities) {
                     dispatch({ type: 'IMPORT_SCENARIO', payload: {
                        libraryEntities: scenario.libraryEntities,
                        placedEntities: scenario.placedEntities,
                        groups: scenario.groups || {}
                    }});
                } else {
                    alert("Invalid scenario file format.");
                }
            } catch (err) {
                console.error("Failed to import scenario:", err);
                alert("Error importing scenario file. Please check console.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const Tooltip: React.FC<{text: string, children: React.ReactNode}> = ({text, children}) => (
        <div className="relative group flex justify-center">
            {children}
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none scale-90 group-hover:scale-100 origin-left z-20">
                {text}
            </div>
        </div>
    );
    const IconButton: React.FC<{onClick: () => void, label: string, children: React.ReactNode}> = ({onClick, label, children}) => (
        <Tooltip text={label}>
            <button
                onClick={onClick}
                aria-label={label}
                className="w-12 h-12 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-sky-500 transition-colors"
            >
                {children}
            </button>
        </Tooltip>
    );

    return (
        <div className="h-full flex flex-col items-center justify-between p-2 bg-white overflow-hidden">
            <div className="flex flex-col items-center space-y-2">
                <Tooltip text="OpsCanvas">
                    <div className="w-12 h-12 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0-6V7m0 6h6m-6 0L3 10m6 6l6-3m6 3l-6-3m0 0V7l5.447-2.724A1 1 0 0121 5.618v10.764a1 1 0 01-.553.894L15 20m0-6h-6" />
                        </svg>
                    </div>
                </Tooltip>
                
                <IconButton onClick={onToggleCollapse} label="Show Entity Library">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                    </svg>
                </IconButton>
                 <IconButton onClick={onNewEntity} label="Create New Entity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </IconButton>
                <input type="file" ref={importRef} onChange={handleImport} accept=".json" className="hidden" />
                <IconButton onClick={() => importRef.current?.click()} label="Import Scenario">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </IconButton>
                <IconButton onClick={handleExport} label="Export Scenario">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </IconButton>
            </div>
            <div className="pb-2">
                 <IconButton onClick={onToggleCollapse} label="Expand Sidebar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </IconButton>
            </div>
        </div>
    );
}

export const Sidebar: React.FC<SidebarProps> = ({ width, isCollapsed, onToggleCollapse, onNewEntity, onEditEntity }) => {
  const { state } = useContext(AppContext);
  
  // Expose state to window for export functionality
  useEffect(() => {
    (window as any).__OPCANVAS_APP_STATE__ = state;
  }, [state]);
  
  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-white border-r border-slate-200 flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out"
    >
      {isCollapsed ? (
          <CollapsedSidebarContent 
            onToggleCollapse={onToggleCollapse}
            onNewEntity={onNewEntity}
          />
      ) : (
        <>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                <Logo />
                <button
                    onClick={onToggleCollapse}
                    aria-label="Collapse Sidebar"
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-sky-500 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="flex-grow flex flex-col overflow-hidden bg-slate-50/50">
                <MainControls onNewEntity={onNewEntity} />
                <ActiveContent onEditEntity={onEditEntity} />
            </div>
        </>
      )}
    </aside>
  );
};
