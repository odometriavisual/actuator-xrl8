import { useRef, type Dispatch, type MutableRef, type StateUpdater } from 'preact/hooks'
import "bootstrap-icons/font/bootstrap-icons.css"

import { socket } from './socket.tsx'
import { CommandType, find_last_movement_node_before, type Bounds, type Status, type TrajetoriaNode } from './types.tsx'
import './trajetoria.css'
import { useTrajetoria } from './trajetoria_context.tsx'

type TrajetoriaArgs = {
  is_dirty: MutableRef<boolean>,
  status: Status,
  offset: { x: number, y: number },
  setOffset: Dispatch<StateUpdater<{ x: number, y: number }>>,
  bounds: Bounds,
}

function CommandArgs({ n, i, nodes, update_node }: { n: TrajetoriaNode, i: number, nodes: TrajetoriaNode[], update_node: any }) {
  const update_x = (value: number) => update_node(i, { ...n, command: { ...n.command, x: value } });
  const update_y = (value: number) => update_node(i, { ...n, command: { ...n.command, y: value } });
  const update_s = (value: number) => update_node(i, { ...n, command: { ...n.command, s: value } });
  const update_p = (value: number) => update_node(i, { ...n, command: { ...n.command, p: value } });
  const update_f = (value: number) => update_node(i, { ...n, command: { ...n.command, f: value } });
  const update_e = (value: number) => update_node(i, { ...n, command: { ...n.command, e: value } });
  const update_str = (value: number) => update_node(i, { ...n, command: { ...n.command, str: value } });

  const update_r = (value: number) => {
    const last_move_node = find_last_movement_node_before(i, nodes);

    if (last_move_node !== null) {
      const { x, y } = last_move_node.command;
      const nx = n.command.x;
      const ny = n.command.y;

      if (value < 0.0001) {
        const min_r = Math.ceil(Math.sqrt(Math.pow(nx - x, 2) + Math.pow(ny - y, 2)) * 500 / 2) / 500;
        value = min_r;
      }

      update_node(i, { ...n, command: { ...n.command, r: value } });
    }
    else {
      update_node(i, { ...n, command: { ...n.command, r: value } });
    }
  };

  switch (n.command.type) {
    case CommandType.Iniciar:
      return (
        <>
          <label> <input type="number" step="0.2" value={n.command.x} onInput={(e: any) => update_x(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="0.2" value={n.command.y} onInput={(e: any) => update_y(parseFloat(e.target.value))} /> </label>
        </>
      );

    case CommandType.Linear:
      return (
        <>
          <label> <input type="number" step="0.2" value={n.command.x} onInput={(e: any) => update_x(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="0.2" value={n.command.y} onInput={(e: any) => update_y(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="1" value={n.command.s} onInput={(e: any) => update_s(parseFloat(e.target.value))} /> </label>
        </>
      );
    case CommandType.Arco_horario:
      return (
        <>
          <label> <input type="number" step="0.2" value={n.command.x} onInput={(e: any) => update_x(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="0.2" value={n.command.y} onInput={(e: any) => update_y(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="1" value={n.command.s} onInput={(e: any) => update_s(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="0.2" value={n.command.r} onInput={(e: any) => update_r(parseFloat(e.target.value))} /> </label>
        </>
      );
    case CommandType.Arco_antihorario:
      return (
        <>
          <label> <input type="number" step="0.2" value={n.command.x} onInput={(e: any) => update_x(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="0.2" value={n.command.y} onInput={(e: any) => update_y(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="1" value={n.command.s} onInput={(e: any) => update_s(parseFloat(e.target.value))} /> </label>
          <label> <input type="number" step="0.2" value={n.command.r} onInput={(e: any) => update_r(parseFloat(e.target.value))} /> </label>
        </>
      );
    case CommandType.Sleep:
      return (
        <label> <input type="number" min="0" step="1" value={n.command.p} onInput={(e: any) => update_p(parseInt(e.target.value))} /> </label>
      );
    case CommandType.Start_acquisition:
      return (
        <>
          <label> <input type="number" step="0.1" value={n.command.f} onInput={(e: any) => update_f(parseFloat(e.target.value))} /> </label>
          <label> <input type="text" value={n.command.str} onInput={(e: any) => update_str(e.target.value)} /> </label>
        </>
      );
    case CommandType.Stop_acquisition:
      return null;
    case CommandType.Start_stream:
      return null;
    case CommandType.Stop_stream:
      return null;
    case CommandType.Set_exposure:
      return (
        <>
          <label> <input type="number" step="0.1" value={n.command.e} onInput={(e: any) => update_e(parseFloat(e.target.value))} /> </label>
        </>
      );
  }
}


export function Trajetoria({ is_dirty, status, offset, setOffset, bounds }: TrajetoriaArgs) {
  const rowDragIndex = useRef<number | null>(null);
  const { nodes, setNodes, getNextNodeId } = useTrajetoria();

  function add_node(e: Event) {
    e.preventDefault();
    let rev_nodes = [...nodes].reverse();
    const last_args = rev_nodes.find(n => CommandType.is_movement(n.command.type))?.command || { x: 40, y: 10, s: 50 };

    let next = {
      id: getNextNodeId(), command: { type: CommandType.Linear, x: last_args.x + 10, y: last_args.y + 40, s: last_args.s, p: 1000, r: 100, f: 10, str: "", e: 500 }
    };

    if (next.command.y > bounds.height - 50) {
      next.command.x += 40;
      next.command.y = 50;
    }
    if (next.command.x > bounds.width - 50) {
      next.command.x = 50;
    }

    if (nodes.length === 0) {
      next.command.type = CommandType.Iniciar;
    }

    setNodes(prev => {
      is_dirty.current = true;
      return [...prev, next];
    });
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
    const gcode = nodes.map(n => {
      const x = n.command.x + offset.x;
      const y = n.command.y + offset.y;

      switch (n.command.type) {
        case CommandType.Iniciar:
          return `G0 X${x} Y${y}`;

        case CommandType.Linear:
          return `G1 X${x} Y${y} S${n.command.s}`;

        case CommandType.Arco_horario:
          return `G2 X${x} Y${y} S${n.command.s} R${n.command.r}`;

        case CommandType.Arco_antihorario:
          return `G3 X${x} Y${y} S${n.command.s} R${n.command.r}`;

        case CommandType.Sleep:
          return `G4 P${n.command.p}`;

        case CommandType.Start_acquisition:
          return `M1000 F${n.command.f} "${n.command.str}"`;

        case CommandType.Stop_acquisition:
          return `M1001`;

        case CommandType.Start_stream:
          return `M1002`;

        case CommandType.Stop_stream:
          return `M1003`;

        case CommandType.Set_exposure:
          return `M1004 E${n.command.e}`;
      }

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
    setNodes(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);

      if (i === 0) {
        copy[i].command.type = moved.command.type;
        moved.command.type = CommandType.Iniciar;
      }
      else if (rowDragIndex.current === 0) {
        moved.command.type = copy[i - 1].command.type;
      }

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
          <div class="trow">
            <div></div>
            <div>Comando</div>
            <div>X (mm) <br /> T (ms)</div>
            <div>Y (mm)</div>
            <div>Speed (mm/s)</div>
            <div>Raio (mm)</div>
          </div>
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
                    <option value={CommandType.Iniciar}> Iniciar </option>
                    :
                    <>
                      <optgroup label="Movimento">
                        <option value={CommandType.Linear}> Linear </option>
                        <option value={CommandType.Arco_horario}> Arco 1 ↷ </option>
                        <option value={CommandType.Arco_antihorario}> Arco 2 ↶ </option>
                        <option value={CommandType.Sleep}> Sleep </option>
                      </optgroup>
                      <hr/>
                      <optgroup label="Encoder Virtual">
                        <option value={CommandType.Start_acquisition}> Iniciar Aquisição </option>
                        <option value={CommandType.Stop_acquisition}> Parar Aquisição </option>
                        <option value={CommandType.Set_exposure}> Setar Exposição </option>
                        <option value={CommandType.Start_stream}> Iniciar Stream </option>
                        <option value={CommandType.Stop_stream}> Parar Stream </option>
                      </optgroup>
                    </>
                  }
                </select>

                <CommandArgs n={n} i={i} nodes={nodes} update_node={update_node} />

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
          <button disabled={!status.running && (!status.connected || !status.calibrated || !status.gcode_loaded || is_dirty.current)} onClick={toggle_play_pause}>
            {status.running ?
              <span><i class="bi bi-pause-circle"></i> Pause</span> :
              <span><i class="bi bi-play-circle"></i> Play</span>
            }
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
