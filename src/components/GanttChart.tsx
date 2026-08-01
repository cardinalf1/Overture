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

  const DAY_WIDTH = 54;
  const ROW_HEIGHT = 64;
  const HEADER_HEIGHT = 40;
  const LEFT_PANEL_WIDTH = 80;

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

  // --- COMPACT TRACK PACKING ALGORITHM ---
  const getStartMs = (node: Node) => {
    const p = parseDate(node.planned_start);
    const a = node.actual_start ? parseDate(node.actual_start) : Infinity;
    return Math.min(p, a);
  };

  const getEndMs = (node: Node) => {
    const p = parseDate(node.planned_end);
    const a = node.actual_end ? parseDate(node.actual_end) : (node.status === 'In Progress' ? simulatedTime : p);
    return Math.max(p, a);
  };

  const sortedNodes = [...nodes].sort((a, b) => {
    const startDiff = getStartMs(a) - getStartMs(b);
    if (startDiff !== 0) return startDiff;
    return getEndMs(a) - getEndMs(b);
  });

  const trackEndTimes: number[] = [];
  const packedNodes: { node: Node; trackIndex: number }[] = [];
  const BUFFER_MS = 12 * 60 * 60 * 1000; // 12hr buffer between tasks in same lane

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

    packedNodes.push({ node, trackIndex: assignedTrack });
  });

  const totalTracks = Math.max(1, trackEndTimes.length);
  const totalHeight = HEADER_HEIGHT + (totalTracks * ROW_HEIGHT);

  const handleExport = () => {
    if (!svgRef.current) return;

    let svgData = new XMLSerializer().serializeToString(svgRef.current);
    
    // Inject embedded styles for Canva vector crispness if not present
    if (!svgData.includes('JetBrains Mono')) {
      const defsBlock = `<defs><style type="text/css">@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&amp;display=swap'); text { font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; text-rendering: geometricPrecision; }</style></defs>`;
      svgData = svgData.replace(/<svg([^>]*)>/, `<svg$1>${defsBlock}`);
    }

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

  const simulatedX = getX(simulatedDate) + (DAY_WIDTH / 2);

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          Active Gantt / Integrated Timeline ({totalTracks} Lane{totalTracks > 1 ? 's' : ''})
        </h2>
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
          xmlnsXlink="http://www.w3.org/1999/xlink"
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
          style={{ backgroundColor: '#000000' }}
        >
          <defs>
            <style type="text/css">
              {`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap'); text { font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; text-rendering: geometricPrecision; }`}
            </style>
          </defs>

          {/* Crisp Black Background */}
          <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="#000000" />

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
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: totalTracks }).map((_, t) => (
              <line
                key={`row-line-${t}`}
                x1={0}
                y1={HEADER_HEIGHT + (t + 1) * ROW_HEIGHT}
                x2={totalWidth}
                y2={HEADER_HEIGHT + (t + 1) * ROW_HEIGHT}
                stroke="#18181b"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Left Panel Track Headers */}
          <g>
            {Array.from({ length: totalTracks }).map((_, t) => (
              <g key={`track-header-${t}`}>
                <rect x={0} y={HEADER_HEIGHT + t * ROW_HEIGHT} width={LEFT_PANEL_WIDTH} height={ROW_HEIGHT} fill="#000000" />
                <text
                  x={10}
                  y={HEADER_HEIGHT + t * ROW_HEIGHT + 36}
                  fill="#71717a"
                  fontSize="10"
                  fontFamily="'JetBrains Mono', 'Courier New', monospace"
                  fontWeight="bold"
                >
                  LANE {String(t + 1).padStart(2, '0')}
                </text>
                <line
                  x1={LEFT_PANEL_WIDTH}
                  y1={HEADER_HEIGHT + t * ROW_HEIGHT}
                  x2={LEFT_PANEL_WIDTH}
                  y2={HEADER_HEIGHT + (t + 1) * ROW_HEIGHT}
                  stroke="#27272a"
                  strokeWidth="1"
                />
              </g>
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
              fontFamily="'JetBrains Mono', 'Courier New', monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              TODAY
            </text>
          </g>

          {/* Date Axis Header */}
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
                  fontFamily="'JetBrains Mono', 'Courier New', monospace"
                  textAnchor="middle"
                >
                  {formattedDate}
                </text>
              );
            })}
          </g>

          {/* Tasks Packed into Compact Tracks */}
          <g>
            {packedNodes.map(({ node, trackIndex }) => {
              const plannedX = getX(node.planned_start);
              const plannedW = getW(node.planned_start, node.planned_end);

              const actualStart = node.actual_start || node.planned_start;
              const actualEnd = node.actual_end || (node.status === 'In Progress' ? simulatedDate : actualStart);
              const actualX = getX(actualStart);
              const actualW = getW(actualStart, actualEnd);

              const bgColor = DEPT_COLORS[node.department as Department] || '#71717a';
              const textColor = node.department === 'PM' || node.department === 'Design' ? '#000000' : '#ffffff';

              const currentY = HEADER_HEIGHT + trackIndex * ROW_HEIGHT;

              let durationText = '';
              if (node.actual_start) {
                const days = getDaysDiff(node.actual_start, node.actual_end || simulatedDate) + 1;
                durationText = node.actual_end ? `${days}d` : `${days}d (ip)`;
              }

              return (
                <g key={`node-${node.id}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(node)}>
                  {/* Task ID, Department Tag & Title */}
                  <text
                    x={plannedX}
                    y={currentY + 18}
                    fill="#e4e4e7"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', 'Courier New', monospace"
                    fontWeight="bold"
                  >
                    [{node.id}] [{node.department.toUpperCase()}] {node.title} {node.dependency && `[DEP: ${node.dependency}]`}
                  </text>

                  {/* Planned Schedule Bar */}
                  <rect
                    x={plannedX}
                    y={currentY + 26}
                    width={plannedW}
                    height={8}
                    fill="#27272a"
                    rx="4"
                  />

                  {/* Actual Progress Bar */}
                  {node.actual_start && (
                    <g>
                      <rect
                        x={actualX}
                        y={currentY + 38}
                        width={actualW}
                        height={18}
                        fill={bgColor}
                        rx="5"
                      />
                      <text
                        x={actualX + 6}
                        y={currentY + 50}
                        fill={textColor}
                        fontSize="9"
                        fontFamily="'JetBrains Mono', 'Courier New', monospace"
                        fontWeight="bold"
                      >
                        {durationText}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

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
