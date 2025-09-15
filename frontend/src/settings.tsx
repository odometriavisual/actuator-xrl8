import { useTrajetoria } from "./trajetoria_context";

export function Settings() {
  const { nodes } = useTrajetoria();

  return (
    <textarea> {nodes} </textarea>
  );
}
