# Especificações formato interno da interface

O formato interno da interface, que é convertido para GCODE é definido pelos tipos:

```typescript
export const CommandType = {
  Iniciar: -1,
  Linear: 0,
  Sleep: 1,
  Arco_horario: 2,
  Arco_antihorario: 3,
  Start_acquisition: 1000,
  Stop_acquisition: 1001,
  Start_stream: 1002,
  Stop_stream: 1003,
  Set_exposure: 1004,
  is_movement: (n: number) => n === CommandType.Iniciar || n === CommandType.Linear || n === CommandType.Arco_horario || n == CommandType.Arco_antihorario,
};
export type CommandData = {
  type: number,
  x: number,
  y: number,
  r: number,
  s: number,
  p: number,
  f: number,
  str: string,
  e: number,
};

export type TrajetoriaNode = { id: number; command: CommandData; };
```


# Especificações do GCODE do atuador 2D.

- O atuador tem dois eixos controlados.
- O limites dos eixos são `0 <= x <= 410` e `0 <= y <= 335`
- O atuador sempre atua no modo de coordenadas absolutas
- Toda trajetória deve começar com um comando G0 para se movimento para a posição inicial
  - Outros movimentos lineares utilizam o comando G1

# Comandos GCODE suportados

## G0 Xn Yn
Movimento linear rápido.
x e y em milímetros.

## G1 Xn Yn Sn
Movimento linear.
x e y em milímetros, s em milímetros/segundo.

## G2 Xn Yn Sn Rn
Movimento em arco no sentido horário.
x e y em milímetros, s em milímetros/segundo, r em milímetros.

## G3 Xn Yn Sn Rn
Movimento em arco no sentido anti-horário.
x e y em milímetros, s em milímetros/segundo, r em milímetros.

## G4 Pn
Pausa.
Tempo de pausa P em milisegundos.

## G28
Auto home.
Move até os fins de curso e zera a posição.

## G90
Ativa coordenadas absolutas. Não implementado.

## G91
Ativa coordenadas relativas. Não implementado

## M1000 Fn "str"
Inicia aquisição do encoder virtual. Envia comando `start_acquisition` na api do encoder virtual.
F é a quantidade de pulsos por segundo, o parâmetro `pulses_per_second` da api. Default: 10 pulsos/segundo;
str é o nome do ensaio, o parâmetro `reason` da api. Default: string vazia.

## M1001
Para aquisição do encoder virtual. Envia comando `stop_acquisition`

## M1002
Ativa streaming de vídeo do encoder virtual. Envia comando `start_stream`.

## M1003
Desativa streaming the vídeo do encoder virtual. Envia comando `stop_stream`.

## M1004 En
Seta tempo de exposição da câmera do encoder virtual.
O tempo de exposisão E é dado em microsegundos. Default: 500 microsegundos.
