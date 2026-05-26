import { useEffect, useState, type Dispatch, type StateUpdater } from 'preact/hooks';

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
  const [encoder_host, setEncoder_host] = useState<string>("virtual-encoder.local");

  const [nodes, setNodes] = useState<Array<TrajetoriaNode>>(JSON.parse(localStorage.getItem("nodes") || "[]"));
  const [nextId, setNextId] = useState<number>(Math.max(...nodes.map(n => n.id)) + 1);
  const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [is_dirty, setIsDirty] = useState<boolean>(true);

  const [stepSize, setStepSize] = useState<number>(1);
  const [target, setTarget] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const setStepSizeRound: Dispatch<StateUpdater<number>> = s => {
    const next_s = s instanceof Function ? s(stepSize) : s;
    setStepSize(Math.round(next_s * 5) / 5);
  };

  const setTargetRound: Dispatch<StateUpdater<{ x: number, y: number }>> = t => {
    const next_target = t instanceof Function ? t(target) : t;

    const x = Math.round(next_target.x * 5) / 5
    const y = Math.round(next_target.y * 5) / 5
    setTarget({ x, y });
  };

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
    connected: true,
    running: false,
    gcode_loaded: false,
    pos: [0, 0],
    calibrated: false
  });

  useEffect(() => {
    const t = setTimeout(() => setStatus(prev => ({ ...prev, connected: false })), 3000);

    socket.on("status", (value: Status) => setStatus(({ ...value, connected: true })));
    socket.on("disconnect", () => setStatus(prev => ({ ...prev, connected: false })));

    socket.on("connect", () => {
      clearTimeout(t);
      setStatus(prev => ({ ...prev, connected: true }))
    });

    socket.on("encoder_host", (value: string) => {
        setEncoder_host(value);
    });

    return () => {
      socket.off("status");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);


  return (
    <TrajetoriaContext.Provider value={{ is_dirty, setIsDirty, nodes, setNodes: setNodesStorage, getNextNodeId, encoder_host, setEncoder_host }}>
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
            <button className={tab == 2 ? "selected" : ""} onClick={() => setTab(2)}> <i className={tab == 2 ? "bi bi-gear" : "bi bi-gear-fill"}></i> </button>
          </div>
          {
            tab == 0 ?
              <Trajetoria status={status} offset={offset} setOffset={setOffset} bounds={bounds} /> :
              tab == 1 ?
                <Manual status={status} stepSize={stepSize} setStepSize={setStepSizeRound} target={target} setTarget={setTargetRound} /> :
                tab == 2 ?
                  <Settings /> :
                  null
          }
        </div>
        <SvgWrap status={status} offset={offset} bounds={bounds} />

        <PositionDisplay pos={status.pos} />
      </div>
    </TrajetoriaContext.Provider>
  )
}
