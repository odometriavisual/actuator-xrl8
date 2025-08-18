import { useRef, useState } from 'preact/hooks'

import './trajetoria.css'

export function Trajetoria({ nodes, setNodes }: any) {
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

    setNodes([...nodes, next]);
    setNextId(id => id + 1);
  }

  function removeNode(e: Event, i: number) {
    e.preventDefault();

    setNodes((prev: any) => {
      const next = [...prev];
      next.splice(i, 1);
      return next;
    })
  }

  function updateNode(i: number, node: any) {
    setNodes((prev: any) => {
      let nodes = [...prev];
      nodes[i] = { ...node }
      return nodes;
    });
  }

  function generateGcode() {
    const gcode = nodes.map((n: any, i: number) => {
      if (i == 0) {
        return `G28\nG0 X${n.x} Y${n.y}`;
      }

      return `G1 X${n.x} Y${n.y} S${n.s}`;
    }).join('\n');

    console.log(gcode);
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
                {i === nodes.length-1?
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
      <button onClick={generateGcode}> Step </button>
      <button onClick={generateGcode}> Pause/Play </button>
      <button onClick={generateGcode}> Stop </button>
      <button onClick={generateGcode}> Start </button>
    </div>
  )
}
