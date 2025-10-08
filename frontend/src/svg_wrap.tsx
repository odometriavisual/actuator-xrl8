import { useRef } from "preact/hooks";

import { CommandType, find_last_movement_node_before, type Bounds, type Status, type TrajetoriaNode } from './types.tsx';
import './svg_wrap.css'
import { useTrajetoria } from "./trajetoria_context.tsx";

type SvgWrapArgs = {
  status: Status,
  offset: { x: number, y: number },
  bounds: Bounds,
}

export function SvgWrap({ status, offset, bounds }: SvgWrapArgs) {
  const dragInfo = useRef<any>(null);
  const { setIsDirty, nodes, setNodes, getNextNodeId } = useTrajetoria();

  function make_arrow(type: number, r: number, a: { x: number; y: number; }, b: { x: number; y: number; }) {
    const startX = a.x;
    const startY = a.y;
    const endX = b.x;
    const endY = b.y;

    if (type === CommandType.Arco_horario) {
      const delta2 = (endX - startX) * (endX - startX) + (endY - startY) * (endY - startY);
      const broken = delta2 > 2 * r * 2 * r;

      return (
        <path d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke={broken ? "var(--warning-color)" : "var(--on-surface-alt-color)"} stroke-width="2.5" stroke-linecap="round"
          fill="none"
          marker-end="url(#arrowhead)" opacity="0.95" />
      );
    }
    else if (type === CommandType.Arco_antihorario) {
      const delta2 = (endX - startX) * (endX - startX) + (endY - startY) * (endY - startY);
      const broken = delta2 > 2 * r * 2 * r;

      return (
        <path d={`M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`}
          stroke={broken ? "var(--warning-color)" : "var(--on-surface-alt-color)"} stroke-width="2.5" stroke-linecap="round"
          fill="none"
          marker-end="url(#arrowhead)" opacity="0.95" />
      );
    }

    return (
      <line x1={startX} y1={startY} x2={endX} y2={endY}
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
    const move_nodes = nodes.filter(n => CommandType.is_movement(n.command.type));
    const last = move_nodes[move_nodes.length - 1] || { s: 50 };
    const nx = Math.max(Math.min(Math.round((pt.x - offset.x) * 5) / 5, bounds.x0 + bounds.width), bounds.x0) - offset.x;
    const ny = Math.max(Math.min(Math.round((pt.y - offset.y) * 5) / 5, bounds.y0 + bounds.height), bounds.y0) - offset.y;

    let next = { id: getNextNodeId(), command: { type: CommandType.Linear, x: nx, y: ny, s: last.command.s, p: 1000, r: 100, f: 10, e: 500, str: "" } };

    setNodes(prev => [...prev, next]);
    setIsDirty(true);
  };


  const onPointerDown = (e: PointerEvent, i: number) => {
    const pt = getSvgPoint(e);
    dragInfo.current = {
      i,
      offsetX: nodes[i].command.x + offset.x - pt.x,
      offsetY: nodes[i].command.y + offset.y - pt.y
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragInfo.current) return;
    const { i, offsetX, offsetY } = dragInfo.current;
    const pt = getSvgPoint(e);
    const nx = Math.max(Math.min(Math.round((pt.x + offsetX) * 5) / 5, bounds.x0 + bounds.width), bounds.x0) - offset.x;
    const ny = Math.max(Math.min(Math.round((pt.y + offsetY) * 5) / 5, bounds.y0 + bounds.height), bounds.y0) - offset.y;

    setNodes((ns: TrajetoriaNode[]) => {
      const copy = [...ns];
      const command_type = copy[i].command.type;

      if (command_type === CommandType.Arco_horario || command_type === CommandType.Arco_antihorario) {
        const { command: { x, y } } = find_last_movement_node_before(i, copy);
        const min_r = Math.ceil(Math.sqrt(Math.pow(nx - x, 2) + Math.pow(ny - y, 2)) * 500 / 2) / 500;
        copy[i].command.x = nx;
        copy[i].command.y = ny;
        copy[i].command.r = min_r;
      }
      else {
        copy[i].command.x = nx;
        copy[i].command.y = ny;
      }

      setIsDirty(true);
      return copy;
    });
  };

  const onPointerUp = () => {
    dragInfo.current = null;
  };

  const move_nodes = nodes.map((n: any, i: number) => [n, i]).filter(a => CommandType.is_movement(a[0].command.type));

  return (
    <div className="svg-wrap">
      <svg viewBox={`${bounds.x0} ${bounds.y0} ${bounds.width} ${bounds.height}`} onDblClick={onDoubleClick} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5.5" refY="2.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L5,2.5 L0,5 z" fill="var(--on-surface-alt-color)" />
          </marker>
          <filter id="shadow" x="-50%" y="-50%" width="250%" height="250%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.12" />
          </filter>
        </defs>
        <g>
          {
            move_nodes.map((a: any, i0: number) => {
              const [n, i] = a;

              if (i == 0) return null;
              const prev = nodes[move_nodes[i0 - 1][1]];
              return make_arrow(
                n.command.type,
                n.command.r,
                { ...prev, x: prev.command.x + offset.x, y: prev.command.y + offset.y },
                { x: n.command.x + offset.x, y: n.command.y + offset.y },
              );
            })}
        </g>
        <g>
          {move_nodes.map((n: any) => (
            <g key={n[0].id} onPointerDown={e => onPointerDown(e, n[1])}>
              <circle cx={n[0].command.x + offset.x} cy={n[0].command.y + offset.y} r={4.5}
                fill="var(--on-surface-color)"
                filter="url(#shadow)"
                style="cursor:grab" />
            </g>
          ))}
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
