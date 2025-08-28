import { useRef, type Dispatch, type MutableRef, type StateUpdater } from "preact/hooks";

import './svg_wrap.css'
import type { Bounds, Status, TrajetoriaNode } from "./app.tsx"

type SvgWrapArgs = {
  nodes: Array<TrajetoriaNode>,
  setNodes: Dispatch<StateUpdater<TrajetoriaNode[]>>,
  nextId: number,
  setNextId: Dispatch<StateUpdater<number>>,
  is_dirty: MutableRef<boolean>,
  status: Status,
  offset: { x: number, y: number },
  bounds: Bounds,
}

export function SvgWrap({ nodes, setNodes, nextId, setNextId, is_dirty, status, offset, bounds }: SvgWrapArgs) {
  const dragInfo = useRef<any>(null);

  function make_arrow(a: { x: number; y: number; }, b: { x: number; y: number; }, r: number) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const startX = a.x + ux * r;
    const startY = a.y + uy * r;
    const endX = b.x - ux * (r + 2.5);
    const endY = b.y - uy * (r + 2.5);
    return (
      <line style="pointer-events: none;" x1={startX} y1={startY} x2={endX} y2={endY}
        stroke="var(--on-surface-alt-color)" stroke-width="2.5" stroke-linecap="round"
        marker-end="url(#arrowhead)" opacity="0.95" />
    );
  }

  function getSvgPoint(e: MouseEvent): { x: number, y: number } {
    const svg = (e.target as SVGAElement).ownerSVGElement || (e.target as SVGSVGElement);
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM()?.inverse();
      const loc = pt.matrixTransform(ctm);
      return { x: loc.x, y: loc.y };
    }
    return { x: 0, y: 0 }
  }

  const onDoubleClick = (e: MouseEvent) => {
    const pt = getSvgPoint(e);
    const last = nodes[nodes.length - 1] || { s: 50 };
    const nx = Math.max(Math.min(Math.round((pt.x - offset.x) * 5) / 5, bounds.x0 + bounds.width), bounds.x0) - offset.x;
    const ny = Math.max(Math.min(Math.round((pt.y - offset.y) * 5) / 5, bounds.y0 + bounds.height), bounds.y0) - offset.y;

    let next = { id: nextId, x: nx, y: ny, s: last.s, command: 0 }

    setNodes(prev => {
      is_dirty.current = true;
      return [...prev, next];
    });
    setNextId(id => id + 1);
  };


  const onPointerDown = (e: PointerEvent, i: number) => {
    const pt = getSvgPoint(e);
    dragInfo.current = {
      i,
      offsetX: nodes[i].x + offset.x - pt.x,
      offsetY: nodes[i].y + offset.y - pt.y
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragInfo.current) return;
    const { i, offsetX, offsetY } = dragInfo.current;
    const pt = getSvgPoint(e);
    const nx = Math.max(Math.min(Math.round((pt.x + offsetX) * 5) / 5, bounds.x0 + bounds.width), bounds.x0) - offset.x;
    const ny = Math.max(Math.min(Math.round((pt.y + offsetY) * 5) / 5, bounds.y0 + bounds.height), bounds.y0) - offset.y;
    setNodes((ns: any) => {
      const copy = [...ns];
      copy[i] = { ...copy[i], x: nx, y: ny };
      is_dirty.current = true;
      return copy;
    });
  };

  const onPointerUp = () => {
    dragInfo.current = null;
  };

  return (
    <div className="svg-wrap">
      <svg viewBox={`${bounds.x0} ${bounds.y0} ${bounds.width} ${bounds.height}`} onDblClick={onDoubleClick} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="3.5" refY="2.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L5,2.5 L0,5 z" fill="var(--on-surface-alt-color)" />
          </marker>
          <filter id="shadow" x="-50%" y="-50%" width="250%" height="250%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.12" />
          </filter>
        </defs>
        <g>
          {nodes.map((n: any, i: number) => (
            <g key={n.id} onPointerDown={e => onPointerDown(e, i)}>
              <circle cx={n.x + offset.x} cy={n.y + offset.y} r={4.5}
                fill="var(--on-surface-color)"
                filter="url(#shadow)"
                style="cursor:grab" />
            </g>
          ))}
        </g>
        <g>
          {nodes.map((n: any, i: number) => {
            if (i == 0) return null;
            const prev = nodes[i - 1];
            return make_arrow({ ...prev, x: prev.x + offset.x, y: prev.y + offset.y }, { ...n, x: n.x + offset.x, y: n.y + offset.y }, 4.5);
          })}
        </g>
        {status.calibrated ?
          <g>
            <circle style="pointer-events: none;" cx={status.pos[0]} cy={status.pos[1]} r={5}
              fill="var(--warning-color)"
              filter="url(#shadow)" />
          </g>
          : null
        }
      </svg>
    </div>
  );
}
