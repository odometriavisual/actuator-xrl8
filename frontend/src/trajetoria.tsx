import { useRef, useState, type Dispatch, type MutableRef, type StateUpdater } from 'preact/hooks'

import { socket } from './socket.tsx'
import type { Status, TrajetoriaNode } from './app.tsx'
import './trajetoria.css'

type TrajetoriaArgs = {
  nodes: Array<TrajetoriaNode>,
  setNodes: Dispatch<StateUpdater<TrajetoriaNode[]>>,
  is_dirty: MutableRef<boolean>,
  status: Status,
}

export function Trajetoria({ nodes, setNodes, is_dirty, status }: TrajetoriaArgs) {
  const [nextId, setNextId] = useState<number>(0);
  const rowDragIndex = useRef<number | null>(null);

  function addNode(e: Event) {
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

  function removeNode(e: Event, i: number) {
    e.preventDefault();

    setNodes(prev => {
      const next = [...prev];
      next.splice(i, 1);

      is_dirty.current = true;
      return next;
    })
  }

  function updateNode(i: number, node: any) {
    setNodes(prev => {
      let nodes = [...prev];
      nodes[i] = { ...node }

      is_dirty.current = true;
      return nodes;
    });
  }

  function send_gcode() {
    const gcode = nodes.map((n, i) => {
      if (i == 0) {
        return `G28\nG0 X${n.x} Y${n.y}`;
      }

      return `G1 X${n.x} Y${n.y} S${n.s}`;
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
      if (is_dirty.current) {
        alert('A trajetória foi alterada. Começando nova trajetória...')
        send_gcode();
      }
      else if (!status.gcode_loaded) {
        send_gcode();
      }
      socket.emit("play");
    }
  }

  function step() {
    if (is_dirty.current) {
      alert('A trajetória foi alterada. Começando nova trajetória...')
      send_gcode();
    }
    else if (!status.gcode_loaded) {
      send_gcode();
    }
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
                <th> <input type="number" step="0.2" value={n.x} onInput={(e: any) => updateNode(i, { ...n, x: parseFloat(e.target.value) })} /> </th>
                <th> <input type="number" step="0.2" value={n.y} onInput={(e: any) => updateNode(i, { ...n, y: parseFloat(e.target.value) })} /> </th>
                {i === nodes.length - 1 ?
                  <th> <input disabled type="text" value="N/A" /></th> :
                  <th> <input type="number" step="1" value={n.s} onInput={(e: any) => updateNode(i, { ...n, s: parseFloat(e.target.value) })} /> </th>
                }
                <th onClick={e => removeNode(e, i)}> [X] </th>
                <th>
                  <select value={n.command} onInput={(e: any) => updateNode(i, { ...n, command: e.target.command })}>
                    <option value="1"> Iniciar aquisição </option>
                    <option value="2"> Parar aquisição </option>
                  </select>
                </th>
              </tr>
            ))
          }
        </tbody>
      </table>
      <button onClick={addNode}> + </button>
      <button onClick={toggle_play_pause}> Pause/Play </button>
      <button onClick={step}> Step </button>
      <button onClick={home}> Home </button>
    </div>
  )
}
