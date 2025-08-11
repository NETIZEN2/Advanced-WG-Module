import { analyzeScenario } from './missionAnalysisService';
import type { PlacedEntity, MissionThread } from '../types';

// This is the entry point for our Web Worker.
// It listens for messages from the main application thread.
self.addEventListener('message', (event: MessageEvent<{ entities: PlacedEntity[], disabledSystemIds: Set<string> }>) => {
  try {
    const { entities, disabledSystemIds } = event.data;
    
    // Perform the heavy computation. This will not block the main UI thread.
    const results: MissionThread[] = analyzeScenario(entities, disabledSystemIds);
    
    // Send the results back to the main thread.
    self.postMessage(results);
  } catch (error) {
    console.error('Error in mission analysis worker:', error);
    // Optionally, post an error message back to the main thread
    self.postMessage({ error: (error as Error).message });
  }
});
