import requests

class EncoderApi:
    def __init__(self, host):
        self.host = host
        
    def start_acquisition(self, pulses_per_second: int, reason: str):
        """
        If in the ModoOdometro or in the ModoTempo at the Ready state, starts an aquisition.
        pulses_per_second must be an integer, reason must be an UTF-8 encoded string.
        ModoOdometro ignores the parameter pulses_per_second.
        """
        try:
            requests.post(f"http://{self.host}/start_acquisition/{pulses_per_second}/{reason}", timeout=3)
            return True
        except requests.RequestException:
            return False


    def stop_acquisition(self):
        """
        If in the ModoOdometro or in the ModoTempo at the Aquisição state, stops and saves an aquisition.
        """
        try:
            requests.post(f"http://{self.host}/stop_acquisition", timeout=3)
            return True
        except requests.RequestException:
            return False


    def start_stream(self):
        """
        Starts the video stream.
        """
        try:
            requests.post(f"http://{self.host}/start_stream", timeout=3)
            return True
        except requests.RequestException:
            return False


    def stop_stream(self):
        """
        Stops the video stream.
        """
        try:
            requests.post(f"http://{self.host}/stop_stream", timeout=3)
            return True
        except requests.RequestException:
            return False


    def set_exposure(self, value: int):
        """
        Sets the camera exposure. Value must be an integer in microseconds.
        """
        try:
            requests.post(f"http://{self.host}/set_exposure/{value}", timeout=3)
            return True
        except requests.RequestException:
            return False
