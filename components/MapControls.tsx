
import React from 'react';
import { MapLayersControl } from './MapLayersControl';
import { AnalysisIcon } from './icons';

interface MapControlsProps {
  mapLayers: any;
  setMapLayers: React.Dispatch<React.SetStateAction<any>>;
  onAnalyzeScenario: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ mapLayers, setMapLayers, onAnalyzeScenario }) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-2">
      <MapLayersControl layers={mapLayers} setLayers={setMapLayers} />
      <button 
        onClick={onAnalyzeScenario}
        className="w-11 h-11 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
        aria-label="Analyze Scenario"
      >
        <AnalysisIcon className="w-6 h-6 text-slate-700" />
      </button>
    </div>
  );
};
