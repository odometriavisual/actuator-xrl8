from actuator_xrl8.gcode_machine import GcodeMachine
from actuator_xrl8.gcode_interpreter import GcodeInterpreter


def main():
    machine = GcodeMachine()

    while True:
        s = input()

        interpreter = GcodeInterpreter(s, machine)

        while status := interpreter.run():
            if status is None:
                print('Comando executado com sucesso')
            elif status is not True:
                print(f'Erro ao executar comando: {status}')



if __name__ == "__main__":
    main()
