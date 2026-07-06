import { useState, useEffect } from 'react';
import { TopStats } from './components/TopStats';
import { Header } from './components/Header';
import { GanttChart } from './components/GanttChart';
import { NodeList } from './components/NodeList';
import { NewNodeModal } from './components/NewNodeModal';
import { EngineeringHub } from './components/EngineeringHub';
import { SettingsModal } from './components/SettingsModal';
import { PartnerPortal } from './components/PartnerPortal';
import { JudgePortal } from './components/JudgePortal';
import { AccessControlPanel } from './components/AccessControlPanel';
import { initialNodes } from './data/mockNodes';
import { initialIterations } from './data/mockIterations';
import { Role, Status, Node, Department, CadIteration, ExpenditureItem, NewsUpdate, JudgeFeedback, AuthorizedUser, SponsorCommitment } from './types';
import { exportSystemData, importSystemData } from './utils/csv';
import { isSupabaseConfigured } from './lib/supabase';
import { supabaseService } from './lib/supabaseService';
import { useAuth } from './components/AuthGate';
import { sendEmail } from './lib/emailService';
import { PublicWelcome } from './components/PublicWelcome';

// Default mock records for Expenditures, News and Feedback
const defaultExpenditures: ExpenditureItem[] = [
  {
    id: "EXP-001",
    item_name: "Polyurethane Foam Block for CNC Machining",
    cost: 45.00,
    category: "Materials",
    needed_by: "2026-07-10",
    status: "Pending",
    pledged_by_email: null,
    pledged_by_name: null
  },
  {
    id: "EXP-002",
    item_name: "Fluoropolymer Low-Friction Wheel Bearings",
    cost: 35.50,
    category: "Materials",
    needed_by: "2026-07-15",
    status: "Pending",
    pledged_by_email: null,
    pledged_by_name: null
  },
  {
    id: "EXP-003",
    item_name: "F1 Wind Tunnel Simulation License Upgrade",
    cost: 120.00,
    category: "Software",
    needed_by: "2026-07-20",
    status: "Pending",
    pledged_by_email: null,
    pledged_by_name: null
  },
  {
    id: "EXP-004",
    item_name: "Titanium Milled Front Wing Prototypes",
    cost: 85.00,
    category: "Manufacturing",
    needed_by: "2026-07-25",
    status: "Pending",
    pledged_by_email: null,
    pledged_by_name: null
  },
  {
    id: "EXP-005",
    item_name: "Pit Display Stands & Corporate Vinyl Banners",
    cost: 150.00,
    category: "Marketing",
    needed_by: "2026-08-01",
    status: "Pending",
    pledged_by_email: null,
    pledged_by_name: null
  }
];

const defaultNews: NewsUpdate[] = [
  {
    id: "NEWS-001",
    title: "Aerodynamic Simulation Breakthrough",
    content: "Our Design and Engineering sub-teams have completed Virtual Wind Tunnel simulations on V1.4. The drag coefficient has been reduced by 12% through targeted sidepod tapering.",
    created_at: "2026-07-01",
    author: "R&D Lead"
  },
  {
    id: "NEWS-002",
    title: "CNC Block Milling Complete",
    content: "The raw polyurethane block has been successfully milled to specification. Wheel wells are aligned, and the chassis conforms perfectly to the F1 in Schools technical regulations.",
    created_at: "2026-07-02",
    author: "Manufacturing Lead"
  }
];

const defaultFeedbacks: JudgeFeedback[] = [
  {
    id: "J-001",
    judge_name: "Lead Scrutineer",
    judge_email: "scrutineer@f1inschools.com",
    category: "Engineering Design & CAD",
    score: 9,
    comments: "EXTREMELY IMPRESSIVE CHASSIS COMPLIANCE. VERTEX COHERENCE IN THE CAD FILE IS PERFECT. AIRFOIL SLOPE CONFORMS FULLY TO THE 2026 RADIUS SPECIFICATION.",
    created_at: "2026-07-02"
  }
];

