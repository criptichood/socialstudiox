import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
  Handle,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeDiagram, NodeDiagramNode } from '../../../lib/nodeDiagrams';

const NODE_WIDTH = 230;
const NODE_HEIGHT = 96;
const H_GAP = 110;
const V_GAP = 40;

const kindStyles: Record<string, { border: string; badge: string; badgeText: string }> = {
  input: { border: 'border-emerald-500/50', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300', badgeText: 'INPUT' },
  process: { border: 'border-purple-500/50', badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-300', badgeText: 'STEP' },
  decision: { border: 'border-amber-500/50', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300', badgeText: 'DECISION' },
  output: { border: 'border-sky-500/50', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-300', badgeText: 'OUTPUT' },
};

const DiagramNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { label, description, type } = (data || {}) as { label?: string; description?: string; type?: NodeDiagramNode['type'] };
  const style = kindStyles[type || 'process'] || kindStyles.process;

  return (
    <div
      className={`relative rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg px-3.5 py-2.5 transition-colors ${
        selected ? 'ring-2 ring-purple-500/60 border-purple-500' : style.border
      }`}
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-white" />
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.badge} ${style.badgeText}`}>
            {style.badgeText}
          </span>
        </div>
        <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{label}</div>
        {description && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-3">{description}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-white" />
    </div>
  );
};

const nodeTypes = { diagram: DiagramNode };

/** Assign a column (x) to every node via longest-path BFS, tolerating cycles.
 *  AI diagrams list nodes in logical order (1, 2, 3…), so any edge pointing to a
 *  node declared earlier is a feedback/back edge (e.g. "Needs Rework" → step 1).
 *  We exclude those back edges from the column computation — otherwise a cycle
 *  leaves no indegree-zero node and the first node gets pushed to the last column.
 *  All edges are still rendered. */
const computeLayout = (diagram: NodeDiagram): { nodes: Node[]; edges: Edge[] } => {
  const declaredIndex = new Map(diagram.nodes.map((n, i) => [n.id, i]));

  // Only edges that go strictly forward in declared order participate in layering.
  const layeringEdges = diagram.edges.filter(
    e => (declaredIndex.get(e.target) ?? 0) > (declaredIndex.get(e.source) ?? 0)
  );

  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  diagram.nodes.forEach(n => {
    indegree.set(n.id, 0);
    adj.set(n.id, []);
  });
  layeringEdges.forEach(e => {
    if (indegree.has(e.target)) indegree.set(e.target, (indegree.get(e.target) || 0) + 1);
    if (adj.has(e.source)) adj.get(e.source)!.push(e.target);
  });

  // Kahn's algorithm for column assignment. With cycles broken there is always
  // at least one source, so the previous "push all nodes" fallback is gone.
  // A node is enqueued only once all its layering predecessors are processed,
  // so processing in queue order yields the correct longest-path depth.
  const remainingIndegree = new Map(indegree);
  const depth = new Map<string, number>();
  const queue = diagram.nodes
    .filter(n => (remainingIndegree.get(n.id) || 0) === 0)
    .map(n => n.id);
  queue.forEach(id => depth.set(id, 0));
  let head = 0;
  while (head < queue.length) {
    const currentId = queue[head++];
    const curDepth = depth.get(currentId) || 0;
    for (const nextId of adj.get(currentId) || []) {
      const nextDepth = Math.max(depth.get(nextId) ?? 0, curDepth + 1);
      depth.set(nextId, nextDepth);
      remainingIndegree.set(nextId, (remainingIndegree.get(nextId) || 0) - 1);
      if (remainingIndegree.get(nextId) === 0) queue.push(nextId);
    }
  }

  // Group by column, ordering nodes within a column by declared order, then
  // stack rows within each column.
  const columns = new Map<number, NodeDiagramNode[]>();
  diagram.nodes.forEach(n => {
    const col = depth.get(n.id) ?? 0;
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(n);
  });

  const nodes: Node[] = [];
  columns.forEach((colNodes, col) => {
    colNodes.forEach((n, row) => {
      nodes.push({
        id: n.id,
        type: 'diagram',
        position: {
          x: col * (NODE_WIDTH + H_GAP),
          y: row * (NODE_HEIGHT + V_GAP),
        },
        data: { label: n.label, description: n.description, type: n.type },
      });
    });
  });

  const edges: Edge[] = diagram.edges.map(e => ({
    id: e.id || `edge_${e.source}_${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7', width: 20, height: 20 },
    style: { stroke: '#a855f7', strokeWidth: 1.6 },
    labelStyle: { fill: '#8b8b8b', fontSize: 10, fontWeight: 600 },
  }));

  return { nodes, edges };
};

interface FlowDiagramRendererProps {
  diagram: NodeDiagram;
  title?: string;
  height?: number;
}

/** Inner canvas: re-fits the view once the container has real dimensions
 *  (React Flow measures the container on mount, which can be 0-size while a
 *  modal/tab animation is running, collapsing the viewport to a single node). */
const FlowCanvas: React.FC<{ nodes: Node[]; edges: Edge[]; height: number }> = ({ nodes, edges, height }) => {
  const { fitView } = useReactFlow();
  const [mounted, setMounted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const refit = useCallback(() => {
    if (typeof window === 'undefined') return;
    fitView({ padding: 0.2, duration: 200, maxZoom: 1 });
  }, [fitView]);

  useEffect(() => {
    if (!mounted) return;
    // Let the layout settle, then fit; also re-fit whenever the container is
    // resized (covers modal/tab animations) so the canvas never shows a
    // collapsed/blank view.
    const t1 = window.setTimeout(refit, 80);
    const t2 = window.setTimeout(refit, 400);

    const el = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && el) {
      observer = new ResizeObserver(() => refit());
      observer.observe(el);
    } else {
      window.addEventListener('resize', refit);
    }

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer?.disconnect();
      window.removeEventListener('resize', refit);
    };
  }, [mounted, refit, nodes, edges]);

  return (
    <div ref={containerRef} style={{ height }} className="w-full">
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable
        nodesDraggable={false}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="#a855f7" gap={22} size={1} />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeStrokeColor="#a855f7"
          nodeColor="#e9d5ff"
          maskColor="rgba(10, 10, 20, 0.6)"
          style={{ backgroundColor: 'rgba(15, 15, 30, 0.85)', border: '1px solid rgba(168,85,247,0.25)' }}
        />
      </ReactFlow>
    </div>
  );
};

export const FlowDiagramRenderer: React.FC<FlowDiagramRendererProps> = ({ diagram, title, height = 420 }) => {
  const { nodes, edges } = useMemo(() => computeLayout(diagram), [diagram]);

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-purple-500/25 bg-slate-50 dark:bg-slate-950/70 shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/20 bg-purple-500/10">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {title || diagram.title || 'Node Diagram'}
        </span>
        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
          {diagram.nodes.length} nodes • {diagram.edges.length} connections
        </span>
      </div>
      <ReactFlowProvider>
        <FlowCanvas nodes={nodes} edges={edges} height={height} />
      </ReactFlowProvider>
    </div>
  );
};