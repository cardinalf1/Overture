import React from 'react';
import { Node, Role, Status } from '../types';

interface ChatAssistantProps {
  nodes: Node[];
  currentRole: Role;
  simulatedDate: string;
  onUpdateStatus: (id: string, status: Status) => void;
  onCreateNode: (node: Omit<Node, 'id' | 'actual_start' | 'actual_end'>) => void;
  onDeleteNode: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatAssistant({ isOpen }: ChatAssistantProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">AI Command Assistant</h2>
      <p className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
        This feature has been disabled by the administrator.
      </p>
    </div>
  );
}
