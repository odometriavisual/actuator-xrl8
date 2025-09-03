import { useRef, type Dispatch, type MutableRef, type StateUpdater } from 'preact/hooks'
import "bootstrap-icons/font/bootstrap-icons.css"

import { socket } from './socket.tsx'
import { CommandType, type Bounds, type Status, type TrajetoriaNode } from './app.tsx'
import './trajetoria.css'

type TrajetoriaArgs = {
  nodes: Array<TrajetoriaNode>,
  setNodes: Dispatch<StateUpdater<TrajetoriaNode[]>>,
  nextId: number,
  setNextId: Dispatch<StateUpdater<number>>,
  is_dirty: MutableRef<boolean>,
  status: Status,
  offset: { x: number, y: number },
  setOffset: Dispatch<StateUpdater<{ x: number, y: number }>>,
  bounds: Bounds,
}

function CommandArgsRow({ n, i, update_node }: { n: TrajetoriaNode, i: number, update_node: any }) {
  switch (n.command.type) {
    case CommandType.Linear:
      return (
        <>
          <div> <input type="number" step="0.2" value={n.command.x} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, x: parseFloat(e.target.value) } })} /> </div>
          <div> <input type="number" step="0.2" value={n.command.y} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, y: parseFloat(e.target.value) } })} /> </div>
          {i === 0 ?
            <div> <input disabled type="text" value="N/A" /></div> :
            <div> <input type="number" step="1" value={n.command.s} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, s: parseFloat(e.target.value) } })} /> </div>
          }
        </>
      );
    case CommandType.Arco_horario:
      return (
        <>
          <div> <input type="number" step="0.2" value={n.command.x} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, x: parseFloat(e.target.value) } })} /> </div>
          <div> <input type="number" step="0.2" value={n.command.y} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, y: parseFloat(e.target.value) } })} /> </div>
          <div> <input type="number" step="0.2" value={n.command.r} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, r: parseFloat(e.target.value) } })} /> </div>
          {i === 0 ?
            <div> <input disabled type="text" value="N/A" /></div> :
            <div> <input type="number" step="1" value={n.command.s} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, s: parseFloat(e.target.value) } })} /> </div>
          }
        </>
      );
    case CommandType.Arco_antihorario:
      return (
        <>
          <div> <input type="number" step="0.2" value={n.command.x} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, x: parseFloat(e.target.value) } })} /> </div>
          <div> <input type="number" step="0.2" value={n.command.y} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, y: parseFloat(e.target.value) } })} /> </div>
          <div> <input type="number" step="0.2" value={n.command.r} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, r: parseFloat(e.target.value) } })} /> </div>
          {i === 0 ?
            <div> <input disabled type="text" value="N/A" /></div> :
            <div> <input type="number" step="1" value={n.command.s} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, s: parseFloat(e.target.value) } })} /> </div>
          }
        </>
      );
    case CommandType.Sleep:
      return (
        <div>
          <input type="number" min="0" step="1" value={n.command.p} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, p: parseInt(e.target.value) } })} />
        </div>
      );
  }
}


