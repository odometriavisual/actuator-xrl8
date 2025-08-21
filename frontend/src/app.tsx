import { useEffect, useRef, useState } from 'preact/hooks';

import { SvgWrap } from './svg_wrap.tsx';
import { Trajetoria } from './trajetoria.tsx';

import './app.css'
import { socket } from './socket.tsx';

export type TrajetoriaNode = { id: number, x: number, y: number, s: number, command: number };
export type Status = {
  running: boolean,
  gcode_loaded: boolean,
  pos: Array<number>
}

export function App() {
  const [tab, setTab] = useState<number>(0);

  const [nodes, setNodes] = useState<Array<TrajetoriaNode>>([]);
  const is_dirty = useRef<boolean>(true);

  const [status, setStatus] = useState<Status>({
    running: false,
    gcode_loaded: false,
    pos: [0, 0]
  });

  useEffect(() => {
    socket.on("status", (value: Status) => {
      setStatus({ ...value });
    });

    return () => {
      socket.off("status");
    };
  });

  return (
    <div class="wrap">
      <div class="panel">
        <div class="tabs">
          <div class={tab == 0 ? "selected" : ""} onClick={() => setTab(0)}> Trajetória </div>
          <div class={tab == 1 ? "selected" : ""} onClick={() => setTab(1)}> Controle </div>
        </div>
        {tab == 0 ?
          <Trajetoria nodes={nodes} setNodes={setNodes} is_dirty={is_dirty} status={status} /> :
          null
        }
      </div>
      <SvgWrap nodes={nodes} setNodes={setNodes} is_dirty={is_dirty} status={status} />
    </div>
  )
}
