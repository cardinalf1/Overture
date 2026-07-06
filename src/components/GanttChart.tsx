import React, { useRef } from 'react';
import { Node, Department } from '../types';
import { Download } from 'lucide-react';

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

  const DAY_WIDTH = 40;
  const ROW_HEIGHT = 48;
  const HEADER_HEIGHT = 40;
  const LEFT_PANEL_WIDTH = 80;
  const DEPT_HEADER_HEIGHT = 24;

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

  const grouped = nodes.reduce((acc, node) => {
    if (!acc[node.department]) acc[node.department] = [];
    acc[node.department].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  let currentY = HEADER_HEIGHT;
  const svgElements: React.JSX.Element[] = [];

  Object.entries(grouped).forEach(([dept, deptNodes]) => {
    // Department Header
    svgElements.push(
      <g key={`dept-${dept}`}>
        <rect x={0} y={currentY} width={totalWidth} height={DEPT_HEADER_HEIGHT} fill="#09090b" />
        <text x={10} y={currentY + 16} fill="#71717a" fontSize="10" fontFamily="monospace" letterSpacing="2">
          // {dept.toUpperCase()}
        </text>
        <line x1={0} y1={currentY + DEPT_HEADER_HEIGHT} x2={totalWidth} y2={currentY + DEPT_HEADER_HEIGHT} stroke="#27272a" strokeWidth="1" />
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
        const days = getDaysDiff(node.actual_start, node.actual_end || simulatedDate) + 1;
        durationText = node.actual_end ? `${days}d` : `${days}d (ip)`;
      }

      svgElements.push(
        <g key={`node-${node.id}`} style={{ cursor: 'pointer' }}>
          {/* Row Background */}
          <rect x={0} y={currentY} width={totalWidth} height={ROW_HEIGHT} fill="none" />
          <line x1={0} y1={currentY + ROW_HEIGHT} x2={totalWidth} y2={currentY + ROW_HEIGHT} stroke="#18181b" strokeWidth="1" />

          {/* Left Panel ID */}
          <rect x={0} y={currentY} width={LEFT_PANEL_WIDTH} height={ROW_HEIGHT} fill="#000000" />
          <text x={10} y={currentY + 28} fill="#71717a" fontSize="10" fontFamily="monospace">{node.id}</text>
          <line x1={LEFT_PANEL_WIDTH} y1={currentY} x2={LEFT_PANEL_WIDTH} y2={currentY + ROW_HEIGHT} stroke="#27272a" strokeWidth="1" />

          {/* Task Name (Always above bars, anchored to planned start) */}
          <text
            x={plannedX}
            y={currentY + 18}
            fill="#e4e4e7"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {node.title} {node.dependency && `[DEP: ${node.dependency}]`}
          </text>

          {/* Planned Bar */}
          <rect
            x={plannedX}
            y={currentY + 24}
            width={plannedW}
            height={6}
            fill="#27272a"
            rx="3"
          />

          {/* Actual Bar */}
          {node.actual_start && (
            <g>
              <rect
                x={actualX}
                y={currentY + 32}
                width={actualW}
                height={12}
                fill={bgColor}
                rx="4"
              />
              <text
                x={actualX + 4}
                y={currentY + 41}
                fill={textColor}
                fontSize="8"
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
    
    // Create a clone to strip React-specific attributes if needed, or just serialize
    let svgData = new XMLSerializer().serializeToString(svgRef.current);
    
    // Add XML declaration which Canva prefers
    svgData = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgData;
    
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cardinal-gantt-export.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simulatedX = getX(simulatedDate) + (DAY_WIDTH / 2); // Center of the day

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Active Gantt / Timeline</h2>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-[10px] font-mono text-zinc-500">
            <div className="flex items-center gap-2"><div className="w-4 h-1.5 bg-zinc-800 rounded-full"></div> Planned</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2 bg-zinc-300 rounded-full"></div> Actual</div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-[10px] font-mono bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
          >
            <Download className="w-3 h-3" />
            EXPORT SVG
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-black">
        <svg
          ref={svgRef}
          width={totalWidth}
          height={totalHeight}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Grid Background */}
          <g>
            {days.map((day, i) => (
              <line
                key={`grid-${day}`}
                x1={LEFT_PANEL_WIDTH + i * DAY_WIDTH}
                y1={HEADER_HEIGHT}
                x2={LEFT_PANEL_WIDTH + i * DAY_WIDTH}
                y2={totalHeight}
                stroke="#18181b"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Simulated Date Line */}
          <g>
            <line
              x1={simulatedX}
              y1={HEADER_HEIGHT}
              x2={simulatedX}
              y2={totalHeight}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <rect
              x={simulatedX - 24}
              y={HEADER_HEIGHT}
              width={48}
              height={14}
              fill="#ef4444"
              rx="2"
            />
            <text
              x={simulatedX}
              y={HEADER_HEIGHT + 10}
              fill="#ffffff"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              TODAY
            </text>
          </g>

          {/* Header */}
          <g>
            <rect x={0} y={0} width={totalWidth} height={HEADER_HEIGHT} fill="#000000" />
            <line x1={0} y1={HEADER_HEIGHT} x2={totalWidth} y2={HEADER_HEIGHT} stroke="#27272a" strokeWidth="1" />
            {days.map((day, i) => {
              const dateObj = new Date(day);
              const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              return (
                <text
                  key={`header-${day}`}
                  x={LEFT_PANEL_WIDTH + i * DAY_WIDTH + (DAY_WIDTH / 2)}
                  y={24}
                  fill="#52525b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {formattedDate}
                </text>
              );
            })}
          </g>

          {/* Rows */}
          {svgElements}
        </svg>
      </div>
    </div>
  );
}
