import numpy as np
from numpy.typing import NDArray

from time import sleep

from actuator_xrl8 import virtual_encoder_api as encoder


class NullGcodeMachine:
    def __init__(self):
        self.pos = np.array([0, 0], dtype=float)
        self.pause_requested = False
        self.calibrated = False

    def is_calibrated(self):
        "Returns true after homing"
        return self.calibrated

    def get_position(self) -> (float, float):
        "Returns position in mm"
        return tuple(self.pos)

    def pause(self):
        self.pause_requested = True

    def _convert_mm_to_steps(self, a: NDArray):
        return (a * self.STEPS_PER_MM).astype(int)

    def g0(self, x: float, y: float) -> bool:
        """
        Fast linear movement. Used when the acquire is disabled.
        Returns false if movement was not finished
        Returns true if movement was finished
        """
        print(f"Recebido comando g0: {x = } {y = }")
        return self.g1(x, y, 100)

    def g1(self, x: float, y: float, s: float) -> bool:
        """
        Linear movement. Used when the acquire is enabled.
        Returns false if movement was not finished
        Returns true if movement was finished
        """
        print(f"Recebido comando g1: {x = } {y = } {s = }")
        end = np.array([x, y])
        dir = end - self.pos
        dir /= np.linalg.norm(dir)
        while np.linalg.norm(end - self.pos) > 1:
            if self.pause_requested:
                self.pause_requested = False
                return False

            self.pos += dir
            sleep(1 / s)

        return True

    def g2(self, x: float, y: float, s: float, r: float) -> bool:
        """
        Clockwise arc movement. 
        Returns false if movement was not finished
        Returns true if movement was finished
        """
        print(f"Recebido comando g2: {x = } {y = } {s = } {r = }")
        end = np.array([x, y])
        dir = end - self.pos
        dir /= np.linalg.norm(dir)
        while np.linalg.norm(end - self.pos) > 1:
            if self.pause_requested:
                self.pause_requested = False
                return False

            self.pos += dir
            sleep(1 / s)

        return True

    def g3(self, x: float, y: float, s: float, r: float) -> bool:
        """
        Counterclockwise arc movement. 
        Returns false if movement was not finished
        Returns true if movement was finished
        """
        print(f"Recebido comando g3: {x = } {y = } {s = } {r = }")
        end = np.array([x, y])
        dir = end - self.pos
        dir /= np.linalg.norm(dir)
        while np.linalg.norm(end - self.pos) > 1:
            if self.pause_requested:
                self.pause_requested = False
                return False

            self.pos += dir
            sleep(1 / s)

        return True

    def g4(self, p: int):
        """
        Dwell. Stops for p millisecons.
        """
        print(f"Recebido comando g4: {p = }")
        sleep(p / 1000)

    def g28(self) -> bool:
        """
        Auto home. Finds home position by moving to the endstops.
        Returns false if calibration was not finished
        Returns true if calibration was finished
        """
        print("Recebido comando g28")
        if self.g1(0, 0, 10):
            self.calibrated = True
            return True

        return False

    def g90(self):
        """
        Absolute coordinates. Movement commands use absolute coordinates.
        """
        print("Recebido comando g90")

    def g91(self):
        """
        Relative coordinates. Movement commands use relative coordinates.
        """
        print("Recebido comando g91")

    def m1000(self, f: int, acquisition_name: str):
        """
        Start encoder. Sends the command `start_acquisition` to the virtual encoder.
        """
        encoder.start_acquisition(pulses_per_second=f, reason=acquisition_name)

    def m1001(self):
        """
        Stop encoder. Sends the command `stop_acquisition` to the virtual encoder.
        """
        encoder.stop_acquisition()

    def m1002(self):
        """
        Streaming on. Sends the command `start_stream` to the virtual encoder.
        """
        encoder.start_stream()

    def m1003(self):
        """
        Streaming off. Sends the command `stop_stream` to the virtual encoder.
        """
        encoder.stop_stream()

    def m1004(self, e: int):
        """
        Set exposure. Sets the camera's exposture to n microseconds.
        """
        encoder.set_exposure(e)
