export const CommandType = {
  Iniciar: -1,
  Linear: 0,
  Sleep: 1,
  Arco_horario: 2,
  Arco_antihorario: 3,
  is_movement: (n: number) => n === CommandType.Iniciar || n === CommandType.Linear || n === CommandType.Arco_horario || n == CommandType.Arco_antihorario,
};
export type CommandData = { type: number; x: number; r: number; y: number; s: number; p: number; };

export type TrajetoriaNode = { id: number; command: CommandData; };
export type Status = {
  connected: boolean;
  running: boolean;
  gcode_loaded: boolean;
  pos: Array<number>;
  calibrated: boolean;
};

export type Bounds = {
  x0: number;
  y0: number;
  width: number;
  height: number;
};

export function find_last_movement_node_before(i: number, nodes: TrajetoriaNode[]) {
  let last_move_i = i - 1;
  while (last_move_i >= 0) {
    if (CommandType.is_movement(nodes[last_move_i].command.type)) {
      break;
    }
    last_move_i -= 1;
  }

  if (last_move_i >= 0) {
    return nodes[last_move_i];
  }

  return nodes[0];
}
