import numpy as np
from numpy.typing import NDArray

from actuator_xrl8 import virtual_encoder_api as encoder


class GcodeMachine:
    def __init__(self):
        # Current postion in number of steps
        self.position = np.array([0, 0], dtype=int)

        # Constants in number of steps
        self.STEPS_PER_MM: int = 5 * 8
        self.WIDTH: int = 100 * self.STEPS_PER_MM
        self.HEIGHT: int = 100 * self.STEPS_PER_MM

        # Flags
        self.is_endstop_hit = False  # True if endstop was hit
        self.is_home = False  # Set to True after the home calibration


    def _convert_mm_to_steps(self, a: NDArray):
        return (a * self.STEPS_PER_MM).astype(int)

    def g0(self, x: float, y: float):
        """
        Fast linear movement. Used when the acquire is disabled.
        """
        print(f'Recebido comando g0: {x = } {y = }')

    def g1(self, x: float, y: float, s: float):
        """
        Linear movement. Used when the acquire is enabled.
        """
        print(f'Recebido comando g1: {x = } {y = } {s = }')

    def g4(self, p: int):
        """
        Dwell. Stops for p millisecons.
        """
        raise NotImplementedError()

    def g28(self):
        """
        Auto home. Finds home position by moving to the endstops.
        """
        raise NotImplementedError()

    def g90(self):
        """
        Absolute coordinates. Movement commands use absolute coordinates.
        """
        raise NotImplementedError()

    def g91(self):
        """
        Relative coordinates. Movement commands use relative coordinates.
        """
        raise NotImplementedError()

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
