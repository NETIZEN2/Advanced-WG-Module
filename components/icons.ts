
import React from 'react';

// --- Standalone UI Icons (Full SVG components) ---
// Note: These are defined using React.createElement to avoid JSX in a .ts file.

export const CreatorIdentityIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { d: "M10 2a5 5 0 00-5 5v1h10V7a5 5 0 00-5-5zM4 13a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM4 16a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" })
    )
);

export const CreatorSensorIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5m-9-3.75h.008v.008H6.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" })
    )
);

export const CreatorWeaponIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a6 6 0 01-2.56 5.84m-2.56-5.84a6 6 0 017.38-5.84m-12.25 0a6 6 0 015.84 2.56m-5.84-2.56a6 6 0 017.38-5.84m5.84 5.84a6 6 0 01-5.84 2.56m0 0a6 6 0 01-7.38-5.84m-5.84 2.56a6 6 0 012.56-5.84" })
    )
);

export const WaypointPathIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" })
    )
);

export const DatalinkIcon = () => (
     React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M1.394 8.929a15 15 0 0121.212 0" })
    )
);

export const EWIcon = () => (
     React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" })
    )
);

export const SignatureIcon = () => (
     React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" })
    )
);

export const LayersIcon = ({className = "w-6 h-6"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" })
    )
);

export const SensorRangeIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v5a1 1 0 11-2 0V9z", clipRule: "evenodd" })
    )
);

export const WeaponRangeIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { d: "M10 12a2 2 0 100-4 2 2 0 000 4z" }),
        React.createElement('path', { fillRule: "evenodd", d: "M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-.274 1.057-.686 2.06-1.182 3.016l-1.414-1.414A6.961 6.961 0 0016 10c-1.857 0-3.512.464-4.899 1.238l-1.414-1.414A4.982 4.982 0 0010 8a4.982 4.982 0 00-1.687.324L7.172 7.172a6.963 6.963 0 00-2.314.993l-1.414-1.414A10.994 10.994 0 00.458 10zm11.559 4.542a3.003 3.003 0 00-3.116-3.116l-1.428-1.428a4.975 4.975 0 00-4.001 4.001l1.428 1.428a3.003 3.003 0 003.116 3.116l1.428 1.428a4.975 4.975 0 004.001-4.001l-1.428-1.428z", clipRule: "evenodd" })
    )
);


export const AnalysisIcon = ({className = "w-6 h-6"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" })
    )
);

export const TimePlayIcon = ({className = "w-6 h-6"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" })
    )
);

export const TimePauseIcon = ({className = "w-6 h-6"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 100-2H9V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" })
    )
);

export const PlayIcon = ({className="w-5 h-5"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" })
    )
);

export const StopIcon = ({className="w-5 h-5"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z", clipRule: "evenodd" })
    )
);

export const FuelIcon = ({className="w-6 h-6"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M15.94 4.542a1 1 0 000-1.414l-2.5-2.5a1 1 0 00-1.414 0L4.293 8.293a1 1 0 000 1.414l2.5 2.5a1 1 0 001.414 0L15.94 4.542zM8.25 12C8.664 12 9 12.336 9 12.75s-0.336 0.75-0.75 0.75S7.5 13.164 7.5 12.75 7.836 12 8.25 12zM12 11c.552 0 1 .448 1 1s-0.448 1-1 1-1-.448-1-1 .448-1 1-1zm3.75.75c.414 0 .75-.336.75-.75s-.336-.75-.75-.75-.75.336-.75.75.336.75.75.75zM8.25 16c.414 0 .75-.336.75-.75s-.336-.75-.75-.75-.75.336-.75.75.336.75.75.75zm3.75-.75c.414 0 .75-.336.75-.75s-.336-.75-.75-.75-.75.336-.75.75.336.75.75.75zM12 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z", clipRule: "evenodd" })
    )
);

export const CriticalIcon = ({className = "w-6 h-6"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M8.257 3.099c.622-1.243 2.36-1.243 2.982 0l6.095 12.19a1.75 1.75 0 01-1.49 2.586H3.652a1.75 1.75 0 01-1.49-2.586L8.257 3.099zM10 12.75a.75.75 0 00-1.5 0v.008c0 .414.336.75.75.75s.75-.336.75-.75v-.008zM10 7a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5A.75.75 0 0010 7z", clipRule: "evenodd" })
    )
);

export const DisableIcon = ({className = "w-6 h-6"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 20 20", fill: "currentColor" },
        React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" })
    )
);

// --- Entity Icon Parts (SVG <g> components) ---
const JetIconPart = () => React.createElement('path', { d: "M 12 4 L 4 20 L 12 16 L 20 20 Z" });
const TankIconPart = () => React.createElement('g', null,
    React.createElement('rect', { x: 5, y: 11, width: 14, height: 6, rx: 1 }),
    React.createElement('rect', { x: 8, y: 7, width: 8, height: 4, rx: 1 }),
    React.createElement('line', { x1: 18, y1: 10, x2: 22, y2: 10, strokeWidth: 1.5, stroke: "currentColor", strokeLinecap: "round" })
);
const ShipIconPart = () => React.createElement('path', { d: "M 3 14 L 5 10 H 19 L 21 14 L 18 18 H 6 Z" });
const SubIconPart = () => React.createElement('path', { d: "M 6 12 C 6 10, 8 9, 12 9 S 18 10, 18 12 C 18 14, 16 15, 12 15 S 6 14, 6 12 Z M 11 9 L 13 6 L 15 9" });
const InfantryIconPart = () => React.createElement('g', { strokeWidth: 1.5, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('line', { x1: 6, y1: 18, x2: 18, y2: 6 }),
    React.createElement('line', { x1: 18, y1: 18, x2: 6, y2: 6 })
);
const SAMIconPart = () => React.createElement('g', { strokeWidth: 1.5, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('rect', { x: 5, y: 16, width: 14, height: 4, fill: "none" }),
    React.createElement('path', { d: "M 12 16 V 6 L 16 10" }),
    React.createElement('path', { d: "M 12 6 L 8 10" })
);

const MissileProjectilePart = () => React.createElement('path', { d: "M 12 2 L 14 10 L 12 22 L 10 10 Z M 10 18 L 14 18" });
const SensorIconPart = () => React.createElement('path', { d: "M 12 12 m -8, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0 M 12 12 m -4, 0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0" });
const WeaponIconPart = () => React.createElement('path', { d: "M 12 2 L 2 12 L 12 22 L 22 12 Z" });

export const ICON_IDS = [
    'jet-1', 'tank-1', 'ship-1', 'sub-1', 'infantry-1', 'sam-1', 'missile-projectile', 'sensor', 'weapon'
];

export const ICON_PART_MAP: Record<string, React.FC> = {
    'jet-1': JetIconPart,
    'tank-1': TankIconPart,
    'ship-1': ShipIconPart,
    'sub-1': SubIconPart,
    'infantry-1': InfantryIconPart,
    'sam-1': SAMIconPart,
    'missile-projectile': MissileProjectilePart,
    'sensor': SensorIconPart,
    'weapon': WeaponIconPart,
};
