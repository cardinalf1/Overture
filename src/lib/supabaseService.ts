import { supabase, isSupabaseConfigured } from './supabase';
import { Node, CadIteration, ExpenditureItem, NewsUpdate, JudgeFeedback, AuthorizedUser, SponsorCommitment } from '../types';

export const supabaseService = {
  // --- Nodes (Tasks) ---
  async getNodes(): Promise<Node[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .order('planned_start', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Table "nodes" does not exist yet. Please run the Supabase setup script.');
          return [];
        }
        throw error;
      }
      return (data || []) as Node[];
    } catch (e) {
      console.error('Error fetching nodes:', e);
      return [];
    }
  },

  async upsertNode(node: Node): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('nodes')
        .upsert({
          id: node.id,
          title: node.title,
          description: node.description,
          department: node.department,
          status: node.status,
          planned_start: node.planned_start,
          planned_end: node.planned_end,
          actual_start: node.actual_start,
          actual_end: node.actual_end,
          dependency: node.dependency || null
        });

      if (error) throw error;
    } catch (e) {
      console.error('Error upserting node:', e);
    }
  },

  async deleteNode(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('nodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting node:', e);
    }
  },

  // --- CAD Iterations ---
  async getIterations(): Promise<CadIteration[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('cad_iterations')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Table "cad_iterations" does not exist yet. Please run the Supabase setup script.');
          return [];
        }
        throw error;
      }
      return (data || []) as CadIteration[];
    } catch (e) {
      console.error('Error fetching iterations:', e);
      return [];
    }
  },

  async upsertIteration(iteration: CadIteration): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('cad_iterations')
        .upsert({
          id: iteration.id,
          date: iteration.date,
          cad_file_ref: iteration.cad_file_ref,
          weight_grams: iteration.weight_grams,
          drag_coefficient_cd: iteration.drag_coefficient_cd,
          status: iteration.status,
          model_url: iteration.model_url || null,
          model_name: iteration.model_name || null
        });

      if (error) throw error;
    } catch (e) {
      console.error('Error upserting iteration:', e);
    }
  },

  async deleteIteration(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('cad_iterations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting iteration:', e);
    }
  },

  // --- Expenditures (Purchases & Sponsor Pledges) ---
  async getExpenditures(): Promise<ExpenditureItem[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('expenditures')
        .select('*')
        .order('needed_by', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Table "expenditures" does not exist yet.');
          return [];
        }
        throw error;
      }
      return (data || []) as ExpenditureItem[];
    } catch (e) {
      console.error('Error fetching expenditures:', e);
      return [];
    }
  },

  async upsertExpenditure(item: ExpenditureItem): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('expenditures')
        .upsert({
          id: item.id,
          item_name: item.item_name,
          cost: item.cost,
          category: item.category,
          needed_by: item.needed_by,
          status: item.status,
          pledged_by_email: item.pledged_by_email,
          pledged_by_name: item.pledged_by_name
        });
      if (error) throw error;
    } catch (e) {
      console.error('Error upserting expenditure:', e);
    }
  },

  async deleteExpenditure(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('expenditures')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting expenditure:', e);
    }
  },

  // --- News Updates & Reports ---
  async getNewsUpdates(): Promise<NewsUpdate[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Table "news_updates" does not exist yet.');
          return [];
        }
        throw error;
      }
      return (data || []) as NewsUpdate[];
    } catch (e) {
      console.error('Error fetching news updates:', e);
      return [];
    }
  },

  async upsertNewsUpdate(update: NewsUpdate): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('news_updates')
        .upsert({
          id: update.id,
          title: update.title,
          content: update.content,
          created_at: update.created_at,
          author: update.author
        });
      if (error) throw error;
    } catch (e) {
      console.error('Error upserting news update:', e);
    }
  },

  async deleteNewsUpdate(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('news_updates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting news update:', e);
    }
  },

  // --- Judge Feedback & Grading ---
  async getJudgeFeedback(): Promise<JudgeFeedback[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('judge_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Table "judge_feedback" does not exist yet.');
          return [];
        }
        throw error;
      }
      return (data || []) as JudgeFeedback[];
    } catch (e) {
      console.error('Error fetching judge feedback:', e);
      return [];
    }
  },

  async upsertJudgeFeedback(feedback: JudgeFeedback): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('judge_feedback')
        .upsert({
          id: feedback.id,
          judge_email: feedback.judge_email,
          judge_name: feedback.judge_name,
          category: feedback.category,
          score: feedback.score,
          comments: feedback.comments,
          created_at: feedback.created_at
        });
      if (error) throw error;
    } catch (e) {
      console.error('Error upserting judge feedback:', e);
    }
  },

  async deleteJudgeFeedback(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('judge_feedback')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting judge feedback:', e);
    }
  },

  // --- Authorized Users / Access Control List ---
  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Table "authorized_users" does not exist yet.');
          return [];
        }
        throw error;
      }
      return (data || []) as AuthorizedUser[];
    } catch (e) {
      console.error('Error fetching authorized users:', e);
      return [];
    }
  },

  async upsertAuthorizedUser(user: AuthorizedUser): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('authorized_users')
        .upsert({
          id: user.id,
          email: user.email.toLowerCase().trim(),
          role: user.role,
          password: user.password || '',
          notes: user.notes || '',
          created_at: user.created_at || new Date().toISOString(),
          is_greenlit: user.is_greenlit ?? false
        });
      if (error) throw error;
    } catch (e) {
      console.error('Error upserting authorized user:', e);
    }
  },

  async deleteAuthorizedUser(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('authorized_users')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting authorized user:', e);
    }
  },

  // --- Account Requests ---
  async getAccountRequests(): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) {
      const saved = localStorage.getItem('cardinal_account_requests');
      return saved ? JSON.parse(saved) : [];
    }
    try {
      const { data, error } = await supabase
        .from('account_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching account requests:', e);
      return [];
    }
  },

  async createAccountRequest(email: string, notes: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const saved = localStorage.getItem('cardinal_account_requests');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.some((r: any) => r.email === email.toLowerCase().trim())) {
        list.push({
          id: `mock-req-${Date.now()}`,
          email: email.toLowerCase().trim(),
          notes: notes.trim(),
          status: 'Pending',
          created_at: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('cardinal_account_requests', JSON.stringify(list));
      }
      return;
    }
    try {
      const { error } = await supabase
        .from('account_requests')
        .upsert({
          id: `REQ-${Date.now()}`,
          email: email.toLowerCase().trim(),
          notes: notes.trim(),
          status: 'Pending',
          created_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.error('Error creating account request:', e);
      throw e;
    }
  },

  async deleteAccountRequest(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const saved = localStorage.getItem('cardinal_account_requests');
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.filter((e: any) => e.id !== id);
      localStorage.setItem('cardinal_account_requests', JSON.stringify(updated));
      return;
    }
    try {
      const { error } = await supabase
        .from('account_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting account request:', e);
    }
  },

  // --- Sponsor Commitments ---
  async getSponsorCommitments(): Promise<SponsorCommitment[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('sponsor_commitments')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Table "sponsor_commitments" does not exist yet.');
          return [];
        }
        throw error;
      }
      return (data || []) as SponsorCommitment[];
    } catch (e) {
      console.error('Error fetching sponsor commitments:', e);
      return [];
    }
  },

  async upsertSponsorCommitment(commitment: SponsorCommitment): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('sponsor_commitments')
        .upsert({
          id: commitment.id,
          sponsor_email: commitment.sponsor_email,
          sponsor_name: commitment.sponsor_name,
          title: commitment.title,
          description: commitment.description,
          due_date: commitment.due_date,
          status: commitment.status,
          assigned_by: commitment.assigned_by
        });
      if (error) throw error;
    } catch (e) {
      console.error('Error upserting sponsor commitment:', e);
    }
  },

  async deleteSponsorCommitment(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('sponsor_commitments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting sponsor commitment:', e);
    }
  },

  async signUpUser(email: string, role: string, password: string, name: string): Promise<any> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
      const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
      
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
      
      const { data, error } = await tempSupabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password.trim(),
        options: {
          data: {
            role,
            name,
          }
        }
      });
      
      if (error) throw error;
      return data.user;
    } catch (e) {
      console.error('Error registering user in Supabase Auth:', e);
      throw e;
    }
  },

  async uploadModelFile(file: File): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      return URL.createObjectURL(file);
    }
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('stl-models')
        .upload(fileName, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('stl-models')
        .getPublicUrl(fileName);
      return publicUrl;
    } catch (e) {
      console.error('Failed to upload file to Supabase storage, falling back to local Blob URL:', e);
      return URL.createObjectURL(file);
    }
  }
};
