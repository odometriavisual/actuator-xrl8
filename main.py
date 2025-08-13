from src.gcode_machine import GcodeMachine


def main():
    machine = GcodeMachine()

    # Home
    machine.g28()

    # Random movement
    machine.g1(10, 10, 5)
    machine.g1(100, 10, 5)
    machine.g1(50, 50, 5)

    # Home
    machine.g28()


if __name__ == "__main__":
    main()
