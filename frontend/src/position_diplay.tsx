import './position_diplay.css'

export function PositionDisplay({ pos }: { pos: number[] }) {
  const x = Math.round(100*pos[0])/100;
  const y = Math.round(100*pos[1])/100;

  function copy({target}: MouseEvent) {
    const text = (target as HTMLElement).innerText;
    navigator.clipboard.writeText(text);
  }

  return (
    <div class="pos-display">
      <span title="Click para copiar X" onClick={copy}>{x}</span>, <span title="Click para copiar Y" onClick={copy}>{y}</span>
    </div>
  );
}
