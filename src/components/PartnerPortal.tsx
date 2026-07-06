import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, CheckCircle, Calendar, Box, Sparkles, HeartHandshake, 
  TrendingUp, Plus, Trash2, Eye, ShieldCheck, Info, FileText, Check, Copy 
} from 'lucide-react';
import { ExpenditureItem, ExpenditureCategory, CadIteration, Node, AuthorizedUser, SponsorCommitment, NewsUpdate } from '../types';
import { GanttChart } from './GanttChart';
import { ModelViewer } from './ModelViewer';
import { useAuth } from './AuthGate';
import { sendEmail } from '../lib/emailService';

interface PartnerPortalProps {
  expenditures: ExpenditureItem[];
  onAddExpenditure: (item: Omit<ExpenditureItem, 'id' | 'pledged_by_email' | 'pledged_by_name'>) => void;
  onDeleteExpenditure: (id: string) => void;
  onPledgeExpenditure: (id: string, sponsorName: string, sponsorEmail: string) => void;
  onUnpledgeExpenditure: (id: string) => void;
  iterations: CadIteration[];
  nodes: Node[];
  newsUpdates: NewsUpdate[];
  authorizedUsers: AuthorizedUser[];
  sponsorCommitments: SponsorCommitment[];
  onAddSponsorCommitment: (commitment: Omit<SponsorCommitment, 'id'>) => void;
  onUpdateSponsorCommitmentStatus: (id: string, status: SponsorCommitment['status']) => void;
  onDeleteSponsorCommitment: (id: string) => void;
  onAddNewsUpdate: (news: Omit<NewsUpdate, 'id' | 'created_at'>) => void;
  onDeleteNewsUpdate: (id: string) => void;
}

