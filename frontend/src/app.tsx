import { useEffect, useRef, useState } from 'preact/hooks';

import { SvgWrap } from './svg_wrap.tsx';
import { Trajetoria } from './trajetoria.tsx';

import './app.css'
import { socket } from './socket.tsx';

export type TrajetoriaNode = { id: number, x: number, y: number, s: number, command: number };
export type Status = {
  running: boolean,
  gcode_loaded: boolean,
  pos: Array<number>,
  calibrated: boolean,
}

export function App() {
  const [tab, setTab] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);

  const [nodes, setNodes] = useState<Array<TrajetoriaNode>>([]);
  const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const is_dirty = useRef<boolean>(true);

  const [status, setStatus] = useState<Status>({
    running: false,
    gcode_loaded: false,
    pos: [0, 0],
    calibrated: false
  });

  useEffect(() => {
    socket.on("status", (value: Status) => {
      setStatus({ ...value });
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.off("status");
      socket.off("connect");
      socket.off("disconnect");
    };
  });

  return (
    <div class="wrap">
      {connected ? null :
        <div class="modal-wrap">
          <div class="modal-connect">
            <span>Erro ao conectar-se com o atuador, tentando novamente...</span>
            <div class="loader"></div>
          </div>
        </div>
      }
      <>
        <div class="panel">
          <div class="tabs">
            <div class={tab == 0 ? "selected" : ""} onClick={() => setTab(0)}> Trajetória </div>
            <div class={tab == 1 ? "selected" : ""} onClick={() => setTab(1)}> Controle </div>
          </div>
          {tab == 0 ?
            <Trajetoria nodes={nodes} setNodes={setNodes} is_dirty={is_dirty} status={status} offset={offset} setOffset={setOffset} /> :
            null
          }
        </div>
        <SvgWrap nodes={nodes} setNodes={setNodes} is_dirty={is_dirty} status={status} offset={offset} />
      </>
      :
    </div>
  )
}
