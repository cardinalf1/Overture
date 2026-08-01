import React, { useRef, useState } from 'react';
import { Node, Department } from '../types';
import { Download, X } from 'lucide-react';

interface GanttChartProps {
  nodes: Node[];
  simulatedDate: string;
}

const DEPT_COLORS: Record<Department, string> = {
  PM: '#f4f4f5', // zinc-100
  Design: '#d4d4d8', // zinc-300
  Engineering: '#71717a', // zinc-500
  Everyone: '#3f3f46', // zinc-700
};

export function GanttChart({ nodes, simulatedDate }: GanttChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Huge Presentation Scale Dimensions
  const DAY_WIDTH = 120;
  const ROW_HEIGHT = 130;
  const HEADER_HEIGHT = 70;
  const LEFT_PANEL_WIDTH = 160;
  const DEPT_HEADER_HEIGHT = 46;

  // Date Math Helpers
  const parseDate = (d: string) => new Date(d).getTime();
  const getDaysDiff = (start: string, end: string) => Math.round((parseDate(end) - parseDate(start)) / (1000 * 60 * 60 * 24));

  // Calculate timeline bounds
  let minTime = Infinity;
  let maxTime = -Infinity;
  const simulatedTime = parseDate(simulatedDate);

  if (nodes.length === 0) {
    minTime = simulatedTime - 7 * 24 * 60 * 60 * 1000;
    maxTime = simulatedTime + 7 * 24 * 60 * 60 * 1000;
  } else {
    nodes.forEach(n => {
      const ps = parseDate(n.planned_start);
      const pe = parseDate(n.planned_end);
      const as = n.actual_start ? parseDate(n.actual_start) : ps;
      const ae = n.actual_end ? parseDate(n.actual_end) : pe;
      minTime = Math.min(minTime, ps, as);
      maxTime = Math.max(maxTime, pe, ae);
    });
    minTime = Math.min(minTime, simulatedTime) - 2 * 24 * 60 * 60 * 1000; // Pad 2 days left
    maxTime = Math.max(maxTime, simulatedTime) + 5 * 24 * 60 * 60 * 1000; // Pad 5 days right
  }

  const totalDays = Math.max(1, Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 1);
  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(minTime + i * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const getX = (dateStr: string) => LEFT_PANEL_WIDTH + getDaysDiff(days[0], dateStr) * DAY_WIDTH;
  const getW = (startStr: string, endStr: string) => (getDaysDiff(startStr, endStr) + 1) * DAY_WIDTH;

  const totalWidth = LEFT_PANEL_WIDTH + (totalDays * DAY_WIDTH);

  // Group nodes by department (like example.svg)
  const grouped = nodes.reduce((acc, node) => {
    if (!acc[node.department]) acc[node.department] = [];
    acc[node.department].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  let currentY = HEADER_HEIGHT;
  const svgElements: React.JSX.Element[] = [];

  Object.entries(grouped).forEach(([dept, deptNodes]) => {
    // Department Header Row
    svgElements.push(
      <g key={`dept-${dept}`}>
        <rect x={0} y={currentY} width={totalWidth} height={DEPT_HEADER_HEIGHT} fill="#09090b" />
        <text
          x={20}
          y={currentY + 31}
          fill="#a1a1aa"
          fontSize="22"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="3"
        >
          // {dept.toUpperCase()}
        </text>
        <line x1={0} y1={currentY + DEPT_HEADER_HEIGHT} x2={totalWidth} y2={currentY + DEPT_HEADER_HEIGHT} stroke="#27272a" strokeWidth="2" />
      </g>
    );
    currentY += DEPT_HEADER_HEIGHT;

    deptNodes.forEach(node => {
      const plannedX = getX(node.planned_start);
      const plannedW = getW(node.planned_start, node.planned_end);

      const actualStart = node.actual_start || node.planned_start;
      const actualEnd = node.actual_end || (node.status === 'In Progress' ? simulatedDate : actualStart);
      const actualX = getX(actualStart);
      const actualW = getW(actualStart, actualEnd);

      const bgColor = DEPT_COLORS[node.department as Department] || '#71717a';
      const textColor = node.department === 'PM' || node.department === 'Design' ? '#000000' : '#ffffff';

      let durationText = '';
      if (node.actual_start) {
        const numDays = getDaysDiff(node.actual_start, node.actual_end || simulatedDate) + 1;
        durationText = node.actual_end ? `${numDays}d` : `${numDays}d (ip)`;
      }

      svgElements.push(
        <g key={`node-${node.id}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(node)}>
          {/* Row Background & Separator Line */}
          <rect x={0} y={currentY} width={totalWidth} height={ROW_HEIGHT} fill="none" />
          <line x1={0} y1={currentY + ROW_HEIGHT} x2={totalWidth} y2={currentY + ROW_HEIGHT} stroke="#18181b" strokeWidth="2" />

          {/* Left Panel ID */}
          <rect x={0} y={currentY} width={LEFT_PANEL_WIDTH} height={ROW_HEIGHT} fill="#000000" />
          <text x={20} y={currentY + 80} fill="#a1a1aa" fontSize="24" fontFamily="monospace" fontWeight="bold">{node.id}</text>
          <line x1={LEFT_PANEL_WIDTH} y1={currentY} x2={LEFT_PANEL_WIDTH} y2={currentY + ROW_HEIGHT} stroke="#27272a" strokeWidth="2" />

          {/* Task Name Title (HUGE 28px Bold) */}
          <text
            x={plannedX}
            y={currentY + 42}
            fill="#ffffff"
            fontSize="28"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {node.title} {node.dependency && `[DEP: ${node.dependency}]`}
          </text>

          {/* Planned Bar */}
          <rect
            x={plannedX}
            y={currentY + 54}
            width={plannedW}
            height={16}
            fill="#27272a"
            rx="6"
          />

          {/* Actual Bar & HUGE Duration Text Inside */}
          {node.actual_start && (
            <g>
              <rect
                x={actualX}
                y={currentY + 78}
                width={actualW}
                height={36}
                fill={bgColor}
                rx="8"
              />
              <text
                x={actualX + 16}
                y={currentY + 104}
                fill={textColor}
                fontSize="20"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {durationText}
              </text>
            </g>
          )}
        </g>
      );
      currentY += ROW_HEIGHT;
    });
  });

  const totalHeight = currentY;

  const handleExport = () => {
    if (!svgRef.current) return;

    let svgData = new XMLSerializer().serializeToString(svgRef.current);
    svgData = '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' + svgData;

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cardinal-gantt-export-huge.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simulatedX = getX(simulatedDate) + (DAY_WIDTH / 2);

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-200 font-bold">
            Active Gantt / Timeline ({nodes.length} Nodes) — HUGE Text Mode
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2"><div className="w-4 h-2 bg-zinc-100 rounded-sm"></div> Planned</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2.5 bg-zinc-400 rounded-sm"></div> Actual</div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs font-mono bg-zinc-100 text-black px-4 py-2 rounded hover:bg-white transition-colors font-bold tracking-wider cursor-pointer shadow-lg"
          >
            <Download className="w-4 h-4" />
            EXPORT HUGE SVG
          </button>
        </div>
      </div>

      {/* SVG Timeline Canvas */}
      <div className="flex-1 overflow-auto bg-black">
        <svg
          ref={svgRef}
          width={totalWidth}
          height={totalHeight}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Grid Background Lines */}
          <g>
            {days.map((day, i) => (
              <line
                key={`grid-${day}`}
                x1={LEFT_PANEL_WIDTH + i * DAY_WIDTH}
                y1={HEADER_HEIGHT}
                x2={LEFT_PANEL_WIDTH + i * DAY_WIDTH}
                y2={totalHeight}
                stroke="#18181b"
                strokeWidth="2"
              />
            ))}
          </g>

          {/* Simulated TODAY Line */}
          <g>
            <line
              x1={simulatedX}
              y1={HEADER_HEIGHT}
              x2={simulatedX}
              y2={totalHeight}
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />
            <rect
              x={simulatedX - 40}
              y={HEADER_HEIGHT + 7}
              width={80}
              height={28}
              fill="#ef4444"
              rx="6"
            />
            <text
              x={simulatedX}
              y={HEADER_HEIGHT + 26}
              fill="#ffffff"
              fontSize="16"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              TODAY
            </text>
          </g>

          {/* Top Date Header */}
          <g>
            <rect x={0} y={0} width={totalWidth} height={HEADER_HEIGHT} fill="#000000" />
            <line x1={0} y1={HEADER_HEIGHT} x2={totalWidth} y2={HEADER_HEIGHT} stroke="#27272a" strokeWidth="2" />
            {days.map((day, i) => {
              const dateObj = new Date(day);
              const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              return (
                <text
                  key={`header-${day}`}
                  x={LEFT_PANEL_WIDTH + i * DAY_WIDTH + (DAY_WIDTH / 2)}
                  y={44}
                  fill="#a1a1aa"
                  fontSize="22"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formattedDate}
                </text>
              );
            })}
          </g>

          {/* Department Groups & Rows */}
          {svgElements}
        </svg>
      </div>

      {/* Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto font-mono">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] text-xs text-zinc-300 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-black/40">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">SYS_NODE_DETAILS // {selectedNode.id}</span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)} 
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">TASK TITLE</span>
                <p className="text-sm text-zinc-100 font-bold uppercase mt-0.5">{selectedNode.title}</p>
              </div>

              <div>
                <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">DESCRIPTION</span>
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed mt-0.5">
                  {selectedNode.description || 'NO ADDITIONAL DETAILS RECORDED FOR THIS NODE.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">DEPARTMENT</span>
                  <span className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase mt-1">
                    {selectedNode.department}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">STATUS</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase mt-1 border ${
                    selectedNode.status === 'Completed' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' :
                    selectedNode.status === 'In Progress' ? 'bg-amber-950/20 text-amber-400 border-amber-900/40' :
                    'bg-zinc-900/55 text-zinc-500 border-zinc-800'
                  }`}>
                    {selectedNode.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">PLANNED SCHEDULE</span>
                  <p className="text-[11px] text-zinc-400 mt-1">{selectedNode.planned_start} to {selectedNode.planned_end}</p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">ACTUAL TIMELINE</span>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {selectedNode.actual_start ? `${selectedNode.actual_start} to ${selectedNode.actual_end || 'In Progress'}` : 'NOT YET DEPLOYED'}
                  </p>
                </div>
              </div>

              {selectedNode.dependency && (
                <div className="border-t border-zinc-900 pt-4">
                  <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">PRE-REQUISITE DEPENDENCY</span>
                  <span className="inline-block bg-rose-950/10 text-rose-400 border border-rose-900/30 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase mt-1">
                    {selectedNode.dependency}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-black/20 px-6 py-3.5 border-t border-zinc-900 text-right flex justify-between items-center">
              <span className="text-[8px] font-mono text-zinc-650">SECURITY LOCK LEVEL 1</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 hover:text-white px-4 py-2 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
