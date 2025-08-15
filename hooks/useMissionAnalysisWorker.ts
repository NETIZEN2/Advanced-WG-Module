import { useState, useEffect, useLayoutEffect } from 'react';
import type { AppState, AppAction } from '../state/appState';
import type { MissionThread } from '../types';

export const useMissionAnalysisWorker = (
  state: AppState,
  dispatch: React.Dispatch<AppAction>
) => {
  const [missionAnalysisWorker, setMissionAnalysisWorker] = useState<Worker | null>(null);
  const [workerInitFailed, setWorkerInitFailed] = useState(false);

  useLayoutEffect(() => {
    let worker: Worker | null = null;
    try {
      const WorkerCtor = (globalThis as any).Worker;
      if (!WorkerCtor) {
        throw new Error('Web Workers are not supported');
      }
      worker = new WorkerCtor(new URL('../services/missionAnalysis.worker.ts', import.meta.url), { type: 'module' });
      setMissionAnalysisWorker(worker);
    } catch (error) {
      console.error('Failed to create mission analysis worker:', error);
      dispatch({ type: 'ANALYSIS_ERROR', payload: { message: `Could not initialize analysis engine: ${(error as Error).message}` } });
      setWorkerInitFailed(true);
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
    missionAnalysisWorker.onerror = (error) => {
      dispatch({ type: 'ANALYSIS_ERROR', payload: { message: `Worker failed: ${error.message}` } });
      setWorkerInitFailed(true);
    };
  }, [missionAnalysisWorker, state.placedEntities, dispatch]);

  useEffect(() => {
    if (state.isAnalysisOverlayVisible && missionAnalysisWorker) {
      dispatch({ type: 'START_ANALYSIS' });
      missionAnalysisWorker.postMessage({
        entities: state.placedEntities,
        disabledSystemIds: state.disabledSystemIds,
      });
    }
  }, [state.disabledSystemIds, state.isAnalysisOverlayVisible, state.placedEntities, missionAnalysisWorker, dispatch]);

  return { missionAnalysisWorker, workerInitFailed };
};
