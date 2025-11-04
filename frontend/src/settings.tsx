import { useTrajetoria } from "./trajetoria_context";
import { socket } from "./socket";

import './settings.css'

export function Settings() {
  const { nodes, setNodes } = useTrajetoria();

  function shutdown_request() {
    socket.emit('shutdown');
    alert("Desligando o atuador... Aguarde 1min antes de desligar a fonte de energia.")
  }

  return (
    <>
      <h2>Configurações</h2>
      <div className={"settings"}>
        <label>
          <span>Trajetória: </span>
          <textarea onInput={ev => setNodes(JSON.parse((ev.target as any).value))}> {JSON.stringify(nodes)}</textarea>
        </label>

      </div>
      <button onClick={shutdown_request}> Shutdown </button>
    </>
  );
}
