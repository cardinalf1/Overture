import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartHandshake, GanttChart as ChartIcon, FileText, Info, 
  Mail, Send, CheckCircle, ShieldCheck, DollarSign
} from 'lucide-react';
import { Node, ExpenditureItem, CadIteration } from '../types';
import { GanttChart } from './GanttChart';
import { TopStats } from './TopStats';

interface PublicWelcomeProps {
  nodes: Node[];
  expenditures: ExpenditureItem[];
  simulatedDate: string;
  activeCadIteration: CadIteration | null;
  onRequestAccount: (email: string) => Promise<void>;
}

export function PublicWelcome({
  nodes,
  expenditures,
  simulatedDate,
  activeCadIteration,
  onRequestAccount
}: PublicWelcomeProps) {
  const [emailInput, setEmailInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Math totals
  const totalBudgetNeeded = expenditures.reduce((acc, item) => acc + item.cost, 0);
  const totalBudgetPledged = expenditures
    .filter(item => item.status === 'Pledged')
    .reduce((acc, item) => acc + item.cost, 0);
  const totalBudgetRemaining = totalBudgetNeeded - totalBudgetPledged;
  const progressPercent = totalBudgetNeeded > 0 ? Math.round((totalBudgetPledged / totalBudgetNeeded) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setSubmitting(true);
    setSuccessMsg('');

    try {
      await onRequestAccount(emailInput.trim());
      setSuccessMsg('✔ Request logged! The Team Administrator will email your credentials.');
      setEmailInput('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner / Hero */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
            <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase font-bold">PUBLIC GATEWAY</span>
          </div>
          <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-wider mt-0.5">Cardinal Overture F1 Campaign</h1>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase">Browse our development timeline and procurement goals. Request sponsor credentials to back open resources.</p>
        </div>
      </div>

      {/* Stats Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Gantt Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gantt */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartIcon className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase font-bold">Project Execution Gantt</span>
            </div>
            <div className="h-96">
              <GanttChart nodes={nodes} simulatedDate={simulatedDate} />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase font-bold">Campaign Procurement Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-[10px] text-zinc-650 uppercase tracking-widest">
                    <th className="pb-3 font-normal">ITEM & REQUISITION</th>
                    <th className="pb-3 font-normal">CATEGORY</th>
                    <th className="pb-3 font-normal">COST</th>
                    <th className="pb-3 font-normal">NEEDED DATE</th>
                    <th className="pb-3 font-normal text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {expenditures.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3.5 pr-4">
                        <span className="text-zinc-200 font-bold block">{item.item_name}</span>
                        <span className="text-[9px] text-zinc-600 uppercase">ID: {item.id}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="bg-zinc-900/50 border border-zinc-900 text-zinc-450 px-2 py-0.5 rounded text-[9px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-300 font-bold">
                        ${item.cost.toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-500">
                        {item.needed_by}
                      </td>
                      <td className="py-3.5 text-right">
                        {item.status === 'Pledged' ? (
                          <span className="text-emerald-400 font-bold uppercase text-[9px] flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Pledged
                          </span>
                        ) : (
                          <span className="text-zinc-600 uppercase text-[9px] font-bold">
                            ○ Open Resource
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Budget Statistics & Request Account */}
        <div className="space-y-6">
          {/* Budget stats */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
            <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block font-bold">Campaign Reallocation Progress</span>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/55 border border-zinc-900 p-3 rounded text-center">
                <span className="text-[8px] font-mono text-zinc-500 block uppercase">GOAL</span>
                <span className="text-xs font-mono text-zinc-200 font-bold">${totalBudgetNeeded.toFixed(0)}</span>
              </div>
              <div className="bg-black/55 border border-emerald-950/40 p-3 rounded text-center">
                <span className="text-[8px] font-mono text-emerald-500 block uppercase">PLEDGED</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">${totalBudgetPledged.toFixed(0)}</span>
              </div>
              <div className="bg-zinc-900/10 border border-dashed border-zinc-800 p-3 rounded text-center">
                <span className="text-[8px] font-mono text-zinc-400 block uppercase">GAP</span>
                <span className="text-xs font-mono text-zinc-400 font-bold">${totalBudgetRemaining.toFixed(0)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>TOTAL SECURED</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Account Request form */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-zinc-200">
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Become a strategic partner</span>
            </div>

            <p className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
              If your brand or organization wishes to pledge support for any open resources, please request secure credentials below. Our Lead Administrator will provision your access profile.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase block font-bold">Email Identifier</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="partner@yourbrand.com"
                    className="w-full bg-black border border-zinc-900 rounded pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                  />
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 p-2 rounded text-[9px] text-center leading-relaxed">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !emailInput.trim()}
                className="w-full text-center bg-zinc-100 hover:bg-white text-black font-bold p-2.5 rounded transition-all uppercase tracking-widest text-[10px] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'LOGGING REQUEST...' : 'REQUEST PARTNER ACCESS'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
