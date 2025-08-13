def start_acquisition(pulses_per_second: int, reason: str):
    """
    If in the ModoOdometro or in the ModoTempo at the Ready state, starts an aquisition.
    pulses_per_second must be an integer, reason must be an UTF-8 encoded string.
    ModoOdometro ignores the parameter pulses_per_second.
    """
    raise NotImplementedError()


def stop_acquisition():
    """
    If in the ModoOdometro or in the ModoTempo at the Aquisição state, stops and saves an aquisition.
    """
    raise NotImplementedError()


def start_stream():
    """
    Starts the video stream.
    """
    raise NotImplementedError()


def stop_stream():
    """
    Stops the video stream.
    """
    raise NotImplementedError()


def set_exposure(value: int):
    """
    Sets the camera exposure. Value must be an integer in microseconds.
    """
    raise NotImplementedError()
