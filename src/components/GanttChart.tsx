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

  // --- Normal Web App Dimensions (Pristine, elegant, department-grouped on-screen) ---
  const APP_DAY_WIDTH = 72;
  const APP_ROW_HEIGHT = 84;
  const APP_HEADER_HEIGHT = 54;
  const APP_LEFT_PANEL_WIDTH = 110;
  const APP_DEPT_HEADER_HEIGHT = 34;

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

  const getAppX = (dateStr: string) => APP_LEFT_PANEL_WIDTH + getDaysDiff(days[0], dateStr) * APP_DAY_WIDTH;
  const getAppW = (startStr: string, endStr: string) => (getDaysDiff(startStr, endStr) + 1) * APP_DAY_WIDTH;
  const appTotalWidth = APP_LEFT_PANEL_WIDTH + (totalDays * APP_DAY_WIDTH);

  // Group nodes by department for Web App view
  const grouped = nodes.reduce((acc, node) => {
    if (!acc[node.department]) acc[node.department] = [];
    acc[node.department].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  // Render Web App Elements
  let appCurrentY = APP_HEADER_HEIGHT;
  const appSvgElements: React.JSX.Element[] = [];

  Object.entries(grouped).forEach(([dept, deptNodes]) => {
    // Department Section Header
    appSvgElements.push(
      <g key={`dept-${dept}`}>
        <rect x={0} y={appCurrentY} width={appTotalWidth} height={APP_DEPT_HEADER_HEIGHT} fill="#09090b" />
        <text
          x={16}
          y={appCurrentY + 23}
          fill="#a1a1aa"
          fontSize="15"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="2"
        >
          // {dept.toUpperCase()}
        </text>
        <line x1={0} y1={appCurrentY + APP_DEPT_HEADER_HEIGHT} x2={appTotalWidth} y2={appCurrentY + APP_DEPT_HEADER_HEIGHT} stroke="#27272a" strokeWidth="1.5" />
      </g>
    );
    appCurrentY += APP_DEPT_HEADER_HEIGHT;

    deptNodes.forEach(node => {
      const plannedX = getAppX(node.planned_start);
      const plannedW = getAppW(node.planned_start, node.planned_end);

      const actualStart = node.actual_start || node.planned_start;
      const actualEnd = node.actual_end || (node.status === 'In Progress' ? simulatedDate : actualStart);
      const actualX = getAppX(actualStart);
      const actualW = getAppW(actualStart, actualEnd);

      const bgColor = DEPT_COLORS[node.department as Department] || '#71717a';
      const textColor = node.department === 'PM' || node.department === 'Design' ? '#000000' : '#ffffff';

      let durationText = '';
      if (node.actual_start) {
        const numDays = getDaysDiff(node.actual_start, node.actual_end || simulatedDate) + 1;
        durationText = node.actual_end ? `${numDays}d` : `${numDays}d (ip)`;
      }

      appSvgElements.push(
        <g key={`node-${node.id}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(node)}>
          {/* Row Background & Divider */}
          <rect x={0} y={appCurrentY} width={appTotalWidth} height={APP_ROW_HEIGHT} fill="none" />
          <line x1={0} y1={appCurrentY + APP_ROW_HEIGHT} x2={appTotalWidth} y2={appCurrentY + APP_ROW_HEIGHT} stroke="#18181b" strokeWidth="1.5" />

          {/* Left Panel ID */}
          <rect x={0} y={appCurrentY} width={APP_LEFT_PANEL_WIDTH} height={APP_ROW_HEIGHT} fill="#000000" />
          <text x={16} y={appCurrentY + 54} fill="#a1a1aa" fontSize="15" fontFamily="monospace" fontWeight="bold">{node.id}</text>
          <line x1={APP_LEFT_PANEL_WIDTH} y1={appCurrentY} x2={APP_LEFT_PANEL_WIDTH} y2={appCurrentY + APP_ROW_HEIGHT} stroke="#27272a" strokeWidth="1.5" />

          {/* Task Name Title */}
          <text
            x={plannedX}
            y={appCurrentY + 28}
            fill="#ffffff"
            fontSize="16"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {node.title} {node.dependency && `[DEP: ${node.dependency}]`}
          </text>

          {/* Planned Container Bar */}
          <rect
            x={plannedX}
            y={appCurrentY + 36}
            width={plannedW}
            height={14}
            fill="#27272a"
            rx="4"
          />

          {/* Actual Progress Bar & Duration Text */}
          {node.actual_start && (
            <g>
              <rect
                x={actualX}
                y={appCurrentY + 54}
                width={actualW}
                height={22}
                fill={bgColor}
                rx="6"
              />
              <text
                x={actualX + 10}
                y={appCurrentY + 70}
                fill={textColor}
                fontSize="13"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {durationText}
              </text>
            </g>
          )}
        </g>
      );
      appCurrentY += APP_ROW_HEIGHT;
    });
  });

  const appTotalHeight = appCurrentY;
  const appSimulatedX = getAppX(simulatedDate) + (APP_DAY_WIDTH / 2);

  // --- NEW PRESENTATION SVG EXPORT (Full-Width, Compact Track-Packed, Huge Typography, Zero Collisions) ---
  const handleExport = () => {
    const EXPORT_DAY_WIDTH = 100;
    const EXPORT_ROW_HEIGHT = 160;
    const EXPORT_HEADER_HEIGHT = 90;
    const EXPORT_LEFT_PANEL_WIDTH = 0; // No side ID column

    const escapeXml = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const getExportX = (dateStr: string) => EXPORT_LEFT_PANEL_WIDTH + getDaysDiff(days[0], dateStr) * EXPORT_DAY_WIDTH;
    const getExportW = (startStr: string, endStr: string) => (getDaysDiff(startStr, endStr) + 1) * EXPORT_DAY_WIDTH;
    const exportTotalWidth = EXPORT_LEFT_PANEL_WIDTH + (totalDays * EXPORT_DAY_WIDTH);

    const baseTime = parseDate(days[0]);

    const getStartMs = (node: Node) => {
      const p = parseDate(node.planned_start);
      const a = node.actual_start ? parseDate(node.actual_start) : Infinity;
      return Math.min(p, a);
    };

    const getEndMs = (node: Node) => {
      const p = parseDate(node.planned_end);
      const a = node.actual_end ? parseDate(node.actual_end) : (node.status === 'In Progress' ? simulatedTime : p);
      const maxBarEndMs = Math.max(p, a);

      // Title visual extent calculation (approx 30px per char for 52px monospace font)
      const plannedX = getExportX(node.planned_start);
      const titleText = `${node.title}${node.dependency ? ` [DEP: ${node.dependency}]` : ''}`;
      const titleVisualWidthPx = titleText.length * 30 + 40;
      const titleEndX = plannedX + titleVisualWidthPx;
      const titleEndDays = (titleEndX - EXPORT_LEFT_PANEL_WIDTH) / EXPORT_DAY_WIDTH;
      const titleEndMs = baseTime + titleEndDays * 24 * 60 * 60 * 1000;

      return Math.max(maxBarEndMs, titleEndMs);
    };

    const sortedNodes = [...nodes].sort((a, b) => {
      const startDiff = getStartMs(a) - getStartMs(b);
      if (startDiff !== 0) return startDiff;
      return getEndMs(a) - getEndMs(b);
    });

    const trackEndTimes: number[] = [];
    const packedExportNodes: {
      node: Node;
      trackIndex: number;
      plannedX: number;
      plannedW: number;
      actualX: number;
      actualW: number;
    }[] = [];
    const BUFFER_MS = 6 * 60 * 60 * 1000;

    sortedNodes.forEach(node => {
      const startMs = getStartMs(node);
      const endMs = getEndMs(node);

      let assignedTrack = -1;
      for (let t = 0; t < trackEndTimes.length; t++) {
        if (trackEndTimes[t] + BUFFER_MS <= startMs) {
          assignedTrack = t;
          break;
        }
      }

      if (assignedTrack === -1) {
        assignedTrack = trackEndTimes.length;
        trackEndTimes.push(endMs);
      } else {
        trackEndTimes[assignedTrack] = endMs;
      }

      const plannedX = getExportX(node.planned_start);
      const plannedW = getExportW(node.planned_start, node.planned_end);
      const actualStart = node.actual_start || node.planned_start;
      const actualEnd = node.actual_end || (node.status === 'In Progress' ? simulatedDate : actualStart);
      const actualX = getExportX(actualStart);
      const actualW = getExportW(actualStart, actualEnd);

      packedExportNodes.push({
        node,
        trackIndex: assignedTrack,
        plannedX,
        plannedW,
        actualX,
        actualW
      });
    });

    const totalTracks = Math.max(1, trackEndTimes.length);
    const exportTotalHeight = EXPORT_HEADER_HEIGHT + (totalTracks * EXPORT_ROW_HEIGHT);

    const exportElements: string[] = [];

    // Header Background & Lines
    exportElements.push(`
      <rect x="0" y="0" width="${exportTotalWidth}" height="${EXPORT_HEADER_HEIGHT}" fill="#000000"/>
      <line x1="0" y1="${EXPORT_HEADER_HEIGHT}" x2="${exportTotalWidth}" y2="${EXPORT_HEADER_HEIGHT}" stroke="#27272a" stroke-width="3"/>
    `);

    // Date Grid Lines & Headers
    days.forEach((day, i) => {
      const dateObj = new Date(day);
      const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      const x = EXPORT_LEFT_PANEL_WIDTH + i * EXPORT_DAY_WIDTH + (EXPORT_DAY_WIDTH / 2);
      exportElements.push(`
        <text x="${x}" y="56" fill="#a1a1aa" font-size="40" font-family="monospace" font-weight="bold" text-anchor="middle">${escapeXml(formattedDate)}</text>
        <line x1="${EXPORT_LEFT_PANEL_WIDTH + i * EXPORT_DAY_WIDTH}" y1="${EXPORT_HEADER_HEIGHT}" x2="${EXPORT_LEFT_PANEL_WIDTH + i * EXPORT_DAY_WIDTH}" y2="${exportTotalHeight}" stroke="#18181b" stroke-width="2.5"/>
      `);
    });

    // Horizontal Lane Dividers
    for (let t = 0; t < totalTracks; t++) {
      const y = EXPORT_HEADER_HEIGHT + (t + 1) * EXPORT_ROW_HEIGHT;
      exportElements.push(`
        <line x1="0" y1="${y}" x2="${exportTotalWidth}" y2="${y}" stroke="#27272a" stroke-width="2.5"/>
      `);
    }

    // TODAY Line
    const exportSimulatedX = getExportX(simulatedDate) + (EXPORT_DAY_WIDTH / 2);
    exportElements.push(`
      <g>
        <line x1="${exportSimulatedX}" y1="${EXPORT_HEADER_HEIGHT}" x2="${exportSimulatedX}" y2="${exportTotalHeight}" stroke="#ef4444" stroke-width="4" stroke-dasharray="8 6"/>
        <rect x="${exportSimulatedX - 80}" y="${EXPORT_HEADER_HEIGHT + 10}" width="160" height="44" fill="#ef4444" rx="8"/>
        <text x="${exportSimulatedX}" y="${EXPORT_HEADER_HEIGHT + 40}" fill="#ffffff" font-size="26" font-family="monospace" font-weight="bold" text-anchor="middle">TODAY</text>
      </g>
    `);

    // Compact Track Nodes Rendering
    packedExportNodes.forEach(({ node, trackIndex, plannedX, plannedW, actualX, actualW }) => {
      const bgColor = DEPT_COLORS[node.department as Department] || '#71717a';
      const textColor = node.department === 'PM' || node.department === 'Design' ? '#000000' : '#ffffff';
      const rowY = EXPORT_HEADER_HEIGHT + trackIndex * EXPORT_ROW_HEIGHT;

      let durationText = '';
      if (node.actual_start) {
        const numDays = getDaysDiff(node.actual_start, node.actual_end || simulatedDate) + 1;
        durationText = node.actual_end ? `${numDays}d` : `${numDays}d (ip)`;
      }

      const titleText = `${node.title}${node.dependency ? ` [DEP: ${node.dependency}]` : ''}`;

      exportElements.push(`
        <g>
          <text x="${plannedX}" y="${rowY + 54}" fill="#ffffff" font-size="52" font-family="monospace" font-weight="bold">${escapeXml(titleText)}</text>
          <rect x="${plannedX}" y="${rowY + 68}" width="${plannedW}" height="20" fill="#27272a" rx="8"/>
          ${node.actual_start ? `
            <rect x="${actualX}" y="${rowY + 96}" width="${actualW}" height="52" fill="${bgColor}" rx="12"/>
            <text x="${actualX + 20}" y="${rowY + 134}" fill="${textColor}" font-size="38" font-family="monospace" font-weight="bold">${escapeXml(durationText)}</text>
          ` : ''}
        </g>
      `);
    });

    let svgData = `<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg width="${exportTotalWidth}" height="${exportTotalHeight}" viewBox="0 0 ${exportTotalWidth} ${exportTotalHeight}" xmlns="http://www.w3.org/2000/svg" style="background-color: #000000;">\n<rect x="0" y="0" width="${exportTotalWidth}" height="${exportTotalHeight}" fill="#000000"/>\n${exportElements.join('\n')}\n</svg>`;

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cardinal-gantt-maximized.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg overflow-hidden font-sans">
      {/* Web App Header Bar */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-200 font-bold">
            Active Gantt / Timeline ({nodes.length} Nodes)
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2"><div className="w-4 h-2 bg-zinc-100 rounded-sm"></div> PM</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2 bg-zinc-300 rounded-sm"></div> Design</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2 bg-zinc-500 rounded-sm"></div> Eng</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2 bg-zinc-700 rounded-sm"></div> Everyone</div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs font-mono bg-zinc-100 text-black px-4 py-2 rounded hover:bg-white transition-colors font-bold tracking-wider cursor-pointer shadow-lg"
          >
            <Download className="w-4 h-4" />
            EXPORT MAXIMIZED SVG
          </button>
        </div>
      </div>

      {/* On-Screen Web App SVG Timeline Canvas */}
      <div className="flex-1 overflow-auto bg-black">
        <svg
          ref={svgRef}
          width={appTotalWidth}
          height={appTotalHeight}
          viewBox={`0 0 ${appTotalWidth} ${appTotalHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Grid Background Lines */}
          <g>
            {days.map((day, i) => (
              <line
                key={`grid-${day}`}
                x1={APP_LEFT_PANEL_WIDTH + i * APP_DAY_WIDTH}
                y1={APP_HEADER_HEIGHT}
                x2={APP_LEFT_PANEL_WIDTH + i * APP_DAY_WIDTH}
                y2={appTotalHeight}
                stroke="#18181b"
                strokeWidth="1.5"
              />
            ))}
          </g>

          {/* Simulated TODAY Line */}
          <g>
            <line
              x1={appSimulatedX}
              y1={APP_HEADER_HEIGHT}
              x2={appSimulatedX}
              y2={appTotalHeight}
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <rect
              x={appSimulatedX - 30}
              y={APP_HEADER_HEIGHT + 5}
              width={60}
              height={22}
              fill="#ef4444"
              rx="4"
            />
            <text
              x={appSimulatedX}
              y={APP_HEADER_HEIGHT + 20}
              fill="#ffffff"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              TODAY
            </text>
          </g>

          {/* Top Date Header */}
          <g>
            <rect x={0} y={0} width={appTotalWidth} height={APP_HEADER_HEIGHT} fill="#000000" />
            <line x1={0} y1={APP_HEADER_HEIGHT} x2={appTotalWidth} y2={APP_HEADER_HEIGHT} stroke="#27272a" strokeWidth="1.5" />
            {days.map((day, i) => {
              const dateObj = new Date(day);
              const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              return (
                <text
                  key={`header-${day}`}
                  x={APP_LEFT_PANEL_WIDTH + i * APP_DAY_WIDTH + (APP_DAY_WIDTH / 2)}
                  y={34}
                  fill="#a1a1aa"
                  fontSize="14"
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
          {appSvgElements}
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
