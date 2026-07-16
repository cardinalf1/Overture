import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, Mail, Send, Calendar, DollarSign, Award, Target, HelpCircle } from 'lucide-react';
import { Node, ExpenditureItem } from '../types';
import { GanttChart } from './GanttChart';

interface PublicWelcomeProps {
  nodes: Node[];
  expenditures: ExpenditureItem[];
  simulatedDate: string;
  onRequestAccount: (email: string, notes: string) => Promise<void>;
}

export function PublicWelcome({
  nodes,
  expenditures,
  simulatedDate,
  onRequestAccount
}: PublicWelcomeProps) {
  const [emailInput, setEmailInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
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
      await onRequestAccount(emailInput.trim(), notesInput.trim());
      setSuccessMsg('✔ Registration request logged! The Team Administrator will provision your access profile.');
      setEmailInput('');
      setNotesInput('');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 font-sans px-4">
      
      {/* 1. Campaign Reallocation Progress (Financial Deck) */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="text-center">
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block font-bold">Campaign Reallocation Progress</span>
          <h2 className="text-lg font-mono font-bold text-zinc-200 uppercase tracking-wider mt-1">Secured Sponsor Contributions & Funding Stats</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-zinc-900 p-4 rounded text-center">
            <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">Target Campaign Budget</span>
            <span className="text-xl font-mono text-zinc-350 font-bold block mt-1">₹{totalBudgetNeeded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-black/40 border border-emerald-950/40 p-4 rounded text-center">
            <span className="text-[9px] font-mono text-emerald-500 block uppercase tracking-wider font-bold">Amount Secured (Pledged)</span>
            <span className="text-xl font-mono text-emerald-400 font-bold block mt-1">₹{totalBudgetPledged.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-zinc-900/10 border border-dashed border-zinc-800 p-4 rounded text-center">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase tracking-wider">Remaining Funding Gap</span>
            <span className="text-xl font-mono text-zinc-400 font-bold block mt-1">₹{totalBudgetRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>CAMPAIGN FUNDING PROGRESS</span>
            <span>{progressPercent}% SECURED</span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-700" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Centered Registration Form ("Register Now") */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-8 space-y-6 shadow-xl max-w-2xl mx-auto">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/30 border border-emerald-900/30 mb-2">
            <HeartHandshake className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-md font-mono font-bold text-zinc-100 uppercase tracking-wider">Become a Strategic Partner / Register Now</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase max-w-md mx-auto leading-relaxed">
            Pledge resources or back physical deliverables on our active roadmap. Request strategic credentials to access the secure partner cockpit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs max-w-lg mx-auto">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-450 uppercase block font-bold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-650" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="representative@yourorganization.com"
                className="w-full bg-black border border-zinc-900 rounded pl-10 pr-3 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-450 uppercase block font-bold">Organization Note / Message</label>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Acme Corp seeking sponsor credentials to back software licences and physical blocks."
              rows={3}
              className="w-full bg-black border border-zinc-900 rounded p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800 resize-none placeholder-zinc-800 transition-colors"
            />
          </div>

          {successMsg && (
            <div className="bg-emerald-950/20 text-emerald-450 border border-emerald-900/40 p-3 rounded text-[10px] text-center leading-relaxed font-bold uppercase">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !emailInput.trim()}
            className="w-full text-center bg-zinc-100 hover:bg-white text-black font-bold p-3 rounded transition-all uppercase tracking-widest text-[10px] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'LOGGING REQUEST...' : 'REGISTER / SUBMIT ACCESS REQUEST'}
          </button>
        </form>
      </div>

      {/* 3. Gantt Chart (Under the registration form, huge!) */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Target className="w-4 h-4 text-zinc-400" />
          <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase font-bold">Project Execution Milestones & Active Gantt Chart</span>
        </div>
        <div className="h-[650px] overflow-hidden">
          <GanttChart nodes={nodes} simulatedDate={simulatedDate} />
        </div>
      </div>
      
    </div>
  );
}
