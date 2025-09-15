import { useTrajetoria } from "./trajetoria_context";

import './settings.css'

export function Settings() {
  const { nodes, setNodes, encoder_ip, setEncoder_ip } = useTrajetoria();

  return (
    <>
      <h2>Configurações</h2>
      <div className={"settings"}>
        <label>
          <span>IP encoder: </span>
          <input type="text" value={encoder_ip} onInput={ev => setEncoder_ip((ev.target as any).value)}></input>
        </label>

        <label>
          <span>Trajetória: </span>
          <textarea onInput={ev => setNodes(JSON.parse((ev.target as any).value))}> {JSON.stringify(nodes)}</textarea>
        </label>
      </div>
    </>
  );
}
