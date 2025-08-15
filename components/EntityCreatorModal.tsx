
import React, { useState, useEffect } from 'react';
import type { LibraryEntity } from '../types';
import { SENSOR_TYPES, WEAPON_TYPES, GUIDANCE_TYPES, EW_TYPES, EntityType as EntityTypesEnum, Force as ForceEnum } from '../types';
import { ICON_IDS, CreatorIdentityIcon, CreatorSensorIcon, CreatorWeaponIcon, WaypointPathIcon, DatalinkIcon, EWIcon, SignatureIcon } from './icons';
import { EntityIcon } from './EntityIcon';

const defaultEntity: Omit<LibraryEntity, 'id'> = {
  name: '', force: ForceEnum.BLUE, type: EntityTypesEnum.AIR, icon: 'jet-1',
  sensors: [], weapons: [],
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: Omit<LibraryEntity, 'id'> | LibraryEntity) => void;
  entity: LibraryEntity | null;
};

const steps = [
  { id: 'identity', name: 'Identity', icon: <CreatorIdentityIcon /> },
  { id: 'platform', name: 'Platform', icon: <WaypointPathIcon /> },
  { id: 'sensors', name: 'Sensors', icon: <CreatorSensorIcon /> },
  { id: 'weapons', name: 'Weapons', icon: <CreatorWeaponIcon /> },
  { id: 'datalinks', name: 'Datalinks', icon: <DatalinkIcon /> },
  { id: 'signature', name: 'Signature', icon: <SignatureIcon /> },
  { id: 'ew', name: 'EW Systems', icon: <EWIcon /> },
];

export const EntityCreatorModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, entity }) => {
  const [currentStep, setCurrentStep] = useState('identity');
  const [formData, setFormData] = useState<Omit<LibraryEntity, 'id'> | LibraryEntity>(entity || defaultEntity);

  useEffect(() => {
    setFormData(entity || defaultEntity);
    setCurrentStep('identity');
  }, [entity, isOpen]);

  const handleSave = () => { onSave(formData); };


  if (!isOpen) return null;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'identity': return <IdentityStep formData={formData} onUpdate={setFormData} />;
      // Add other step components here later
      default: return <div className="p-6 text-center text-slate-500"><p>This step has not been implemented yet.</p></div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onMouseDown={(e) => {if(e.target === e.currentTarget) onClose()}}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{entity ? 'Edit Entity' : 'Create New Entity'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>
        <div className="flex flex-grow min-h-0">
          <nav className="w-56 border-r border-slate-200 bg-slate-50 p-3 flex-shrink-0">
            <ul className="space-y-1">
              {steps.map(step => (
                <li key={step.id}>
                  <button onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentStep === step.id ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                    <span className="w-5 h-5 flex-shrink-0">{step.icon}</span>
                    <span>{step.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <main className="flex-grow p-6 overflow-y-auto">
            {renderCurrentStep()}
          </main>
        </div>
        <footer className="p-4 border-t border-slate-200 flex justify-end space-x-3 flex-shrink-0 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors">Save Entity</button>
        </footer>
      </div>
    </div>
  );
};

const IdentityStep = ({ formData, onUpdate }: { formData: any, onUpdate: Function }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input type="text" id="name" value={formData.name} onChange={e => onUpdate({ ...formData, name: e.target.value })} className="w-full border-slate-300 rounded-md shadow-sm text-sm" />
        </div>
        <div>
           <label htmlFor="force" className="block text-sm font-medium text-slate-700 mb-1">Force</label>
            <select id="force" value={formData.force} onChange={e => onUpdate({ ...formData, force: e.target.value })} className="w-full border-slate-300 rounded-md shadow-sm text-sm">
              {Object.values(ForceEnum).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
        </div>
        <div>
           <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select id="type" value={formData.type} onChange={e => onUpdate({ ...formData, type: e.target.value })} className="w-full border-slate-300 rounded-md shadow-sm text-sm">
              {Object.values(EntityTypesEnum).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
      </div>
       <div>
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                <div className="p-2 border rounded-md bg-white">
                    <EntityIcon force={formData.force} iconId={formData.icon} />
                </div>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mt-2 p-2 border rounded-md bg-slate-100 max-h-48 overflow-y-auto">
                {ICON_IDS.map(id => (
                    <button key={id} onClick={() => onUpdate({ ...formData, icon: id })} className={`p-1 rounded-md hover:bg-slate-300 transition-colors ${formData.icon === id ? 'bg-sky-200 ring-2 ring-sky-500' : 'bg-slate-200'}`}>
                        <EntityIcon force={formData.force} iconId={id} />
                    </button>
                ))}
            </div>
       </div>
       <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea id="description" value={formData.description || ''} onChange={e => onUpdate({ ...formData, description: e.target.value })} rows={4} className="w-full border-slate-300 rounded-md shadow-sm text-sm"></textarea>
       </div>
    </div>
  );
};
