import React, { useState } from 'react';
import { CadIteration } from '../types';
import { ModelViewer } from './ModelViewer';
import { Upload, X } from 'lucide-react';

interface IterationDetailModalProps {
  iteration: CadIteration | null;
  onClose: () => void;
  onUploadModel: (id: string, file: File) => void;
  onEdit: (iter: CadIteration) => void;
  onDelete: (id: string) => void;
}

export function IterationDetailModal({ iteration, onClose, onUploadModel, onEdit, onDelete }: IterationDetailModalProps) {
  const [isDragging, setIsDragging] = useState(false);

  if (!iteration) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.stl')) {
        onUploadModel(iteration.id, file);
      } else {
        alert('Please upload an .stl file for 3D rendering.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.stl')) {
        onUploadModel(iteration.id, file);
      } else {
        alert('Please upload an .stl file for 3D rendering.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-mono font-bold text-zinc-100">{iteration.id}</h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{iteration.cad_file_ref}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(iteration)} className="px-3 py-1.5 bg-zinc-900 text-zinc-300 hover:text-white text-[10px] font-mono uppercase tracking-widest rounded transition-colors border border-zinc-800 hover:border-zinc-600">Edit</button>
            <button onClick={() => { onDelete(iteration.id); onClose(); }} className="px-3 py-1.5 bg-zinc-900 text-zinc-300 hover:text-red-400 text-[10px] font-mono uppercase tracking-widest rounded transition-colors border border-zinc-800 hover:border-red-900/50">Delete</button>
            <div className="w-px h-4 bg-zinc-800 mx-2"></div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left: 3D Viewer or Upload */}
          <div className="flex-1 p-6 border-r border-zinc-800 flex flex-col">
            {iteration.model_url ? (
              <div className="flex-1 relative">
                <ModelViewer url={iteration.model_url} />
                <label className="absolute bottom-4 right-4 z-30 px-3 py-1.5 bg-zinc-900/90 backdrop-blur text-zinc-300 hover:text-white hover:border-zinc-500 rounded border border-zinc-700 text-[10px] font-mono uppercase tracking-widest cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Update 3D Model (.STL)
                  <input type="file" accept=".stl" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              <div 
                className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-zinc-400 bg-zinc-900/50' : 'border-zinc-800 hover:border-zinc-600'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-zinc-600 mb-4" />
                <p className="text-sm font-mono text-zinc-400 mb-2">Drag & Drop .STL File Here</p>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-6">To render 3D preview</p>
                <label className="px-4 py-2 bg-zinc-100 text-black rounded text-xs font-mono font-bold uppercase tracking-widest cursor-pointer hover:bg-white transition-colors">
                  Browse Files
                  <input type="file" accept=".stl" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            )}
          </div>
          
          {/* Right: Details */}
          <div className="w-80 p-6 bg-black flex flex-col gap-6">
            <div>
              <h3 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Iteration Status</h3>
              <div className="inline-block px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-300 uppercase tracking-widest">
                {iteration.status}
              </div>
            </div>
            
            <div>
              <h3 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Date Deployed</h3>
              <div className="text-sm font-mono text-zinc-300">{iteration.date}</div>
            </div>

            <div className="h-px w-full bg-zinc-900"></div>

            <div>
              <h3 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Weight (g)</h3>
              <div className={`text-2xl font-mono ${iteration.weight_grams < 50.0 ? 'text-zinc-100 bg-zinc-200 text-black px-2 py-1 rounded-sm inline-block' : 'text-zinc-100'}`}>
                {iteration.weight_grams.toFixed(1)}g
              </div>
              {iteration.weight_grams < 50.0 && (
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-2 bg-zinc-900 border border-zinc-800 p-2 rounded">
                  ⚠️ Regulation Breach: &lt; 50.0g
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Drag Coefficient (Cd)</h3>
              <div className="text-2xl font-mono text-zinc-100">
                {iteration.drag_coefficient_cd.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
