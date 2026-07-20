import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, Cpu, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthorizedUser } from '../types';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<any>(() => {
    const savedCustomSession = localStorage.getItem('cardinal_custom_session');
    if (savedCustomSession) {
      try {
        return JSON.parse(savedCustomSession);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Team' | 'Sponsor' | 'Judge'>('Team');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);

  useEffect(() => {
    const savedCustomSession = localStorage.getItem('cardinal_custom_session');
    if (savedCustomSession) {
      try {
        setUser(JSON.parse(savedCustomSession));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('cardinal_custom_session');
      }
    }

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!localStorage.getItem('cardinal_custom_session') && session?.user) {
        try {
          const emailLower = session.user.email?.toLowerCase().trim();
          const { data: authUsers, error: authErr } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', emailLower);

          if (!authErr && authUsers && authUsers.length > 0) {
            const matchedUser = authUsers[0];
            if (matchedUser.is_greenlit === false) {
              await supabase.auth.signOut().catch(() => {});
              setUser(null);
            } else {
              setUser({
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  role: matchedUser.role,
                  name: matchedUser.notes || session.user.email?.split('@')[0],
                  department: matchedUser.department || 'Design',
                }
              });
            }
          } else {
            await supabase.auth.signOut().catch(() => {});
            setUser(null);
          }
        } catch (err) {
          console.error('Error verifying restored session:', err);
          setUser(session.user);
        }
      } else if (!localStorage.getItem('cardinal_custom_session')) {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!localStorage.getItem('cardinal_custom_session') && session?.user) {
        try {
          const emailLower = session.user.email?.toLowerCase().trim();
          const { data: authUsers, error: authErr } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', emailLower);

          if (!authErr && authUsers && authUsers.length > 0) {
            const matchedUser = authUsers[0];
            if (matchedUser.is_greenlit === false) {
              await supabase.auth.signOut().catch(() => {});
              setUser(null);
            } else {
              setUser({
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  role: matchedUser.role,
                  name: matchedUser.notes || session.user.email?.split('@')[0],
                  department: matchedUser.department || 'Design',
                }
              });
            }
          } else {
            await supabase.auth.signOut().catch(() => {});
            setUser(null);
          }
        } catch (err) {
          setUser(session.user);
        }
      } else if (!localStorage.getItem('cardinal_custom_session') && !session) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setFormLoading(true);

    try {
      const emailLower = email.toLowerCase().trim();

      if (!isSupabaseConfigured || !supabase) {
        // Local simulation / offline development fallback login
        setTimeout(() => {
          let mockRole: 'Admin' | 'Team' | 'Sponsor' | 'Judge' = 'Team';
          let mockName = emailLower.split('@')[0];
          let mockDept: 'Design' | 'Engineering' | 'PM' = 'Design';
          
          if (emailLower === 'contact@cardinalsystems.org' || emailLower === 'raghav@cardinalsystems.org') {
            mockRole = 'Admin';
            mockDept = 'PM';
            mockName = emailLower === 'raghav@cardinalsystems.org' ? 'Raghav' : 'Contact Admin';
          } else if (emailLower === 'manthan@cardinalsystems.org') {
            mockRole = 'Team';
            mockDept = 'Design';
            mockName = 'Manthan';
          } else if (emailLower === 'neel@cardinalsystems.org') {
            mockRole = 'Team';
            mockDept = 'Engineering';
            mockName = 'Neel';
          } else if (emailLower === 'rudra@cardinalsystems.org') {
            mockRole = 'Team';
            mockDept = 'Design';
            mockName = 'Rudra';
          } else if (emailLower.includes('sponsor')) {
            mockRole = 'Sponsor';
            mockName = 'Autodesk (Partner)';
          } else if (emailLower.includes('judge') || emailLower.includes('evaluator')) {
            mockRole = 'Judge';
            mockName = 'Lead Evaluator';
          } else if (emailLower === 'guest') {
            mockRole = 'Guest' as any;
            mockName = 'Guest Reader';
          }

          const customSession = {
            id: `mock-${Date.now()}`,
            email: emailLower,
            user_metadata: {
              role: mockRole,
              name: mockName,
              department: mockDept
            },
            isCustom: true
          };
          localStorage.setItem('cardinal_custom_session', JSON.stringify(customSession));
          setUser(customSession);
          setFormLoading(false);
          setIsLoggingIn(false);
        }, 500);
        return;
      }

      if (isSignUp) {
        // Strict verification of pre-authorization if registering
        const { data: authUsers, error: fetchErr } = await supabase
          .from('authorized_users')
          .select('*')
          .eq('email', emailLower);
        
        let matchedUser = null;
        if (!fetchErr && authUsers && authUsers.length > 0) {
          matchedUser = authUsers[0];
        }

        if (!matchedUser) {
          throw new Error(`ACCESS DENIED: "${email}" is not pre-authorized. Please contact the Team Administrator to set up your account.`);
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: matchedUser.role,
              name: matchedUser.notes || email.split('@')[0],
              department: matchedUser.department || 'Design',
            }
          }
        });

        if (error) throw error;
        
        if (data.user && !data.session) {
          setInfoMsg('Verification email sent! Please check your inbox before logging in.');
          setIsSignUp(false);
        } else if (data.session) {
          setUser({
            ...data.user,
            user_metadata: {
              ...data.user.user_metadata,
              role: matchedUser.role,
              name: matchedUser.notes || email.split('@')[0],
              department: matchedUser.department || 'Design',
            }
          });
        }
      } else {
        // 1. Try Authenticating with Admin-Created Direct Credentials
        try {
          const { data: authUsers, error: fetchErr } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', emailLower);

          if (!fetchErr && authUsers && authUsers.length > 0) {
            const matchedUser = authUsers[0];
            if (matchedUser.password && matchedUser.password === password) {
              if (matchedUser.is_greenlit === false) {
                throw new Error('ACCESS DENIED: Your account is currently dormant. Awaiting administrator greenlight.');
              }
              const customSession = {
                id: matchedUser.id,
                email: matchedUser.email,
                user_metadata: {
                  role: matchedUser.role,
                  name: matchedUser.notes || matchedUser.email.split('@')[0],
                  department: matchedUser.department || 'Design',
                },
                isCustom: true
              };
              localStorage.setItem('cardinal_custom_session', JSON.stringify(customSession));
              setUser(customSession);
              setFormLoading(false);
              return;
            }
          }
        } catch (dbErr: any) {
          if (dbErr.message && dbErr.message.includes('ACCESS DENIED')) {
            throw dbErr;
          }
          console.warn('Direct credentials check bypassed, checking main database:', dbErr);
        }

        // 2. Fallback to standard Supabase Password Authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error('Authentication failed. Check your password, or contact an administrator to create your account.');
        }

        // Verify authorization status
        const { data: authUsers, error: authErr } = await supabase
          .from('authorized_users')
          .select('*')
          .eq('email', emailLower);

        if (authErr || !authUsers || authUsers.length === 0) {
          await supabase.auth.signOut().catch(() => {});
          throw new Error(`ACCESS DENIED: "${email}" is not authorized. Please contact the Team Administrator.`);
        }

        const matchedUser = authUsers[0];
        if (matchedUser.is_greenlit === false) {
          await supabase.auth.signOut().catch(() => {});
          throw new Error('ACCESS DENIED: Your account is currently dormant. Awaiting administrator greenlight.');
        }

        setUser({
          ...data.user,
          user_metadata: {
            ...data.user.user_metadata,
            role: matchedUser.role,
            name: matchedUser.notes || data.user.email?.split('@')[0],
            department: matchedUser.department || 'Design',
          }
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('cardinal_custom_session');
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setBypassAuth(false);
    setIsLoggingIn(false);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-zinc-100 font-mono">
        <div className="flex flex-col items-center gap-4">
          <Cpu className="w-8 h-8 text-zinc-500 animate-pulse" />
          <span className="text-[10px] tracking-widest text-zinc-500 uppercase">SYS_INITIALIZING // AUTH_CHECK</span>
        </div>
      </div>
    );
  }

  // Get user role from metadata or default to Guest if unauthenticated
  const userRole = user?.user_metadata?.role || (user ? 'Team' : 'Guest');
  const userName = user?.user_metadata?.name || (user ? user.email?.split('@')[0] : 'Guest Partner');

  // If the user actively bypasses auth (offline local mode), or they have a user session, or they are not trying to log in (thus remaining a guest)
  if (bypassAuth || user || !isLoggingIn) {
    return (
      <AuthContext.Provider value={{ 
        user, 
        signOut: handleSignOut, 
        isSupabaseActive: isSupabaseConfigured && !bypassAuth,
        role: bypassAuth ? 'Team' : userRole,
        name: bypassAuth ? 'Offline Administrator' : userName,
        isLoggingIn,
        setIsLoggingIn
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden selection:bg-zinc-800">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">CARDINAL // SECURITY_GATE_V2</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-600">SECURE SHELL</span>
        </div>

        <div className="p-8">
          {/* Brand/Product Name */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-mono tracking-[0.25em] text-zinc-100 font-bold uppercase">CARDINAL :: OVERTURE</h1>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-1.5">INTEGRATED RESEARCH & OPERATIONS SYSTEM</p>
          </div>

          <AnimatePresence mode="wait">
            <form onSubmit={handleAuth} className="space-y-4">
              {/* Error Alert */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-950/20 border border-rose-900/40 rounded-sm p-3.5 flex gap-2.5 items-start"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] font-mono text-rose-300 leading-relaxed uppercase tracking-wide">
                    {errorMsg}
                  </div>
                </motion.div>
              )}

              {/* Info Alert */}
              {infoMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-950/20 border border-emerald-900/40 rounded-sm p-3.5 flex gap-2.5 items-start"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] font-mono text-emerald-300 leading-relaxed uppercase tracking-wide">
                    {infoMsg}
                  </div>
                </motion.div>
              )}

              {/* Toggle Sign Up / Sign In link */}
              {isSupabaseConfigured && (
                <div className="text-center pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider underline cursor-pointer"
                  >
                    {isSignUp ? "Already authorized? Sign In" : "Pre-authorized? Register Account"}
                  </button>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">EMAIL IDENTIFIER</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-600">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@system.domain"
                    className="w-full bg-black border border-zinc-900 rounded px-3 py-2.5 pl-9 text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">ACCESS PASSPHRASE</label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-600">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-black border border-zinc-900 rounded px-3 py-2.5 pl-9 text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              </div>

              {/* Local simulation cheatsheet when offline */}
              {!isSupabaseConfigured && (
                <div className="p-3 bg-zinc-900/30 border border-zinc-900/50 rounded text-[9px] font-mono text-zinc-400 uppercase leading-relaxed space-y-1 mt-2">
                  <span className="text-zinc-500 block font-bold">// LOCAL SIMULATION PROFILE CHEATSHEET:</span>
                  <div>• Enter <span className="text-emerald-400">sponsor@example.com</span> for Sponsor Role</div>
                  <div>• Enter <span className="text-amber-400">judge@example.com</span> for Judge/Evaluator Role</div>
                  <div>• Enter any other email for Administrator Role</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full h-10 mt-2 bg-zinc-100 hover:bg-white text-black font-mono text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {formLoading ? 'AUTHORIZING_...' : (
                  isSignUp ? (
                    <>
                      REGISTER CREDENTIALS
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      AUTHENTICATE
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )
                )}
              </button>
            </form>
          </AnimatePresence>
        </div>

        {/* Footer options */}
        <div className="p-4 border-t border-zinc-900 bg-black/40 flex flex-col gap-2">
          <button
            onClick={() => setIsLoggingIn(false)}
            className="w-full py-2 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 text-zinc-300 hover:text-white font-mono text-[9px] uppercase tracking-widest rounded transition-all"
          >
            ← Cancel & Return to Guest View
          </button>
          <button
            onClick={() => setBypassAuth(true)}
            className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-850 text-zinc-500 hover:text-zinc-400 font-mono text-[9px] uppercase tracking-widest rounded transition-all"
          >
            Offline Workspace Mode
          </button>
          <div className="flex justify-between text-[8px] font-mono text-zinc-650 uppercase px-1">
            <span>SYS_VERSION 2.4.1</span>
            <span>SECURED BY SUPABASE</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// React Context for Auth
import { createContext, useContext } from 'react';

interface AuthContextType {
  user: any;
  signOut: () => Promise<void>;
  isSupabaseActive: boolean;
  role: 'Team' | 'Sponsor' | 'Judge' | 'Guest';
  name: string;
  isLoggingIn: boolean;
  setIsLoggingIn: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signOut: async () => {},
  isSupabaseActive: false,
  role: 'Guest',
  name: 'Guest Partner',
  isLoggingIn: false,
  setIsLoggingIn: () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}
