import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, UserPlus, Trash2, Mail, CheckCircle2, UserCheck, 
  Lock, Copy, Check, Info, HelpCircle, Key, RefreshCw, Eye, EyeOff, Send, Edit2
} from 'lucide-react';
import { AuthorizedUser } from '../types';
import { useAuth } from './AuthGate';

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
  const { role: currentUserRole } = useAuth();
  const isCurrentUserAdmin = currentUserRole === 'Admin';
  const canSeePasswords = currentUserRole === 'Admin' || currentUserRole === 'Judge';

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
    if (user.role === 'Admin' && !isCurrentUserAdmin) {
      alert('Only Administrators can modify Admin user accounts.');
      return;
    }
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
    if (editRole === 'Admin' && !isCurrentUserAdmin) {
      alert('Only Administrators can promote accounts to the Admin role.');
      return;
    }
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

    if (role === 'Admin' && !isCurrentUserAdmin) {
      alert('Only Administrators can create new Admin accounts.');
      return;
    }

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
    const displayedPass = canSeePasswords ? (user.password || '(Contact Team)') : '•••••••• (Protected)';
    const kitText = `=========================================
CARDINAL OVERTURE F1 SECURE PORTAL
=========================================
Your secure credentials have been provisioned:

- Workspace URL: ${window.location.origin}
- Username/Email: ${user.email}
- Password: ${displayedPass}
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
- Temporary Password: ${canSeePasswords ? password : '••••••••'}
- Access Profile: ${role}

Please use these credentials to sign in directly.
=========================================`;

    navigator.clipboard.writeText(kitText);
    setCopiedKit(true);
    setTimeout(() => setCopiedKit(false), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    if (!canSeePasswords) {
      alert('Password visibility is restricted to Administrators and Judges.');
      return;
    }
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">SECURE CREDENTIALS RAIL</span>
          <h1 className="text-xl font-mono font-bold text-zinc-100 tracking-tight uppercase flex items-center gap-2">
            <Lock className="w-5 h-5 text-zinc-400" />
            ACCESS CONTROL &amp; IDENTITY MANAGEMENT
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-md text-zinc-400">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span>RLS HARDENED POLICY ACTIVE</span>
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 p-3 rounded text-xs font-mono flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </motion.div>
      )}

      {/* Grid containing provision box & user table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Create User */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
              <UserPlus className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                PRE-AUTHORIZE USER ACCOUNT
              </h2>
            </div>
            
            <p className="text-[11px] font-mono text-zinc-400 leading-relaxed mb-4">
              Define the exact login credentials (Email &amp; Password) for your partners, sponsors, or judges. Only they will be allowed to log in; public registration is disabled.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              {/* Email */}
              <div>
                <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block mb-1">TARGET EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-600" />
                  <input
                    type="email"
                    required
                    placeholder="partner@sponsor-company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">DESIGNATED PASSWORD</label>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="text-[9px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    title="Generate Random Password"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> RE-GENERATE
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword && canSeePasswords ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded pl-3 pr-9 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                  {canSeePasswords && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block mb-1">ACCESS ROLE</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-black border border-zinc-900 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                  >
                    {isCurrentUserAdmin && <option value="Admin">Admin</option>}
                    <option value="Team">Team Member</option>
                    <option value="Sponsor">Sponsor</option>
                    <option value="Judge">Judge</option>
                  </select>
                </div>

                {role === 'Team' && (
                  <div>
                    <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block mb-1">DEPARTMENT</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as any)}
                      className="w-full bg-black border border-zinc-900 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                    >
                      <option value="Design">Design</option>
                      <option value="Engineering">Engineering</option>
                      <option value="PM">Project Mgmt</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block mb-1">MEMORANDUM / REMARKS</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Engineer or Title Sponsor"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-black border border-zinc-900 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>

              {/* Greenlight Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="greenlight"
                  checked={greenlightImmediately}
                  onChange={(e) => setGreenlightImmediately(e.target.checked)}
                  className="rounded border-zinc-800 bg-black text-emerald-500 focus:ring-0 accent-emerald-500"
                />
                <label htmlFor="greenlight" className="text-[10px] text-zinc-400 font-mono uppercase cursor-pointer select-none">
                  GREENLIGHT ACCOUNT IMMEDIATELY
                </label>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-zinc-100 text-black hover:bg-white transition-colors font-mono font-bold text-xs py-2.5 rounded tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <UserCheck className="w-4 h-4" />
                  PRE-AUTHORIZE CREDENTIALS
                </button>
              </div>
            </form>
          </div>

          {/* Login Kit Helper Button */}
          <div className="mt-4 pt-4 border-t border-zinc-900">
            <button
              onClick={copyCustomInvite}
              className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 text-[10px] font-mono py-2 rounded uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedKit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKit ? "WELCOME KIT COPIED TO CLIPBOARD" : "COPY FORM WELCOME KIT LUNCHLETTER"}
            </button>
          </div>
        </div>

        {/* Right Column: User Management Table */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  AUTHORIZED USERS ROSTER ({authorizedUsers.length})
                </h2>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">ACTIVE POLICY // STRICT AUTH</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] text-zinc-500 uppercase tracking-widest">
                    <th className="pb-3 font-normal">EMAIL ADDRESS</th>
                    <th className="pb-3 font-normal">ACCESS LEVEL</th>
                    <th className="pb-3 font-normal">ASSIGNED PASSWORD</th>
                    <th className="pb-3 font-normal">STATUS</th>
                    <th className="pb-3 font-normal">MEMORANDUM</th>
                    <th className="pb-3 font-normal text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {authorizedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-600 uppercase text-[10px] leading-relaxed">
                        <ShieldAlert className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
                        NO AUTHORIZED USERS REGISTERED YET.
                      </td>
                    </tr>
                  ) : (
                    authorizedUsers.map(user => {
                      const isEditing = user.id === editingUserId;
                      const isPassVisible = canSeePasswords && !!visiblePasswords[user.id];
                      const isAdminUser = user.role === 'Admin';
                      const canModify = !isAdminUser || isCurrentUserAdmin;

                      return (
                        <tr key={user.id} className="hover:bg-zinc-900/10 transition-all align-middle">
                          <td className="py-3.5 text-zinc-200 pr-3 font-bold max-w-[130px] truncate" title={user.email}>
                            {user.email}
                          </td>
                          <td className="py-3.5 pr-3">
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5">
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value as any)}
                                  className="bg-black border border-zinc-900 rounded px-1.5 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                                >
                                  {isCurrentUserAdmin && <option value="Admin">Admin</option>}
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
                                    <option value="PM">PM</option>
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
                          <td className="py-3.5 pr-3 text-zinc-300">
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
                                {canSeePasswords && (
                                  <button
                                    onClick={() => togglePasswordVisibility(user.id)}
                                    className="text-zinc-650 hover:text-zinc-400"
                                    title="Toggle Visibility"
                                  >
                                    {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 pr-3">
                            <button
                              disabled={!canModify}
                              onClick={() => {
                                onUpdateAuthorizedUser({
                                  ...user,
                                  is_greenlit: !user.is_greenlit
                                });
                              }}
                              className={`text-[9px] font-mono uppercase px-2.5 py-1 rounded-full border transition-colors font-bold ${
                                !canModify ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer '
                              }${
                                user.is_greenlit
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/20'
                                  : 'bg-zinc-900/60 text-zinc-500 border-zinc-800/60 hover:bg-zinc-800/30'
                              }`}
                              title={!canModify ? "Admin accounts can only be modified by Administrators" : (user.is_greenlit ? "Click to suspend" : "Click to greenlight")}
                            >
                              {user.is_greenlit ? '● GREENLIT' : '○ DORMANT'}
                            </button>
                          </td>
                          <td className="py-3.5 text-zinc-400 pr-3 max-w-[120px] truncate" title={user.notes}>
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
                            <div className="flex items-center justify-end gap-1.5">
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
                                  {canModify && (
                                    <>
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
                <span className="text-zinc-300 font-bold block mb-1">ROLE ACCESS POLICY &amp; SECURITY GUARANTEE</span>
                TEAM MEMBERS HAVE FULL ADMINISTRATIVE ACCESS TO ALL SYSTEM MODULES, BUT CANNOT ALTER OR DELETE ADMIN ACCOUNTS, NOR VIEW OTHER USERS' PASSWORDS. PASSWORDS REMAIN STRICTLY MASKED AND PROTECTED UNLESS LOGGED IN WITH ADMIN OR JUDGE ROLES.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
