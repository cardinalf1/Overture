import React, { useState } from 'react';
import { Download, Plus, Box, Edit2, Trash2 } from 'lucide-react';
import { CadIteration } from '../types';
import { NewIterationModal } from './NewIterationModal';
import { IterationDetailModal } from './IterationDetailModal';
import { supabaseService } from '../lib/supabaseService';

interface EngineeringHubProps {
  iterations: CadIteration[];
  setIterations: React.Dispatch<React.SetStateAction<CadIteration[]>>;
}

export function EngineeringHub({ iterations, setIterations }: EngineeringHubProps) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedIteration, setSelectedIteration] = useState<CadIteration | null>(null);
  const [editingIteration, setEditingIteration] = useState<CadIteration | null>(null);

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'CAD File Ref', 'Weight (g)', 'Drag Coefficient (Cd)', 'Status'];
    const csvRows = [headers.join(',')];

    iterations.forEach(i => {
      const row = [
        i.id,
        i.date,
        i.cad_file_ref,
        i.weight_grams,
        i.drag_coefficient_cd,
        i.status
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

  const handleCreateIteration = (iterData: Omit<CadIteration, 'id'>) => {
    const maxNum = iterations.reduce((max, iter) => {
      const num = parseFloat(iter.id.replace('V', ''));
      return !isNaN(num) && num > max ? num : max;
    }, 0.9); // Start at 0.9 so first is V1.0 if empty
    const newId = `V${(maxNum + 0.1).toFixed(1)}`;
    
    const newIter: CadIteration = {
      id: newId,
      ...iterData
    };
    setIterations([...iterations, newIter]);
    supabaseService.upsertIteration(newIter).catch(console.error);
  };

  const handleEditIteration = (id: string, data: Omit<CadIteration, 'id'>) => {
    const updatedIter = { id, ...data };
    setIterations(prev => prev.map(iter => iter.id === id ? { ...iter, ...data } : iter));
    if (selectedIteration?.id === id) {
      setSelectedIteration(prev => prev ? { ...prev, ...data } : null);
    }
    supabaseService.upsertIteration(updatedIter).catch(console.error);
  };

  const handleDeleteIteration = (id: string) => {
    setIterations(prev => prev.filter(iter => iter.id !== id));
    if (selectedIteration?.id === id) {
      setSelectedIteration(null);
    }
    supabaseService.deleteIteration(id).catch(console.error);
  };

  const openEditModal = (iter: CadIteration) => {
    setEditingIteration(iter);
    setIsNewModalOpen(true);
  };

  const handleUploadModel = async (id: string, file: File) => {
    const url = await supabaseService.uploadModelFile(file);
    const existing = iterations.find(iter => iter.id === id);
    if (existing) {
      const updatedIter = { ...existing, model_url: url, model_name: file.name };
      supabaseService.upsertIteration(updatedIter).catch(console.error);
    }
    setIterations(prev => prev.map(iter => 
      iter.id === id ? { ...iter, model_url: url, model_name: file.name } : iter
    ));
    if (selectedIteration?.id === id) {
      setSelectedIteration(prev => prev ? { ...prev, model_url: url, model_name: file.name } : null);
    }
  };

  const renderDelta = (current: number, previous: number | undefined, decimals: number, unit: string = '') => {
    if (previous === undefined) return <span className="text-zinc-600 text-[10px] uppercase tracking-widest">Initial Baseline</span>;
    const diff = current - previous;
    if (Math.abs(diff) < 0.0001) return <span className="text-zinc-500 text-[10px] uppercase tracking-widest">No Change</span>;
    const sign = diff > 0 ? '↑' : '↓';
    const color = diff < 0 ? 'text-zinc-100 font-bold' : 'text-zinc-500';
    return <span className={`${color} text-[10px] uppercase tracking-widest`}>{sign} {Math.abs(diff).toFixed(decimals)} {unit}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">R&D Ledger / Iteration Tracker</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 text-[10px] font-mono bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
        >
          <Download className="w-3 h-3" />
          EXPORT R&D LOG
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {iterations.map((iter, index) => {
            const prevIter = index > 0 ? iterations[index - 1] : undefined;
            const isWeightBreach = iter.weight_grams < 50.0;

            return (
              <div 
                key={iter.id} 
                onClick={() => setSelectedIteration(iter)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4 hover:border-zinc-600 transition-colors cursor-pointer group relative overflow-hidden"
              >
                {/* Action Buttons (Hover) */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(iter); }}
                    className="p-1.5 bg-zinc-900/90 backdrop-blur text-zinc-400 hover:text-white rounded border border-zinc-700 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteIteration(iter.id); }}
                    className="p-1.5 bg-zinc-900/90 backdrop-blur text-zinc-400 hover:text-red-400 rounded border border-zinc-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-mono font-bold text-zinc-100">{iter.id}</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{iter.date}</p>
                  </div>
                  <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                    {iter.status}
                  </div>
                </div>

                {/* File Ref */}
                <div className="flex items-center gap-2 text-zinc-400">
                  <Box className="w-4 h-4" />
                  <span className="text-xs font-mono truncate">{iter.cad_file_ref}</span>
                </div>

                <div className="h-px w-full bg-zinc-900 my-1"></div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Weight</p>
                    <div className={`text-sm font-mono ${isWeightBreach ? 'bg-zinc-200 text-black px-1.5 py-0.5 inline-block rounded-sm font-bold' : 'text-zinc-300'}`}>
                      {iter.weight_grams.toFixed(1)}g
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Drag (Cd)</p>
                    <div className="text-sm font-mono text-zinc-300">
                      {iter.drag_coefficient_cd.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Deltas */}
                <div className="mt-auto pt-4 border-t border-zinc-900 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Weight Δ</span>
                    {renderDelta(iter.weight_grams, prevIter?.weight_grams, 1, 'g')}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Drag Δ</span>
                    {renderDelta(iter.drag_coefficient_cd, prevIter?.drag_coefficient_cd, 3, 'Cd')}
                  </div>
                </div>
                
                {/* 3D Indicator */}
                {iter.model_url && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-zinc-800 rounded-bl-lg flex items-center justify-center group-hover:opacity-0 transition-opacity z-10">
                    <span className="text-[8px] font-mono font-bold text-zinc-300">3D</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* New Iteration Node */}
          <button 
            onClick={() => { setEditingIteration(null); setIsNewModalOpen(true); }} 
            className="border border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center p-6 hover:bg-zinc-900/50 hover:border-zinc-600 transition-colors h-full min-h-[250px] group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
              <Plus className="w-6 h-6 text-zinc-400 group-hover:text-zinc-100" />
            </div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300">Initialize New Iteration</span>
          </button>
        </div>
      </div>

      <NewIterationModal 
        isOpen={isNewModalOpen} 
        onClose={() => { setIsNewModalOpen(false); setEditingIteration(null); }} 
        onCreate={handleCreateIteration} 
        initialData={editingIteration}
        onEdit={handleEditIteration}
      />

      <IterationDetailModal
        iteration={selectedIteration}
        onClose={() => setSelectedIteration(null)}
        onUploadModel={handleUploadModel}
        onEdit={openEditModal}
        onDelete={handleDeleteIteration}
      />
    </div>
  );
}
