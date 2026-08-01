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

  // Scaled dimensions with NO left ID panel (0px) & compact lane allocation
  const DAY_WIDTH = 100;
  const ROW_HEIGHT = 160;
  const HEADER_HEIGHT = 90;
  const LEFT_PANEL_WIDTH = 0; // Removed left ID column completely

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

  // --- COMPACT TRACK PACKING ALGORITHM (Only make new lines if needed!) ---
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
  const packedNodes: {
    node: Node;
    trackIndex: number;
    plannedX: number;
    plannedW: number;
    actualX: number;
    actualW: number;
  }[] = [];
  const BUFFER_MS = 12 * 60 * 60 * 1000; // 12hr buffer

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

    const plannedX = getX(node.planned_start);
    const plannedW = getW(node.planned_start, node.planned_end);
    const actualStart = node.actual_start || node.planned_start;
    const actualEnd = node.actual_end || (node.status === 'In Progress' ? simulatedDate : actualStart);
    const actualX = getX(actualStart);
    const actualW = getW(actualStart, actualEnd);

    packedNodes.push({
      node,
      trackIndex: assignedTrack,
      plannedX,
      plannedW,
      actualX,
      actualW
    });
  });

  const totalTracks = Math.max(1, trackEndTimes.length);
  const totalHeight = HEADER_HEIGHT + (totalTracks * ROW_HEIGHT);

  const handleExport = () => {
    if (!svgRef.current) return;

    let svgData = new XMLSerializer().serializeToString(svgRef.current);
    svgData = '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' + svgData;

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cardinal-gantt-maximized.svg';
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
            Gantt Timeline ({nodes.length} Tasks packed into {totalTracks} Lane{totalTracks > 1 ? 's' : ''})
          </h2>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mt-0.5">
            Full-Width Maximized Presentation Vector Export
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex gap-4 text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[#f4f4f5] rounded-sm"></div> PM</div>
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[#d4d4d8] rounded-sm"></div> Design</div>
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[#71717a] rounded-sm"></div> Eng</div>
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[#3f3f46] rounded-sm"></div> Everyone</div>
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
          {/* Solid Black Canvas Background */}
          <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="#000000" />

          {/* Vertical Day Grid Lines */}
          <g>
            {days.map((day, i) => (
              <line
                key={`grid-${day}`}
                x1={LEFT_PANEL_WIDTH + i * DAY_WIDTH}
                y1={HEADER_HEIGHT}
                x2={LEFT_PANEL_WIDTH + i * DAY_WIDTH}
                y2={totalHeight}
                stroke="#18181b"
                strokeWidth="2.5"
              />
            ))}
          </g>

          {/* Lane Divider Horizontal Lines */}
          <g>
            {Array.from({ length: totalTracks }).map((_, t) => (
              <line
                key={`lane-line-${t}`}
                x1={0}
                y1={HEADER_HEIGHT + (t + 1) * ROW_HEIGHT}
                x2={totalWidth}
                y2={HEADER_HEIGHT + (t + 1) * ROW_HEIGHT}
                stroke="#27272a"
                strokeWidth="2.5"
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
              strokeWidth="4"
              strokeDasharray="8 6"
            />
            <rect
              x={simulatedX - 80}
              y={HEADER_HEIGHT + 10}
              width={160}
              height={44}
              fill="#ef4444"
              rx="8"
            />
            <text
              x={simulatedX}
              y={HEADER_HEIGHT + 40}
              fill="#ffffff"
              fontSize="26"
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
            <line x1={0} y1={HEADER_HEIGHT} x2={totalWidth} y2={HEADER_HEIGHT} stroke="#27272a" strokeWidth="3" />
            {days.map((day, i) => {
              const dateObj = new Date(day);
              const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              return (
                <text
                  key={`header-${day}`}
                  x={LEFT_PANEL_WIDTH + i * DAY_WIDTH + (DAY_WIDTH / 2)}
                  y={56}
                  fill="#a1a1aa"
                  fontSize="40"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formattedDate}
                </text>
              );
            })}
          </g>

          {/* Compact Task Nodes Maximize Space */}
          <g>
            {packedNodes.map(({ node, trackIndex, plannedX, plannedW, actualX, actualW }) => {
              const bgColor = DEPT_COLORS[node.department as Department] || '#71717a';
              const textColor = node.department === 'PM' || node.department === 'Design' ? '#000000' : '#ffffff';
              const rowY = HEADER_HEIGHT + trackIndex * ROW_HEIGHT;

              let durationText = '';
              if (node.actual_start) {
                const numDays = getDaysDiff(node.actual_start, node.actual_end || simulatedDate) + 1;
                durationText = node.actual_end ? `${numDays}d` : `${numDays}d (ip)`;
              }

              return (
                <g
                  key={`node-${node.id}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Task Name Title (HUGE 52px Bold) */}
                  <text
                    x={plannedX}
                    y={rowY + 54}
                    fill="#ffffff"
                    fontSize="52"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.title} {node.dependency && `[DEP: ${node.dependency}]`}
                  </text>

                  {/* Planned Schedule Container Bar */}
                  <rect
                    x={plannedX}
                    y={rowY + 68}
                    width={plannedW}
                    height={20}
                    fill="#27272a"
                    rx="8"
                  />

                  {/* Actual Progress Bar (THICK 52px Bar) & HUGE 38px Duration Text Inside */}
                  {node.actual_start && (
                    <g>
                      <rect
                        x={actualX}
                        y={rowY + 96}
                        width={actualW}
                        height={52}
                        fill={bgColor}
                        rx="12"
                      />
                      <text
                        x={actualX + 20}
                        y={rowY + 134}
                        fill={textColor}
                        fontSize="38"
                        fontFamily="monospace"
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
