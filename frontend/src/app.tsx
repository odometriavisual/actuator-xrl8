import { useEffect, useRef, useState } from 'preact/hooks';

import { SvgWrap } from './svg_wrap.tsx';
import { Trajetoria } from './trajetoria.tsx';

import './app.css'
import { socket } from './socket.tsx';
import { Manual } from './manual.tsx';

export type TrajetoriaNode = { id: number, x: number, y: number, s: number, command: number };
export type Status = {
  connected: boolean,
  running: boolean,
  gcode_loaded: boolean,
  pos: Array<number>,
  calibrated: boolean,
}

export function App() {
  const [tab, setTab] = useState<number>(0);

  const [nodes, setNodes] = useState<Array<TrajetoriaNode>>([]);
  const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const is_dirty = useRef<boolean>(true);

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
      <div className={`toast-wrap${status.connected ? "" : " show"}`}>
        <div className="toast-connect">
          <span>Erro ao conectar-se com o atuador, tentando novamente...</span>
          <div className="loader"></div>
        </div>
      </div>
      <div className="panel">
          <div className="tabs">
            <button className={tab == 0 ? "selected" : ""} onClick={() => setTab(0)}> Trajetória </button>
            <button className={tab == 1 ? "selected" : ""} onClick={() => setTab(1)}> Controle Manual </button>
          </div>
        {
          tab == 0 ?
            <Trajetoria nodes={nodes} setNodes={setNodes} is_dirty={is_dirty} status={status} offset={offset} setOffset={setOffset} /> :
            tab == 1 ?
              <Manual status={status} /> :
              null
        }
      </div>
      <SvgWrap nodes={nodes} setNodes={setNodes} is_dirty={is_dirty} status={status} offset={offset} />
    </div>
  )
}
