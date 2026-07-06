import React, { useState, useEffect } from 'react';
import { CadIteration, IterationStatus } from '../types';

interface NewIterationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (iter: Omit<CadIteration, 'id'>) => void;
  initialData?: CadIteration | null;
  onEdit?: (id: string, iter: Omit<CadIteration, 'id'>) => void;
}

export function NewIterationModal({ isOpen, onClose, onCreate, initialData, onEdit }: NewIterationModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [cadFileRef, setCadFileRef] = useState('');
  const [weight, setWeight] = useState<number>(50.0);
  const [drag, setDrag] = useState<number>(0.120);
  const [status, setStatus] = useState<IterationStatus>('Draft');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setCadFileRef(initialData.cad_file_ref);
        setWeight(initialData.weight_grams);
        setDrag(initialData.drag_coefficient_cd);
        setStatus(initialData.status);
      } else {
        setDate(today);
        setCadFileRef('');
        setWeight(50.0);
        setDrag(0.120);
        setStatus('Draft');
      }
    }
  }, [isOpen, initialData, today]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date,
      cad_file_ref: cadFileRef,
      weight_grams: weight,
      drag_coefficient_cd: drag,
      status,
      model_url: initialData?.model_url,
      model_name: initialData?.model_name,
    };

    if (initialData && onEdit) {
      onEdit(initialData.id, data);
    } else {
      onCreate(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-black">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-100">
            {initialData ? `Edit Iteration ${initialData.id}` : 'Initialize New Iteration'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Date</label>
            <input
              required
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">CAD File Ref</label>
            <input
              required
              type="text"
              value={cadFileRef}
              onChange={e => setCadFileRef(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
              placeholder="e.g. chassis_v3.step"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Weight (g)</label>
              <input
                required
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(parseFloat(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Drag (Cd)</label>
              <input
                required
                type="number"
                step="0.001"
                value={drag}
                onChange={e => setDrag(parseFloat(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as IterationStatus)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
            >
              <option value="Draft">Draft</option>
              <option value="Simulated">Simulated</option>
              <option value="Milled">Milled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-800 text-zinc-400 rounded text-xs font-mono uppercase tracking-widest hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-zinc-100 text-black rounded text-xs font-mono uppercase tracking-widest font-bold hover:bg-white transition-colors"
            >
              {initialData ? 'Save Changes' : 'Deploy Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
