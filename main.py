from flask import send_from_directory
from flask_socketio import SocketIO
import numpy as np

from threading import Thread
from time import sleep, time_ns

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

    @ws.on("connect")
    def connect():
        ws.emit("status", app.get_status())

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
        last_status = app.get_status()
        data = []

        while True:
            status = app.get_status()

            if last_status != status:
                if not last_status["running"] and status["running"]:
                    data = []
                elif status["running"]:
                    data.append([time_ns(), *status["pos"]])
                elif last_status["running"] and not status["running"]:
                    np.savez("/tmp/trajectory.npz", data)

                ws.emit("status", status)
                last_status = status

            sleep(1 / 30)

    Thread(target=send_status, daemon=True).start()
    start_button_thread(app)
    ws.run(app, allow_unsafe_werkzeug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
