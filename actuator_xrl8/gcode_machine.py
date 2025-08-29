import numpy as np
from numpy.typing import NDArray

from time import sleep

from actuator_xrl8 import virtual_encoder_api as encoder


class NullGcodeMachine:
    def __init__(self):
        self.pos = np.array([0, 0], dtype=float)
        self.calibrated = False

    def is_calibrated(self):
        "Returns true after homing"
        return self.calibrated

    def get_position(self) -> (float, float):
        "Returns position in mm"
        return tuple(self.pos)

    def _convert_mm_to_steps(self, a: NDArray):
        return (a * self.STEPS_PER_MM).astype(int)

    def g0(self, x: float, y: float):
        """
        Fast linear movement. Used when the acquire is disabled.
        """
        print(f"Recebido comando g0: {x = } {y = }")
        self.g1(x, y, 10)

    def g1(self, x: float, y: float, s: float):
        """
        Linear movement. Used when the acquire is enabled.
        """
        print(f"Recebido comando g1: {x = } {y = } {s = }")
        end = np.array([x, y])
        dir = end - self.pos
        dir /= np.linalg.norm(dir)
        while np.linalg.norm(end-self.pos) > 1:
            self.pos += dir
            sleep(1/s)

    def g4(self, p: int):
        """
        Dwell. Stops for p millisecons.
        """
        print(f"Recebido comando g4: {p = }")
        sleep(p / 1000)

    def g28(self):
        """
        Auto home. Finds home position by moving to the endstops.
        """
        print("Recebido comando g28")
        self.calibrated = True
        self.g1(0, 0, 10)

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
