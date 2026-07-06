import { Node, Role, Status } from '../types';

interface NodeListProps {
  nodes: Node[];
  currentRole: Role;
  onUpdateStatus: (id: string, status: Status) => void;
  onDeleteNode: (id: string) => void;
  onOpenCreateModal: () => void;
  isReadOnly?: boolean;
}

export function NodeList({ nodes, currentRole, onUpdateStatus, onDeleteNode, onOpenCreateModal, isReadOnly }: NodeListProps) {
  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Node Engine / Active Tasks</h2>
        <div className="flex items-center gap-3">
          {currentRole === 'PM' && !isReadOnly && (
            <button 
              onClick={onOpenCreateModal}
              className="text-[10px] font-mono bg-zinc-100 text-black px-3 py-1.5 rounded hover:bg-white transition-colors font-bold tracking-widest"
            >
              + NEW NODE
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="text-zinc-600 sticky top-0 bg-black z-10 border-b border-zinc-900 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-4 font-normal">ID</th>
              <th className="p-4 font-normal">Title</th>
              <th className="p-4 font-normal">Dept</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {nodes.map(node => (
              <tr key={node.id} className="hover:bg-zinc-900/30 transition-colors group">
                <td className="p-4 text-zinc-500">{node.id}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-zinc-200">{node.title}</span>
                    {node.dependency && (
                      <span className="text-[9px] text-zinc-500 font-mono tracking-wider mt-0.5">
                        DEP: <span className="text-zinc-400 font-bold border border-zinc-800 px-1 py-0.5 rounded bg-zinc-950">{node.dependency}</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-zinc-500">{node.department}</td>
                <td className="p-4">
                  {isReadOnly ? (
                    <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${
                      node.status === 'Completed' 
                        ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/40' 
                        : node.status === 'In Progress'
                          ? 'text-amber-400 bg-amber-950/20 border border-amber-900/40'
                          : 'text-zinc-500 bg-zinc-900/30 border border-zinc-800/40'
                    }`}>
                      {node.status}
                    </span>
                  ) : (
                    <select
                      value={node.status}
                      onChange={(e) => onUpdateStatus(node.id, e.target.value as Status)}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-1 rounded outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  )}
                </td>
                <td className="p-4 text-right">
                  {currentRole === 'PM' && !isReadOnly ? (
                    <button 
                      onClick={() => onDeleteNode(node.id)}
                      className="text-zinc-700 hover:text-white transition-colors"
                    >
                      [DEL]
                    </button>
                  ) : (
                    <span className="text-zinc-800">--</span>
                  )}
                </td>
              </tr>
            ))}
            {nodes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-600 font-mono text-xs">
                  No nodes visible for current role.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
