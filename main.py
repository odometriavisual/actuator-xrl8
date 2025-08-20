from actuator_xrl8.gcode_machine import NullGcodeMachine
from actuator_xrl8.gcode_interpreter import GcodeInterpreter


def main():

    while True:
        s = input()
        interpreter = GcodeInterpreter(s, NullGcodeMachine())

        while status := interpreter.step():
            if status is None:
                print('Comando executado com sucesso')
            elif status is not True:
                print(f'Erro ao executar comando: {status}')



if __name__ == "__main__":
    main()
