import React, { useState, useRef, useMemo, useContext } from 'react';
import type { MissionThread, SystemInvolvement } from '../types';
import { EntityIcon } from './EntityIcon';
import { Force } from '../types';
import { CriticalIcon, DisableIcon } from './icons';
import { AppContext } from '../state/appState';

// --- SUB-COMPONENTS ---
const ContextMenu: React.FC<{ x: number, y: number, system: SystemInvolvement, isDisabled: boolean, onToggle: () => void, onClose: () => void }> =
({ x, y, system, isDisabled, onToggle, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} style={{ top: y, left: x }} className="absolute z-50 w-48 bg-white/90 backdrop-blur-md rounded-lg shadow-2xl p-1.5 animate-fade-in">
            <button onClick={onToggle} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:text-white hover:bg-rose-500 transition-colors">
                <DisableIcon className="w-5 h-5 flex-shrink-0" />
                <span>{isDisabled ? "Enable System" : "Disable System"}</span>
            </button>
        </div>
    );
};

const SystemNode: React.FC<{ system: SystemInvolvement; setContextMenu: (menu: { x: number; y: number; systemId: string; } | null) => void; }> = ({ system, setContextMenu }) => {
    const { state, dispatch } = useContext(AppContext);
    const isDisabled = state.disabledSystemIds.has(system.systemId);

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, systemId: system.systemId });
    };
    
    const baseClasses = "flex items-center space-x-2 p-1.5 rounded-md transition-all duration-200 cursor-default relative text-left w-full";
    const disabledClasses = "bg-slate-200/50 opacity-50";
    const enabledClasses = "bg-slate-100 hover:bg-slate-200";
    const criticalClasses = system.isCritical ? "animate-pulse-critical shadow-amber-400/50" : "shadow-sm";

    return (
        <button
            className={`${baseClasses} ${isDisabled ? disabledClasses : enabledClasses} ${criticalClasses}`}
            onMouseEnter={() => dispatch({ type: 'SET_MISSION_HIGHLIGHT', payload: system.entityId })}
            onMouseLeave={() => dispatch({ type: 'SET_MISSION_HIGHLIGHT', payload: null })}
            onContextMenu={handleRightClick}
        >
            {system.isCritical && !isDisabled && (
                <div title="This system is a single point of failure for this step." className="absolute -top-1.5 -left-1.5 text-amber-400 bg-white rounded-full p-0.5 shadow">
                    <CriticalIcon className="w-4 h-4" />
                </div>
            )}
            <EntityIcon force={Force.BLUE} iconId={system.entityIcon} className="w-5 h-5 flex-shrink-0" />
            <div className="flex-grow truncate"><p className="text-xs font-bold text-slate-700 truncate">{system.systemName}</p></div>
        </button>
    );
};

const Lifeline: React.FC<{ entity: {id: string, name: string, icon: string, force: Force} }> = ({ entity }) => {
    const { dispatch } = useContext(AppContext);
    return (
        <div className="flex-shrink-0 w-48 text-center" onMouseEnter={() => dispatch({ type: 'SET_MISSION_HIGHLIGHT', payload: entity.id })} onMouseLeave={() => dispatch({ type: 'SET_MISSION_HIGHLIGHT', payload: null })}>
            <div className="p-2 rounded-lg border-2 bg-white shadow-lg mx-auto" style={{ borderColor: entity.force === Force.RED ? '#f43f5e' : '#0ea5e9' }}>
                <div className="flex items-center space-x-2">
                    <EntityIcon force={entity.force} iconId={entity.icon} className="w-8 h-8 flex-shrink-0" />
                    <div className="truncate text-left">
                        <p className="text-sm font-bold text-slate-800 truncate">{entity.name}</p>
                        <p className="text-xs uppercase font-semibold" style={{ color: entity.force === Force.RED ? '#be123c' : '#0369a1' }}>{entity.force} Force</p>
                    </div>
                </div>
            </div>
            <div className="h-48 w-px bg-slate-300 mx-auto mt-2" />
        </div>
    );
};

const InteractionArrow: React.FC<{ step: MissionThread['steps'][0]; sourceIndex: number; targetIndex: number; }> = ({ step, sourceIndex, targetIndex }) => {
    const statusColors = { PENDING: { text: 'text-sky-600', stroke: 'stroke-sky-500' }, SUCCESS: { text: 'text-emerald-600', stroke: 'stroke-emerald-500' }, FAIL: { text: 'text-rose-600', stroke: 'stroke-rose-500' }, UNAVAILABLE: { text: 'text-slate-400', stroke: 'stroke-slate-400' } };
    const colors = statusColors[step.status] || statusColors.UNAVAILABLE;
    const LIFELINE_WIDTH = 192, GAP_WIDTH = 32;
    const startX = sourceIndex * (LIFELINE_WIDTH + GAP_WIDTH) + (LIFELINE_WIDTH / 2);
    const endX = targetIndex * (LIFELINE_WIDTH + GAP_WIDTH) + (LIFELINE_WIDTH / 2);
    const width = Math.abs(endX - startX);
    const markerId = `arrowhead-${step.type}`;

    return (
        <div className="absolute h-full" style={{ left: Math.min(startX, endX), width }}>
            <svg width={width} height="100%" className="overflow-visible">
                <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className={`fill-current ${colors.text}`} /></marker></defs>
                <line x1={sourceIndex > targetIndex ? width : 0} y1={40} x2={sourceIndex > targetIndex ? 0 : width} y2={40} className={colors.stroke} strokeWidth="2" strokeDasharray={step.status === 'FAIL' || step.status === 'UNAVAILABLE' ? '4 8' : 'none'} markerEnd={`url(#${markerId})`} />
            </svg>
            <div className="absolute text-center" style={{ width, top: '0px', left: 0 }}>
                <div className="inline-block px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-sm">
                    <p className={`text-sm font-bold ${colors.text}`}>{step.type}</p>
                    {step.estimatedTimeSeconds && <p className="text-xs text-slate-500">~{step.estimatedTimeSeconds.toFixed(1)}s</p>}
                </div>
            </div>
        </div>
    );
};


