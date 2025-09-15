import RPi.GPIO as GPIO
from time import sleep
from threading import Thread

BUTTON = 14

def __check_button(app):
    last_button_state = GPIO.HIGH

    while True:
        current_state = GPIO.input(BUTTON)

        if last_button_state == GPIO.HIGH and current_state == GPIO.LOW:
            app.play_pause()

        last_button_state = current_state
        sleep(0.01)


def start_button_thread(app):
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    Thread(target=__check_button, args=(app,), daemon=True).start()
