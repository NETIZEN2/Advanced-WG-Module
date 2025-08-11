
import React, { useEffect } from 'react';

const MoveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m4.5 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>);
const WaypointIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>);
const CenterIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>);
const DuplicateIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75c-.621 0-1.125-.504-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>);
const DeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const DetailsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>);

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  actions: {
    onMove: () => void;
    onPlotWaypoints: () => void;
    onCenter: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onViewDetails: () => void;
  };
}

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
}> = ({ icon, label, onClick, isDestructive = false }) => {
    const textClass = isDestructive ? 'text-rose-700 hover:text-white' : 'text-slate-700 hover:text-white';
    const hoverClass = isDestructive ? 'hover:bg-rose-500' : 'hover:bg-sky-500';
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`flex items-center space-x-3 w-full text-left px-3 py-2 text-sm font-medium transition-colors rounded-md ${textClass} ${hoverClass}`}
        >
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            <span>{label}</span>
        </button>
    );
};

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, actions }) => {
  const allActions = [
    { fn: actions.onMove, label: 'Move Unit', icon: <MoveIcon /> },
    { fn: actions.onPlotWaypoints, label: 'Plot Waypoints', icon: <WaypointIcon /> },
    { fn: actions.onCenter, label: 'Center on Unit', icon: <CenterIcon /> },
    { fn: actions.onDuplicate, label: 'Duplicate Unit', icon: <DuplicateIcon /> },
    { fn: actions.onViewDetails, label: 'View Details', icon: <DetailsIcon /> },
  ];
  
  const destructiveActions = [
      { fn: actions.onDelete, label: 'Delete Unit', icon: <DeleteIcon />, isDestructive: true },
  ];
  
  const handleActionClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      style={{ top: y, left: x }}
      className="absolute z-50 w-52 bg-white/80 backdrop-blur-md rounded-lg shadow-2xl border border-slate-200/50 p-1.5 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-1">
        {allActions.map((action, i) => (
          <MenuItem
            key={i}
            icon={action.icon}
            label={action.label}
            onClick={() => handleActionClick(action.fn)}
          />
        ))}
        <div className="h-px bg-slate-200/70 my-1 mx-2" />
         {destructiveActions.map((action, i) => (
          <MenuItem
            key={i}
            icon={action.icon}
            label={action.label}
            onClick={() => handleActionClick(action.fn)}
            isDestructive={action.isDestructive}
          />
        ))}
      </div>
    </div>
  );
};
