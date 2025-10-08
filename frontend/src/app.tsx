import { useEffect, useRef, useState, type Dispatch, type StateUpdater } from 'preact/hooks';

import { SvgWrap } from './svg_wrap.tsx';
import { Trajetoria } from './trajetoria.tsx';
import { Manual } from './manual.tsx';
import { Settings } from './settings.tsx';

import { socket } from './socket.tsx';
import { type TrajetoriaNode, CommandType, type Status } from './types.tsx';
import './app.css'
import { TrajetoriaContext } from './trajetoria_context.tsx';
import { PositionDisplay } from './position_diplay.tsx';

export function App() {
  const [tab, setTab] = useState<number>(0);
  const [encoder_ip, setEncoder_ip] = useState<string>('rpi5-00.local');

  const [nodes, setNodes] = useState<Array<TrajetoriaNode>>(JSON.parse(localStorage.getItem("nodes") || "[]"));
  const [nextId, setNextId] = useState<number>(Math.max(...nodes.map(n => n.id)) + 1);
  const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const is_dirty = useRef<boolean>(true);

  const setNodesStorage: Dispatch<StateUpdater<TrajetoriaNode[]>> = value => {
    const next_ns = value instanceof Function ? value(nodes) : value;
    next_ns[0].command.type = CommandType.Iniciar;

    localStorage.setItem('nodes', JSON.stringify(next_ns));
    setNodes(next_ns);
  };

  const getNextNodeId = () => {
    const id = nextId;
    setNextId(prev => prev + 1);
    return id;
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
    socket.on("status", (value: Status) => setStatus(({ ...value, connected: true })));
    socket.on("connect", () => setStatus(prev => ({ ...prev, connected: true })));
    socket.on("disconnect", () => setStatus(prev => ({ ...prev, connected: false })));

    return () => {
      socket.off("status");
      socket.off("connect");
      socket.off("disconnect");
    };
  });

  return (
    <TrajetoriaContext.Provider value={{ nodes, setNodes: setNodesStorage, getNextNodeId, encoder_ip, setEncoder_ip }}>
      <div className="wrap">
        <div className="panel">
          <div className="tabs">
            <button className={tab == 0 ? "selected" : ""} onClick={() => setTab(0)}> Trajetória </button>
            <button className={tab == 1 ? "selected" : ""} onClick={() => setTab(1)}> Controle Manual </button>
            <button className={tab == 2 ? "selected" : ""} onClick={() => setTab(2)}> <i className={tab == 2 ? "bi bi-gear" : "bi bi-gear-fill"}></i> </button>
          </div>
          {
            tab == 0 ?
              <Trajetoria is_dirty={is_dirty} status={status} offset={offset} setOffset={setOffset} bounds={bounds} /> :
              tab == 1 ?
                <Manual status={status} /> :
                tab == 2 ?
                  <Settings /> :
                  null
          }
        </div>
        <SvgWrap is_dirty={is_dirty} status={status} offset={offset} bounds={bounds} />
      </div>
      <PositionDisplay pos={status.pos} />
    </TrajetoriaContext.Provider>
  )
}
