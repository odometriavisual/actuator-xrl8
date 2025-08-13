import src.virtual_encoder_api as encoder


class GcodeMachine:
    def __init__(self):
        raise NotImplementedError()

    def g0(self, x, y):
        """
        Fast linear movement. Used when the acquire is disabled.
        """
        raise NotImplementedError()

    def g1(self, x, y, s):
        """
        Linear movement. Used when the acquire is enabled.
        """
        raise NotImplementedError()

    def g4(self, p):
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