export function PartnerPortal({
  expenditures,
  onAddExpenditure,
  onDeleteExpenditure,
  onPledgeExpenditure,
  onUnpledgeExpenditure,
  iterations,
  nodes,
  newsUpdates,
  authorizedUsers,
  sponsorCommitments,
  onAddSponsorCommitment,
  onUpdateSponsorCommitmentStatus,
  onDeleteSponsorCommitment,
  onAddNewsUpdate,
  onDeleteNewsUpdate
}: PartnerPortalProps) {
  const { user, role, name: currentSponsorName } = useAuth();
  
  // Gmail notification status tracking
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notifySponsorViaEmail, setNotifySponsorViaEmail] = useState(false);

  // Admin selected sponsor viewpoint simulation
  const [selectedSponsorEmail, setSelectedSponsorEmail] = useState<string | null>(null);

  // Derive unique list of all sponsors from expenditures and authorized users
  const allSponsors = React.useMemo(() => {
    const list: { name: string; email: string }[] = [];
    const seen = new Set<string>();

    // From expenditures
    expenditures.forEach(exp => {
      if (exp.pledged_by_email && !seen.has(exp.pledged_by_email)) {
        seen.add(exp.pledged_by_email);
        list.push({
          name: exp.pledged_by_name || exp.pledged_by_email.split('@')[0],
          email: exp.pledged_by_email
        });
      }
    });

    // From authorizedUsers
    authorizedUsers?.forEach(usr => {
      if (usr.role === 'Sponsor' && usr.email && !seen.has(usr.email)) {
        seen.add(usr.email);
        list.push({
          name: usr.notes || usr.email.split('@')[0],
          email: usr.email
        });
      }
    });

    return list;
  }, [expenditures, authorizedUsers]);

  // Determine active email and name for sponsor views
  const activeSponsorEmail = role === 'Sponsor'
    ? user?.email
    : (role === 'Team' ? selectedSponsorEmail : null);

  const activeSponsorName = role === 'Sponsor'
    ? (currentSponsorName || user?.email?.split('@')[0] || 'Partner')
    : (role === 'Team' && selectedSponsorEmail
        ? (allSponsors.find(sp => sp.email === selectedSponsorEmail)?.name || selectedSponsorEmail.split('@')[0])
        : 'All Partners');

  // Local state for Sponsor Commitments (Strategic action items)
  const [isAddingCommitment, setIsAddingCommitment] = useState(false);
  const [commitmentTitle, setCommitmentTitle] = useState('');
  const [commitmentDescription, setCommitmentDescription] = useState('');
  const [commitmentDueDate, setCommitmentDueDate] = useState('');
  const [commitmentSponsorEmail, setCommitmentSponsorEmail] = useState('');
  const [isInvitingNew, setIsInvitingNew] = useState(false);
  const [customInviteEmail, setCustomInviteEmail] = useState('');

  // Local state for adding custom items (Team Member or Admin role can add)
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ExpenditureCategory>('Materials');
  const [newItemDate, setNewItemDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'pledge' | 'updates' | 'commitments'>('overview');

  // Local state for News Update form
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsContent, setNewNewsContent] = useState('');
  const [newNewsAuthor, setNewNewsAuthor] = useState('Project Manager');
  const [isSendingNewsEmail, setIsSendingNewsEmail] = useState(false);
  const [newsSuccessMsg, setNewsSuccessMsg] = useState('');

  // Copy/Export templates
  const [copiedEmailDraft, setCopiedEmailDraft] = useState(false);
  const [copiedSponsorId, setCopiedSponsorId] = useState<string | null>(null);

  const copySponsorPledgeEmail = () => {
    const total = sponsorPledges.reduce((sum, item) => sum + item.cost, 0);
    const pledgeLines = sponsorPledges.map(item => ` - ${item.item_name} (₹${item.cost.toFixed(2)}) [Needed by: ${item.needed_by}]`).join('\n');
    
    const emailText = `Subject: Pledged Resources Confirmation - Cardinal Overture F1 in Schools

Dear ${currentSponsorName || 'Partner'},

This is a formal confirmation of the resources you have generously pledged to back for our F1 in Schools Campaign. 

PLEDGED ITEMS & ALLOCATED FUNDING:
${pledgeLines}

TOTAL ALLOCATED CONTRIBUTION: ₹${total.toFixed(2)}

Our engineering queue has marked these procurement items as "PLEDGED" and locked them from public bidding. We will reach out shortly with invoicing and routing instructions.

Thank you once again for your vital support in accelerating our race to the world stage.

Best regards,
Cardinal Overture F1 in Schools Team`;

    navigator.clipboard.writeText(emailText);
    setCopiedEmailDraft(true);
    setTimeout(() => setCopiedEmailDraft(false), 2500);
  };

  const handleCopyEmailForSponsor = (sponsorEmail: string, sponsorName: string) => {
    const items = expenditures.filter(e => e.pledged_by_email === sponsorEmail && e.status === 'Pledged');
    if (items.length === 0) return;
    const total = items.reduce((sum, e) => sum + e.cost, 0);
    const pledgeLines = items.map(item => ` - ${item.item_name} (₹${item.cost.toFixed(2)}) [Needed by: ${item.needed_by}]`).join('\n');

    const emailText = `Subject: Pledged Resources Confirmation - Cardinal Overture F1 in Schools

Dear ${sponsorName},

This is a formal confirmation of the resources you have generously pledged to back for our F1 in Schools Campaign.

PLEDGED ITEMS & ALLOCATED FUNDING:
${pledgeLines}

TOTAL ALLOCATED CONTRIBUTION: ₹${total.toFixed(2)}

Our engineering queue has marked these procurement items as "PLEDGED" and locked them from public bidding. We will reach out shortly with invoicing and routing instructions.

Thank you once again for your vital support in accelerating our race to the world stage.

Best regards,
Cardinal Overture F1 in Schools Team`;

    navigator.clipboard.writeText(emailText);
    setCopiedSponsorId(sponsorEmail);
    setTimeout(() => setCopiedSponsorId(null), 2500);
  };

  const handleExportPledgesCSV = () => {
    const pledgedItems = expenditures.filter(e => e.status === 'Pledged');
    const headers = ['Item Name', 'Category', 'Cost', 'Needed By', 'Sponsor Name', 'Sponsor Email'];
    const rows = pledgedItems.map(item => [
      `"${item.item_name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.cost.toFixed(2),
      item.needed_by,
      `"${(item.pledged_by_name || '').replace(/"/g, '""')}"`,
      item.pledged_by_email || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cardinal_overture_sponsor_pledges.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isTeam = role === 'Team';

  // Math totals
  const totalBudgetNeeded = expenditures.reduce((acc, item) => acc + item.cost, 0);
  const totalBudgetPledged = expenditures
    .filter(item => item.status === 'Pledged')
    .reduce((acc, item) => acc + item.cost, 0);
  const totalBudgetRemaining = totalBudgetNeeded - totalBudgetPledged;
  
  const sponsorPledges = expenditures.filter(
    item => item.pledged_by_email === activeSponsorEmail && item.status === 'Pledged'
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCost) return;
    onAddExpenditure({
      item_name: newItemName,
      cost: parseFloat(newItemCost),
      category: newItemCategory,
      needed_by: newItemDate,
      status: 'Pending'
    });
    setNewItemName('');
    setNewItemCost('');
    setIsAdding(false);
  };

  const latestCar = iterations.find(i => i.status === 'Simulated' || i.status === 'Milled') || iterations[iterations.length - 1];

  return (
    <div className="space-y-6 font-sans">
      {/* Admin viewpoint simulation banner */}
      {isTeam && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 tracking-widest uppercase font-bold">ADMINISTRATIVE CONTROLLER</span>
            </div>
            <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider mt-0.5">Sponsor Viewpoint Simulator</h3>
            <p className="text-[9px] text-zinc-500 mt-1 font-mono uppercase">Toggle between sponsor views to manage pledges and dispatch deliverables from their unique perspective.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase shrink-0">Active Viewpoint:</span>
            <select
              value={selectedSponsorEmail || ''}
              onChange={(e) => {
                const email = e.target.value;
                setSelectedSponsorEmail(email || null);
              }}
              className="bg-black border border-zinc-800 text-zinc-300 text-[11px] font-mono px-3 py-2 rounded focus:border-zinc-500 cursor-pointer outline-none"
            >
              <option value="">-- DEFAULT TEAM VIEW (ALL PLEDGES) --</option>
              {allSponsors.map(sp => (
                <option key={sp.email} value={sp.email}>{sp.name} ({sp.email})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex border-b border-zinc-900 gap-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'overview' ? 'border-zinc-100 text-zinc-100 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          01 // OVERVIEW & DESIGN
        </button>
        <button
          onClick={() => setActiveTab('pledge')}
          className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'pledge' ? 'border-zinc-100 text-zinc-100 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          02 // SPONSOR PLEDGES ({expenditures.filter(e => e.status === 'Pending').length} OPEN)
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'updates' ? 'border-zinc-100 text-zinc-100 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          03 // PROJECT NEWS & REPORTS
        </button>
        <button
          onClick={() => setActiveTab('commitments')}
          className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'commitments' ? 'border-zinc-100 text-zinc-100 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          04 // DELIVERABLES & COMMITMENTS
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Middle Panels: Vehicle CAD & Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">CURRENT AERODYNAMIC DESIGN</span>
                  <h3 className="text-sm font-mono font-bold text-zinc-100 tracking-wider uppercase">
                    {latestCar ? `${latestCar.id} // ${latestCar.cad_file_ref}` : 'CARDINAL CAR PROTOTYPE'}
                  </h3>
                </div>
                {latestCar && (
                  <div className="flex gap-4">
                    <div className="bg-black border border-zinc-900 px-3 py-1 rounded">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block">DRAG COEFFICIENT</span>
                      <span className="text-xs font-mono text-zinc-200 font-bold">Cd {latestCar.drag_coefficient_cd.toFixed(4)}</span>
                    </div>
                    <div className="bg-black border border-zinc-900 px-3 py-1 rounded">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block">MASS SPEC</span>
                      <span className="text-xs font-mono text-zinc-200 font-bold">{latestCar.weight_grams} g</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3D Model or CSS CAD Placeholder */}
              <div className="h-80 relative rounded border border-zinc-900 overflow-hidden bg-black flex items-center justify-center">
                {latestCar?.model_url ? (
                  <ModelViewer url={latestCar.model_url} />
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-90 text-center">
                    {/* Retro wireframe look car */}
                    <div className="w-56 h-12 border-2 border-dashed border-zinc-700/50 rounded-full relative mb-4 animate-pulse flex items-center justify-center">
                      <div className="absolute left-6 -bottom-2 w-6 h-6 rounded-full border border-zinc-500 bg-black flex items-center justify-center text-[8px] font-mono text-zinc-600">W</div>
                      <div className="absolute right-6 -bottom-2 w-6 h-6 rounded-full border border-zinc-500 bg-black flex items-center justify-center text-[8px] font-mono text-zinc-600">W</div>
                      <span className="text-[8px] font-mono text-zinc-600 tracking-widest uppercase">F1_SCALE_WIRE</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">STL CAD Design Baseline v1.4</span>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">Virtual Wind Tunnel Aero Simulation Ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Read-Only Gantt View */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block mb-3">01.2 // MASTER Gantt & MILSTONES</span>
              <div className="h-96">
                <GanttChart nodes={nodes} simulatedDate={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          {/* Right Panel: Sponsor Financial Stand & My Pledges */}
          <div className="space-y-6">
            {/* Financial Overview Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">FINANCIAL HEALTH DECK</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/55 border border-zinc-900 p-3 rounded">
                  <span className="text-[8px] font-mono text-zinc-500 block">BUDGET GOAL</span>
                  <span className="text-sm font-mono text-zinc-200 font-bold">₹{totalBudgetNeeded.toFixed(2)}</span>
                </div>
                <div className="bg-black/55 border border-emerald-950/40 p-3 rounded">
                  <span className="text-[8px] font-mono text-emerald-500 block">PLEDGED</span>
                  <span className="text-sm font-mono text-emerald-400 font-bold">₹{totalBudgetPledged.toFixed(2)}</span>
                </div>
                <div className="bg-zinc-900/10 border border-dashed border-zinc-800 p-3 rounded">
                  <span className="text-[8px] font-mono text-zinc-400 block">REMAINING</span>
                  <span className="text-sm font-mono text-zinc-400 font-bold">₹{totalBudgetRemaining.toFixed(2)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>FUNDING BAR</span>
                  <span>{totalBudgetNeeded > 0 ? Math.round((totalBudgetPledged / totalBudgetNeeded) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${totalBudgetNeeded > 0 ? (totalBudgetPledged / totalBudgetNeeded) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-black border border-zinc-900 rounded p-4 text-[10px] font-mono text-zinc-400 space-y-2 leading-relaxed">
                <div className="flex items-start gap-2 text-zinc-300 font-bold uppercase mb-1">
                  <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Sponsorship & Backing</span>
                </div>
                Cardinal Overture is backed directly by school sponsorships. High quality materials, polymer milling blocks, CNC slots, and wind-tunnel analytics are fully supported by corporate pledges. Mark any open resource item as pledged to support our racing campaign!
              </div>
            </div>

            {/* My Active Pledges */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block mb-3">MY ACCOUNT PLEDGES</span>
              
              {sponsorPledges.length === 0 ? (
                <div className="border border-dashed border-zinc-900 rounded-lg p-6 text-center">
                  <HeartHandshake className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">No pledges recorded yet</span>
                  <button 
                    onClick={() => setActiveTab('pledge')}
                    className="mt-3 text-[10px] font-mono bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 px-3 py-1.5 rounded transition-all"
                  >
                    Open Pledge Ledger
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-950/10 border border-emerald-900/30 rounded p-3 text-[10px] font-mono text-emerald-400 leading-relaxed uppercase">
                    ♥ Thank you for your support, <span className="font-bold">{currentSponsorName}</span>! Your backing has been added directly to our active procurement queue.
                  </div>
                  <div className="divide-y divide-zinc-900">
                    {sponsorPledges.map(item => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center text-[11px] font-mono">
                        <div>
                          <span className="text-zinc-200 block truncate max-w-[150px]">{item.item_name}</span>
                          <span className="text-[9px] text-zinc-500 uppercase">{item.category} // NEEDED BY {item.needed_by}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">₹{item.cost.toFixed(2)}</span>
                          <button
                            onClick={() => onUnpledgeExpenditure(item.id)}
                            className="text-zinc-600 hover:text-rose-400 transition-colors"
                            title="Cancel Pledge"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-zinc-900 flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">TOTAL SUPPORT</span>
                    <span className="text-emerald-400 font-bold">₹{sponsorPledges.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}</span>
                  </div>

                  <button
                    onClick={copySponsorPledgeEmail}
                    className="w-full text-[10px] font-mono bg-zinc-900 hover:bg-zinc-850 text-zinc-300 py-2 border border-zinc-800 hover:border-zinc-700 rounded mt-3 transition-colors flex items-center justify-center gap-2 uppercase cursor-pointer"
                  >
                    {copiedEmailDraft ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileText className="w-3.5 h-3.5" />}
                    {copiedEmailDraft ? 'COPIED EMAIL DRAFT!' : 'COPY PLEDGE EMAIL DRAFT'}
                  </button>                  <button
                    onClick={async () => {
                      try {
                        setEmailSending(true);
                        setEmailStatusMsg(null);
                        const total = sponsorPledges.reduce((sum, item) => sum + item.cost, 0);
                        const pledgeLines = sponsorPledges.map(item => ` - ${item.item_name} (₹${item.cost.toFixed(2)}) [Needed by: ${item.needed_by}]`).join('\n');
                        
                        const bodyText = `Dear ${currentSponsorName || 'Partner'},\n\nThis is a formal confirmation of the resources you have generously pledged to back for our F1 in Schools Campaign.\n\nPLEDGED ITEMS & ALLOCATED FUNDING:\n${pledgeLines}\n\nTOTAL ALLOCATED CONTRIBUTION: ₹${total.toFixed(2)}\n\nOur engineering queue has marked these procurement items as "PLEDGED" and locked them from public bidding. We will reach out shortly with invoicing and routing instructions.\n\nThank you once again for your vital support in accelerating our race to the world stage.\n\nBest regards,\nCardinal Overture F1 in Schools Team`;

                        await sendEmail({
                          to: user?.email || '',
                          subject: 'Pledged Resources Confirmation - Cardinal Overture F1 in Schools',
                          body: bodyText
                        });
                        setEmailStatusMsg({ type: 'success', text: 'CONFIRMATION EMAIL DISPATCHED SUCCESSFULLY!' });
                      } catch (err: any) {
                        console.error(err);
                        setEmailStatusMsg({ type: 'error', text: err.message || 'FAILED TO TRANSMIT EMAIL' });
                      } finally {
                        setEmailSending(false);
                      }
                    }}
                    disabled={emailSending || sponsorPledges.length === 0}
                    className="w-full text-[10px] font-mono bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 py-2 border border-emerald-900/40 rounded mt-2 transition-colors flex items-center justify-center gap-2 uppercase cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {emailSending ? 'TRANSMITTING EMAIL...' : 'SEND CONFIRMATION EMAIL'}
                  </button>

                  {emailStatusMsg && (
                    <div className={`mt-2 p-2 rounded text-[9px] font-mono border uppercase text-center ${
                      emailStatusMsg.type === 'success' 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' 
                        : 'bg-rose-950/20 text-rose-450 border-rose-900/40'
                    }`}>
                      {emailStatusMsg.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pledge' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">PROCUREMENT LEDGER</span>
              <h2 className="text-sm font-mono font-bold text-zinc-100 tracking-wider uppercase">Team Purchases, Expenditures & Funding Gaps</h2>
            </div>
            
            {isTeam && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 text-xs font-mono bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD ITEM
              </button>
            )}
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddSubmit}
                className="bg-black border border-zinc-900 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase block">ITEM NAME</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Polyurethane foam block"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase block">ESTIMATED COST (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    placeholder="e.g. 45.00"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase block">CATEGORY</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as ExpenditureCategory)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                  >
                    <option value="Materials">Materials & Hardware</option>
                    <option value="Manufacturing">Manufacturing & Machining</option>
                    <option value="Software">Software & CAD</option>
                    <option value="Testing">Aero & Testing</option>
                    <option value="Marketing">Marketing & Pit Display</option>
                    <option value="Entry Fees">Competition Fees</option>
                  </select>
                </div>
                <div className="space-y-1 flex flex-col justify-between">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase block">NEEDED BY</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={newItemDate}
                      onChange={(e) => setNewItemDate(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800"
                    />
                    <button
                      type="submit"
                      className="bg-zinc-100 hover:bg-white text-black font-mono text-xs font-bold px-3 rounded"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest">
                  <th className="pb-3 font-normal">ITEM & DESCRIPTION</th>
                  <th className="pb-3 font-normal">CATEGORY</th>
                  <th className="pb-3 font-normal">COST</th>
                  <th className="pb-3 font-normal">NEEDED DATE</th>
                  <th className="pb-3 font-normal">STATUS / SPONSOR</th>
                  <th className="pb-3 font-normal text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {expenditures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 uppercase text-[10px]">
                      No expenditures logged in procurement system.
                    </td>
                  </tr>
                ) : (
                  expenditures.map(item => {
                    const isPledgedByCurrentUser = item.pledged_by_email === user?.email;
                    
                    return (
                      <tr key={item.id} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="py-4 pr-4">
                          <span className="text-zinc-100 font-bold block">{item.item_name}</span>
                          <span className="text-[9px] text-zinc-500 uppercase">Procurement ID: {item.id}</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-zinc-200 font-bold font-mono">
                          ₹{item.cost.toFixed(2)}
                        </td>
                        <td className="py-4 pr-4 text-zinc-400">
                          {item.needed_by}
                        </td>
                        <td className="py-4 pr-4">
                          {item.status === 'Pledged' ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-emerald-400 font-bold flex items-center gap-1 uppercase text-[10px]">
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                Pledged
                              </span>
                              <span className="text-[8px] text-zinc-500 uppercase block max-w-[150px] truncate" title={`${item.pledged_by_name} (${item.pledged_by_email})`}>
                                BY: {item.pledged_by_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-600 font-bold uppercase text-[10px]">
                              ○ OPEN RESOURCE
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            {item.status === 'Pending' ? (
                              <button
                                onClick={() => onPledgeExpenditure(item.id, currentSponsorName, user?.email || '')}
                                className="flex items-center gap-1 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded font-bold uppercase transition-all shadow-[0_0_10px_-3px_rgba(16,185,129,0.4)]"
                              >
                                <HeartHandshake className="w-3 h-3" />
                                Pledge
                              </button>
                            ) : (
                              isPledgedByCurrentUser && (
                                <button
                                  onClick={() => onUnpledgeExpenditure(item.id)}
                                  className="text-[10px] text-zinc-500 hover:text-rose-400 font-bold uppercase transition-colors"
                                >
                                  Release Pledge
                                </button>
                              )
                            )}

                            {isTeam && (
                              <button
                                onClick={() => onDeleteExpenditure(item.id)}
                                className="text-zinc-600 hover:text-rose-400 p-1.5 rounded hover:bg-zinc-900 transition-all"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

          {/* Admin Export Controls */}
          {isTeam && (
            <div className="pt-6 border-t border-zinc-900 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">TEAM ADMINISTRATION</span>
                  <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">Manual Sponsor Pledge Exports & Dispatch</h3>
                </div>
                <button
                  onClick={handleExportPledgesCSV}
                  className="flex items-center gap-2 text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 px-4 border border-zinc-800 hover:border-zinc-700 rounded transition-all uppercase cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export All Pledges (.CSV Ledger)
                </button>
              </div>

              {/* Unique Sponsor list with manual email copies */}
              <div className="bg-black/40 border border-zinc-900 rounded p-4 space-y-3">
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">Pending Sponsor Email Communications</span>
                
                {(() => {
                  const pledgedItems = expenditures.filter(e => e.status === 'Pledged');
                  const sponsors = Array.from(new Set(pledgedItems.map(e => e.pledged_by_email).filter(Boolean))) as string[];
                  
                  if (sponsors.length === 0) {
                    return (
                      <p className="text-[10px] font-mono text-zinc-600 uppercase">
                        No active pledges recorded in system. Once a sponsor clicks "Pledge" on any open resource, they will appear here with copyable email templates.
                      </p>
                    );
                  }

                  return (
                    <div className="divide-y divide-zinc-900">
                      {sponsors.map(sponsorEmail => {
                        const sponsorItems = pledgedItems.filter(e => e.pledged_by_email === sponsorEmail);
                        const sponsorName = sponsorItems[0]?.pledged_by_name || 'Partner';
                        const totalCost = sponsorItems.reduce((sum, e) => sum + e.cost, 0);

                        return (
                          <div key={sponsorEmail} className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-[11px] font-mono last:pb-0">
                            <div>
                              <span className="text-zinc-200 font-bold block">{sponsorName}</span>
                              <span className="text-[9px] text-zinc-500 uppercase">{sponsorEmail} // {sponsorItems.length} Pledges</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-400 font-bold">₹{totalCost.toFixed(2)}</span>
                              <button
                                onClick={() => handleCopyEmailForSponsor(sponsorEmail, sponsorName)}
                                className="text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded flex items-center gap-1 transition-all"
                                title="Copy Email Confirmation Draft"
                              >
                                {copiedSponsorId === sponsorEmail ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>COPIED EMAIL DRAFT</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>COPY EMAIL SLIP</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    setEmailSending(true);
                                    setEmailStatusMsg(null);
                                    
                                    const items = expenditures.filter(e => e.pledged_by_email === sponsorEmail && e.status === 'Pledged');
                                    const total = items.reduce((sum, e) => sum + e.cost, 0);
                                    const pledgeLines = items.map(item => ` - ${item.item_name} (₹${item.cost.toFixed(2)}) [Needed by: ${item.needed_by}]`).join('\n');
                                    
                                    const bodyText = `Dear ${sponsorName},\n\nThis is a formal confirmation of the resources you have generously pledged to back for our F1 in Schools Campaign.\n\nPLEDGED ITEMS & ALLOCATED FUNDING:\n${pledgeLines}\n\nTOTAL ALLOCATED CONTRIBUTION: ₹${total.toFixed(2)}\n\nOur engineering queue has marked these procurement items as "PLEDGED" and locked them from public bidding. We will reach out shortly with invoicing and routing instructions.\n\nThank you once again for your vital support in accelerating our race to the world stage.\n\nBest regards,\nCardinal Overture F1 in Schools Team`;

                                    await sendEmail({
                                      to: sponsorEmail,
                                      subject: 'Pledged Resources Confirmation - Cardinal Overture F1 in Schools',
                                      body: bodyText
                                    });
                                    setEmailStatusMsg({ type: 'success', text: `CONFIRMATION EMAIL SUCCESSFULLY DISPATCHED TO ${sponsorName.toUpperCase()}!` });
                                  } catch (err: any) {
                                    console.error(err);
                                    setEmailStatusMsg({ type: 'error', text: err.message || 'FAILED TO SEND EMAIL' });
                                  } finally {
                                    setEmailSending(false);
                                  }
                                }}
                                disabled={emailSending}
                                className="text-[10px] font-mono bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 px-2 py-1 border border-emerald-900/40 rounded flex items-center gap-1 transition-all cursor-pointer"
                                title="Send confirmation email directly to partner"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{emailSending ? 'SENDING...' : 'SEND EMAIL'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main updates column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-6">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">03.1 // ENGINEERING LOGS & REPORTS</span>
              
              {newsUpdates.length === 0 ? (
                <div className="border border-dashed border-zinc-900 rounded p-12 text-center">
                  <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">No reports or news posted yet</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {newsUpdates.map((update, idx) => (
                    <div key={update.id || idx} className="border-b border-zinc-900 pb-6 last:pb-0 last:border-0 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wide">{update.title}</h4>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block mt-0.5">POSTED ON {update.created_at} BY {update.author}</span>
                        </div>
                        {isTeam && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete project report "${update.title}"?`)) {
                                onDeleteNewsUpdate(update.id);
                              }
                            }}
                            className="text-zinc-650 hover:text-rose-400 p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap uppercase">
                        {update.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary / Sponsor recognition rail & Publish Form */}
          <div className="space-y-6">
            {isTeam && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-500 tracking-widest uppercase block font-bold">ADMINISTRATION PANEL</span>
                  <h3 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wider">Publish Project Report</h3>
                  <p className="text-[9px] text-zinc-500 mt-1 font-mono uppercase">
                    Publish updates on Gantt milestones, milling results, or CAD revisions. All sponsors will be automatically emailed a formal report from cardinalsystems.org.
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newNewsTitle.trim() || !newNewsContent.trim()) return;

                  setIsSendingNewsEmail(true);
                  setNewsSuccessMsg('');

                  try {
                    await onAddNewsUpdate({
                      title: newNewsTitle.trim(),
                      content: newNewsContent.trim(),
                      author: newNewsAuthor.trim()
                    });

                    setNewsSuccessMsg('✔ Report published & emails dispatched successfully!');
                    setNewNewsTitle('');
                    setNewNewsContent('');
                    setTimeout(() => setNewsSuccessMsg(''), 4000);
                  } catch (err: any) {
                    console.error(err);
                  } finally {
                    setIsSendingNewsEmail(false);
                  }
                }} className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Report Title</label>
                    <input
                      type="text"
                      placeholder="e.g. MILLING PHASE COMPLETED"
                      value={newNewsTitle}
                      onChange={(e) => setNewNewsTitle(e.target.value)}
                      required
                      className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Author Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Project Manager"
                      value={newNewsAuthor}
                      onChange={(e) => setNewNewsAuthor(e.target.value)}
                      required
                      className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Report Content</label>
                    <textarea
                      placeholder="ENTER DETAILED LOG CONTENT OR MILESTONE UPDATES..."
                      value={newNewsContent}
                      onChange={(e) => setNewNewsContent(e.target.value)}
                      rows={5}
                      required
                      className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500 resize-none uppercase"
                    />
                  </div>

                  {newsSuccessMsg && (
                    <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 p-2 rounded text-[9px] text-center">
                      {newsSuccessMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingNewsEmail}
                    className="w-full text-center bg-zinc-100 hover:bg-white text-black font-bold p-2.5 rounded transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                  >
                    {isSendingNewsEmail ? 'DISPATCHING...' : 'PUBLISH & EMAIL PARTNERS'}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">SPONSORSHIP DECK & RECOGNITION</span>
              
              <div className="border border-zinc-900 rounded p-4 text-[11px] font-mono space-y-4">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-bold uppercase tracking-wider text-xs">PLEDGE HALL OF FAME</span>
                </div>
                
                {expenditures.filter(e => e.status === 'Pledged').length === 0 ? (
                  <span className="text-zinc-600 text-[10px] block uppercase">Pledge hall is empty. Become our very first backer!</span>
                ) : (
                  <div className="space-y-2">
                    {Array.from(new Set(expenditures.filter(e => e.status === 'Pledged').map(e => e.pledged_by_name))).map((sponsorName, i) => {
                      const totalPledgedByThisSponsor = expenditures
                        .filter(e => e.pledged_by_name === sponsorName && e.status === 'Pledged')
                        .reduce((sum, item) => sum + item.cost, 0);
                      return (
                        <div key={i} className="flex justify-between items-center text-[10px] uppercase">
                          <span className="text-zinc-300 font-bold">♥ {sponsorName}</span>
                          <span className="text-emerald-400 font-bold">₹{totalPledgedByThisSponsor.toFixed(2)} pledged</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'commitments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block font-bold">04.1 // STRATEGIC DELIVERABLES & COMMITMENTS</span>
                  <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider mt-0.5">
                    {activeSponsorEmail ? `${activeSponsorName}'s Deliverables` : 'All Active Sponsorship Commitments'}
                  </h3>
                </div>
              </div>

              {/* Filtering logic: if activeSponsorEmail is set, only show theirs. Else show all. */}
              {(() => {
                const filteredCommitments = activeSponsorEmail
                  ? sponsorCommitments.filter(c => c.sponsor_email === activeSponsorEmail)
                  : sponsorCommitments;

                if (filteredCommitments.length === 0) {
                  return (
                    <div className="border border-dashed border-zinc-900 rounded p-12 text-center">
                      <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">No commitments or deliverables recorded</span>
                      {isTeam && (
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono uppercase">Use the assignment engine to dispatch deliverables to sponsors.</p>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filteredCommitments.map(commitment => (
                      <div key={commitment.id} className="border border-zinc-900 bg-black/30 rounded p-4 space-y-3 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1 bg-zinc-800" />
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wide">{commitment.title}</span>
                              <span className={`px-1.5 py-0.5 text-[8px] font-mono rounded border ${
                                commitment.status === 'Fulfilled'
                                  ? 'text-emerald-400 border-emerald-900/40 bg-emerald-950/10'
                                  : commitment.status === 'In Progress'
                                    ? 'text-amber-400 border-amber-900/40 bg-amber-950/10'
                                    : 'text-zinc-500 border-zinc-800/40 bg-zinc-900/10'
                              }`}>
                                {commitment.status}
                              </span>
                            </div>
                            {!activeSponsorEmail && (
                              <span className="text-[9px] font-mono text-zinc-500 uppercase block mt-1">
                                SPONSOR: {commitment.sponsor_name} ({commitment.sponsor_email})
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">DUE: {commitment.due_date}</span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 whitespace-pre-wrap uppercase leading-relaxed">{commitment.description}</p>
                        
                        {/* Control buttons */}
                        <div className="flex justify-between items-center border-t border-zinc-900/50 pt-3">
                          <div className="flex gap-2">
                            {commitment.status === 'In Queue' && (
                              <button
                                onClick={() => onUpdateSponsorCommitmentStatus(commitment.id, 'In Progress')}
                                className="text-[9px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-2.5 py-1 rounded transition-colors uppercase cursor-pointer"
                              >
                                Start Work
                              </button>
                            )}
                            {commitment.status !== 'Fulfilled' && (
                              <button
                                onClick={() => onUpdateSponsorCommitmentStatus(commitment.id, 'Fulfilled')}
                                className="text-[9px] font-mono bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2.5 py-1 rounded transition-colors uppercase cursor-pointer"
                              >
                                Mark Fulfilled
                              </button>
                            )}
                          </div>
                          {isTeam && (
                            <button
                              onClick={() => onDeleteSponsorCommitment(commitment.id)}
                              className="text-[9px] font-mono text-zinc-600 hover:text-red-400 transition-colors uppercase cursor-pointer"
                            >
                              [DELETE]
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right column: Dispatch form for Team admins */}
          <div className="space-y-6">
            {isTeam ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-500 tracking-widest uppercase block font-bold">ADMINISTRATION PANEL</span>
                  <h3 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wider">Assign Sponsor Deliverable</h3>
                  <p className="text-[9px] text-zinc-500 mt-1 font-mono uppercase">Assign unique strategic actions and deliverables to specific partners. Sponsors can track and mark progress securely.</p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!commitmentTitle || !commitmentDueDate) return;
                  
                  // Extract email and name
                  let email = isInvitingNew ? customInviteEmail : commitmentSponsorEmail;
                  let name = '';
                  const selectedSponsor = allSponsors.find(s => s.email === email);
                  if (selectedSponsor) {
                    name = selectedSponsor.name;
                  } else {
                    name = email.split('@')[0] || 'Partner';
                  }

                  onAddSponsorCommitment({
                    sponsor_email: email,
                    sponsor_name: name,
                    title: commitmentTitle,
                    description: commitmentDescription,
                    due_date: commitmentDueDate,
                    status: 'In Queue',
                    assigned_by: 'Admin'
                  });

                  if (notifySponsorViaEmail && email) {
                    try {
                      setEmailStatusMsg(null);
                      const subject = `New Strategic Deliverable Assigned - Cardinal Overture F1 in Schools`;
                      const bodyText = `Dear ${name},\n\nA new strategic deliverable has been assigned to your brand in the Cardinal Overture Sponsor Workspace:\n\nDELIVERABLE: ${commitmentTitle}\nDESCRIPTION: ${commitmentDescription || 'N/A'}\nDUE DATE: ${commitmentDueDate}\n\nPlease authenticate and log in to the Partner Portal to track, start work, and mark progress on this and other strategic deliverables.\n\nBest regards,\nCardinal Overture F1 in Schools Team`;
                      
                      await sendEmail({ to: email, subject, body: bodyText });
                      setEmailStatusMsg({ type: 'success', text: `SPONSOR NOTIFIED OF DELIVERABLE DISPATCH!` });
                    } catch (err: any) {
                      console.error('Failed to send deliverable dispatch notification:', err);
                      setEmailStatusMsg({ type: 'error', text: `Deliverable added but email dispatch failed: ${err.message}` });
                    }
                  }

                  // Clear form
                  setCommitmentTitle('');
                  setCommitmentDescription('');
                  setCommitmentDueDate('');
                  setCommitmentSponsorEmail('');
                  setCustomInviteEmail('');
                  setIsInvitingNew(false);
                  setIsAddingCommitment(false);
                }} className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Target Sponsor</label>
                    <select
                      value={commitmentSponsorEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCommitmentSponsorEmail(val);
                        if (val === 'new-partner-invite') {
                          setIsInvitingNew(true);
                        } else {
                          setIsInvitingNew(false);
                        }
                      }}
                      required
                      className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value="">-- SELECT SPONSOR --</option>
                      {allSponsors.map(s => (
                        <option key={s.email} value={s.email}>{s.name} ({s.email})</option>
                      ))}
                      <option value="new-partner-invite">-- ASSIGN TO NEW EMAIL --</option>
                    </select>
                  </div>

                  {isInvitingNew && (
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase font-bold">New Sponsor Email</label>
                      <input
                        type="email"
                        placeholder="sponsor@brand.com"
                        required
                        value={customInviteEmail}
                        onChange={(e) => setCustomInviteEmail(e.target.value)}
                        className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Deliverable Title</label>
                    <input
                      type="text"
                      placeholder="e.g. SUBMIT BRAND LOGO VECTORS"
                      value={commitmentTitle}
                      onChange={(e) => setCommitmentTitle(e.target.value)}
                      required
                      className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Description</label>
                    <textarea
                      placeholder="ENTER DETAILED EXPECTATIONS..."
                      value={commitmentDescription}
                      onChange={(e) => setCommitmentDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Due Date</label>
                    <input
                      type="date"
                      value={commitmentDueDate}
                      onChange={(e) => setCommitmentDueDate(e.target.value)}
                      required
                      className="w-full bg-black border border-zinc-800 text-zinc-300 p-2 rounded outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 py-1 select-none">
                    <input
                      type="checkbox"
                      id="notifySponsorViaEmail"
                      checked={notifySponsorViaEmail}
                      onChange={(e) => setNotifySponsorViaEmail(e.target.checked)}
                      className="rounded bg-black border-zinc-850 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="notifySponsorViaEmail" className="text-[9px] text-zinc-400 uppercase cursor-pointer">
                      Notify sponsor instantly via email dispatch
                    </label>
                  </div>

                  {emailStatusMsg && (
                    <div className={`p-2 rounded text-[9px] font-mono border uppercase text-center ${
                      emailStatusMsg.type === 'success' 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' 
                        : 'bg-rose-950/20 text-rose-450 border-rose-900/40'
                    }`}>
                      {emailStatusMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full text-center bg-zinc-100 hover:bg-white text-black font-bold p-2.5 rounded transition-all uppercase tracking-widest text-[10px]"
                  >
                    DISPATCH DELIVERABLE
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block font-bold">COMMITTED PARTNERSHIP</span>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed uppercase">
                  THESE COVENANTS OUTLINE YOUR ASSIGNED DELIVERABLES & EXPECTATIONS AS A VALUE PARTNER.
                </p>
                <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded text-[11px] font-mono text-zinc-500 uppercase leading-relaxed">
                  ONLY YOUR BRAND REPRESENTATIVE AND THE MAIN ADMINISTRATIVE TEAM CAN ACCESS OR MODIFY THESE DELIVERABLES.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
