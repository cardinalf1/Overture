import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Upload, Copy, Check, Database } from 'lucide-react';
import { Role } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: Role;
  simulatedDate: string;
  onDateChange: (newDate: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  currentRole, 
  simulatedDate, 
  onDateChange,
  onExport,
  onImport
}: SettingsModalProps) {
  const [dateInput, setDateInput] = useState(simulatedDate);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    setDateInput(simulatedDate);
  }, [simulatedDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'PM') {
      onDateChange(dateInput);
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sqlScript = `-- 1. Expenditures and Sponsor Pledges Table
CREATE TABLE IF NOT EXISTS expenditures (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  cost NUMERIC NOT NULL,
  category TEXT NOT NULL,
  needed_by DATE NOT NULL,
  status TEXT DEFAULT 'Pending',
  pledged_by_email TEXT,
  pledged_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS) for Expenditures
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON expenditures;
DROP POLICY IF EXISTS "Auth Modification Access" ON expenditures;

-- Anonymous users (and all authenticated profiles) can read expenditures
CREATE POLICY "Public Read Access" ON expenditures
  FOR SELECT USING (true);

-- Authenticated team members and sponsors can update to insert or pledge
CREATE POLICY "Auth Modification Access" ON expenditures
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. News and Project Reports Table
CREATE TABLE IF NOT EXISTS news_updates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  author TEXT NOT NULL
);

ALTER TABLE news_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public News Read" ON news_updates;
DROP POLICY IF EXISTS "Authenticated News Write" ON news_updates;

CREATE POLICY "Public News Read" ON news_updates FOR SELECT USING (true);
CREATE POLICY "Authenticated News Write" ON news_updates FOR ALL USING (auth.role() = 'authenticated');

-- 3. Judge Feedback & Scorecard Table
CREATE TABLE IF NOT EXISTS judge_feedback (
  id TEXT PRIMARY KEY,
  judge_email TEXT NOT NULL,
  judge_name TEXT NOT NULL,
  category TEXT NOT NULL,
  score INTEGER NOT NULL,
  comments TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE judge_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Feedback Read" ON judge_feedback;
DROP POLICY IF EXISTS "Authenticated Feedback Write" ON judge_feedback;

CREATE POLICY "Public Feedback Read" ON judge_feedback FOR SELECT USING (true);
CREATE POLICY "Authenticated Feedback Write" ON judge_feedback FOR ALL USING (auth.role() = 'authenticated');

-- 4. Pending account requests
CREATE TABLE IF NOT EXISTS account_requests (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE account_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public request inserts" ON account_requests;
DROP POLICY IF EXISTS "Authenticated request controls" ON account_requests;

CREATE POLICY "Public request inserts" ON account_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated request controls" ON account_requests FOR ALL USING (auth.role() = 'authenticated');

-- 5. Authorized Users Table
CREATE TABLE IF NOT EXISTS authorized_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Team', 'Sponsor', 'Judge')),
  password TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_greenlit BOOLEAN DEFAULT FALSE
);

ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Authorized" ON authorized_users;
DROP POLICY IF EXISTS "Admin Write Authorized" ON authorized_users;
CREATE POLICY "Public Read Authorized" ON authorized_users FOR SELECT USING (true);
CREATE POLICY "Admin Write Authorized" ON authorized_users FOR ALL USING (auth.role() = 'authenticated');


-- 6. Sponsor Commitments Table
CREATE TABLE IF NOT EXISTS sponsor_commitments (
  id TEXT PRIMARY KEY,
  sponsor_email TEXT NOT NULL,
  sponsor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('In Queue', 'In Progress', 'Fulfilled')),
  assigned_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sponsor_commitments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public commitments read" ON sponsor_commitments;
DROP POLICY IF EXISTS "Auth commitments write" ON sponsor_commitments;
CREATE POLICY "Public commitments read" ON sponsor_commitments FOR SELECT USING (true);
CREATE POLICY "Auth commitments write" ON sponsor_commitments FOR ALL USING (auth.role() = 'authenticated');

-- 7. Nodes (Gantt Milestones) Table
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL,
  planned_start TEXT NOT NULL,
  planned_end TEXT NOT NULL,
  actual_start TEXT,
  actual_end TEXT,
  dependency TEXT
);

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public nodes read" ON nodes;
DROP POLICY IF EXISTS "Auth nodes write" ON nodes;
CREATE POLICY "Public nodes read" ON nodes FOR SELECT USING (true);
CREATE POLICY "Auth nodes write" ON nodes FOR ALL USING (auth.role() = 'authenticated');

-- 8. CAD Iterations Table
CREATE TABLE IF NOT EXISTS cad_iterations (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  cad_file_ref TEXT NOT NULL,
  weight_grams NUMERIC NOT NULL,
  drag_coefficient_cd NUMERIC NOT NULL,
  status TEXT NOT NULL,
  model_url TEXT,
  model_name TEXT
);

ALTER TABLE cad_iterations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public iterations read" ON cad_iterations;
DROP POLICY IF EXISTS "Auth iterations write" ON cad_iterations;
CREATE POLICY "Public iterations read" ON cad_iterations FOR SELECT USING (true);
CREATE POLICY "Auth iterations write" ON cad_iterations FOR ALL USING (auth.role() = 'authenticated');

-- 9. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE cad_iterations;
ALTER PUBLICATION supabase_realtime ADD TABLE expenditures;
ALTER PUBLICATION supabase_realtime ADD TABLE news_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE judge_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE authorized_users;
ALTER PUBLICATION supabase_realtime ADD TABLE account_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE sponsor_commitments;
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-black">
          <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-100">System Settings & Sync</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
          {/* Date Settings */}
          <form id="settings-form" onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Simulated System Date
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              disabled={currentRole !== 'PM'}
              className="bg-black border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            {currentRole !== 'PM' && (
              <p className="text-[10px] font-mono text-rose-500 mt-1">
                Only PM (Admin) can change the system date.
              </p>
            )}
          </form>

          {/* Database Setup Helper (Supabase SQL) */}
          <div className="flex flex-col gap-3 pt-6 border-t border-zinc-900">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                SUPABASE DB SETUP (SQL)
              </label>
              <button 
                onClick={() => setShowSql(!showSql)}
                className="text-[9px] font-mono text-zinc-400 hover:text-white uppercase px-2 py-1 bg-zinc-900 rounded border border-zinc-800"
              >
                {showSql ? 'HIDE SQL CODE' : 'SHOW SQL CODE'}
              </button>
            </div>
            
            {showSql && (
              <div className="space-y-3">
                <p className="text-[10px] font-mono text-zinc-400 uppercase leading-relaxed">
                  To host private dashboards on Supabase and enable sponsorship pledges & judge scores, run the following SQL schema inside your Supabase SQL Editor:
                </p>
                <div className="relative">
                  <pre className="bg-black border border-zinc-900 rounded p-4 text-[9px] font-mono text-zinc-400 max-h-48 overflow-y-auto overflow-x-auto whitespace-pre leading-relaxed uppercase">
                    {sqlScript}
                  </pre>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 p-1.5 rounded transition-colors"
                    title="Copy SQL Code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Data Management */}
          <div className="flex flex-col gap-4 pt-6 border-t border-zinc-900">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              System Data Management
            </label>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onExport}
                className="flex items-center justify-center gap-2 w-full bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded text-xs font-mono hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                EXPORT SYSTEM DATA (CSV)
              </button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={currentRole !== 'PM'}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={currentRole !== 'PM'}
                  className="flex items-center justify-center gap-2 w-full bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded text-xs font-mono hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-300"
                >
                  <Upload className="w-4 h-4" />
                  IMPORT SYSTEM DATA (CSV)
                </button>
              </div>
              {currentRole !== 'PM' && (
                <p className="text-[10px] font-mono text-rose-500 text-center">
                  Only PM (Admin) can import system data.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-zinc-900 bg-black">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="submit"
            form="settings-form"
            disabled={currentRole !== 'PM'}
            className="px-4 py-2 text-xs font-mono bg-zinc-100 text-black rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold uppercase"
          >
            SAVE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
}

