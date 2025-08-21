import { useRef, type Dispatch, type MutableRef, type StateUpdater } from "preact/hooks";

import './svg_wrap.css'
import type { Status, TrajetoriaNode } from "./app.tsx"

type SvgWrapArgs = {
  nodes: Array<TrajetoriaNode>,
  setNodes: Dispatch<StateUpdater<TrajetoriaNode[]>>,
  is_dirty: MutableRef<boolean>,
  status: Status,
}

export function SvgWrap({ nodes, setNodes, is_dirty, status }: SvgWrapArgs) {
  const dragInfo = useRef<any>(null);
  const x0 = 0;
  const y0 = 0;
  const width = 800
  const height = 600;

  function make_arrow(a: { x: number; y: number; }, b: { x: number; y: number; }, r: number) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const startX = a.x + ux * r, startY = a.y + uy * r;
    const endX = b.x - ux * r, endY = b.y - uy * r;
    return (
      <line x1={startX} y1={startY} x2={endX} y2={endY}
        stroke="#cccccc" stroke-width="3" stroke-linecap="round"
        marker-end="url(#arrowhead)" opacity="0.95" />
    );
  }

  function getSvgPoint(e: PointerEvent): { x: number, y: number } {
    const svg = (e.target as SVGAElement).ownerSVGElement;
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

  const onPointerDown = (e: PointerEvent, i: number) => {
    const pt = getSvgPoint(e);
    dragInfo.current = {
      i,
      offsetX: nodes[i].x - pt.x,
      offsetY: nodes[i].y - pt.y
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragInfo.current) return;
    const { i, offsetX, offsetY } = dragInfo.current;
    const pt = getSvgPoint(e);
    const nx = Math.max(Math.min(Math.round((pt.x + offsetX) * 5) / 5, x0 + width), x0);
    const ny = Math.max(Math.min(Math.round((pt.y + offsetY) * 5) / 5, y0 + height), y0);
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
    <div class="svg-wrap">
      <svg viewBox={`${x0} ${y0} ${width} ${height}`} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="3.5" refY="2.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L5,2.5 L0,5 z" fill="#cccccc" />
          </marker>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.12" />
          </filter>
        </defs>
        <g>
          {nodes.map((n: any, i: number) => (
            <g key={n.id} onPointerDown={e => onPointerDown(e, i)}>
              <circle cx={n.x} cy={n.y} r={5}
                fill={"#444444"}
                stroke="#fff"
                stroke-width="1"
                filter="url(#shadow)"
                style="cursor:grab" />
            </g>
          ))}
        </g>
        <g>
          {nodes.map((n: any, i: number) => {
            if (i == 0) return null;
            const prev = nodes[i - 1];
            return make_arrow(prev, n, 5);
          })}
        </g>
        <g>
          <circle style="pointer-events: none;" cx={status.pos[0]} cy={status.pos[1]} r={5}
            fill={"#ff3322"}
            stroke="#fff"
            stroke-width="1"
            filter="url(#shadow)" />
        </g>
      </svg>
    </div>
  );
}
