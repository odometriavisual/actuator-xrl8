import { useState } from 'preact/hooks';

import { SvgWrap } from './svg_wrap.tsx';
import { Trajetoria } from './trajetoria.tsx';

import './app.css'

type Node = {id: number, x: number, y: number, s: number, command: number};

export function App() {
  const [tab, setTab] = useState<number>(0);
  const [nodes, setNodes] = useState<Array<Node>>([]);

  return (
    <div class="wrap">
      <div class="panel">
        <div class="tabs">
          <div class={tab == 0 ? "selected" : ""} onClick={() => setTab(0)}> Trajetória </div>
          <div class={tab == 1 ? "selected" : ""} onClick={() => setTab(1)}> Controle </div>
        </div>
        { tab == 0? 
          <Trajetoria nodes={nodes} setNodes={setNodes}/> :
           null
        }
      </div>
      <SvgWrap nodes={nodes} setNodes={setNodes} />
    </div>
  )
}
