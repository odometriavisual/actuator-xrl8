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
  const [target, setTarget] = useState<{x: number, y: number}>({x: 0, y: 0});

  function setTargetX(value: number) {
    value = Math.round(value*5)/5;
    setTarget(prev => {return {x: value, y: prev.y};});
  };

  function setTargetY(value: number) {
    value = Math.round(value*5)/5;
    setTarget(prev => {return {x: prev.x, y: value};});
  };

  function goto() {
    socket.emit("gcode", `G0 X${target.x} Y${target.y}`)
  }

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
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={up}>
          <i class="bi bi-arrow-up"></i>
        </button>
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={left}>
          <i class="bi bi-arrow-left"></i>
        </button>
        <button disabled={!status.connected || status.running} onClick={home}>
          <i class="home bi bi-house-fill"></i>
        </button>
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={right}>
          <i class="bi bi-arrow-right"></i>
        </button>
        <button disabled={!status.connected || !status.calibrated || status.running} onClick={down}>
          <i class="bi bi-arrow-down"></i>
        </button>
      </div>
      <label className="manual-goto">
        <input type="number" step="0.2" placeholder="x" value={target.x} onInput={(e: any) => setTargetX(parseFloat(e.target.value))}></input>
        <input type="number" step="0.2" placeholder="y" value={target.y} onInput={(e: any) => setTargetY(parseFloat(e.target.value))}></input>
        <button onInput={() => goto()}>Go to</button>
      </label>
      <fieldset className="manual-multiplier">
        <label>
          <input type="radio" id="1" name="step-size" value="1" checked={stepSize === 1} onClick={() => setStepSize(1)} />
          x1
        </label>
        <label>
          <input type="radio" id="10" name="step-size" value="10" checked={stepSize === 10} onClick={() => setStepSize(10)} />
          x10
        </label>
        <label>
          <input type="radio" id="100" name="step-size" value="100" checked={stepSize === 100} onClick={() => setStepSize(100)} />
          x100
        </label>
      </fieldset>
    </>
  );
}
