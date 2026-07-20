import { LayoutDashboard, Cpu, Settings, LogOut, Sparkles, HeartHandshake, ListTodo, ShieldCheck, Lock } from 'lucide-react';
import { Role } from '../types';
import { useAuth } from './AuthGate';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  activeModule: string;
  onModuleChange: (module: string) => void;
  onOpenSettings: () => void;
  onOpenChat: () => void;
  isSupabaseActive?: boolean;
}

export function Header({ currentRole, onRoleChange, activeModule, onModuleChange, onOpenSettings, onOpenChat, isSupabaseActive }: HeaderProps) {
  const { user, signOut, role: authRole, name: displayName, setIsLoggingIn } = useAuth();

  // Determine dynamic navigation based on Auth Role
  const navItems = [];
  if (authRole === 'Team') {
    navItems.push(
      { name: 'Command Center', icon: LayoutDashboard },
      { name: 'To-Dos', icon: ListTodo },
      { name: 'Engineering & R&D', icon: Cpu },
      { name: 'Sponsor Portal', icon: HeartHandshake },
      { name: 'Access Control', icon: ShieldCheck }
    );
  } else if (authRole === 'Sponsor') {
    navItems.push(
      { name: 'Sponsor Portal', icon: HeartHandshake }
    );
  } else {
    // Guest role (removing Judge navigation completely!)
    navItems.push(
      { name: 'Progress & Timeline', icon: LayoutDashboard }
    );
  }

  return (
    <header className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 shrink-0 bg-black z-10 font-sans">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold tracking-widest text-zinc-100">CARDINAL :: OVERTURE</span>
          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm border uppercase tracking-widest font-semibold ${
            isSupabaseActive 
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' 
              : 'bg-zinc-900/40 text-zinc-500 border-zinc-800'
          }`}>
            {isSupabaseActive ? '● CLOUD' : '○ LOCAL'}
          </span>
          {user && (
            <span className="text-[8px] font-mono text-zinc-400 bg-zinc-900/40 border border-zinc-900 px-2 py-0.5 rounded uppercase tracking-wider">
              {authRole}: {displayName}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => onModuleChange(item.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                activeModule === item.name 
                  ? 'bg-zinc-900 text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">


        <div className="w-px h-4 bg-zinc-850"></div>

        {authRole === 'Admin' && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Role:</span>
            <select 
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as Role)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-1 rounded outline-none focus:border-zinc-500 transition-colors cursor-pointer"
            >
              <option value="PM">PM (Admin)</option>
              <option value="Design">Design</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>
        )}
        {authRole === 'Team' && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Dept:</span>
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              {currentRole}
            </span>
          </div>
        )}
        <div className="w-px h-4 bg-zinc-800"></div>
        {authRole === 'Admin' && (
          <>
            <button onClick={onOpenSettings} title="Settings" className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}
        {authRole === 'Guest' && (
          <>
            <div className="w-px h-4 bg-zinc-850"></div>
            <button 
              onClick={() => setIsLoggingIn && setIsLoggingIn(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-black font-mono font-bold rounded-sm text-[10px] transition-all uppercase tracking-wider cursor-pointer hover:scale-105"
            >
              <Lock className="w-3 h-3" />
              PARTNER LOGIN
            </button>
          </>
        )}
        {authRole !== 'Guest' && (
          <>
            <div className="w-px h-4 bg-zinc-800"></div>
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to log out from the workspace?')) {
                  signOut();
                }
              }} 
              title="Sign Out" 
              className="flex items-center gap-1 text-zinc-500 hover:text-rose-450 font-mono text-[10px] uppercase transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
