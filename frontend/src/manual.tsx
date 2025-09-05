import { useState } from 'preact/hooks';
import "bootstrap-icons/font/bootstrap-icons.css"

import { socket } from './socket';
import type { Status } from './types.tsx';
import './manual.css'

type ManualParams = {
  status: Status
};

export function Manual({ status }: ManualParams) {
  const [stepSize, setStepSize] = useState<number>(1);

  function home() {
    socket.emit("gcode", "G28")
  }

  function left() {
    const x = status.pos[0] - stepSize;
    const y = status.pos[1];
    socket.emit("gcode", `G0 X${x} Y${y}`)
  }

  function right() {
    const x = status.pos[0] + stepSize;
    const y = status.pos[1];
    socket.emit("gcode", `G0 X${x} Y${y}`)
  }

  function up() {
    const x = status.pos[0];
    const y = status.pos[1] - stepSize;
    socket.emit("gcode", `G0 X${x} Y${y}`)
  }

  function down() {
    const x = status.pos[0];
    const y = status.pos[1] + stepSize;
    socket.emit("gcode", `G0 X${x} Y${y}`)
  }

  return (
    <>
      <div className="manual-wrap">
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={up}> ^ </button>
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={left}> {"<"} </button>
        <button disabled={!status.connected || status.running} onClick={home}> <i class="home bi bi-house-fill"></i> </button>
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={right}> {">"} </button>
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={down}> V </button>
      </div>
      <fieldset className="manual-controls">
        <div>
          <input type="radio" id="1" name="step-size" value="1" checked={stepSize === 1} onClick={() => setStepSize(1)} />
          <label for="1">x1</label>
        </div>
        <div>
          <input type="radio" id="10" name="step-size" value="10" checked={stepSize === 10} onClick={() => setStepSize(10)} />
          <label for="10">x10</label>
        </div>
        <div>
          <input type="radio" id="100" name="step-size" value="100" checked={stepSize === 100} onClick={() => setStepSize(100)} />
          <label for="100">x100</label>
        </div>
      </fieldset>
    </>
  );
}
