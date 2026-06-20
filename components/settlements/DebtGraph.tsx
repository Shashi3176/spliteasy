'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

type Edge = {
  from: string;
  to: string;
  amount: number;
};

type DebtGraphProps = {
  groupMembers: Array<{ userId: string; name: string; avatar?: string | null }>;
  beforeEdges: Edge[];
  afterEdges: Edge[];
};

const NODE_RADIUS = 30;
const LABEL_OFFSET = 45;
const VIEWBOX_SIZE = 600;
const CENTER = VIEWBOX_SIZE / 2;

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

export default function DebtGraph({ groupMembers, beforeEdges, afterEdges }: DebtGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewMode, setViewMode] = useState<'before' | 'after'>('before');

  const edges = viewMode === 'before' ? beforeEdges : afterEdges;

  useEffect(() => {
    if (!svgRef.current || groupMembers.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const positions = groupMembers.map((_, i) => {
      const angle = (i * 2 * Math.PI) / groupMembers.length;
      return {
        x: CENTER + Math.cos(angle) * (CENTER - NODE_RADIUS - 10),
        y: CENTER + Math.sin(angle) * (CENTER - NODE_RADIUS - 10),
      };
    });

    const nodeGroup = g.append('g');

    groupMembers.forEach((member, i) => {
      const pos = positions[i];
      const node = nodeGroup.append('g').attr('transform', `translate(${pos.x}, ${pos.y})`);

      node.append('circle')
        .attr('r', NODE_RADIUS)
        .attr('fill', 'hsl(var(--background))')
        .attr('stroke', 'hsl(var(--border))')
        .attr('stroke-width', 2);

      if (member.avatar) {
        node.append('image')
          .attr('x', -NODE_RADIUS * 0.8)
          .attr('y', -NODE_RADIUS * 0.8)
          .attr('width', NODE_RADIUS * 1.6)
          .attr('height', NODE_RADIUS * 1.6)
          .attr('href', member.avatar)
          .attr('clip-path', `circle(${NODE_RADIUS * 0.8}px at ${NODE_RADIUS * 0.8}px ${NODE_RADIUS * 0.8}px)`);
      } else {
        const initials = getInitials(member.name || 'Unknown');
        node.append('text')
          .attr('x', 0)
          .attr('y', 6)
          .attr('text-anchor', 'middle')
          .attr('font-size', 12)
          .attr('font-weight', 600)
          .attr('fill', 'hsl(var(--foreground))')
          .text(initials);
      }

      const labelY = pos.y > CENTER ? LABEL_OFFSET : -LABEL_OFFSET;
      node.append('text')
        .attr('x', 0)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('fill', 'hsl(var(--muted-foreground))')
        .text((member.name || 'Unknown').split(' ')[0]);
    });

    if (edges.length > 0) {
      const amounts = edges.map((e) => e.amount);
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      const strokeWidthScale = d3.scaleLinear().domain([minAmount, maxAmount]).range([1.5, 8]).clamp(true);

      g.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -6 12 12')
        .attr('refX', NODE_RADIUS + 2)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M 0 -5 L 10 0 L 0 5')
        .attr('fill', 'hsl(var(--primary))');

      edges.forEach((edge) => {
        const fromIdx = groupMembers.findIndex((m) => m.userId === edge.from);
        const toIdx = groupMembers.findIndex((m) => m.userId === edge.to);
        if (fromIdx === -1 || toIdx === -1) return;

        const fromPos = positions[fromIdx];
        const toPos = positions[toIdx];

        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
        const startX = fromPos.x + Math.cos(angle) * NODE_RADIUS;
        const startY = fromPos.y + Math.sin(angle) * NODE_RADIUS;
        const endX = toPos.x - Math.cos(angle) * NODE_RADIUS;
        const endY = toPos.y - Math.sin(angle) * NODE_RADIUS;

        g.append('line')
          .attr('x1', startX)
          .attr('y1', startY)
          .attr('x2', endX)
          .attr('y2', endY)
          .attr('stroke', 'hsl(var(--muted-foreground))')
          .attr('stroke-width', strokeWidthScale(edge.amount))
          .attr('marker-end', 'url(#arrowhead)')
          .attr('opacity', 0.7);
      });
    }
  }, [groupMembers, edges, viewMode]);

  const hasEdges = beforeEdges.length > 0 || afterEdges.length > 0;

  if (!hasEdges) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('before')}
          className={`rounded-md px-3 py-1 text-sm ${
            viewMode === 'before'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Before Simplification
        </button>
        <button
          onClick={() => setViewMode('after')}
          className={`rounded-md px-3 py-1 text-sm ${
            viewMode === 'after'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          After Simplification
        </button>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full max-w-[500px]" />
    </div>
  );
}