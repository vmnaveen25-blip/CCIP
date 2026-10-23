import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Focus, 
  Tag, 
  Layers, 
  AlertTriangle, 
  RefreshCw, 
  Network,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

export interface GraphNode3D {
  id: string;
  label: string;
  type: string;
  canonicalValue?: string;
  confidence?: number;
  reviewStatus?: string;
  source?: string;
  degree?: number;
  metadata?: Record<string, any>;
  connections?: string[];
  // internal Three.js force coordinates
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface GraphLink3D {
  id?: string;
  source: string | GraphNode3D;
  target: string | GraphNode3D;
  type: string;
  confidence?: number;
  sourceType?: string; // 'DETERMINISTIC' | 'RELATION_MODEL' | 'CORRELATION_MODEL' | 'GRAPH_LINK_MODEL' | 'INVESTIGATOR_CONFIRMED'
  reviewStatus?: string;
  metadata?: Record<string, any>;
}

export interface CorrelationGraph3DProps {
  nodes: GraphNode3D[];
  links: GraphLink3D[];
  selectedNodeId?: string | null;
  onNodeSelect: (node: GraphNode3D | null) => void;
  onLinkSelect?: (link: GraphLink3D | null) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedCaseNumber?: string;
  className?: string;
}

// CCIP Semantic Palette
export function getNodeCategory(type: string): { color: string; label: string; bgClass: string; textClass: string } {
  const upper = (type || '').toUpperCase();
  if (upper === 'CASE' || upper === 'COMPLAINT') {
    return { color: '#00e676', label: 'Cases', bgClass: 'bg-[#00e676]/20 border-[#00e676]/40', textClass: 'text-[#00e676]' };
  }
  if (['PHONE', 'UPI', 'BANK_ACCOUNT', 'BANK', 'CRYPTO_WALLET', 'WALLET'].includes(upper)) {
    return { color: '#19D58A', label: 'Financial / Telecom', bgClass: 'bg-[#19D58A]/20 border-[#19D58A]/40', textClass: 'text-[#19D58A]' };
  }
  if (['IP', 'DOMAIN', 'URL', 'EMAIL', 'INFRASTRUCTURE', 'SERVER'].includes(upper)) {
    return { color: '#67C7E7', label: 'Infrastructure', bgClass: 'bg-[#67C7E7]/20 border-[#67C7E7]/40', textClass: 'text-[#67C7E7]' };
  }
  if (['ORGANIZATION', 'PERSON', 'PLATFORM', 'VICTIM'].includes(upper)) {
    return { color: '#EF9BC2', label: 'Organizations & Persons', bgClass: 'bg-[#EF9BC2]/20 border-[#EF9BC2]/40', textClass: 'text-[#EF9BC2]' };
  }
  if (['SUSPECT', 'THREAT_ACTOR', 'ACTOR', 'MALWARE'].includes(upper)) {
    return { color: '#F0D600', label: 'Identified Entities', bgClass: 'bg-[#F0D600]/20 border-[#F0D600]/40', textClass: 'text-[#F0D600]' };
  }
  return { color: '#94A3B8', label: 'Other Entities', bgClass: 'bg-slate-500/20 border-slate-500/40', textClass: 'text-slate-400' };
}

export const CorrelationGraph3D: React.FC<CorrelationGraph3DProps> = ({
  nodes,
  links,
  selectedNodeId,
  onNodeSelect,
  onLinkSelect,
  loading = false,
  error = null,
  onRetry,
  selectedCaseNumber,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods>();

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 440 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [is2DMode, setIs2DMode] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode3D | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // ResizeObserver to fit container cleanly
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: isFullscreen ? window.innerHeight : (containerRef.current.clientHeight || 440)
        });
      }
    };
    updateDims();
    const observer = new ResizeObserver(updateDims);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Fullscreen ESC handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Compute node degrees and build connection map
  const { nodeDegreeMap, adjacencyMap, linkKeySet } = useMemo(() => {
    const degrees: Record<string, number> = {};
    const adj: Record<string, Set<string>> = {};
    const linkSet = new Set<string>();

    links.forEach(l => {
      const srcId = typeof l.source === 'object' ? (l.source as GraphNode3D).id : String(l.source);
      const tgtId = typeof l.target === 'object' ? (l.target as GraphNode3D).id : String(l.target);

      degrees[srcId] = (degrees[srcId] || 0) + 1;
      degrees[tgtId] = (degrees[tgtId] || 0) + 1;

      if (!adj[srcId]) adj[srcId] = new Set();
      if (!adj[tgtId]) adj[tgtId] = new Set();
      adj[srcId].add(tgtId);
      adj[tgtId].add(srcId);

      linkSet.add(`${srcId}->${tgtId}`);
      linkSet.add(`${tgtId}->${srcId}`);
    });

    return { nodeDegreeMap: degrees, adjacencyMap: adj, linkKeySet: linkSet };
  }, [links]);

  // Highlighted set for neighborhood isolation
  const highlightedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>([selectedNodeId]);
    const neighbors = adjacencyMap[selectedNodeId];
    if (neighbors) {
      neighbors.forEach(nId => set.add(nId));
    }
    return set;
  }, [selectedNodeId, adjacencyMap]);

  // Normalization of graph data for ForceGraph3D
  const graphData = useMemo(() => {
    const enrichedNodes = nodes.map(n => ({
      ...n,
      degree: nodeDegreeMap[n.id] || 0,
      connections: adjacencyMap[n.id] ? Array.from(adjacencyMap[n.id]) : []
    }));

    return {
      nodes: enrichedNodes,
      links: links.map(l => ({ ...l }))
    };
  }, [nodes, links, nodeDegreeMap, adjacencyMap]);

  // Focus camera on selected node
  useEffect(() => {
    if (!selectedNodeId || !fgRef.current) return;
    const targetNode = graphData.nodes.find(n => n.id === selectedNodeId);
    if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined && targetNode.z !== undefined) {
      const distance = 90;
      const distRatio = 1 + distance / Math.hypot(targetNode.x, targetNode.y, targetNode.z || 1);
      fgRef.current.cameraPosition(
        {
          x: targetNode.x * distRatio,
          y: targetNode.y * distRatio,
          z: (targetNode.z || 0) * distRatio
        },
        targetNode as any,
        1000
      );
    }
  }, [selectedNodeId, graphData.nodes]);

  // Initial camera orientation
  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(800, 40);
      }, 500);
    }
  }, [nodes.length]);

  // Category legend derived from actual nodes present
  const presentCategories = useMemo(() => {
    const cats = new Map<string, { color: string; label: string; count: number }>();
    nodes.forEach(n => {
      const cat = getNodeCategory(n.type);
      if (!cats.has(cat.label)) {
        cats.set(cat.label, { color: cat.color, label: cat.label, count: 1 });
      } else {
        cats.get(cat.label)!.count += 1;
      }
    });
    return Array.from(cats.values());
  }, [nodes]);

  // Node 3D Object Renderer
  const nodeThreeObject = useCallback((node: any) => {
    const isSelected = node.id === selectedNodeId;
    const isHovered = node.id === hoveredNode?.id;
    const isConnected = highlightedNodeIds.has(node.id);
    const hasFocus = Boolean(selectedNodeId);

    // Opacity based on focus
    let opacity = 1.0;
    if (hasFocus) {
      opacity = (isSelected || isConnected) ? 1.0 : 0.22;
    }

    const group = new THREE.Group();
    const isCase = (node.type || '').toUpperCase() === 'CASE';
    const radius = isCase ? 9 : Math.min(13, Math.max(5, 4.5 + (node.degree || 1) * 0.7));
    const category = getNodeCategory(node.type);
    const color = new THREE.Color(category.color);

    // 1. Central WebGL Sphere
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.35,
      metalness: 0.25,
      emissive: color,
      emissiveIntensity: isSelected ? 0.9 : (isHovered ? 0.6 : (hasFocus && !isConnected ? 0.08 : 0.3)),
      transparent: true,
      opacity: opacity
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // 2. Outer Pulsing Ring for Selected Node
    if (isSelected) {
      const ringGeo = new THREE.RingGeometry(radius * 1.35, radius * 1.6, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00E676,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    // 3. Subtle Halo for Case Nodes
    if (isCase && !isSelected) {
      const caseRingGeo = new THREE.RingGeometry(radius * 1.25, radius * 1.45, 32);
      const caseRingMat = new THREE.MeshBasicMaterial({
        color: 0x00E676,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: hasFocus && !isConnected ? 0.2 : 0.6
      });
      const caseRing = new THREE.Mesh(caseRingGeo, caseRingMat);
      caseRing.rotation.x = Math.PI / 2;
      group.add(caseRing);
    }

    // 4. SpriteText Labels facing camera
    const shouldShowLabel = showLabels && (
      nodes.length < 80 ||
      isSelected ||
      isHovered ||
      isConnected ||
      (node.degree && node.degree >= 3)
    );

    if (shouldShowLabel) {
      const rawLabel = node.label || node.canonicalValue || node.id;
      const truncated = rawLabel.length > 22 ? rawLabel.slice(0, 20) + '…' : rawLabel;
      const sprite = new SpriteText(truncated);
      sprite.color = isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : '#E2E8F0');
      sprite.textHeight = Math.max(3.2, radius * 0.65);
      sprite.position.set(0, -radius - 3.5, 0);
      sprite.fontFace = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      sprite.fontWeight = isSelected ? 'bold' : 'normal';
      sprite.backgroundColor = 'rgba(12, 12, 14, 0.8)';
      sprite.padding = [1.5, 3];
      sprite.borderRadius = 3;
      sprite.borderWidth = isSelected ? 0.8 : 0.4;
      sprite.borderColor = isSelected ? '#00e676' : 'rgba(255, 255, 255, 0.15)';
      group.add(sprite);
    }

    return group;
  }, [selectedNodeId, hoveredNode, highlightedNodeIds, showLabels, nodes.length]);

  // Link styling functions
  const getLinkColor = useCallback((link: any) => {
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;

    const isConnectedToSelected = selectedNodeId && (srcId === selectedNodeId || tgtId === selectedNodeId);
    const hasFocus = Boolean(selectedNodeId);

    if (hasFocus && !isConnectedToSelected) {
      return 'rgba(255, 255, 255, 0.08)';
    }

    const st = (link.sourceType || link.source || '').toUpperCase();
    if (st === 'INVESTIGATOR_CONFIRMED' || link.reviewStatus === 'VERIFIED') {
      return '#19D58A'; // Strong green confirmed
    }
    if (st === 'RELATION_MODEL') {
      return '#67C7E7'; // Soft cyan relation
    }
    if (st === 'CORRELATION_MODEL' || st === 'GRAPH_LINK_MODEL' || link.type === 'CROSS_CASE_CORRELATION') {
      return '#F0D600'; // Amber/yellow candidate
    }
    return 'rgba(242, 100, 12, 0.7)'; // Default orange deterministic
  }, [selectedNodeId]);

  const getLinkWidth = useCallback((link: any) => {
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
    if (selectedNodeId && (srcId === selectedNodeId || tgtId === selectedNodeId)) {
      return 2.4;
    }
    return 1.4;
  }, [selectedNodeId]);

  const getLinkParticles = useCallback((link: any) => {
    const st = (link.sourceType || link.source || '').toUpperCase();
    if (st === 'GRAPH_LINK_MODEL' || st === 'CORRELATION_MODEL' || link.type === 'CROSS_CASE_CORRELATION') {
      return 3;
    }
    if (st === 'INVESTIGATOR_CONFIRMED') {
      return 2;
    }
    return 1;
  }, []);

  // Controls Handlers
  const handleResetView = () => {
    if (!fgRef.current) return;
    fgRef.current.cameraPosition({ x: 0, y: 0, z: 280 }, { x: 0, y: 0, z: 0 }, 900);
  };

  const handleFitGraph = () => {
    if (!fgRef.current) return;
    fgRef.current.zoomToFit(800, 40);
  };

  const handleToggle2D = () => {
    if (!fgRef.current) return;
    if (!is2DMode) {
      // Switch to top-down flat perspective
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 360 }, { x: 0, y: 0, z: 0 }, 1000);
      setIs2DMode(true);
    } else {
      // Switch back to 3D oblique view
      fgRef.current.cameraPosition({ x: 140, y: 90, z: 240 }, { x: 0, y: 0, z: 0 }, 1000);
      setIs2DMode(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl bg-[#0C0C0E] border border-white/[0.08] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[450px]'
      } ${className}`}
      onMouseMove={(e) => {
        if (hoveredNode && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
    >
      {/* Top Toolbar / Canvas Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Dynamic Legend */}
        <div className="flex items-center gap-2 bg-[#141416]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[0.08] pointer-events-auto text-[11px] font-mono shadow-lg">
          <span className="text-content-muted uppercase tracking-wider text-[10px] mr-1 hidden sm:inline">VECTORS:</span>
          {presentCategories.length > 0 ? (
            presentCategories.map(cat => (
              <span key={cat.label} className="flex items-center gap-1.5 text-content-secondary">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                <span className="hidden md:inline">{cat.label}</span>
                <span className="text-[10px] text-content-muted">({cat.count})</span>
              </span>
            ))
          ) : (
            <span className="text-content-muted text-[10px]">No active entity categories</span>
          )}
        </div>

        {/* Right: Camera Action Buttons */}
        <div className="flex items-center gap-1.5 bg-[#141416]/90 backdrop-blur-md p-1 rounded-lg border border-white/[0.08] pointer-events-auto shadow-lg">
          <button
            onClick={handleResetView}
            className="p-1.5 rounded hover:bg-white/[0.1] text-content-secondary hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] font-mono">Reset</span>
          </button>

          <button
            onClick={handleFitGraph}
            className="p-1.5 rounded hover:bg-white/[0.1] text-content-secondary hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Fit Graph into View"
          >
            <Focus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] font-mono">Fit</span>
          </button>

          <button
            onClick={handleToggle2D}
            className={`p-1.5 rounded transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono text-[10px] ${
              is2DMode ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/[0.1] text-content-secondary hover:text-white'
            }`}
            title="Toggle 2D Top-Down / 3D Spatial Mode"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{is2DMode ? '2D' : '3D'}</span>
          </button>

          <button
            onClick={() => setShowLabels(prev => !prev)}
            className={`p-1.5 rounded transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono text-[10px] ${
              showLabels ? 'bg-white/[0.12] text-white' : 'hover:bg-white/[0.1] text-content-muted'
            }`}
            title="Toggle 3D Labels"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Labels</span>
          </button>

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-1.5 rounded hover:bg-white/[0.1] text-content-secondary hover:text-white transition-colors cursor-pointer text-xs"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-primary" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main 3D ForceGraph Canvas */}
      <ForceGraph3D
        ref={fgRef as any}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#0C0C0E"
        nodeThreeObject={nodeThreeObject}
        nodeLabel={() => ''} // custom hover tooltip used instead
        onNodeClick={(node: any) => {
          onNodeSelect(node as GraphNode3D);
        }}
        onNodeHover={(node: any) => {
          setHoveredNode(node as GraphNode3D || null);
          if (!node) setHoverPosition(null);
        }}
        onBackgroundClick={() => {
          onNodeSelect(null);
          setHoveredNode(null);
        }}
        onLinkClick={(link: any) => {
          if (onLinkSelect) onLinkSelect(link as GraphLink3D);
        }}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkOpacity={0.65}
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={getLinkColor}
        enableNodeDrag={true}
        showNavInfo={false}
      />

      {/* Bottom Telemetry HUD Overlay */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2">
        <div className="text-[10px] font-mono text-content-muted bg-[#141416]/90 backdrop-blur-md px-2.5 py-1 rounded border border-white/[0.08] flex items-center gap-2 shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-soft-green animate-pulse"></span>
            <span className="text-content-primary font-bold">{is2DMode ? '2D TOP-DOWN' : '3D SPATIAL ACCELERATED'}</span>
          </span>
          <span className="text-white/[0.2]">•</span>
          <span>{nodes.length} NODES</span>
          <span className="text-white/[0.2]">•</span>
          <span>{links.length} RELATION EDGES</span>
          {selectedNodeId && (
            <>
              <span className="text-white/[0.2]">•</span>
              <span className="text-primary font-bold">ISOLATION MODE</span>
            </>
          )}
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredNode && hoverPosition && (
        <div
          className="absolute z-20 pointer-events-none bg-[#18181B]/95 backdrop-blur-md border border-white/[0.12] rounded-xl p-3 shadow-2xl font-mono text-xs w-64 -translate-x-1/2 -translate-y-full -mt-3 transition-transform"
          style={{ left: hoverPosition.x, top: hoverPosition.y }}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08]">
            <span className="text-primary font-bold truncate max-w-[150px]">{hoveredNode.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getNodeCategory(hoveredNode.type).bgClass} ${getNodeCategory(hoveredNode.type).textClass}`}>
              {hoveredNode.type}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-content-secondary">
            <div className="flex justify-between">
              <span className="text-content-muted">Source:</span>
              <span className="font-bold text-content-primary">{hoveredNode.source || 'CASE_EVIDENCE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Review Status:</span>
              <span className={`font-bold ${hoveredNode.reviewStatus === 'VERIFIED' ? 'text-soft-green' : 'text-amber-400'}`}>
                {hoveredNode.reviewStatus || 'CANDIDATE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Direct Connections:</span>
              <span className="font-bold text-content-primary">{hoveredNode.degree || 0} entities</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-[#0C0C0E]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
          <div className="text-center font-mono">
            <p className="text-xs font-bold text-content-primary uppercase tracking-wider">Building Intelligence Graph</p>
            <p className="text-[10px] text-content-muted mt-0.5">Synthesizing multi-hop case entities & neural correlation links…</p>
          </div>
        </div>
      )}

      {/* Error State Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 z-30 bg-[#0C0C0E]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-mono font-bold text-content-primary uppercase mb-1">Evidence Graph Unavailable</h3>
          <p className="text-[11px] text-content-muted max-w-sm mb-4 leading-relaxed">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Graph Build
            </button>
          )}
        </div>
      )}

      {/* Empty State Overlay */}
      {!loading && !error && nodes.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-content-muted mb-3">
            <Network className="w-6 h-6 opacity-40" />
          </div>
          <h3 className="text-xs font-mono font-bold text-content-primary uppercase mb-1">
            No evidence relationships available yet.
          </h3>
          <p className="text-[11px] text-content-muted max-w-xs leading-relaxed">
            Run intelligence analysis or add verified evidence to build the case graph.
          </p>
        </div>
      )}
    </div>
  );
};
