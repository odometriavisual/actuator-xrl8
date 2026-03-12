import requests

def start_acquisition(pulses_per_second: int, reason: str):
    """
    If in the ModoOdometro or in the ModoTempo at the Ready state, starts an aquisition.
    pulses_per_second must be an integer, reason must be an UTF-8 encoded string.
    ModoOdometro ignores the parameter pulses_per_second.
    """
    try:
        requests.post(f"http://rpi3-00.local/start_acquisition/{pulses_per_second}/{reason}", timeout=3)
        return True
    except requests.RequestException:
        return False


def stop_acquisition():
    """
    If in the ModoOdometro or in the ModoTempo at the Aquisição state, stops and saves an aquisition.
    """
    try:
        requests.post("http://rpi3-00.local/stop_acquisition", timeout=3)
        return True
    except requests.RequestException:
        return False


def start_stream():
    """
    Starts the video stream.
    """
    try:
        requests.post("http://rpi3-00.local/start_stream", timeout=3)
        return True
    except requests.RequestException:
        return False


def stop_stream():
    """
    Stops the video stream.
    """
    try:
        requests.post("http://rpi3-00.local/stop_stream", timeout=3)
        return True
    except requests.RequestException:
        return False


def set_exposure(value: int):
    """
    Sets the camera exposure. Value must be an integer in microseconds.
    """
    try:
        requests.post(f"http://rpi3-00.local/set_exposure/{value}", timeout=3)
        return True
    except requests.RequestException:
        return False
