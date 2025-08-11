

import React, { useState } from 'react';
import { Force } from '../types';
import { EntityIcon } from './EntityIcon';
import { LayersIcon, SensorRangeIcon, WeaponRangeIcon, DatalinkIcon, WaypointPathIcon } from './icons';

interface MapLayersControlProps {
    layers: {
        forces: { blue: boolean; red: boolean };
        ranges: { sensors: boolean; weapons: boolean };
        links: { datalinks: boolean };
        paths: { waypoints: boolean; trails: boolean };
    };
    setLayers: React.Dispatch<React.SetStateAction<MapLayersControlProps['layers']>>;
}

const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    id: string;
}> = ({ checked, onChange, id }) => {
    return (
        <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
        </label>
    );
};


const LayerItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ icon, label, id, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-5 h-5 text-slate-500">{icon}</div>
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <ToggleSwitch id={id} checked={checked} onChange={onChange} />
    </div>
);

const SectionHeader: React.FC<{children: React.ReactNode}> = ({children}) => (
    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider pt-2">{children}</h4>
);


export const MapLayersControl: React.FC<MapLayersControlProps> = ({ layers, setLayers }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleLayer = (category: keyof typeof layers, key: string) => {
        setLayers(prev => ({
            ...prev,
            [category]: {
                // @ts-ignore
                ...prev[category],
                // @ts-ignore
                [key]: !prev[category][key]
            }
        }));
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-11 h-11 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                aria-label="Toggle Map Layers"
            >
                <LayersIcon className="w-6 h-6 text-slate-700" />
            </button>
            
            {isOpen && (
                <div 
                    className="absolute top-14 right-0 w-64 bg-white/80 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-200/50 p-3 space-y-2 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    <SectionHeader>Forces</SectionHeader>
                    <LayerItem
                        icon={<EntityIcon force={Force.BLUE} iconId="infantry-1" />}
                        label="Blue Force"
                        id="layer-force-blue"
                        checked={layers.forces.blue}
                        onChange={() => toggleLayer('forces', 'blue')}
                    />
                    <LayerItem
                        icon={<EntityIcon force={Force.RED} iconId="infantry-1" />}
                        label="Red Force"
                        id="layer-force-red"
                        checked={layers.forces.red}
                        onChange={() => toggleLayer('forces', 'red')}
                    />

                    <SectionHeader>Ranges</SectionHeader>
                    <LayerItem
                        icon={<SensorRangeIcon />}
                        label="Sensor Ranges"
                        id="layer-range-sensors"
                        checked={layers.ranges.sensors}
                        onChange={() => toggleLayer('ranges', 'sensors')}
                    />
                     <LayerItem
                        icon={<WeaponRangeIcon />}
                        label="Weapon Ranges"
                        id="layer-range-weapons"
                        checked={layers.ranges.weapons}
                        onChange={() => toggleLayer('ranges', 'weapons')}
                    />

                     <SectionHeader>Links & Paths</SectionHeader>
                      <LayerItem
                        icon={<DatalinkIcon />}
                        label="Datalinks"
                        id="layer-links-datalinks"
                        checked={layers.links.datalinks}
                        onChange={() => toggleLayer('links', 'datalinks')}
                    />
                    <LayerItem
                        icon={<WaypointPathIcon />}
                        label="Waypoints"
                        id="layer-paths-waypoints"
                        checked={layers.paths.waypoints}
                        onChange={() => toggleLayer('paths', 'waypoints')}
                    />
                     <LayerItem
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51-2.222m2.51 2.222l2.222-2.51m-2.222 2.51l2.222 2.51M3.75 4.5h.007v.007H3.75V4.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>}
                        label="Movement Trails"
                        id="layer-paths-trails"
                        checked={layers.paths.trails}
                        onChange={() => toggleLayer('paths', 'trails')}
                    />
                </div>
            )}
        </div>
    );
};