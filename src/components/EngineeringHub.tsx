import React, { useState } from 'react';
import { Download, Plus, Box, Edit2, Trash2, Upload } from 'lucide-react';
import { CadIteration, IterationStatus } from '../types';
import { NewIterationModal } from './NewIterationModal';
import { IterationDetailModal } from './IterationDetailModal';
import { ModelViewer } from './ModelViewer';

interface EngineeringHubProps {
  iterations: CadIteration[];
  onAddIteration: (newIter: CadIteration) => void;
  onEditIteration: (id: string, updatedIter: CadIteration) => void;
  onDeleteIteration: (id: string) => void;
  onUploadIterationModel: (id: string, file: File) => void;
}

export function EngineeringHub({
  iterations,
  onAddIteration,
  onEditIteration,
  onDeleteIteration,
  onUploadIterationModel,
}: EngineeringHubProps) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedIteration, setSelectedIteration] = useState<CadIteration | null>(null);
  const [editingIteration, setEditingIteration] = useState<CadIteration | null>(null);

  const handleExportCSV = () => {
    const headers = ['ID', 'Part Name', 'Date', 'CAD File Ref', 'Weight (g)', 'Status', 'Description'];
    const csvRows = [headers.join(',')];

    iterations.forEach(i => {
      const row = [
        i.id,
        i.part_name || 'Car',
        i.date,
        i.cad_file_ref,
        i.weight_grams,
        i.status,
        `"${(i.description || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cardinal-rnd-log.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEditModal = (iter: CadIteration) => {
    setEditingIteration(iter);
    setIsNewModalOpen(true);
  };

  const handleQuickStatusMove = (iter: CadIteration, newStatus: IterationStatus) => {
    onEditIteration(iter.id, {
      ...iter,
      status: newStatus,
    });
  };

  const renderDelta = (current: number, previous: number | undefined, decimals: number, unit: string = '') => {
    if (previous === undefined) return <span className="text-zinc-650 text-[10px] uppercase tracking-widest font-mono">Baseline</span>;
    const diff = current - previous;
    if (Math.abs(diff) < 0.0001) return <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-mono">No Change</span>;
    const sign = diff > 0 ? '↑' : '↓';
    const color = diff < 0 ? 'text-zinc-200 font-bold' : 'text-zinc-600';
    return <span className={`${color} text-[10px] uppercase tracking-widest font-mono`}>{sign} {Math.abs(diff).toFixed(decimals)} {unit}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">CAD REPOSITORY</span>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">R&D Ledger / Iteration & Part Tracker</h2>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 text-[10px] font-mono bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
        >
          <Download className="w-3 h-3" />
          EXPORT R&D LOG
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {iterations.map((iter, index) => {
            const prevIter = index > 0 ? iterations[index - 1] : undefined;
            const isWeightBreach = iter.weight_grams < 50.0;

            return (
              <div 
                key={iter.id} 
                className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors relative group overflow-hidden"
              >
                {/* Hover Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(iter); }}
                    className="p-1.5 bg-zinc-900/90 backdrop-blur text-zinc-400 hover:text-white rounded border border-zinc-700 transition-colors cursor-pointer"
                    title="Edit Iteration"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteIteration(iter.id); }}
                    className="p-1.5 bg-zinc-900/90 backdrop-blur text-zinc-400 hover:text-rose-455 rounded border border-zinc-700 transition-colors cursor-pointer"
                    title="Delete Iteration"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-mono font-bold text-zinc-100">{iter.part_name || 'Car Part'}</h3>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">{iter.id} // {iter.date}</span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="relative z-10">
                    <select
                      value={iter.status}
                      onChange={(e) => handleQuickStatusMove(iter, e.target.value as IterationStatus)}
                      className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded outline-none cursor-pointer focus:border-zinc-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Simulated">Simulated</option>
                      <option value="Milled">Milled</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* 3D Model Rendering or Upload */}
                <div className="h-44 relative rounded border border-zinc-900 overflow-hidden bg-black flex items-center justify-center">
                  {iter.model_url ? (
                    <div className="w-full h-full" onClick={() => setSelectedIteration(iter)}>
                      <ModelViewer url={iter.model_url} />
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-zinc-900/40 transition-colors">
                      <Upload className="w-8 h-8 text-zinc-650 mb-2" />
                      <span className="text-[10px] font-mono text-zinc-400">PUT STL FILE</span>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase mt-0.5">Click to browse 3D Model</span>
                      <input 
                        type="file" 
                        accept=".stl" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.name.toLowerCase().endsWith('.stl')) {
                              onUploadIterationModel(iter.id, file);
                            } else {
                              alert('Please upload an .stl file.');
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* File Reference */}
                <div className="flex items-center gap-2 text-zinc-400">
                  <Box className="w-3.5 h-3.5 text-zinc-550" />
                  <span className="text-[10px] font-mono truncate">{iter.cad_file_ref}</span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-zinc-500 font-mono leading-relaxed line-clamp-2">
                  {iter.description || 'No description provided.'}
                </p>

                {/* Stats */}
                <div className="pt-3 border-t border-zinc-900/60 mt-auto flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500">Weight:</span>
                  <div className={`text-zinc-300 ${isWeightBreach ? 'bg-rose-950/20 border border-rose-900/30 text-rose-400 px-1.5 py-0.5 rounded-sm font-bold' : ''}`}>
                    {iter.weight_grams.toFixed(1)}g
                  </div>
                </div>

                {/* Weight delta */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-555">Weight Δ:</span>
                  {renderDelta(iter.weight_grams, prevIter?.weight_grams, 1, 'g')}
                </div>
              </div>
            );
          })}

          {/* New Iteration Node */}
          <button 
            onClick={() => { setEditingIteration(null); setIsNewModalOpen(true); }} 
            className="border border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center p-6 hover:bg-zinc-900/30 hover:border-zinc-700 transition-colors h-full min-h-[280px] group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
              <Plus className="w-6 h-6 text-zinc-500 group-hover:text-zinc-200" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300">Initialize Component Iteration</span>
          </button>
        </div>
      </div>

      <NewIterationModal 
        isOpen={isNewModalOpen} 
        onClose={() => { setIsNewModalOpen(false); setEditingIteration(null); }} 
        onCreate={onAddIteration} 
        initialData={editingIteration}
        onEdit={onEditIteration}
      />

      <IterationDetailModal
        iteration={selectedIteration}
        onClose={() => setSelectedIteration(null)}
        onUploadModel={onUploadIterationModel}
        onEdit={openEditModal}
        onDelete={onDeleteIteration}
      />
    </div>
  );
}
