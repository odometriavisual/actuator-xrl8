import { CommandType, type TrajetoriaNode } from "./types";

export function nodes_to_gcode(nodes: TrajetoriaNode[], offset: {x: number, y: number}) {
  return nodes.map(n => {
      const x = n.command.x + offset.x;
      const y = n.command.y + offset.y;

      switch (n.command.type) {
        case CommandType.Iniciar:
          return `G0 X${x} Y${y}`;

        case CommandType.Linear:
          return `G1 X${x} Y${y} S${n.command.s}`;

        case CommandType.Arco_horario:
          return `G2 X${x} Y${y} S${n.command.s} R${n.command.r}`;

        case CommandType.Arco_antihorario:
          return `G3 X${x} Y${y} S${n.command.s} R${n.command.r}`;

        case CommandType.Sleep:
          return `G4 P${n.command.p}`;

        case CommandType.Start_acquisition:
          return `M1000 F${n.command.f} "${n.command.str}"`;

        case CommandType.Stop_acquisition:
          return `M1001`;

        case CommandType.Start_stream:
          return `M1002`;

        case CommandType.Stop_stream:
          return `M1003`;

        case CommandType.Set_exposure:
          return `M1004 E${n.command.e}`;
      }

    }).join('\n');
}
