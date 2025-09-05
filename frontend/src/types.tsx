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
