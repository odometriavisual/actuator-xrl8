import { useRef, useState, type Dispatch, type MutableRef, type StateUpdater } from 'preact/hooks'

import { socket } from './socket.tsx'
import type { Status, TrajetoriaNode } from './app.tsx'
import './trajetoria.css'

type TrajetoriaArgs = {
  nodes: Array<TrajetoriaNode>,
  setNodes: Dispatch<StateUpdater<TrajetoriaNode[]>>,
  is_dirty: MutableRef<boolean>,
  status: Status,
  offset: { x: number, y: number },
  setOffset: Dispatch<StateUpdater<{ x: number, y: number }>>,
}

export function Trajetoria({ nodes, setNodes, is_dirty, status, offset, setOffset }: TrajetoriaArgs) {
  const [nextId, setNextId] = useState<number>(0);
  const rowDragIndex = useRef<number | null>(null);

  function add_node(e: Event) {
    e.preventDefault();
    const last = nodes[nodes.length - 1] || { x: 40, y: 10 };

    let next = { id: nextId, x: last.x + 10, y: last.y + 40, s: 1, command: 0 }

    if (next.y > 550) {
      next.x += 40;
      next.y = 50;
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

      is_dirty.current = true;
      return nodes;
    });
  }

  function send_trajetoria() {
    const gcode = nodes.map((n, i) => {
      const x = n.x + offset.x;
      const y = n.y + offset.y;

      if (i == 0) {
        return `G0 X${x} Y${y}`;
      }

      return `G1 X${x} Y${y} S${n.s}`;
    }).join('\n');

    socket.emit("gcode", gcode)
    is_dirty.current = false;
  }

  function home() {
    socket.emit("gcode", "G28")
    socket.emit("play")
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
            <th> <input type="number" step="0.2" value={offset.x} onInput={(e: any) => setOffset({x: parseFloat(e.target.value), y: offset.y})} /> </th>
            <th> <input type="number" step="0.2" value={offset.y} onInput={(e: any) => setOffset({x: offset.x, y: parseFloat(e.target.value)})} /> </th>
          </tr>
        </tbody>
      </table>
      <div class="trajetoria">
        <table>
          <thead>
            <tr>
              <th>  </th>
              <th> X </th>
              <th> Y </th>
              <th> Velocidade </th>
            </tr>
          </thead>
          <tbody>
            {
              nodes.map((n: any, i: number) => (
                <tr key={n.id}>
                  <th draggable={true}
                    onDragStart={e => onRowDragStart(e, i)}
                    onDragOver={e => onRowDragOver(e, i)}
                    onDrop={onRowDrop} >
                    # </th>
                  <th> <input type="number" step="0.2" value={n.x} onInput={(e: any) => update_node(i, { ...n, x: parseFloat(e.target.value) })} /> </th>
                  <th> <input type="number" step="0.2" value={n.y} onInput={(e: any) => update_node(i, { ...n, y: parseFloat(e.target.value) })} /> </th>
                  {i === nodes.length - 1 ?
                    <th> <input disabled type="text" value="N/A" /></th> :
                    <th> <input type="number" step="1" value={n.s} onInput={(e: any) => update_node(i, { ...n, s: parseFloat(e.target.value) })} /> </th>
                  }
                  <th onClick={e => remove_node(e, i)}> [X] </th>
                  <th>
                    <select value={n.command} onInput={(e: any) => update_node(i, { ...n, command: e.target.command })}>
                      <option value="1"> Iniciar aquisição </option>
                      <option value="2"> Parar aquisição </option>
                    </select>
                  </th>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div class="controls">
          <button disabled={status.running} onClick={add_node} > + 1 </button>
          <button disabled={!status.calibrated || status.running} onClick={send_trajetoria} > Preparar trajetória </button>
          <button disabled={!status.calibrated || !status.gcode_loaded || is_dirty.current} onClick={toggle_play_pause}>
            {status.running ? "Pause" : "Play"}
          </button>
          <button disabled={!status.calibrated || !status.gcode_loaded || is_dirty.current || status.running} onClick={step}> Step </button>
          <button disabled={status.running} onClick={home}> Calibrar Home </button>
        </div>
      </div>
    </>
  )
}
