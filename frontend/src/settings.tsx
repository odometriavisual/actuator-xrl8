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
    const data = JSON.stringify(nodes);

    const blob = new Blob([data], { type: "application/json" });
    const jsonObjectUrl = URL.createObjectURL(blob);

    const filename = `trajectoria de ${(new Date()).toISOString()}.json`;

    const anchorEl = document.createElement("a");
    anchorEl.href = jsonObjectUrl;
    anchorEl.download = filename;
    anchorEl.click();

    URL.revokeObjectURL(jsonObjectUrl);
  }

  async function upload_trajectory(file: File) {
    try {
      setNodes(JSON.parse(await file.text()));
    }
    catch {
      alert("Arquivo inválido!");
    }
  }

  return (
    <>
      <h2>Configurações</h2>
      <div className={"settings"}>
        <section>
          <span>Trajetória </span>

          <button onClick={download_trajectory}> Baixar <i className="bi bi-download" /> </button>

          <label>
            Carregar trajetória <i className="bi bi-upload" />
            <input type="file" accept=".json" onChange={ev => upload_trajectory(ev.target.files[0])} />
          </label>
        </section>

        <hr/>

        <section>
          <span>IP do encoder </span>
          <label>
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
        </section>
      </div>
    </>
  );
}
