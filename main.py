from flask import Flask, send_from_directory
from flask_socketio import SocketIO

from threading import Thread
from time import sleep

try:
    from actuator_xrl8.motor import MotorGcodeMachine as GcodeMachine
except RuntimeError:
    from actuator_xrl8.gcode_machine import NullGcodeMachine as GcodeMachine

from actuator_xrl8.gcode_interpreter import GcodeInterpreter


def main():
    app = Flask(
        __name__, static_url_path="/assets", static_folder="./frontend/dist/assets"
    )
    ws = SocketIO(app, cors_allowed_origins="*")

    app.machine = GcodeMachine()
    app.interpreter = None
    app.running = False

    @app.route("/")
    def index():
        return send_from_directory("frontend/dist", "index.html")

    @ws.on("gcode")
    def gcode(gcode_src):
        app.running = True
        app.interpreter = GcodeInterpreter(gcode_src, app.machine)
        app.interpreter.step()
        app.running = False

    @ws.on("step")
    def step():
        app.running = True
        if status := app.interpreter.step():
            if status is not True:
                print(f"{status}")

        if app.interpreter.is_finished():
            app.interpreter = None
        app.running = False

    @ws.on("play")
    def play():
        if app.interpreter is not None:
            app.running = True

            while status := app.interpreter.step():
                if status is not True:
                    print(f"{status}")
                    break

            if app.interpreter.is_finished():
                app.interpreter = None

            app.running = False

    @ws.on("pause")
    def pause():
        app.machine.pause()

    def send_status():
        while True:
            status = {
                "running": app.running,
                "gcode_loaded": app.interpreter is not None,
                "pos": app.machine.get_position(),
                "calibrated": app.machine.is_calibrated(),
            }
            ws.emit("status", status)
            sleep(1 / 30)

    Thread(target=send_status, daemon=True).start()

    ws.run(app, allow_unsafe_werkzeug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