export function Trajetoria({ nodes, setNodes, nextId, setNextId, is_dirty, status, offset, setOffset, bounds }: TrajetoriaArgs) {
  const rowDragIndex = useRef<number | null>(null);

  function add_node(e: Event) {
    e.preventDefault();
    let rev_nodes = [...nodes].reverse();
    const last_args = rev_nodes.find(n => CommandType.is_movement(n.command.type))?.command || { x: 40, y: 10, s: 50 };

    let next = {
      id: nextId, command: { type: CommandType.Linear, x: last_args.x + 10, y: last_args.y + 40, s: last_args.s, p: 1000, r: 100 }
    };

    if (next.command.y > bounds.height - 50) {
      next.command.x += 40;
      next.command.y = 50;
    }
    if (next.command.x > bounds.width - 50) {
      next.command.x = 50;
    }

    setNodes(prev => {
      is_dirty.current = true;
      return [...prev, next];
    });
    setNextId(id => id + 1);
  }

  function remove_node(e: Event, i: number) {
    e.preventDefault();

    setNodes(prev => {
      const next = [...prev];
      next.splice(i, 1);

      is_dirty.current = true;
      return next;
    })
  }

  function update_node(i: number, node: any) {
    setNodes(prev => {
      let nodes = [...prev];
      nodes[i] = { ...node }

      nodes[i].command.x = Math.max(Math.min(Math.round((nodes[i].command.x) * 5) / 5, bounds.x0 + bounds.width), bounds.x0) - offset.x;
      nodes[i].command.y = Math.max(Math.min(Math.round((nodes[i].command.y) * 5) / 5, bounds.y0 + bounds.height), bounds.y0) - offset.y;

      is_dirty.current = true;
      return nodes;
    });
  }

  function send_trajetoria() {
    const gcode = nodes.map((n, i) => {
      const x = n.command.x + offset.x;
      const y = n.command.y + offset.y;

      if (i == 0) {
        return `G0 X${x} Y${y}`;
      }

      return `G1 X${x} Y${y} S${n.command.s}`;
    }).join('\n');

    socket.emit("gcode", gcode)
    is_dirty.current = false;
  }

  function home() {
    socket.emit("gcode", "G28")
    is_dirty.current = true;
  }

  function toggle_play_pause() {
    if (status.running) {
      socket.emit("pause");
    }
    else {
      socket.emit("play");
    }
  }

  function step() {
    socket.emit("step")
  }

  function onRowDragStart(e: any, i: number) {
    rowDragIndex.current = i;
    e.dataTransfer.effectAllowed = "move";
  }

  function onRowDragOver(e: any, i: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const from = rowDragIndex.current;
    if (from === null || from === i) return;
    setNodes((prev: any) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(i, 0, moved);
      rowDragIndex.current = i;
      return copy;
    });
  }

  function onRowDrop(e: Event) {
    e.preventDefault();
    rowDragIndex.current = null;
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th> Offset X </th>
            <th> Offset Y </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th> <input type="number" step="0.2" value={offset.x} onInput={(e: any) => setOffset({ x: parseFloat(e.target.value), y: offset.y })} /> </th>
            <th> <input type="number" step="0.2" value={offset.y} onInput={(e: any) => setOffset({ x: offset.x, y: parseFloat(e.target.value) })} /> </th>
          </tr>
        </tbody>
      </table>
      <div className="trajetoria">
        <div class="table">
          {
            nodes.map((n: any, i: number) => (
              <div class="trow" key={n.id}>
                <div draggable={true}
                  onDragStart={e => onRowDragStart(e, i)}
                  onDragOver={e => onRowDragOver(e, i)}
                  onDrop={onRowDrop} >
                  <i class="mv-node bi bi-list"></i>
                </div>

                <select class="command-sel" value={n.command.type} onInput={(e: any) => update_node(i, { ...n, command: { ...n.command, type: parseInt(e.target.value) } })}>
                  {i == 0 ?
                    <option value={CommandType.Linear}> Iniciar </option>
                    :
                    <>
                      <option value={CommandType.Linear}> Linear </option>
                      <option value={CommandType.Arco_horario}> Arco 1 ↷ </option>
                      <option value={CommandType.Arco_antihorario}> Arco 2 ↶ </option>
                      <option value={CommandType.Sleep}> Sleep </option>
                    </>
                  }
                </select>

                <CommandArgsRow n={n} i={i} update_node={update_node} />

                <i class="rm-node bi bi-x-circle"
                  onClick={e => remove_node(e, i)}
                  onMouseEnter={ev => (ev.target as Element).classList.replace('bi-x-circle', 'bi-x-circle-fill')}
                  onMouseLeave={ev => (ev.target as Element).classList.replace('bi-x-circle-fill', 'bi-x-circle')}></i>
              </div>
            ))
          }
        </div>
        <div className="controls">
          <button disabled={status.running} onClick={add_node} > + 1 </button>
          <button disabled={!status.connected || !status.calibrated || status.running} onClick={send_trajetoria} > Preparar trajetória </button>
          <button disabled={!status.connected || !status.calibrated || !status.gcode_loaded || is_dirty.current} onClick={toggle_play_pause}>
            {status.running ?
              <span><i class="bi bi-pause-circle"></i> Pause</span> :
              <span><i class="bi bi-play-circle"></i> Play</span>}
          </button>
          <button disabled={!status.connected || !status.calibrated || !status.gcode_loaded || is_dirty.current || status.running} onClick={step}>
            <i class="bi bi-arrow-bar-right"></i> Step
          </button>
          <button disabled={!status.connected || status.running} onClick={home}>
            <span>
              <i class="bi bi-house-fill"></i> Calibrar Home
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
