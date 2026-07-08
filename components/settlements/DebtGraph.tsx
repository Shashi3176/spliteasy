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

const NODE_RADIUS = 32;
const LABEL_OFFSET = 48;
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

    const defs = svg.append('defs');
    const edgeGroup = svg.append('g').attr('class', 'edges-layer');
    const nodeGroup = svg.append('g').attr('class', 'nodes-layer');

    const positions = groupMembers.map((_, i) => {
      const angle = (i * 2 * Math.PI) / groupMembers.length - Math.PI / 2;
      return {
        x: CENTER + Math.cos(angle) * (CENTER - NODE_RADIUS - 30),
        y: CENTER + Math.sin(angle) * (CENTER - NODE_RADIUS - 30),
      };
    });

    const shadowFilter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    
    shadowFilter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 4)
      .attr('stdDeviation', 6)
      .attr('flood-color', '#0f172a')
      .attr('flood-opacity', 0.15);

    const colorScale = d3.scaleOrdinal<number, string>()
      .domain(d3.range(groupMembers.length))
      .range([
        'hsl(215, 80%, 60%)',
        'hsl(142, 70%, 45%)',
        'hsl(38, 90%, 55%)',
        'hsl(280, 75%, 60%)',
        'hsl(345, 80%, 60%)',
        'hsl(175, 75%, 40%)'
      ]);

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', NODE_RADIUS + 12)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .append('path')
      .attr('d', 'M 0 -4 L 9 0 L 0 4')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .attr('opacity', 0.8);

    groupMembers.forEach((member, i) => {
      if (member.avatar) {
        defs.append('clipPath')
          .attr('id', `avatar-clip-${i}`)
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', NODE_RADIUS - 1.5);
      }
    });

    if (edges.length > 0) {
      const amounts = edges.map((e) => e.amount);
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      
      const strokeWidthScale = d3.scaleLinear()
        .domain([minAmount, maxAmount])
        .range([2, 6])
        .clamp(true);

      edges.forEach((edge) => {
        const fromIdx = groupMembers.findIndex((m) => m.userId === edge.from);
        const toIdx = groupMembers.findIndex((m) => m.userId === edge.to);
        if (fromIdx === -1 || toIdx === -1) return;

        const fromPos = positions[fromIdx];
        const toPos = positions[toIdx];

        const edgeElement = edgeGroup.append('g')
          .attr('class', 'edge-path-group')
          .style('transition', 'all 0.2s ease');

        const line = edgeElement.append('line')
          .attr('x1', fromPos.x)
          .attr('y1', fromPos.y)
          .attr('x2', toPos.x)
          .attr('y2', toPos.y)
          .attr('stroke', 'hsl(var(--border))')
          .attr('stroke-width', strokeWidthScale(edge.amount))
          .attr('stroke-linecap', 'round')
          .attr('marker-end', 'url(#arrowhead)')
          .attr('opacity', 0.45);

                // Value Floating Pill Badge
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;

        const badge = edgeElement.append('g')
          .attr('transform', `translate(${midX}, ${midY})`);

        // Text layer with high-contrast explicit color variables
        const textNode = badge.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 4)
          .attr('font-size', 11)
          .attr('font-weight', 700)
          .attr('fill', 'hsl(var(--primary))') // Clearly visible colored text
          .text(`₹${edge.amount}`);

        const textWidth = textNode.node()?.getComputedTextLength() || 40;
        const paddingX = 10;

        // Clean white/card-matching background label box
        badge.insert('rect', 'text')
          .attr('x', -textWidth / 2 - paddingX / 2)
          .attr('y', -10)
          .attr('width', textWidth + paddingX)
          .attr('height', 18)
          .attr('rx', 6)
          .attr('fill', 'hsl(var(--card))') // Matches dashboard card container theme
          .attr('stroke', 'hsl(var(--primary) / 0.3)') // Subtle matching border outline
          .attr('stroke-width', 1);

        edgeElement.style('cursor', 'pointer')
          .on('mouseenter', () => {
            line.attr('stroke', 'hsl(var(--primary))').attr('opacity', 0.9);
          })
          .on('mouseleave', () => {
            line.attr('stroke', 'hsl(var(--border))').attr('opacity', 0.45);
          });
      });
    }

    groupMembers.forEach((member, i) => {
      const pos = positions[i];
      const nodeColor = colorScale(i);

      const node = nodeGroup.append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .attr('class', 'node-avatar-group')
        .style('cursor', 'pointer')
        .style('transition', 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)');

      node.append('circle')
        .attr('r', NODE_RADIUS)
        .attr('fill', member.avatar ? 'hsl(var(--background))' : nodeColor)
        .attr('stroke', member.avatar ? 'hsl(var(--border))' : nodeColor)
        .attr('stroke-width', 2)
        .attr('filter', 'url(#node-shadow)');

      if (member.avatar) {
        node.append('image')
          .attr('x', -NODE_RADIUS)
          .attr('y', -NODE_RADIUS)
          .attr('width', NODE_RADIUS * 2)
          .attr('height', NODE_RADIUS * 2)
          .attr('href', member.avatar)
          .attr('clip-path', `url(#avatar-clip-${i})`);
      } else {
        const initials = getInitials(member.name || 'Unknown');
        node.append('text')
          .attr('x', 0)
          .attr('y', 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', 14)
          .attr('font-weight', 700)
          .attr('fill', '#ffffff')
          .text(initials);
      }

      const isBottomOffset = pos.y > CENTER;
      const labelY = isBottomOffset ? LABEL_OFFSET : -LABEL_OFFSET + 10;
      
      node.append('text')
        .attr('x', 0)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .attr('fill', 'hsl(var(--foreground))')
        .attr('paint-order', 'stroke')
        .attr('stroke', 'hsl(var(--background))')
        .attr('stroke-width', 4)
        .attr('stroke-linejoin', 'round')
        .text((member.name || 'Unknown').split(' ')[0]);

      node.on('mouseenter', function() {
        d3.select(this).attr('transform', `translate(${pos.x}, ${pos.y}) scale(1.12)`);
      }).on('mouseleave', function() {
        d3.select(this).attr('transform', `translate(${pos.x}, ${pos.y}) scale(1)`);
      });
    });

  }, [groupMembers, edges, viewMode]);

  const hasEdges = beforeEdges.length > 0 || afterEdges.length > 0;
  if (!hasEdges) return null;

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Debt Balance Graph</h4>
          <p className="text-xs text-muted-foreground">Visualizing transactions across members</p>
        </div>
        <div className="inline-flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setViewMode('before')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'before'
                ? 'bg-background text-foreground shadow-sm border border-border/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Raw Debts
          </button>
          <button
            onClick={() => setViewMode('after')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'after'
                ? 'bg-background text-foreground shadow-sm border border-border/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Simplified
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center py-4">
        <svg 
          ref={svgRef} 
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} 
          className="w-full max-w-[460px] overflow-visible" 
        />
      </div>
    </div>
  );
}
