export type Department = 'PM' | 'Design' | 'Engineering' | 'Everyone';
export type Status = 'To Do' | 'In Progress' | 'Completed';
export type Role = 'PM' | 'Design' | 'Engineering';

export interface Node {
  id: string;
  title: string;
  description: string;
  department: Department;
  status: Status;
  planned_start: string; // YYYY-MM-DD
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  dependency?: string; // ID of the node it depends on
}

export type IterationStatus = 'Draft' | 'Simulated' | 'Milled' | 'Rejected';

export interface CadIteration {
  id: string;
  date: string;
  cad_file_ref: string;
  weight_grams: number;
  drag_coefficient_cd: number;
  status: IterationStatus;
  model_url?: string;
  model_name?: string;
}

export type ExpenditureCategory = 'Manufacturing' | 'Materials' | 'Software' | 'Travel' | 'Marketing' | 'Entry Fees';
export type ExpenditureStatus = 'Pending' | 'Pledged' | 'Purchased';

export interface ExpenditureItem {
  id: string;
  item_name: string;
  cost: number;
  category: ExpenditureCategory;
  needed_by: string; // YYYY-MM-DD
  status: ExpenditureStatus;
  pledged_by_email: string | null;
  pledged_by_name: string | null;
}

export interface NewsUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string; // YYYY-MM-DD or ISO
  author: string;
}

export interface JudgeFeedback {
  id: string;
  judge_email: string;
  judge_name: string;
  category: string; // 'Engineering Design' | 'Project Management' | 'Sponsor & Portfolio' | 'Overall'
  score: number; // 1 to 10
  comments: string;
  created_at: string;
}

export interface AuthorizedUser {
  id: string;
  email: string;
  role: 'Team' | 'Sponsor' | 'Judge';
  password?: string;
  notes?: string;
  created_at?: string;
}

export interface SponsorCommitment {
  id: string;
  sponsor_email: string;
  sponsor_name: string;
  title: string;
  description: string;
  due_date: string;
  status: 'In Queue' | 'In Progress' | 'Fulfilled';
  assigned_by: string;
}
