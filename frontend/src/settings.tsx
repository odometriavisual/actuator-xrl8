import { useTrajetoria } from "./trajetoria_context";
import { socket } from "./socket";

import './settings.css'

export type SettingsArgsType = {
  trajectoryImgSrc: string|undefined,
};

export function Settings({trajectoryImgSrc}: SettingsArgsType) {
  const { nodes, setNodes, encoder_host } = useTrajetoria();

  function shutdown_request() {
    socket.emit('shutdown');
    alert("Desligando o atuador... Aguarde 1min antes de desligar a fonte de energia.")
  }

  function set_encoder_host(host: string) {
    socket.emit("set_encoder_host", host);
  }

  return (
    <>
      <h2>Configurações</h2>
      <div className={"settings"}>
        <label>
          <span>Trajetória: </span>
          <textarea onInput={ev => setNodes(JSON.parse((ev.target as any).value))}> {JSON.stringify(nodes)}</textarea>
        </label>

        <label>
          <span>IP do encoder: </span>
          <input type="text" onInput={ev => set_encoder_host((ev.target as any).value)} value={encoder_host} />
        </label>
      </div>

      {trajectoryImgSrc !== undefined?
        <>
          <a href="/dl/trajectory.npz">Baixar trajetória</a>
          <img src={trajectoryImgSrc} />
        </>
        :
        null
      }
    
      <button onClick={shutdown_request}> Shutdown </button>
    </>
  );
}