export default function App() {
  const { isSupabaseActive, role: authRole, user, name: authName } = useAuth();
  const [currentRole, setCurrentRole] = useState<Role>('PM');
  const [activeModule, setActiveModule] = useState('Command Center');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [simulatedDate, setSimulatedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [supabaseLoading, setSupabaseLoading] = useState(isSupabaseActive);

  // Initialize core states
  const [nodes, setNodes] = useState<Node[]>(() => {
    const saved = localStorage.getItem('cardinal_nodes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const seen = new Set<string>();
        return parsed.map((node: Node, index: number) => {
          let id = node.id;
          if (seen.has(id)) {
            id = `${id}-dup-${index}`;
          }
          seen.add(id);
          return { ...node, id };
        });
      } catch (e) {
        return initialNodes;
      }
    }
    return initialNodes;
  });
  
  const [iterations, setIterations] = useState<CadIteration[]>(() => {
    const saved = localStorage.getItem('cardinal_iterations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const seen = new Set<string>();
        return parsed.map((iter: CadIteration, index: number) => {
          let id = iter.id;
          if (seen.has(id)) {
            id = `${id}-dup-${index}`;
          }
          seen.add(id);
          return { ...iter, id };
        });
      } catch (e) {
        return initialIterations;
      }
    }
    return initialIterations;
  });

  const [expenditures, setExpenditures] = useState<ExpenditureItem[]>(() => {
    const saved = localStorage.getItem('cardinal_expenditures');
    return saved ? JSON.parse(saved) : defaultExpenditures;
  });

  const [newsUpdates, setNewsUpdates] = useState<NewsUpdate[]>(() => {
    const saved = localStorage.getItem('cardinal_news');
    return saved ? JSON.parse(saved) : defaultNews;
  });

  const [judgeFeedbacks, setJudgeFeedbacks] = useState<JudgeFeedback[]>(() => {
    const saved = localStorage.getItem('cardinal_feedback');
    return saved ? JSON.parse(saved) : defaultFeedbacks;
  });

  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() => {
    const saved = localStorage.getItem('cardinal_authorized_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [accountRequests, setAccountRequests] = useState<any[]>([]);

  const [sponsorCommitments, setSponsorCommitments] = useState<SponsorCommitment[]>(() => {
    const saved = localStorage.getItem('cardinal_sponsor_commitments');
    return saved ? JSON.parse(saved) : [
      {
        id: 'commit-1',
        sponsor_email: 'sponsor1@example.com',
        sponsor_name: 'Autodesk',
        title: 'Review CAD Clearance Tolerances',
        description: 'Verify 0.5mm clearance on front spoiler mounting assemblies.',
        due_date: '2026-07-15',
        status: 'In Queue',
        assigned_by: 'Admin'
      },
      {
        id: 'commit-2',
        sponsor_email: 'sponsor1@example.com',
        sponsor_name: 'Autodesk',
        title: 'Submit Vector Brand Assets',
        description: 'Provide high-contrast vector file versions for physical decals on milled car bodies.',
        due_date: '2026-07-20',
        status: 'In Progress',
        assigned_by: 'Admin'
      }
    ];
  });

  // Role-based Auto Module Routing
  useEffect(() => {
    if (authRole === 'Sponsor') {
      setActiveModule('Sponsor Portal');
    } else if (authRole === 'Judge') {
      setActiveModule('Judge Portal');
    } else if (authRole === 'Guest') {
      setActiveModule('Progress & Timeline');
    } else {
      setActiveModule('Command Center');
    }
  }, [authRole]);

  // Fetch from Supabase on mount (if configured)
  useEffect(() => {
    async function initSupabase() {
      if (!isSupabaseActive) {
        const savedReqs = localStorage.getItem('cardinal_account_requests');
        if (savedReqs) setAccountRequests(JSON.parse(savedReqs));
        setSupabaseLoading(false);
        return;
      }
      try {
        setSupabaseLoading(true);
        let remoteNodes = await supabaseService.getNodes();
        let remoteIterations = await supabaseService.getIterations();
        let remoteExpenditures = await supabaseService.getExpenditures();
        let remoteNews = await supabaseService.getNewsUpdates();
        let remoteFeedback = await supabaseService.getJudgeFeedback();
        let remoteAuthUsers = await supabaseService.getAuthorizedUsers();
        let remoteAccountRequests = await supabaseService.getAccountRequests();

        // Seed if core tables are completely empty (helps user get started instantly!)
        if (remoteNodes.length === 0 && remoteIterations.length === 0) {
          console.log('Supabase tables empty, auto-seeding default Overture data...');
          for (const node of initialNodes) {
            await supabaseService.upsertNode(node);
          }
          for (const iter of initialIterations) {
            await supabaseService.upsertIteration(iter);
          }
          for (const exp of defaultExpenditures) {
            await supabaseService.upsertExpenditure(exp);
          }
          for (const newsItem of defaultNews) {
            await supabaseService.upsertNewsUpdate(newsItem);
          }
          for (const fed of defaultFeedbacks) {
            await supabaseService.upsertJudgeFeedback(fed);
          }
          remoteNodes = await supabaseService.getNodes();
          remoteIterations = await supabaseService.getIterations();
          remoteExpenditures = await supabaseService.getExpenditures();
          remoteNews = await supabaseService.getNewsUpdates();
          remoteFeedback = await supabaseService.getJudgeFeedback();
          remoteAuthUsers = await supabaseService.getAuthorizedUsers();
        }

        if (remoteNodes.length > 0) setNodes(remoteNodes);
        if (remoteIterations.length > 0) setIterations(remoteIterations);
        if (remoteExpenditures.length > 0) setExpenditures(remoteExpenditures);
        if (remoteNews.length > 0) setNewsUpdates(remoteNews);
        if (remoteFeedback.length > 0) setJudgeFeedbacks(remoteFeedback);
        if (remoteAuthUsers.length > 0) setAuthorizedUsers(remoteAuthUsers);
        if (remoteAccountRequests.length > 0) {
          setAccountRequests(remoteAccountRequests);
        } else {
          const savedReqs = localStorage.getItem('cardinal_account_requests');
          if (savedReqs) setAccountRequests(JSON.parse(savedReqs));
        }
      } catch (err) {
        console.error('Failed to sync with Supabase on mount:', err);
      } finally {
        setSupabaseLoading(false);
      }
    }
    initSupabase();
  }, [isSupabaseActive]);

  // Persist state to localStorage on change
  useEffect(() => {
    localStorage.setItem('cardinal_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('cardinal_iterations', JSON.stringify(iterations));
  }, [iterations]);

  useEffect(() => {
    localStorage.setItem('cardinal_expenditures', JSON.stringify(expenditures));
  }, [expenditures]);

  useEffect(() => {
    localStorage.setItem('cardinal_news', JSON.stringify(newsUpdates));
  }, [newsUpdates]);

  useEffect(() => {
    localStorage.setItem('cardinal_feedback', JSON.stringify(judgeFeedbacks));
  }, [judgeFeedbacks]);

  useEffect(() => {
    localStorage.setItem('cardinal_authorized_users', JSON.stringify(authorizedUsers));
  }, [authorizedUsers]);

  // RBAC Visibility Logic
  const visibleNodes = nodes.filter(node => {
    if (currentRole === 'PM') return true;
    return node.department === currentRole || node.department === 'Everyone';
  });

  const handleUpdateStatus = (id: string, status: Status) => {
    // Check dependency constraints
    const targetNode = nodes.find(n => n.id === id);
    if (targetNode && targetNode.dependency && (status === 'In Progress' || status === 'Completed')) {
      const depNode = nodes.find(n => n.id === targetNode.dependency);
      if (depNode && depNode.status !== 'Completed') {
        alert(`SCHEDULING VIOLATION: Cannot progress "${targetNode.title}" because it depends on "${depNode.title}" (${depNode.id}), which is not yet Completed.`);
        return;
      }
    }

    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        const today = simulatedDate;
        let actual_start = n.actual_start;
        let actual_end = n.actual_end;
        
        if (status === 'In Progress' && n.status === 'To Do') {
          actual_start = today;
        } else if (status === 'Completed' && n.status !== 'Completed') {
          actual_end = today;
          if (!actual_start) actual_start = today;
        } else if (status === 'To Do') {
          actual_start = null;
          actual_end = null;
        }
        
        const updatedNode = { ...n, status, actual_start, actual_end };
        supabaseService.upsertNode(updatedNode).catch(console.error);
        return updatedNode;
      }
      return n;
    }));
  };

  const handleDeleteNode = (id: string) => {
    if (currentRole !== 'PM') return;
    setNodes(prev => prev.filter(n => n.id !== id));
    supabaseService.deleteNode(id).catch(console.error);
  };

  const handleCreateNode = (nodeData: { title: string; description: string; department: Department; planned_start: string; planned_end: string }) => {
    if (currentRole !== 'PM') return;
    
    const maxIdNum = nodes.reduce((max, node) => {
      const match = node.id.match(/^(?:ND|N)-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const newId = `ND-${String(maxIdNum + 1).padStart(3, '0')}`;
    const newNode: Node = {
      id: newId,
      ...nodeData,
      status: 'To Do',
      actual_start: null,
      actual_end: null,
    };
    
    setNodes(prev => [...prev, newNode]);
    supabaseService.upsertNode(newNode).catch(console.error);
  };

  // EXPENDITURE HANDLERS
  const handleAddExpenditure = (itemData: Omit<ExpenditureItem, 'id' | 'pledged_by_email' | 'pledged_by_name'>) => {
    const newId = `EXP-${String(expenditures.length + 1).padStart(3, '0')}`;
    const newItem: ExpenditureItem = {
      id: newId,
      ...itemData,
      pledged_by_email: null,
      pledged_by_name: null
    };

    setExpenditures(prev => [newItem, ...prev]);
    supabaseService.upsertExpenditure(newItem).catch(console.error);
  };

  const handleDeleteExpenditure = (id: string) => {
    setExpenditures(prev => prev.filter(e => e.id !== id));
    supabaseService.deleteExpenditure(id).catch(console.error);
  };

  const handlePledgeExpenditure = (id: string, name: string, email: string) => {
    setExpenditures(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, status: 'Pledged' as const, pledged_by_email: email, pledged_by_name: name };
        supabaseService.upsertExpenditure(updated).catch(console.error);
        return updated;
      }
      return e;
    }));
  };

  const handleUnpledgeExpenditure = (id: string) => {
    setExpenditures(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, status: 'Pending' as const, pledged_by_email: null, pledged_by_name: null };
        supabaseService.upsertExpenditure(updated).catch(console.error);
        return updated;
      }
      return e;
    }));
  };

  // SPONSOR COMMITMENT HANDLERS
  const handleAddSponsorCommitment = (commitment: Omit<SponsorCommitment, 'id'>) => {
    const newCommitment: SponsorCommitment = {
      ...commitment,
      id: `commit-${Date.now()}`
    };
    const updated = [...sponsorCommitments, newCommitment];
    setSponsorCommitments(updated);
    localStorage.setItem('cardinal_sponsor_commitments', JSON.stringify(updated));
  };

  const handleUpdateSponsorCommitmentStatus = (id: string, status: SponsorCommitment['status']) => {
    const updated = sponsorCommitments.map(c => c.id === id ? { ...c, status } : c);
    setSponsorCommitments(updated);
    localStorage.setItem('cardinal_sponsor_commitments', JSON.stringify(updated));
  };

  const handleDeleteSponsorCommitment = (id: string) => {
    const updated = sponsorCommitments.filter(c => c.id !== id);
    setSponsorCommitments(updated);
    localStorage.setItem('cardinal_sponsor_commitments', JSON.stringify(updated));
  };

  // NEWS & REPORTS HANDLERS & AUTOMATED EMAILS
  const sendNewsEmailToAllPartners = async (newsItem: NewsUpdate) => {
    const partners = new Map<string, string>(); // email -> name
    
    expenditures.forEach(e => {
      if (e.pledged_by_email) {
        partners.set(e.pledged_by_email.toLowerCase().trim(), e.pledged_by_name || e.pledged_by_email.split('@')[0]);
      }
    });

    authorizedUsers.forEach(u => {
      if (u.role === 'Sponsor' && u.email) {
        partners.set(u.email.toLowerCase().trim(), u.notes || u.email.split('@')[0]);
      }
    });

    if (partners.size === 0) {
      console.log('No partners registered to receive email updates.');
      return;
    }

    partners.forEach(async (name, email) => {
      const subject = `Cardinal Overture Project Update: ${newsItem.title}`;
      const body = `Dear ${name},

A new project update has been posted by the Project Manager in the Cardinal Overture Workspace:

------------------------------------------------------------------------
TITLE: ${newsItem.title}
DATE: ${newsItem.created_at}
------------------------------------------------------------------------

${newsItem.content}

------------------------------------------------------------------------

Log in to the Secure Portal to view iterations, active deliverables, and project progression.

Best regards,
Cardinal Overture F1 in Schools Team
(Dispatched via cardinalsystems.org)`;

      try {
        await sendEmail({ to: email, subject, body });
      } catch (err) {
        console.error(`Failed to send update email to ${email}:`, err);
      }
    });
  };

  const handleAddNewsUpdate = (newsData: Omit<NewsUpdate, 'id' | 'created_at'>) => {
    const newId = `NEWS-${Date.now()}`;
    const newNews: NewsUpdate = {
      id: newId,
      created_at: simulatedDate,
      ...newsData
    };
    const updated = [newNews, ...newsUpdates];
    setNewsUpdates(updated);
    supabaseService.upsertNewsUpdate(newNews).catch(console.error);
    
    // Dispatch automated email to all partners via our placeholder system
    sendNewsEmailToAllPartners(newNews);
  };

  const handleDeleteNewsUpdate = (id: string) => {
    const updated = newsUpdates.filter(n => n.id !== id);
    setNewsUpdates(updated);
    supabaseService.deleteNewsUpdate(id).catch(console.error);
  };

  // JUDGE FEEDBACK HANDLERS
  const handleAddJudgeFeedback = (feedData: Omit<JudgeFeedback, 'id' | 'judge_email' | 'judge_name' | 'created_at'>) => {
    const newId = `JDB-${Date.now()}`;
    const newFeedback: JudgeFeedback = {
      id: newId,
      judge_email: user?.email || 'evaluator@system.domain',
      judge_name: authName || 'Standard Evaluator',
      created_at: new Date().toISOString().split('T')[0],
      ...feedData
    };

    setJudgeFeedbacks(prev => [newFeedback, ...prev]);
    supabaseService.upsertJudgeFeedback(newFeedback).catch(console.error);
  };

  const handleDeleteFeedback = (id: string) => {
    setJudgeFeedbacks(prev => prev.filter(f => f.id !== id));
    supabaseService.deleteJudgeFeedback(id).catch(console.error);
  };

  // AUTHORIZED USERS ACCESS HANDLERS
  const handleAddAuthorizedUser = (userData: Omit<AuthorizedUser, 'id'>) => {
    const newId = `AUTH-${Date.now()}`;
    const newUser: AuthorizedUser = {
      id: newId,
      ...userData
    };
    setAuthorizedUsers(prev => [newUser, ...prev]);
    supabaseService.upsertAuthorizedUser(newUser).catch(console.error);

    // Auto-clean any matching pending registration requests
    const matchingReq = accountRequests.find(r => r.email.toLowerCase().trim() === userData.email.toLowerCase().trim());
    if (matchingReq) {
      handleDeleteAccountRequest(matchingReq.id);
    }
  };

  const handleDeleteAuthorizedUser = (id: string) => {
    setAuthorizedUsers(prev => prev.filter(u => u.id !== id));
    supabaseService.deleteAuthorizedUser(id).catch(console.error);
  };

  const handleCreateAccountRequest = async (email: string) => {
    try {
      await supabaseService.createAccountRequest(email);
      const updated = await supabaseService.getAccountRequests();
      setAccountRequests(updated);
    } catch (e) {
      console.error('Failed to create account request:', e);
      throw e;
    }
  };

  const handleDeleteAccountRequest = async (id: string) => {
    try {
      await supabaseService.deleteAccountRequest(id);
      const updated = await supabaseService.getAccountRequests();
      setAccountRequests(updated);
    } catch (e) {
      console.error('Failed to delete account request:', e);
    }
  };

  const handleExportSystem = () => {
    exportSystemData(nodes, iterations);
  };

  const handleImportSystem = async (file: File) => {
    try {
      const data = await importSystemData(file);
      setNodes(data.nodes);
      setIterations(data.iterations);
      if (isSupabaseConfigured) {
        for (const node of data.nodes) {
          await supabaseService.upsertNode(node);
        }
        for (const iter of data.iterations) {
          await supabaseService.upsertIteration(iter);
        }
      }
      alert('System data imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import system data. Please check the CSV format.');
    }
  };

  const activeCadIteration = iterations.length > 0 ? iterations[iterations.length - 1] : null;

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-50 overflow-hidden font-sans selection:bg-zinc-800">
      <Header 
        currentRole={currentRole} 
        onRoleChange={setCurrentRole} 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        isSupabaseActive={isSupabaseActive}
      />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {authRole === 'Guest' ? (
          <PublicWelcome 
            nodes={visibleNodes}
            expenditures={expenditures}
            simulatedDate={simulatedDate}
            activeCadIteration={activeCadIteration}
            onRequestAccount={handleCreateAccountRequest}
          />
        ) : (
          (activeModule === 'Command Center' || activeModule === 'Progress & Timeline') && (
            <>
              <TopStats activeCadIteration={activeCadIteration} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px] h-[calc(100vh-12rem)]">
                <div className="h-full">
                  <NodeList 
                    nodes={visibleNodes} 
                    currentRole={currentRole}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteNode={handleDeleteNode}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                    isReadOnly={false}
                  />
                </div>
                <div className="h-full">
                  <GanttChart nodes={visibleNodes} simulatedDate={simulatedDate} />
                </div>
              </div>
            </>
          )
        )}

        {activeModule === 'Engineering & R&D' && (
          <div className="h-[calc(100vh-8rem)]">
            <EngineeringHub iterations={iterations} setIterations={setIterations} />
          </div>
        )}

        {(activeModule === 'Sponsor Portal' || activeModule === 'Sponsor Dashboard') && (
          <PartnerPortal 
            expenditures={expenditures}
            onAddExpenditure={handleAddExpenditure}
            onDeleteExpenditure={handleDeleteExpenditure}
            onPledgeExpenditure={handlePledgeExpenditure}
            onUnpledgeExpenditure={handleUnpledgeExpenditure}
            iterations={iterations}
            nodes={nodes}
            newsUpdates={newsUpdates}
            authorizedUsers={authorizedUsers}
            sponsorCommitments={sponsorCommitments}
            onAddSponsorCommitment={handleAddSponsorCommitment}
            onUpdateSponsorCommitmentStatus={handleUpdateSponsorCommitmentStatus}
            onDeleteSponsorCommitment={handleDeleteSponsorCommitment}
            onAddNewsUpdate={handleAddNewsUpdate}
            onDeleteNewsUpdate={handleDeleteNewsUpdate}
          />
        )}

        {(activeModule === 'Judge Portal' || activeModule === 'Evaluator Scores') && (
          <JudgePortal 
            nodes={nodes}
            iterations={iterations}
            judgeFeedbacks={judgeFeedbacks}
            onAddJudgeFeedback={handleAddJudgeFeedback}
            onDeleteFeedback={handleDeleteFeedback}
            newsUpdates={newsUpdates}
          />
        )}

        {activeModule === 'Access Control' && (
          <AccessControlPanel 
            authorizedUsers={authorizedUsers}
            onAddAuthorizedUser={handleAddAuthorizedUser}
            onDeleteAuthorizedUser={handleDeleteAuthorizedUser}
            accountRequests={accountRequests}
            onDeleteAccountRequest={handleDeleteAccountRequest}
          />
        )}
      </main>

      <NewNodeModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateNode} 
        existingNodes={nodes}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentRole={currentRole}
        simulatedDate={simulatedDate}
        onDateChange={setSimulatedDate}
        onExport={handleExportSystem}
        onImport={handleImportSystem}
      />


    </div>
  );
}
