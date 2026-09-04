import React from 'react';
import { CoverElement } from './types.ts';
import { Trash2, BringToFront, SendToBack, Copy } from 'lucide-react';

interface Props {
  selectedElement: CoverElement | null;
  onChange: (el: CoverElement) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayerChange: (dir: 'up' | 'down') => void;
}

export const PropertiesPanel: React.FC<Props> = ({ selectedElement, onChange, onDelete, onDuplicate, onLayerChange }) => {
  if (!selectedElement) {
    return (
      <div className="p-4 text-sm text-slate-500 italic text-center">
        Select an element on the canvas to edit its properties.
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'number') {
      finalValue = parseFloat(value);
    }
    onChange({
      ...selectedElement,
      [name]: finalValue,
    });
  };

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="flex gap-2 pb-4 border-b border-slate-200">
        <button onClick={() => onLayerChange('down')} className="flex-1 flex justify-center py-1.5 border border-slate-300 rounded hover:bg-slate-50" title="Send Backward">
          <SendToBack className="h-4 w-4 text-slate-600" />
        </button>
        <button onClick={() => onLayerChange('up')} className="flex-1 flex justify-center py-1.5 border border-slate-300 rounded hover:bg-slate-50" title="Bring Forward">
          <BringToFront className="h-4 w-4 text-slate-600" />
        </button>
        <button onClick={onDuplicate} className="flex-1 flex justify-center py-1.5 border border-slate-300 rounded hover:bg-slate-50" title="Duplicate">
          <Copy className="h-4 w-4 text-slate-600" />
        </button>
        <button onClick={onDelete} className="flex-1 flex justify-center py-1.5 border border-rose-300 rounded hover:bg-rose-50 text-rose-600" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">X Position</label>
          <input type="number" name="x" value={Math.round(selectedElement.x)} onChange={handleChange} className="w-full text-sm border-slate-300 rounded p-1.5" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Y Position</label>
          <input type="number" name="y" value={Math.round(selectedElement.y)} onChange={handleChange} className="w-full text-sm border-slate-300 rounded p-1.5" />
        </div>
      </div>

      {(selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'text') && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Color / Fill</label>
          <div className="flex gap-2">
            <input type="color" name="fill" value={selectedElement.fill || '#000000'} onChange={handleChange} className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0" />
            <input type="text" name="fill" value={selectedElement.fill || '#000000'} onChange={handleChange} className="flex-1 text-sm border-slate-300 rounded p-1.5 uppercase font-mono" />
          </div>
        </div>
      )}

      {selectedElement.type === 'text' && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Text Content</label>
            <input type="text" name="text" value={selectedElement.text || ''} onChange={handleChange} className="w-full text-sm border-slate-300 rounded p-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Font Size</label>
              <input type="number" name="fontSize" value={selectedElement.fontSize || 16} onChange={handleChange} className="w-full text-sm border-slate-300 rounded p-1.5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Font Family</label>
              <select name="fontFamily" value={selectedElement.fontFamily || 'Arial'} onChange={handleChange} className="w-full text-sm border-slate-300 rounded p-1.5">
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Impact">Impact</option>
              </select>
            </div>
          </div>
          <div>
             <label className="block text-xs font-semibold text-slate-500 mb-1">Alignment</label>
             <select name="textAlign" value={selectedElement.textAlign || 'left'} onChange={handleChange} className="w-full text-sm border-slate-300 rounded p-1.5">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
          </div>
        </div>
      )}

    </div>
  );
};
