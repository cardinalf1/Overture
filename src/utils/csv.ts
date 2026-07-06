import Papa from 'papaparse';
import { Node, CadIteration, Department, Status, IterationStatus } from '../types';

export const exportSystemData = (nodes: Node[], iterations: CadIteration[]) => {
  const data: any[] = [];

  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  nodes.forEach(n => {
    data.push({
      Type: 'Node',
      ID: n.id,
      Title: n.title,
      Description: n.description,
      Department: n.department,
      Status: n.status,
      PlannedStart: n.planned_start,
      PlannedEnd: n.planned_end,
      ActualStart: n.actual_start || '',
      ActualEnd: n.actual_end || '',
      ActualDurationDays: getDuration(n.actual_start, n.actual_end),
      Dependency: n.dependency || '',
      Date: '',
      CadFileRef: '',
      WeightGrams: '',
      DragCoefficientCd: '',
      ModelUrl: '',
      ModelName: ''
    });
  });

  iterations.forEach(i => {
    data.push({
      Type: 'Iteration',
      ID: i.id,
      Title: '',
      Description: '',
      Department: '',
      Status: i.status,
      PlannedStart: '',
      PlannedEnd: '',
      ActualStart: '',
      ActualEnd: '',
      ActualDurationDays: '',
      Dependency: '',
      Date: i.date,
      CadFileRef: i.cad_file_ref,
      WeightGrams: i.weight_grams,
      DragCoefficientCd: i.drag_coefficient_cd,
      ModelUrl: i.model_url || '',
      ModelName: i.model_name || ''
    });
  });

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cardinal-system-data.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importSystemData = (file: File): Promise<{ nodes: Node[], iterations: CadIteration[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const nodes: Node[] = [];
        const iterations: CadIteration[] = [];

        try {
          results.data.forEach((row: any) => {
            if (row.Type === 'Node') {
              nodes.push({
                id: row.ID,
                title: row.Title,
                description: row.Description,
                department: row.Department as Department,
                status: row.Status as Status,
                planned_start: row.PlannedStart,
                planned_end: row.PlannedEnd,
                actual_start: row.ActualStart || null,
                actual_end: row.ActualEnd || null,
                dependency: row.Dependency || undefined,
              });
            } else if (row.Type === 'Iteration') {
              iterations.push({
                id: row.ID,
                date: row.Date,
                cad_file_ref: row.CadFileRef,
                weight_grams: Number(row.WeightGrams),
                drag_coefficient_cd: Number(row.DragCoefficientCd),
                status: row.Status as IterationStatus,
                model_url: row.ModelUrl || undefined,
                model_name: row.ModelName || undefined,
              });
            }
          });
          resolve({ nodes, iterations });
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
