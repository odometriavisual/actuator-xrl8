from flask import Flask, send_from_directory
from flask_socketio import SocketIO

from threading import Thread
from time import sleep

try:
    from actuator_xrl8.motor import MotorGcodeMachine as GcodeMachine
except RuntimeError:
    from actuator_xrl8.gcode_machine import NullGcodeMachine as GcodeMachine

from actuator_xrl8.gcode_interpreter import GcodeInterpreter


class ActuatorApp(Flask):
    def __init__(self):
        super().__init__(
            __name__, static_url_path="/assets", static_folder="./frontend/dist/assets"
        )

        self.machine = GcodeMachine()
        self.interpreter = None
        self.running = False
        self.last_gcode = None

    def is_running(self):
        return self.running

    def is_calibrated(self):
        return self.machine.is_calibrated()

    def is_trajectory_initialized(self):
        return self.interpreter is not None

    def initialize_trajectory(self, gcode_src):
        self.running = True
        self.interpreter = GcodeInterpreter(gcode_src, self.machine)
        self.interpreter.step()
        self.running = False

    def reinitialize_last_trajectory(self):
        self.initialize_trajectory(self.last_gcode)

    def step(self):
        self.running = True
        if status := self.interpreter.step():
            if status is not True:
                print(f"{status}")

        if self.interpreter.is_finished():
            self.interpreter = None
        self.running = False

    def play(self):
        if self.interpreter is not None:
            self.running = True

            while status := self.interpreter.step():
                if status is not True:
                    print(f"{status}")
                    break

            if self.interpreter.is_finished():
                self.interpreter = None

            self.running = False

    def pause(self):
        self.machine.pause()


def main():
    app = ActuatorApp()
    ws = SocketIO(app, cors_allowed_origins="*")

    @app.route("/")
    def index():
        return send_from_directory("frontend/dist", "index.html")

    @ws.on("gcode")
    def gcode(gcode_src):
        app.initialize_trajectory(gcode_src)

    @ws.on("step")
    def step():
        app.step()

    @ws.on("play")
    def play():
        app.play()

    @ws.on("pause")
    def pause():
        app.pause()

    def send_status():
        while True:
            status = {
                "running": app.is_running(),
                "gcode_loaded": app.is_trajectory_initialized(),
                "pos": app.machine.get_position(),
                "calibrated": app.is_calibrated(),
            }
            ws.emit("status", status)
            sleep(1 / 30)

    Thread(target=send_status, daemon=True).start()

    ws.run(app, allow_unsafe_werkzeug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
