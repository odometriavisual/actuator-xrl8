from flask import Flask
from threading import Thread, Event

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

        self.machine = GcodeMachine()
        self.interpreter = None
        self.running = False
        self.last_gcode = None
        self.pause_request = False

        self.play_event = Event()
        self.play_event.clear()
        Thread(target=self.__run, daemon=True).start()

    def __run(self):
        while True:
            self.play_event.wait()
            self.play_event.clear()

            if self.interpreter is not None:
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

    def get_status(self):
        return {
            "running": self.is_running(),
            "gcode_loaded": self.is_trajectory_initialized(),
            "pos": self.machine.get_position(),
            "calibrated": self.is_calibrated(),
        }
