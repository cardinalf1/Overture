import React, { useState } from 'react';
import { Department, Node } from '../types';

interface NewNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (node: { title: string; description: string; department: Department; planned_start: string; planned_end: string; dependency?: string }) => void;
  existingNodes: Node[];
}

export function NewNodeModal({ isOpen, onClose, onCreate, existingNodes }: NewNodeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('Engineering');
  const [dependency, setDependency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [plannedStart, setPlannedStart] = useState(today);
  const [plannedEnd, setPlannedEnd] = useState(today);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure end date is not before start date
    const finalEnd = new Date(plannedEnd) < new Date(plannedStart) ? plannedStart : plannedEnd;

    onCreate({
      title,
      description,
      department,
      planned_start: plannedStart,
      planned_end: finalEnd,
      dependency: dependency || undefined,
    });
    // Reset form
    setTitle('');
    setDescription('');
    setDepartment('Engineering');
    setDependency('');
    setSearchQuery('');
    setPlannedStart(today);
    setPlannedEnd(today);
    onClose();
  };

  // Filter tasks based on search query
  const filteredNodes = existingNodes.filter(node => 
    node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 bg-black">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-100">Initialize New Node</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Node Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
              placeholder="e.g. Front Wing CFD"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Description</label>
            <input
              required
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
              placeholder="Task details..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Department</label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value as Department)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none hover:border-zinc-700 cursor-pointer"
            >
              <option value="PM">PM</option>
              <option value="Design">Design</option>
              <option value="Engineering">Engineering</option>
              <option value="Everyone">Everyone</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Start Date</label>
              <input
                required
                type="date"
                value={plannedStart}
                onChange={e => setPlannedStart(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">End Date</label>
              <input
                required
                type="date"
                value={plannedEnd}
                onChange={e => setPlannedEnd(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:border-zinc-500 outline-none"
              />
            </div>
          </div>

          {/* Task Dependency Picker */}
          <div className="space-y-2 pt-2 border-t border-zinc-900">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Dependency (Optional)</label>
              {dependency && (
                <button
                  type="button"
                  onClick={() => setDependency('')}
                  className="text-[9px] font-mono text-red-400 uppercase tracking-wider hover:text-red-300"
                >
                  [Clear None]
                </button>
              )}
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search active tasks to depend on..."
              className="w-full bg-black border border-zinc-850 rounded px-3 py-1.5 text-xs font-mono text-zinc-300 focus:border-zinc-600 outline-none"
            />

            <div className="border border-zinc-900 rounded bg-black max-h-[100px] overflow-y-auto divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
              <div 
                onClick={() => setDependency('')}
                className={`p-2 text-xs font-mono cursor-pointer transition-colors flex justify-between items-center ${!dependency ? 'bg-zinc-900 text-zinc-100 font-bold' : 'text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300'}`}
              >
                <span>None (No Dependency)</span>
                {!dependency && <span className="text-[10px] text-zinc-400">✓</span>}
              </div>
              {filteredNodes.length > 0 ? (
                filteredNodes.map(node => (
                  <div
                    key={node.id}
                    onClick={() => setDependency(node.id)}
                    className={`p-2 text-xs font-mono cursor-pointer transition-colors flex justify-between items-center ${dependency === node.id ? 'bg-zinc-900 text-zinc-100 font-bold border-l-2 border-zinc-300' : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-[10px] text-zinc-500">{node.id}</span>
                      <span>{node.title}</span>
                    </div>
                    {dependency === node.id && <span className="text-[10px] text-zinc-300">✓</span>}
                  </div>
                ))
              ) : (
                <div className="p-3 text-[10px] font-mono text-zinc-600 text-center">
                  No matching nodes found.
                </div>
              )}
            </div>
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
              Deploy Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
