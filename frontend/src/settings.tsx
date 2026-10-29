import { useTrajetoria } from "./trajetoria_context";
import { socket } from "./socket";

import './settings.css'

export type SettingsArgsType = {
  lastTrajectory: string|undefined,
};

export function Settings({lastTrajectory}: SettingsArgsType) {
  const { nodes, setNodes, encoder_host } = useTrajetoria();

  function set_encoder_host(host: string) {
    socket.emit("set_encoder_host", host);
  }

  function download_trajectory() {
    // Turn the JSON object into a string
    const data = JSON.stringify(nodes);

    // Pass the string to a Blob and turn it
    // into an ObjectURL
    const blob = new Blob([data], { type: "application/json" });
    const jsonObjectUrl = URL.createObjectURL(blob);

    // Create an anchor element, set it's
    // href to be the Object URL we have created
    // and set the download property to be the file name
    // we want to set
    const filename = `trajectoria de ${(new Date()).toISOString()}.json`;
    const anchorEl = document.createElement("a");
    anchorEl.href = jsonObjectUrl;
    anchorEl.download = filename;

    // There is no need to actually attach the DOM
    // element but we do need to click on it
    anchorEl.click();

    // We don't want to keep a reference to the file
    // any longer so we release it manually
    URL.revokeObjectURL(jsonObjectUrl);
  }

  function upload_trajectory() {
    alert("não implementado")
  }

  return (
    <>
      <h2>Configurações</h2>
      <div className={"settings"}>
        <label>
          <span>Trajetória: </span>
          <button onClick={download_trajectory}> Baixar <i className="bi bi-download" /> </button>
          <button onClick={upload_trajectory}> Carregar <i className="bi bi-upload" /> </button>
          <textarea onInput={ev => setNodes(JSON.parse((ev.target as any).value))}> {JSON.stringify(nodes)}</textarea>
        </label>

        <label>
          <span>IP do encoder: </span>
          <input type="text" onInput={ev => set_encoder_host((ev.target as any).value)} value={encoder_host} />
        </label>

        {lastTrajectory !== undefined?
          <div className={"last-trajectory"}>
            <a href={`/dl/${lastTrajectory}.npz`}>Baixar última trajetória realizada</a>
            <img src={lastTrajectory + ".jpg"} />
          </div>
          :
          null
        }
      </div>
    </>
  );
}
