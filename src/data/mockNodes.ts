import { Node } from '../types';

// Using dates around March 2026 for the mock data
export const initialNodes: Node[] = [
  { id: 'ND-001', title: 'Chassis Concept', description: 'Initial CAD', department: 'Design', status: 'Completed', planned_start: '2026-03-01', planned_end: '2026-03-05', actual_start: '2026-03-01', actual_end: '2026-03-06' },
  { id: 'ND-002', title: 'Aero CFD Testing', description: 'Virtual wind tunnel', department: 'Engineering', status: 'In Progress', planned_start: '2026-03-06', planned_end: '2026-03-12', actual_start: '2026-03-07', actual_end: null },
  { id: 'ND-004', title: 'CNC Milling', description: 'Machining chassis', department: 'Engineering', status: 'To Do', planned_start: '2026-03-15', planned_end: '2026-03-20', actual_start: null, actual_end: null },
  { id: 'ND-005', title: 'Team Assembly', description: 'All hands meeting', department: 'Everyone', status: 'To Do', planned_start: '2026-03-22', planned_end: '2026-03-23', actual_start: null, actual_end: null },
  { id: 'ND-007', title: 'Livery Design', description: 'Decal placement', department: 'Design', status: 'To Do', planned_start: '2026-03-18', planned_end: '2026-03-25', actual_start: null, actual_end: null },
];
