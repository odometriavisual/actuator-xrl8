from flask import Flask
import matplotlib.pyplot as plt
import numpy as np
from threading import Thread, Event
from time import time_ns

try:
    from actuator_xrl8.motor import MotorGcodeMachine as GcodeMachine
except RuntimeError:
    from actuator_xrl8.gcode_machine import NullGcodeMachine as GcodeMachine

from actuator_xrl8.gcode_interpreter import GcodeInterpreter

class ActuatorApp(Flask):
    def __init__(self):
        Flask.__init__(
            self,
            __name__,
            static_url_path="/assets",
            static_folder="../frontend/dist/assets",
        )

        self.ws = None

        self.machine = GcodeMachine()
        self.interpreter = None
        self.running = False
        self.last_gcode = None
        self.pause_request = False

        self.trajectory_timestamps = []
        self.trajectory_x = []
        self.trajectory_y = []
        self.trajectory_figure = plt.figure()

        self.play_event = Event()
        self.play_event.clear()
        Thread(target=self.__run, daemon=True).start()

    def __start_recording_trajectory(self):
        self.trajectory_timestamps = []
        self.trajectory_x = []
        self.trajectory_y = []
        self.trajectory_figure.clear()

    def __append_to_trajectory(self, ts, x, y):
        self.trajectory_timestamps.append(ts)
        self.trajectory_x.append(x)
        self.trajectory_y.append(y)

    def __stop_recording_trajectory(self):
        np.savez(
            "/tmp/trajectory.npz",
            timestamp=self.trajectory_timestamps,
            x=self.trajectory_x,
            y=self.trajectory_y
        )

        ax = self.trajectory_figure.add_subplot()
        ax.axis("off")
        ax.invert_yaxis()
        ax.plot(self.trajectory_x, self.trajectory_y)
        self.trajectory_figure.savefig("/tmp/trajectory.jpg")
        self.ws.emit("new_trajectory_plot")

    def __run(self):
        while True:
            self.play_event.wait()
            self.play_event.clear()

            if self.interpreter is not None:
                self.__start_recording_trajectory()
                self.running = True
                self.pause_request = False

                while status := self.interpreter.step():
                    if status is not True:
                        print(f"{status}")
                        break
                    if self.pause_request:
                        break

                if self.interpreter.is_finished():
                    self.interpreter = None

                self.__stop_recording_trajectory()
                self.running = False

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
        self.last_gcode = gcode_src
        self.pause_request = False

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
        self.play_event.set()

    def pause(self):
        self.play_event.clear()
        self.machine.pause()
        self.pause_request = True

    def play_pause(self):
        if self.is_running():
            self.pause()
        else:
            self.play()

    def set_encoder_host(self, host):
        self.machine.encoder.host = host
        self.ws.emit("encoder_host", host)

    def get_status(self):
        pos = self.machine.get_position()
        self.__append_to_trajectory(time_ns(), *pos)

        return {
            "running": self.is_running(),
            "gcode_loaded": self.is_trajectory_initialized(),
            "pos": pos,
            "calibrated": self.is_calibrated(),
        }