const ThreadSequenceDiagram: React.FC<{ thread: MissionThread }> = ({ thread }) => {
    const { state, dispatch } = useContext(AppContext);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; systemId: string; } | null>(null);

    const contextMenuSystem = useMemo(() => {
        if (!contextMenu) return null;
        for (const step of thread.steps) {
            const system = step.systems.find(s => s.systemId === contextMenu.systemId);
            if (system) {
                return {
                    system,
                    isDisabled: state.disabledSystemIds.has(system.systemId)
                };
            }
        }
        return null;
    }, [contextMenu, thread.steps, state.disabledSystemIds]);

    const involvedEntities = useMemo(() => {
        const entities = new Map<string, { id: string, name: string, icon: string, force: Force }>();
        entities.set(thread.threatId, { id: thread.threatId, name: thread.threatName, icon: thread.threatIcon, force: Force.RED });
        thread.steps.forEach(step => step.systems.forEach(sys => {
            if (!entities.has(sys.entityId)) {
                entities.set(sys.entityId, { id: sys.entityId, name: sys.entityName, icon: sys.entityIcon, force: Force.BLUE });
            }
        }));
        return Array.from(entities.values());
    }, [thread]);

    const getLifelineIndex = (entityId: string) => involvedEntities.findIndex(e => e.id === entityId);

    return (
        <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-slate-200/50 shadow-2xl relative">
            {contextMenu && contextMenuSystem && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    system={contextMenuSystem.system}
                    isDisabled={contextMenuSystem.isDisabled}
                    onToggle={() => {
                        dispatch({ type: 'TOGGLE_SYSTEM_DISABLED', payload: contextMenu.systemId });
                        setContextMenu(null);
                    }}
                    onClose={() => setContextMenu(null)}
                />
            )}
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">Mission: <span className="ml-2 text-sky-600">{thread.name}</span></h3>
            
            <div className="flex items-start space-x-8 relative" style={{ height: '300px' }}>
                {involvedEntities.map(entity => <Lifeline key={entity.id} entity={entity} />)}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {thread.steps.map(step => {
                        const sourceEntityIds = new Set(step.systems.map(s => s.entityId));
                        return Array.from(sourceEntityIds).map(sourceId => {
                            const sourceIndex = getLifelineIndex(sourceId);
                            const targetIndex = getLifelineIndex(thread.threatId);
                            if (sourceIndex === -1 || targetIndex === -1) return null;

                            return (
                                <React.Fragment key={`${step.type}-${sourceId}`}>
                                    <InteractionArrow step={step} sourceIndex={sourceIndex} targetIndex={targetIndex} />
                                    <div className="absolute pointer-events-auto" style={{ top: '60px', left: `${sourceIndex * (192 + 32)}px`, width: '192px' }}>
                                        <div className="space-y-1.5 p-2 bg-white/50 rounded-lg">
                                            {step.systems.filter(s => s.entityId === sourceId).map(system => (
                                                <SystemNode key={system.systemId} system={system} setContextMenu={setContextMenu} />
                                            ))}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        });
                    })}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-end items-center space-x-6 text-sm">
                <div className="text-right"><p className="font-bold text-slate-800">{((thread.steps.find(s=>s.type==='ENGAGE')?.probabilityOfSuccess ?? 0) * 100).toFixed(0)}%</p><p className="text-xs text-slate-500">Success Probability</p></div>
                <div className="text-right"><p className="font-bold text-slate-800">{(thread.steps.find(s=>s.type==='ENGAGE')?.estimatedTimeSeconds ?? 0).toFixed(1)}s</p><p className="text-xs text-slate-500">Time to Engage</p></div>
                <div className="text-right"><p className="font-bold text-slate-800">{thread.steps.find(s=>s.type==='ENGAGE')?.resourcesExpended?.length || 0}</p><p className="text-xs text-slate-500">Resources Used</p></div>
            </div>
        </div>
    );
};


export const MissionAnalysisOverlay: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { missionThreads: threads, isAnalysisLoading: isLoading, analysisStatusMessage } = state;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex flex-col items-center p-8 animate-fade-in overflow-x-auto" onMouseDown={(e) => { if(e.target === e.currentTarget) dispatch({ type: 'CLOSE_ANALYSIS' }) }}>
             <div className="w-full min-w-max my-auto">
                <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-white shadow-lg">Mission Engineering Analysis</h2>
                    <button onClick={() => dispatch({ type: 'CLOSE_ANALYSIS' })} className="p-2 rounded-full text-slate-300 bg-white/10 hover:bg-white/20 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                 <div className="space-y-6">
                    {isLoading && <p className="text-slate-300 animate-pulse-slow text-center text-lg">Analyzing scenario...</p>}
                    
                    {!isLoading && threads.length === 0 && (
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 mt-10 text-center border border-slate-700 max-w-2xl mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.007H12v-.007z" />
                          </svg>
                          <h3 className="mt-4 text-xl font-bold text-white">Analysis Complete</h3>
                          <p className="mt-2 text-md text-slate-300 max-w-2xl mx-auto">{analysisStatusMessage}</p>
                      </div>
                    )}

                    {!isLoading && threads.map(thread => <ThreadSequenceDiagram key={thread.id} thread={thread} />)}
                 </div>
             </div>
        </div>
    );
};