import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, UserPlus, Trash2, Mail, CheckCircle2, UserCheck, 
  Lock, Copy, Check, Info, HelpCircle, Key, RefreshCw, Eye, EyeOff, Send, Edit2
} from 'lucide-react';
import { AuthorizedUser } from '../types';

interface AccessControlPanelProps {
  authorizedUsers: AuthorizedUser[];
  onAddAuthorizedUser: (user: Omit<AuthorizedUser, 'id'>) => void;
  onDeleteAuthorizedUser: (id: string) => void;
  onUpdateAuthorizedUser: (user: AuthorizedUser) => void;
  accountRequests: any[];
  onDeleteAccountRequest: (id: string) => void;
}

const generateRandomPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

export function AccessControlPanel({
  authorizedUsers,
  onAddAuthorizedUser,
  onDeleteAuthorizedUser,
  onUpdateAuthorizedUser,
  accountRequests,
  onDeleteAccountRequest
}: AccessControlPanelProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Team' | 'Sponsor' | 'Judge'>('Sponsor');
  const [department, setDepartment] = useState<'Design' | 'Engineering' | 'PM'>('Design');
  const [password, setPassword] = useState(() => generateRandomPassword());
  const [notes, setNotes] = useState('');
  const [greenlightImmediately, setGreenlightImmediately] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedKit, setCopiedKit] = useState(false);

  // Inline editing state variables
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'Admin' | 'Team' | 'Sponsor' | 'Judge'>('Sponsor');
  const [editDepartment, setEditDepartment] = useState<'Design' | 'Engineering' | 'PM'>('Design');
  const [editPassword, setEditPassword] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const startEdit = (user: AuthorizedUser) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
    setEditPassword(user.password || '');
    setEditNotes(user.notes || '');
    setEditDepartment(user.department || 'Design');
  };

  const cancelEdit = () => {
    setEditingUserId(null);
  };

  const saveEdit = (user: AuthorizedUser) => {
    onUpdateAuthorizedUser({
      ...user,
      role: editRole,
      password: editPassword,
      notes: editNotes,
      department: editRole === 'Admin' ? 'PM' : (editRole === 'Team' ? editDepartment : undefined)
    });
    setEditingUserId(null);
  };

  const handleRegeneratePassword = () => {
    setPassword(generateRandomPassword());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    // Check if email already authorized
    if (authorizedUsers.some(u => u.email.toLowerCase().trim() === email.toLowerCase().trim())) {
      alert(`The email "${email}" is already pre-authorized in this system.`);
      return;
    }

    onAddAuthorizedUser({
      email: email.toLowerCase().trim(),
      role,
      password: password.trim(),
      notes: notes || `Assigned ${role} credentials`,
      is_greenlit: greenlightImmediately,
      department: role === 'Admin' ? 'PM' : (role === 'Team' ? department : undefined)
    });

    setSuccessMsg(`✔ Account pre-configured for ${emailLower(email)} with designated password.`);
    setTimeout(() => setSuccessMsg(null), 4000);

    setEmail('');
    setNotes('');
    setPassword(generateRandomPassword());
  };

  const emailLower = (str: string) => str.toLowerCase().trim();

  const copyLoginKit = (user: AuthorizedUser) => {
    const kitText = `=========================================
CARDINAL OVERTURE F1 SECURE PORTAL
=========================================
Your secure credentials have been provisioned:

- Workspace URL: ${window.location.origin}
- Username/Email: ${user.email}
- Password: ${user.password || '(Contact Team)'}
- Access Profile: ${user.role}

All car designs, aerodynamic simulation matrices, and financial
data are protected. Log in to view our workspace securely.
=========================================`;

    navigator.clipboard.writeText(kitText);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCustomInvite = () => {
    const kitText = `=========================================
CARDINAL OVERTURE F1 SECURE PORTAL
=========================================
We have provisioned your access credentials:

- Workspace URL: ${window.location.origin}
- Username/Email: ${email || '[User Email]'}
- Temporary Password: ${password}
- Access Profile: ${role}

Please use these credentials to sign in directly.
=========================================`;

    navigator.clipboard.writeText(kitText);
    setCopiedKit(true);
    setTimeout(() => setCopiedKit(false), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">SECURE CREDENTIALS RAIL</span>
          <h1 className="text-xl font-mono font-bold text-zinc-100 tracking-tight uppercase flex items-center gap-2">
            <Lock className="w-5 h-5 text-zinc-400" />
            Access Authorization Engine
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register/Authorize form */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-zinc-100 font-bold uppercase text-xs">
              <UserPlus className="w-4 h-4 text-zinc-400" />
              <span>Provision User Credentials</span>
            </div>
            
            <p className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
              Define the exact login credentials (Email & Password) for your partners, sponsors, or judges. Only they will be allowed to log in; public registration is disabled.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">EMAIL IDENTIFIER</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@sponsorcorp.com"
                    className="w-full bg-black border border-zinc-900 rounded pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-850 focus:outline-none focus:border-zinc-800 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">DESIGNATED PASSWORD</label>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="text-[9px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 uppercase tracking-wider"
                    title="Generate Random Password"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded pl-9 pr-10 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-600 hover:text-zinc-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">ACCESS PROFILE</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-black border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800 transition-colors"
                >
                  <option value="Admin">System Administrator (Admin)</option>
                  <option value="Team">Team Member</option>
                  <option value="Sponsor">Sponsor / Partner</option>
                  <option value="Judge">Judge / Evaluator</option>
                </select>
              </div>

              {/* Department Select (For Team role only) */}
              {role === 'Team' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">ASSIGNED DEPARTMENT</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full bg-black border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800 transition-colors"
                  >
                    <option value="Design">Design</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">ADMIN NOTES / ORGANIZATION</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Platinum Sponsor, Intel Corp"
                  className="w-full bg-black border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-850 focus:outline-none focus:border-zinc-800 transition-colors"
                />
              </div>

              {/* Greenlight toggle on creation */}
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="greenlight-checkbox"
                  checked={greenlightImmediately}
                  onChange={(e) => setGreenlightImmediately(e.target.checked)}
                  className="rounded border-zinc-900 bg-black text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                />
                <label htmlFor="greenlight-checkbox" className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase cursor-pointer">
                  GREENLIGHT ACCOUNT IMMEDIATELY
                </label>
              </div>

              <button
                type="submit"
                className="w-full text-xs font-mono bg-zinc-100 hover:bg-white text-black py-2.5 rounded font-bold uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                CREATE ACCOUNT CREDENTIALS
              </button>
            </form>

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-emerald-950/20 border border-emerald-900/40 rounded p-3 text-[10px] font-mono text-emerald-400 uppercase text-center"
                >
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Guide */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-zinc-200 font-bold uppercase text-xs">
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              <span>CREDENTIAL DELIVERY</span>
            </div>
            
            <p className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
              Copy the complete login welcome letter containing the designated password below to send directly to your partner via email or message:
            </p>

            <button
              onClick={copyCustomInvite}
              className="w-full text-[10px] font-mono bg-zinc-900 hover:bg-zinc-850 text-zinc-300 py-2 border border-zinc-800 hover:border-zinc-700 rounded transition-colors flex items-center justify-center gap-2 uppercase cursor-pointer"
            >
              {copiedKit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Send className="w-3.5 h-3.5" />}
              {copiedKit ? 'COPIED WELCOME KIT!' : 'COPY WELCOME EMAIL KIT'}
            </button>
          </div>
        </div>

        {/* Right Column: Live Authorized User list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">ENFORCED LIST</span>
                <h3 className="text-sm font-mono font-bold text-zinc-100 tracking-wider uppercase">Active Access Authorization Entries</h3>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900/50 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">
                {authorizedUsers.length} Active Accounts
              </span>
            </div>

            <div className="overflow-x-auto">              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] text-zinc-500 uppercase tracking-widest">
                    <th className="pb-3 font-normal">EMAIL ADDRESS</th>
                    <th className="pb-3 font-normal">ACCESS LEVEL</th>
                    <th className="pb-3 font-normal">ASSIGNED PASSWORD</th>
                    <th className="pb-3 font-normal">STATUS</th>
                    <th className="pb-3 font-normal">MEMORANDUM / NOTES</th>
                    <th className="pb-3 font-normal text-right">DISPATCH / ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {authorizedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-600 uppercase text-[10px] leading-relaxed">
                        <ShieldAlert className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
                        NO AUTHORIZED USERS REGISTERED YET.<br />
                        CREATE A SPONSOR OR JUDGE ACCOUNT ON THE LEFT.
                      </td>
                    </tr>
                  ) : (
                    authorizedUsers.map(user => {
                      const isEditing = user.id === editingUserId;
                      const isPassVisible = !!visiblePasswords[user.id];
                      return (
                        <tr key={user.id} className="hover:bg-zinc-900/10 transition-all align-middle">
                          <td className="py-3.5 text-zinc-200 pr-4 font-bold max-w-[140px] truncate" title={user.email}>
                            {user.email}
                          </td>
                          <td className="py-3.5 pr-4">
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5">
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value as any)}
                                  className="bg-black border border-zinc-900 rounded px-1.5 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Team">Team</option>
                                  <option value="Sponsor">Sponsor</option>
                                  <option value="Judge">Judge</option>
                                </select>
                                {editRole === 'Team' && (
                                  <select
                                    value={editDepartment}
                                    onChange={(e) => setEditDepartment(e.target.value as any)}
                                    className="bg-black border border-zinc-900 rounded px-1.5 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                                  >
                                    <option value="Design">Design</option>
                                    <option value="Engineering">Engineering</option>
                                  </select>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border text-center ${
                                  user.role === 'Admin'
                                    ? 'bg-purple-950/20 text-purple-400 border-purple-900/40'
                                    : user.role === 'Team' 
                                    ? 'bg-amber-950/20 text-amber-400 border-amber-900/40' 
                                    : user.role === 'Sponsor'
                                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40'
                                    : 'bg-blue-950/20 text-blue-400 border-blue-900/40'
                                }`}>
                                  {user.role}
                                </span>
                                {user.role === 'Team' && user.department && (
                                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-center mt-0.5">
                                    Dept: {user.department}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 text-zinc-300">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="bg-black border border-zinc-900 rounded px-1.5 py-1 text-[11px] font-mono text-zinc-200 w-24 focus:outline-none focus:border-zinc-800"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="text-[11px]">
                                  {isPassVisible ? (user.password || '—') : '••••••••'}
                                </span>
                                <button
                                  onClick={() => togglePasswordVisibility(user.id)}
                                  className="text-zinc-650 hover:text-zinc-400"
                                  title="Toggle Visibility"
                                >
                                  {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 pr-4">
                            <button
                              onClick={() => {
                                onUpdateAuthorizedUser({
                                  ...user,
                                  is_greenlit: !user.is_greenlit
                                });
                              }}
                              className={`text-[9px] font-mono uppercase px-2.5 py-1 rounded-full border transition-colors cursor-pointer font-bold ${
                                user.is_greenlit
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/20'
                                  : 'bg-zinc-900/60 text-zinc-500 border-zinc-800/60 hover:bg-zinc-800/30'
                              }`}
                              title={user.is_greenlit ? "Click to suspend / make dormant" : "Click to greenlight account"}
                            >
                              {user.is_greenlit ? '● GREENLIT' : '○ DORMANT'}
                            </button>
                          </td>
                          <td className="py-3.5 text-zinc-400 pr-4 max-w-[150px] truncate" title={user.notes}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="bg-black border border-zinc-900 rounded px-1.5 py-1 text-[11px] font-mono text-zinc-200 w-full focus:outline-none focus:border-zinc-800"
                              />
                            ) : (
                              user.notes || '-'
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(user)}
                                    className="text-[10px] font-mono text-emerald-400 hover:text-white px-2 py-1 rounded bg-emerald-950/20 border border-emerald-900/40 hover:bg-emerald-900/50 transition-colors uppercase font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => copyLoginKit(user)}
                                    className="text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-1 transition-all"
                                    title="Copy Login Kit for User"
                                  >
                                    {copiedId === user.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span>COPIED</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>KIT</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => startEdit(user)}
                                    className="text-zinc-500 hover:text-white p-1 rounded transition-colors cursor-pointer"
                                    title="Edit details"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Revoke authorization and delete account credentials for "${user.email}"?`)) {
                                        onDeleteAuthorizedUser(user.id);
                                      }
                                    }}
                                    className="text-zinc-650 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                                    title="Revoke Permission"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-black/40 border border-zinc-900 rounded p-4 flex items-start gap-3 mt-4 text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
              <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-zinc-300 font-bold block mb-1">PRIVACY COMPLIANCE NOTICE</span>
                ALL DATA ASSOCIATED WITH CAR ITERATIONS, DESIGN SPECIFICATIONS, WIND-TUNNEL ANALYSIS, AND SPONSOR PROCUREMENT REMAIN FULLY ENCRYPTED AND VISIBLE ONLY TO AUTHORIZED ACCOUNTS REGISTERED IN THIS REPOSITORY. UNREGISTERED GUESTS OR SYSTEM BROWSERS CANNOT DISCOVER SYSTEM DATA AS CONTROLLERS MANDATE TOKEN MATCHES IN SUPABASE ROW-LEVEL SECURITY POLICIES.
              </div>
            </div>

            {/* Supabase SQL Assistant Section */}
            <details className="group border border-zinc-900 rounded mt-4 bg-zinc-950">
              <summary className="flex justify-between items-center p-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest cursor-pointer select-none group-open:border-b group-open:border-zinc-900">
                <span>⚡ SUPABASE SQL DATABASE MIGRATION GUIDE</span>
                <span className="text-zinc-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
                  Run the following SQL snippet in your Supabase SQL Editor to make sure the Authorization table supports admin-created passwords:
                </p>
                <div className="relative">
                  <pre className="bg-black text-[9px] text-zinc-300 font-mono p-3 rounded border border-zinc-900 overflow-x-auto select-all whitespace-pre">
{`-- Run this to update existing tables to support greenlighting:
ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS is_greenlit BOOLEAN DEFAULT FALSE;

-- Update admin accounts to be greenlit automatically:
UPDATE authorized_users SET is_greenlit = TRUE WHERE email LIKE '%@cardinalsystems.org';

-- Schema Table Definitions:
CREATE TABLE IF NOT EXISTS authorized_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Team', 'Sponsor', 'Judge')),
  password TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_greenlit BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS account_requests (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Enable Row-Level Security (RLS)
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_commitments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Read Authorized" ON authorized_users;
DROP POLICY IF EXISTS "Admin Write Authorized" ON authorized_users;
DROP POLICY IF EXISTS "Public request inserts" ON account_requests;
DROP POLICY IF EXISTS "Authenticated request controls" ON account_requests;
DROP POLICY IF EXISTS "Public commitments read" ON sponsor_commitments;
DROP POLICY IF EXISTS "Auth commitments write" ON sponsor_commitments;

-- Security Policies (Permits writes from both standard Auth and direct password session which runs as anon)
CREATE POLICY "Public Read Authorized" ON authorized_users FOR SELECT USING (true);
CREATE POLICY "Admin Write Authorized" ON authorized_users FOR ALL USING (true);

CREATE POLICY "Public request inserts" ON account_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated request controls" ON account_requests FOR ALL USING (true);

CREATE POLICY "Public commitments read" ON sponsor_commitments FOR SELECT USING (true);
CREATE POLICY "Auth commitments write" ON sponsor_commitments FOR ALL USING (true);

-- Enable Supabase Realtime Replication for All tables
ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE cad_iterations;
ALTER PUBLICATION supabase_realtime ADD TABLE expenditures;
ALTER PUBLICATION supabase_realtime ADD TABLE news_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE judge_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE authorized_users;
ALTER PUBLICATION supabase_realtime ADD TABLE account_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE sponsor_commitments;`}
                  </pre>
                </div>
              </div>
            </details>
          </div>

          {/* Pending Registration Requests card */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block font-bold">REQUESTS QUEUE</span>
                <h3 className="text-sm font-mono font-bold text-zinc-100 tracking-wider uppercase">Pending Invitation Requests</h3>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900/50 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">
                {accountRequests.length} Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] text-zinc-550 uppercase tracking-widest">
                    <th className="pb-3 font-normal">EMAIL IDENTIFIER</th>
                    <th className="pb-3 font-normal">NOTE / ORG</th>
                    <th className="pb-3 font-normal">REQUEST DATE</th>
                    <th className="pb-3 font-normal text-right">RESOLVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {accountRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-600 uppercase text-[9px]">
                        No pending registration requests recorded.
                      </td>
                    </tr>
                  ) : (
                    accountRequests.map(req => (
                      <tr key={req.id} className="hover:bg-zinc-900/10 transition-all">
                        <td className="py-3 pr-4 text-zinc-200 font-bold max-w-[120px] truncate" title={req.email}>
                          {req.email}
                        </td>
                        <td className="py-3 pr-4 text-zinc-400 max-w-[150px] truncate" title={req.notes || 'N/A'}>
                          {req.notes || <span className="text-zinc-700 italic">None</span>}
                        </td>
                        <td className="py-3 pr-4 text-zinc-500">
                          {req.created_at ? req.created_at.split('T')[0] : 'N/A'}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                setEmail(req.email);
                                setNotes(req.notes || `Assigned Sponsor credentials`);
                                setRole('Sponsor');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-[9px] font-mono text-emerald-450 hover:text-white px-2 py-1 rounded bg-emerald-950/20 border border-emerald-900/40 hover:bg-emerald-900/50 transition-colors uppercase font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Decline and delete access request for "${req.email}"?`)) {
                                  onDeleteAccountRequest(req.id);
                                }
                              }}
                              className="text-zinc-650 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                              title="Delete Request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
