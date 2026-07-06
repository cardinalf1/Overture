import { CadIteration } from '../types';

export const initialIterations: CadIteration[] = [
  { id: 'V1.0', date: '2026-02-10', cad_file_ref: 'chassis_base_v1.step', weight_grams: 55.2, drag_coefficient_cd: 0.142, status: 'Simulated' },
  { id: 'V1.1', date: '2026-02-15', cad_file_ref: 'chassis_aero_v1.1.step', weight_grams: 53.8, drag_coefficient_cd: 0.135, status: 'Simulated' },
  { id: 'V1.2', date: '2026-02-22', cad_file_ref: 'chassis_slim_v1.2.step', weight_grams: 51.4, drag_coefficient_cd: 0.128, status: 'Milled' },
  { id: 'V2.0', date: '2026-03-05', cad_file_ref: 'chassis_evo_v2.0.step', weight_grams: 49.5, drag_coefficient_cd: 0.115, status: 'Rejected' },
  { id: 'V2.1', date: '2026-03-10', cad_file_ref: 'chassis_evo_v2.1.step', weight_grams: 50.2, drag_coefficient_cd: 0.118, status: 'Draft' },
];
