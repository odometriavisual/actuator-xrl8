import { useEffect, useRef, useState } from 'preact/hooks';

import { SvgWrap } from './svg_wrap.tsx';
import { Trajetoria } from './trajetoria.tsx';

import './app.css'
import { socket } from './socket.tsx';
import { Manual } from './manual.tsx';

export const CommandType = {
  Iniciar: -1,
  Linear: 0,
  Sleep: 1,
  Arco_horario: 2,
  Arco_antihorario: 3,
  is_movement: (n: number) => n === CommandType.Iniciar || n === CommandType.Linear || n === CommandType.Arco_horario || n == CommandType.Arco_antihorario,
}
export type CommandData = { type: number, x: number, r: number, y: number, s: number, p: number };

export type TrajetoriaNode = { id: number, command: CommandData };
export type Status = {
  connected: boolean,
  running: boolean,
  gcode_loaded: boolean,
  pos: Array<number>,
  calibrated: boolean,
}

export type Bounds = {
  x0: number,
  y0: number,
  width: number,
  height: number
}

export function App() {
  const [tab, setTab] = useState<number>(0);

  const [nodes, setNodes] = useState<Array<TrajetoriaNode>>(JSON.parse(localStorage.getItem("nodes") || "[]"));
  const [nextId, setNextId] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const is_dirty = useRef<boolean>(true);

  const setNodesStorage = (ns: any) => {
    const next_ns = ns(nodes);
    localStorage.setItem('nodes', JSON.stringify(next_ns));
    setNodes(next_ns);
  };

  const bounds = {
    x0: 0,
    y0: 0,
    width: 410,
    height: 335,
  };

  const [status, setStatus] = useState<Status>({
    connected: false,
    running: false,
    gcode_loaded: false,
    pos: [0, 0],
    calibrated: false
  });

  useEffect(() => {
    socket.on("status", (value: Status) => setStatus({ ...value, connected: true }));
    socket.on("connect", () => setStatus(prev => ({ ...prev, connected: true })));
    socket.on("disconnect", () => setStatus(prev => ({ ...prev, connected: false })));

    return () => {
      socket.off("status");
      socket.off("connect");
      socket.off("disconnect");
    };
  });

  return (
    <div className="wrap">
      <div className="panel">
        <div className="tabs">
          <button className={tab == 0 ? "selected" : ""} onClick={() => setTab(0)}> Trajetória </button>
          <button className={tab == 1 ? "selected" : ""} onClick={() => setTab(1)}> Controle Manual </button>
        </div>
        {
          tab == 0 ?
            <Trajetoria nodes={nodes} setNodes={setNodesStorage} nextId={nextId} setNextId={setNextId} is_dirty={is_dirty} status={status} offset={offset} setOffset={setOffset} bounds={bounds} /> :
            tab == 1 ?
              <Manual status={status} /> :
              null
        }
      </div>
      <SvgWrap nodes={nodes} setNodes={setNodesStorage} nextId={nextId} setNextId={setNextId} is_dirty={is_dirty} status={status} offset={offset} bounds={bounds} />
    </div>
  )
}
