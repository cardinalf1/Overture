import { GitBranch } from 'lucide-react';
import { CadIteration } from '../types';

interface TopStatsProps {
  activeCadIteration: CadIteration | null;
}

export function TopStats({ activeCadIteration }: TopStatsProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-zinc-900 rounded-md">
          <GitBranch className="w-4 h-4 text-zinc-400" />
        </div>
        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Active CAD Iteration</h2>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-sm font-mono font-bold text-zinc-100">
              {activeCadIteration ? activeCadIteration.id : 'None'}
            </span>
            <span className="text-[10px] font-mono text-zinc-600">AERO</span>
          </div>
        </div>
      </div>
      <div className="text-[10px] font-mono text-zinc-500 bg-black border border-zinc-800 px-2 py-1 rounded">
        {activeCadIteration ? `Status: ${activeCadIteration.status}` : 'No active iteration'}
      </div>
    </div>
  );
}
