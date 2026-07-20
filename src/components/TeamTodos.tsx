import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, User, Calendar, Edit2, ListTodo } from 'lucide-react';
import { Node, Department, Status, AuthorizedUser } from '../types';

interface TeamTodosProps {
  nodes: Node[];
  authorizedUsers: AuthorizedUser[];
  currentRole: 'PM' | 'Design' | 'Engineering';
  onAddTodo: (todo: { title: string; description: string; department: Department; planned_start: string; planned_end: string; dependency?: string; assigned_to?: string | null }) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onDeleteTodo: (id: string) => void;
  onAssignTodo: (id: string, assignedTo: string | null) => void;
  onEditTodo: (id: string, updatedTodo: Node) => void;
  isAdmin: boolean;
}

export function TeamTodos({
  nodes,
  authorizedUsers,
  currentRole,
  onAddTodo,
  onUpdateStatus,
  onDeleteTodo,
  onAssignTodo,
  onEditTodo,
  isAdmin,
}: TeamTodosProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('Everyone');
  const [assignedTo, setAssignedTo] = useState('');
  const [plannedStart, setPlannedStart] = useState(new Date().toISOString().split('T')[0]);
  const [plannedEnd, setPlannedEnd] = useState(new Date().toISOString().split('T')[0]);
  const [dependency, setDependency] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDepartment, setEditDepartment] = useState<Department>('Everyone');
  const [editAssignedTo, setEditAssignedTo] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Status>('To Do');
  const [editPlannedStart, setEditPlannedStart] = useState('');
  const [editPlannedEnd, setEditPlannedEnd] = useState('');
  const [editDependency, setEditDependency] = useState('');

  // Filter team members
  const teamMembers = authorizedUsers.filter(u => u.role === 'Team');

  const startEditing = (node: Node) => {
    setEditingId(node.id);
    setEditTitle(node.title);
    setEditDescription(node.description || '');
    setEditDepartment(node.department);
    setEditAssignedTo(node.assigned_to || null);
    setEditStatus(node.status);
    setEditPlannedStart(node.planned_start);
    setEditPlannedEnd(node.planned_end);
    setEditDependency(node.dependency || '');
  };

  const handleSave = (id: string) => {
    if (!editTitle || !editPlannedStart || !editPlannedEnd) return;

    const originalNode = nodes.find(n => n.id === id);
    const updatedNode: Node = {
      id,
      title: editTitle,
      description: editDescription,
      department: editDepartment,
      status: editStatus,
      planned_start: editPlannedStart,
      planned_end: editPlannedEnd,
      actual_start: originalNode?.actual_start || null,
      actual_end: originalNode?.actual_end || null,
      dependency: editDependency || undefined,
      assigned_to: editAssignedTo || null,
    };

    onEditTodo(id, updatedNode);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !plannedStart || !plannedEnd) return;

    onAddTodo({
      title,
      description,
      department,
      planned_start: plannedStart,
      planned_end: plannedEnd,
      dependency: dependency || undefined,
      assigned_to: assignedTo || null,
    });

    setTitle('');
    setDescription('');
    setDepartment('Everyone');
    setAssignedTo('');
    setDependency('');
    setIsAdding(false);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">TEAM TASK BOARD</span>
          <h2 className="text-sm font-mono font-bold text-zinc-100 tracking-wider uppercase">Operational To-Dos & Campaign Assignments</h2>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 text-xs font-mono bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {isAdding ? 'CANCEL' : 'ADD TO-DO'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-black border border-zinc-900 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design physical sidepod contours"
                className="w-full bg-zinc-955 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-205 focus:outline-none focus:border-zinc-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Optimize air intake flows and milling bounds"
                className="w-full bg-zinc-955 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-205 focus:outline-none focus:border-zinc-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full bg-zinc-955 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-205 focus:outline-none"
              >
                <option value="Everyone">Everyone</option>
                <option value="PM">PM & Management</option>
                <option value="Design">Design & Styling</option>
                <option value="Engineering">Engineering & R&D</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-205 focus:outline-none"
              >
                <option value="">-- Unassigned --</option>
                {teamMembers.map(u => (
                  <option key={u.email} value={u.email}>{u.notes || u.email}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Planned Start Date</label>
              <input
                type="date"
                required
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-205 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Planned End Date</label>
              <input
                type="date"
                required
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-205 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Dependency Task</label>
              <select
                value={dependency}
                onChange={(e) => setDependency(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-205 focus:outline-none"
              >
                <option value="">-- None --</option>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.id} : {n.title}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 lg:col-span-2 flex items-end justify-end">
              <button
                type="submit"
                className="w-full lg:w-auto bg-zinc-100 hover:bg-white text-black font-mono text-xs font-bold px-6 py-2 rounded transition-colors"
              >
                ADD TO-DO TASK
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest">
              <th className="pb-3 font-normal">TASK DETAIL</th>
              <th className="pb-3 font-normal">DEPARTMENT</th>
              <th className="pb-3 font-normal">TIMELINE</th>
              <th className="pb-3 font-normal">ASSIGNED TO</th>
              <th className="pb-3 font-normal">STATUS</th>
              <th className="pb-3 font-normal text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {nodes.map(node => {
              const isEditing = editingId === node.id;

              if (isEditing) {
                return (
                  <tr key={node.id} className="bg-zinc-900/20">
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                          placeholder="Task Title"
                        />
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="bg-black border border-zinc-800 rounded px-2 py-0.5 text-[11px] text-zinc-400 focus:outline-none"
                          placeholder="Description"
                        />
                        <select
                          value={editDependency}
                          onChange={(e) => setEditDependency(e.target.value)}
                          className="bg-black border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-zinc-400 focus:outline-none w-full"
                        >
                          <option value="">-- No Dependency --</option>
                          {nodes.filter(n => n.id !== node.id).map(n => (
                            <option key={n.id} value={n.id}>{n.id} : {n.title}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value as Department)}
                        className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-350 focus:outline-none"
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="PM">PM & Management</option>
                        <option value="Design">Design & Styling</option>
                        <option value="Engineering">Engineering & R&D</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <input
                          type="date"
                          value={editPlannedStart}
                          onChange={(e) => setEditPlannedStart(e.target.value)}
                          className="bg-black border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-450 focus:outline-none"
                        />
                        <input
                          type="date"
                          value={editPlannedEnd}
                          onChange={(e) => setEditPlannedEnd(e.target.value)}
                          className="bg-black border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-450 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={editAssignedTo || ''}
                        onChange={(e) => setEditAssignedTo(e.target.value || null)}
                        className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map(u => (
                          <option key={u.email} value={u.email}>{u.notes || u.email}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as Status)}
                        className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleSave(node.id)}
                          className="bg-zinc-100 hover:bg-white text-black font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                        >
                          SAVE
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-450 hover:text-white px-2 py-1 rounded text-[10px] cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={node.id} className="hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-bold block">{node.title}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{node.description || 'No description provided.'}</span>
                      {node.dependency && (
                        <span className="text-[9px] text-zinc-650 uppercase mt-1">
                          Requires: <span className="text-zinc-400 font-semibold border border-zinc-900 px-1 py-0.2 rounded bg-zinc-950/40">{node.dependency}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-450">
                    <span className="bg-zinc-900/50 border border-zinc-900 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                      {node.department}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-500 text-[10px] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{node.planned_start} ➔ {node.planned_end}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-400 text-[11px]">
                    {isAdmin ? (
                      <select
                        value={node.assigned_to || ''}
                        onChange={(e) => onAssignTodo(node.id, e.target.value || null)}
                        className="bg-zinc-950 border border-zinc-900 rounded text-zinc-350 text-[11px] px-2 py-1 outline-none max-w-[120px] cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map(u => (
                          <option key={u.email} value={u.email}>{u.notes || u.email}</option>
                        ))}
                      </select>
                    ) : (
                      <span>
                        {node.assigned_to 
                          ? (teamMembers.find(t => t.email === node.assigned_to)?.notes || node.assigned_to)
                          : 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    {isAdmin || node.department === currentRole || node.department === 'Everyone' ? (
                      <select
                        value={node.status}
                        onChange={(e) => onUpdateStatus(node.id, e.target.value as Status)}
                        className="bg-zinc-950 border border-zinc-900 rounded text-zinc-300 text-[11px] px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold border ${
                        node.status === 'Completed' 
                           ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40' 
                           : node.status === 'In Progress'
                             ? 'text-amber-400 bg-amber-950/20 border-amber-900/40'
                             : 'text-zinc-550 bg-zinc-900/30 border-zinc-800/40'
                      }`}>
                        {node.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right font-mono">
                    {isAdmin ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                           onClick={() => startEditing(node)}
                           className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded transition-all cursor-pointer"
                           title="Edit Task"
                         >
                           <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                           onClick={() => onDeleteTodo(node.id)}
                           className="text-zinc-600 hover:text-rose-450 p-1.5 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 rounded transition-all cursor-pointer"
                           title="Delete Task"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-800">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {nodes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-650 font-mono text-xs">
                  No operational task records discovered in local database context.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
