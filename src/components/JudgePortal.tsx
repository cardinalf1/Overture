import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, CheckSquare, FileText, Star, BarChart2, 
  MessageSquare, PlusCircle, Calendar, Sparkles, TrendingDown, Trash2 
} from 'lucide-react';
import { Node, CadIteration, JudgeFeedback } from '../types';
import { GanttChart } from './GanttChart';
import { useAuth } from './AuthGate';

interface JudgePortalProps {
  nodes: Node[];
  iterations: CadIteration[];
  judgeFeedbacks: JudgeFeedback[];
  onAddJudgeFeedback: (feedback: Omit<JudgeFeedback, 'id' | 'judge_email' | 'judge_name' | 'created_at'>) => void;
  onDeleteFeedback: (id: string) => void;
  newsUpdates: any[];
}

export function JudgePortal({
  nodes,
  iterations,
  judgeFeedbacks,
  onAddJudgeFeedback,
  onDeleteFeedback,
  newsUpdates
}: JudgePortalProps) {
  const { user, name: judgeName } = useAuth();

  // Local state for feedback form
  const [category, setCategory] = useState('Engineering Design & CAD');
  const [score, setScore] = useState(8);
  const [comments, setComments] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Tabs for Judge portal
  const [activeTab, setActiveTab] = useState<'evaluation' | 'engineering' | 'pmsponsor'>('evaluation');

  // Math stats for dashboard
  const completedTasksCount = nodes.filter(n => n.status === 'Completed').length;
  const progressPercent = nodes.length > 0 ? Math.round((completedTasksCount / nodes.length) * 100) : 0;
  
  const latestCar = iterations[iterations.length - 1];

  // Filters feedbacks left by THIS judge
  const myFeedbacks = judgeFeedbacks.filter(f => f.judge_email === user?.email);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    onAddJudgeFeedback({
      category,
      score,
      comments
    });

    setComments('');
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  const categories = [
    'Engineering Design & CAD',
    'Project Management & Execution',
    'Sponsor Portfolio & Budgeting',
    'Overall Impression & Presentation'
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-navigation */}
      <div className="flex border-b border-zinc-900 gap-6">
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'evaluation' ? 'border-zinc-100 text-zinc-100 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          01 // EVALUATOR CARD
        </button>
        <button
          onClick={() => setActiveTab('engineering')}
          className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'engineering' ? 'border-zinc-100 text-zinc-100 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          02 // TECHNICAL PORTFOLIO & CAD
        </button>
        <button
          onClick={() => setActiveTab('pmsponsor')}
          className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'pmsponsor' ? 'border-zinc-100 text-zinc-100 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          03 // PM, GANTT & LOGS
        </button>
      </div>

      {activeTab === 'evaluation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scoring/Submission Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-6">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">OFFICIAL SCORECARD</span>
                <h2 className="text-sm font-mono font-bold text-zinc-100 tracking-wider uppercase">Submit Evaluator Feedback & Scores</h2>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category select */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">EVALUATION CATEGORY</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-black border border-zinc-900 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-800 transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Score Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono tracking-wider uppercase text-zinc-500">
                      <span>METRIC SCORE</span>
                      <span className="text-zinc-100 font-bold">{score} / 10</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value))}
                        className="flex-1 accent-zinc-200 bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Comments box */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block">EVALUATOR COMMENDATIONS & COMMENTS</label>
                  <textarea
                    rows={4}
                    required
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter detailed critical feedback, technical observations, or suggestions for the F1 team here..."
                    className="w-full bg-black border border-zinc-900 rounded px-3 py-2.5 text-xs font-mono text-zinc-200 placeholder-zinc-800 focus:outline-none focus:border-zinc-800 transition-all uppercase"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[9px] font-mono text-zinc-600 uppercase">
                    SUBMITTING AS: {judgeName}
                  </span>
                  
                  <button
                    type="submit"
                    className="flex items-center gap-2 text-xs font-mono bg-zinc-100 hover:bg-white text-black px-5 py-2.5 rounded font-bold transition-colors uppercase"
                  >
                    <Award className="w-3.5 h-3.5" />
                    RECORD GRADE
                  </button>
                </div>
              </form>

              {formSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-950/20 border border-emerald-900/30 rounded p-4 text-[10px] font-mono text-emerald-400 uppercase text-center"
                >
                  ✔ Score and feedback recorded successfully in Supabase backend cloud ledger.
                </motion.div>
              )}
            </div>

            {/* My feedback history */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">My Evaluation Ledger</span>
              
              {myFeedbacks.length === 0 ? (
                <div className="border border-dashed border-zinc-900 rounded p-6 text-center text-zinc-600 text-[10px] font-mono uppercase">
                  You have not recorded any grades for this project yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {myFeedbacks.map(f => (
                    <div key={f.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex justify-between items-start text-xs font-mono">
                        <div>
                          <span className="text-zinc-100 font-bold block">{f.category}</span>
                          <span className="text-[9px] text-zinc-500 uppercase">Submitted {f.created_at}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold px-2.5 py-1 rounded text-[10px]">
                            {f.score} / 10
                          </span>
                          <button
                            onClick={() => onDeleteFeedback(f.id)}
                            className="text-zinc-600 hover:text-rose-400 transition-colors"
                            title="Delete Feedback"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-zinc-400 leading-relaxed uppercase">
                        {f.comments}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side stats / Rubric Info */}
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">OFFICIAL RUBRIC GUIDES</span>
              
              <div className="space-y-4 text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
                <div className="border-b border-zinc-900 pb-3">
                  <span className="text-zinc-300 font-bold block mb-1">01 // Engineering Design & CAD</span>
                  Assess computational fluid dynamics, wind tunnel metrics, drag coefficient advancements, and overall geometric milling fidelity.
                </div>
                <div className="border-b border-zinc-900 pb-3">
                  <span className="text-zinc-300 font-bold block mb-1">02 // Project Management</span>
                  Assess chronological compliance, dependency tracking, task completion density, and simulation efficiency.
                </div>
                <div className="border-b border-zinc-900 pb-3">
                  <span className="text-zinc-300 font-bold block mb-1">03 // Portfolio & Budget</span>
                  Assess resource acquisition ingenuity, corporate sponsorship coverage, and purchasing integrity.
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">Project Metrics</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/55 border border-zinc-900 p-3 rounded text-center">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase">CAD ITERATIONS</span>
                  <span className="text-sm font-mono text-zinc-200 font-bold">{iterations.length}</span>
                </div>
                <div className="bg-black/55 border border-zinc-900 p-3 rounded text-center">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase">GANTT PROGRESS</span>
                  <span className="text-sm font-mono text-zinc-200 font-bold">{progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engineering' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">CURRENT AERODYNAMIC DESIGN DETAIL</span>
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

            {/* Iterations Grid List for Judges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {iterations.map(iter => (
                <div key={iter.id} className="bg-black border border-zinc-900 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-zinc-100">{iter.id}</span>
                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                      iter.status === 'Simulated' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' :
                      iter.status === 'Milled' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {iter.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px] text-zinc-400">
                    <div className="flex justify-between">
                      <span>FILE:</span>
                      <span className="text-zinc-300 font-bold truncate max-w-[100px]" title={iter.cad_file_ref}>{iter.cad_file_ref}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WEIGHT:</span>
                      <span className="text-zinc-200 font-bold">{iter.weight_grams}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DRAG COEFF:</span>
                      <span className="text-emerald-400 font-bold">Cd {iter.drag_coefficient_cd.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pmsponsor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Live Gantt Chart read-only */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block mb-3">Chronological Execution Gantt</span>
              <div className="h-96">
                <GanttChart nodes={nodes} simulatedDate={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Logs/Updates */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">03 // PM LOGS & COMMUNICATIONS</span>
              
              <div className="space-y-4">
                {newsUpdates.length === 0 ? (
                  <span className="text-[10px] font-mono text-zinc-600 block uppercase">No updates or posts in the logs list.</span>
                ) : (
                  newsUpdates.map((update, i) => (
                    <div key={update.id || i} className="border-b border-zinc-900 pb-3 last:border-0 last:pb-0 space-y-1">
                      <span className="text-zinc-300 font-bold block text-[11px] uppercase">{update.title}</span>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase truncate leading-relaxed">
                        {update.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
