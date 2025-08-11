
import React, { useContext } from 'react';
import type { LibraryEntity } from '../types';
import { Force } from '../types';
import { EntityIcon } from './EntityIcon';
import { AppContext } from '../state/appState';

interface PlacableEntityProps {
  entity: LibraryEntity;
  onEdit: (entity: LibraryEntity) => void;
}

const PlacableEntity: React.FC<PlacableEntityProps> = ({ entity, onEdit }) => {
  const { state, dispatch } = useContext(AppContext);
  const isSelectedForPlacement = state.placingEntityId === entity.id;

  const forceColor = entity.force === Force.BLUE ? 'border-l-sky-500' : 'border-l-rose-500';
  const selectionClass = isSelectedForPlacement
    ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-white shadow-lg'
    : 'shadow-sm hover:shadow-md hover:bg-slate-100';

  return (
    <div className="relative group">
      <button
        onClick={() => dispatch({ type: 'SET_PLACING_ENTITY', payload: entity.id })}
        className={`w-full p-2 bg-white rounded-md border-l-4 ${forceColor} cursor-pointer flex items-center space-x-3 text-left transition-all duration-150 ${selectionClass}`}
      >
          <div className="flex-shrink-0">
              <EntityIcon force={entity.force} iconId={entity.icon} />
          </div>
          <div className="flex-grow">
              <p className="font-bold text-sm text-slate-800">{entity.name}</p>
              <p className="text-xs text-slate-500">{entity.type}</p>
          </div>
      </button>
       <button 
          onClick={() => onEdit(entity)} 
          className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-md bg-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-300 hover:text-slate-700"
          aria-label={`Edit ${entity.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
          </svg>
        </button>
    </div>
  );
};

interface EntityListProps {
  title: string;
  entities: LibraryEntity[];
  force: Force;
  onEditEntity: (entity: LibraryEntity) => void;
}

const EntityList: React.FC<EntityListProps> = ({ title, entities, force, onEditEntity }) => {
  const filteredEntities = entities.filter(e => e.force === force);
  const titleColor = force === Force.BLUE ? 'text-sky-600' : 'text-rose-600';

  return (
    <div>
      <h3 className={`font-semibold ${titleColor} mb-2 px-4`}>{title}</h3>
      <div className="space-y-2 px-4 pb-4">
        {filteredEntities.length > 0 ? (
          filteredEntities.map(entity => <PlacableEntity key={entity.id} entity={entity} onEdit={onEditEntity} />)
        ) : (
          <p className="text-xs text-slate-500 px-2">No entities available.</p>
        )}
      </div>
    </div>
  );
};

interface EntityLibraryProps {
    onEditEntity: (entity: LibraryEntity) => void;
}

export const EntityLibrary: React.FC<EntityLibraryProps> = ({ onEditEntity }) => {
  const { state } = useContext(AppContext);
  const { libraryEntities: entities } = state;

  if (entities.length === 0) {
    return (
        <div className="p-6 text-center text-slate-500">
            <h3 className="font-semibold text-slate-700">Library is Empty</h3>
            <p className="text-sm mt-1">Click "Import" to load a scenario file or "Create" to build a new entity.</p>
        </div>
    )
  }

  return (
    <div className="flex-grow overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-600 my-3 px-4">Entity Library</h2>
        <div className="space-y-4">
            <EntityList title="Blue Force" entities={entities} force={Force.BLUE} onEditEntity={onEditEntity} />
            <EntityList title="Red Force" entities={entities} force={Force.RED} onEditEntity={onEditEntity} />
        </div>
    </div>
  );
};
