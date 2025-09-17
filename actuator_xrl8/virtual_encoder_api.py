import requests

def start_acquisition(pulses_per_second: int, reason: str):
    """
    If in the ModoOdometro or in the ModoTempo at the Ready state, starts an aquisition.
    pulses_per_second must be an integer, reason must be an UTF-8 encoded string.
    ModoOdometro ignores the parameter pulses_per_second.
    """
    requests.post(f"http://rpi5-00.local/start_acquisition/{pulses_per_second}/{reason}")


def stop_acquisition():
    """
    If in the ModoOdometro or in the ModoTempo at the Aquisição state, stops and saves an aquisition.
    """
    requests.post("http://rpi5-00.local/stop_acquisition")


def start_stream():
    """
    Starts the video stream.
    """
    requests.post("http://rpi5-00.local/start_stream")


def stop_stream():
    """
    Stops the video stream.
    """
    requests.post("http://rpi5-00.local/stop_stream")


def set_exposure(value: int):
    """
    Sets the camera exposure. Value must be an integer in microseconds.
    """
    requests.post(f"http://rpi5-00.local/set_exposure/{value}")
