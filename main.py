from flask import send_from_directory
from flask_socketio import SocketIO

from threading import Thread
from time import sleep

try:
    from actuator_xrl8.button import start_button_thread
except RuntimeError:
    def start_button_thread(app):
        pass

from actuator_xrl8.actuator_app import ActuatorApp

def main():
    app = ActuatorApp()
    ws = SocketIO(app, cors_allowed_origins="*")

    @app.route("/")
    def index():
        return send_from_directory("../frontend/dist", "index.html")

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
    start_button_thread(app)
    ws.run(app, allow_unsafe_werkzeug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
