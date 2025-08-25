import RPi.GPIO as GPIO
import time
import multiprocessing
import math
import numpy as np

from actuator_xrl8.gcode_machine import NullGcodeMachine

# Pin definitions (adjust according to your wiring)
STEP_PIN_X = 10  # Step pin for X axis
DIR_PIN_X = 22  # Direction pin for X axis
STEP_PIN_Y = 27  # Step pin for Y axis
DIR_PIN_Y = 17  # Direction pin for Y axis

# Endstop pins
BUTTON = 14
ENDSTOP_X_MIN = 15  # Endstop for X min
ENDSTOP_X_MAX = 18  # Endstop for X max
ENDSTOP_Y_MIN = 23  # Endstop for Y min
ENDSTOP_Y_MAX = 24  # Endstop for Y max

RETURN_SPEED = 500  # Default return speed (steps/s)
DEFAULT_INTERVAL = 0.0005  # Default step interval


class MotorGcodeMachine(NullGcodeMachine):
    def __init__(self, accelerate=0.1, max_position=130000*80, min_position=-130000*80):
        super().__init__()
        GPIO.setwarnings(False)
        GPIO.cleanup()

        # Movement parameters
        self.max_position = max_position
        self.min_position = min_position
        self.curr_position_x = 0
        self.curr_position_y = 0
        self.accelerate = accelerate

        # Setup GPIO
        try:
            GPIO.setmode(GPIO.BCM)

            # Motor control pins
            GPIO.setup(STEP_PIN_X, GPIO.OUT)
            GPIO.setup(DIR_PIN_X, GPIO.OUT)
            GPIO.setup(STEP_PIN_Y, GPIO.OUT)
            GPIO.setup(DIR_PIN_Y, GPIO.OUT)

            # Endstop pins
            GPIO.setup(ENDSTOP_X_MIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
            GPIO.setup(ENDSTOP_X_MAX, GPIO.IN, pull_up_down=GPIO.PUD_UP)
            GPIO.setup(ENDSTOP_Y_MIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
            GPIO.setup(ENDSTOP_Y_MAX, GPIO.IN, pull_up_down=GPIO.PUD_UP)
            GPIO.setup(BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)

            # Initialize outputs
            GPIO.output(STEP_PIN_X, False)
            GPIO.output(DIR_PIN_X, False)
            GPIO.output(STEP_PIN_Y, False)
            GPIO.output(DIR_PIN_Y, False)

        except Exception as e:
            print(f"GPIO setup failed: {e}")
            raise

        # Movement control
        self.emergency_stop = False
        self.movement_done = multiprocessing.Event()
        self.movement_done.clear()

        # Variáveis para perfis de velocidade
        self.ramp_profile_up_x = None
        self.ramp_profile_down_x = None
        self.ramp_steps_x = 0

        self.ramp_profile_up_y = None
        self.ramp_profile_down_y = None
        self.ramp_steps_y = 0

    def g0(self, x, y):
        self.g1(x, y, 50)

    def g1(self, x, y, s):
        dx = x - self.curr_position_x
        dy = y - self.curr_position_y
        position = math.sqrt(dx**2 + dy**2)

        if position == 0:
            return

        speed_x = (abs(dx) / position) * s
        speed_y = (abs(dy) / position) * s

        self.move(speed_x, x, speed_y, y)

    def g28(self):
        self.move(0, 0, 50, -30000)
        self.move(50, -30000, 0, 0)
        self.calibrated = True
        self.curr_position_x = 0
        self.curr_position_y = 0
        self.pos = np.array([0, 0], dtype=float)

    def move(self, speed_x, position_x, speed_y, position_y):
        position_x *= -80
        position_y *= 80
        speed_x *= 80
        speed_y *= 80
        self.emergency_stop = False
        self.movement_done.clear()

        # Pré-calcular perfis de aceleração/desaceleração para X
        total_steps_x = abs(position_x - self.curr_position_x)
        self.ramp_steps_x = max(1, int(self.accelerate * speed_x))

        if self.ramp_steps_x > 0 and total_steps_x > 0:
            # Perfil exponencial de aceleração (de 0.1 a 1.0)
            self.ramp_profile_up_x = np.logspace(-1, 0, self.ramp_steps_x, base=6)
            self.ramp_profile_up_x = self.ramp_profile_up_x / np.max(
                self.ramp_profile_up_x
            )

            # Perfil exponencial de desaceleração (de 1.0 a 0.1)
            self.ramp_profile_down_x = np.logspace(0, -1, self.ramp_steps_x, base=6)
            self.ramp_profile_down_x = self.ramp_profile_down_x / np.max(
                self.ramp_profile_down_x
            )
        else:
            # Caso não haja aceleração/desaceleração
            self.ramp_profile_up_x = np.ones(1)
            self.ramp_profile_down_x = np.ones(1)

        # Pré-calcular perfis de aceleração/desaceleração para Y
        total_steps_y = abs(position_y - self.curr_position_y)
        self.ramp_steps_y = max(1, int(self.accelerate * speed_y))

        if self.ramp_steps_y > 0 and total_steps_y > 0:
            # Perfil exponencial de aceleração (de 0.1 a 1.0)
            self.ramp_profile_up_y = np.logspace(-1, 0, self.ramp_steps_y, base=6)
            self.ramp_profile_up_y = self.ramp_profile_up_y / np.max(
                self.ramp_profile_up_y
            )

            # Perfil exponencial de desaceleração (de 1.0 a 0.1)
            self.ramp_profile_down_y = np.logspace(0, -1, self.ramp_steps_y, base=6)
            self.ramp_profile_down_y = self.ramp_profile_down_y / np.max(
                self.ramp_profile_down_y
            )
        else:
            # Caso não haja aceleração/desaceleração
            self.ramp_profile_up_y = np.ones(1)
            self.ramp_profile_down_y = np.ones(1)

        try:
            self.__move(speed_x, position_x, speed_y, position_y)
        except Exception as e:
            print(f"Movement error: {e}")
            raise
        finally:
            GPIO.output(STEP_PIN_X, False)
            GPIO.output(STEP_PIN_Y, False)
            self.movement_done.set()

    def __move(self, speed_x, position_x, speed_y, position_y):
        # Validate positions
        if (
            position_x > self.max_position
            or position_x < self.min_position
            or position_y > self.max_position
            or position_y < self.min_position
        ):
            raise ValueError("Desired position out of bounds")

        # Setup X axis movement
        dir_x = 1 if position_x > self.curr_position_x else -1
        GPIO.output(DIR_PIN_X, dir_x == 1)
        total_steps_x = abs(position_x - self.curr_position_x)
        steps_remaining_x = total_steps_x

        # Velocidade mínima para evitar divisão por zero
        min_speed = 0.1
        effective_speed_x = max(speed_x, min_speed)
        step_interval_x = 1.0 / effective_speed_x

        # Setup Y axis movement
        dir_y = 1 if position_y > self.curr_position_y else -1
        GPIO.output(DIR_PIN_Y, dir_y == 1)
        total_steps_y = abs(position_y - self.curr_position_y)
        steps_remaining_y = total_steps_y

        effective_speed_y = max(speed_y, min_speed)
        step_interval_y = 1.0 / effective_speed_y

        # Initialize timing
        last_step_time_x = last_step_time_y = time.time()

        while (
            steps_remaining_x > 0 or steps_remaining_y > 0
        ) and not self.emergency_stop:
            current_time = time.time()

            # Check endstops
            if (
                GPIO.input(ENDSTOP_X_MIN) == GPIO.HIGH
                or GPIO.input(ENDSTOP_X_MAX) == GPIO.HIGH
            ):
                self.__handle_endstop_x()
                return

            if (
                GPIO.input(ENDSTOP_Y_MIN) == GPIO.HIGH
                or GPIO.input(ENDSTOP_Y_MAX) == GPIO.HIGH
            ):
                self.__handle_endstop_y()
                return

            # X axis movement
            if (
                steps_remaining_x > 0
                and current_time - last_step_time_x >= step_interval_x
            ):
                GPIO.output(STEP_PIN_X, not GPIO.input(STEP_PIN_X))

                if GPIO.input(STEP_PIN_X):
                    self.curr_position_x += dir_x
                    steps_remaining_x -= 1
                    self.pos[0] = -self.curr_position_x/80

                steps_performed_x = total_steps_x - steps_remaining_x

                # Calcular velocidade atual com perfil exponencial para X
                if total_steps_x > 0:
                    if steps_performed_x <= self.ramp_steps_x:
                        # Ramp up exponencial
                        profile_index = min(
                            int(steps_performed_x), len(self.ramp_profile_up_x) - 1
                        )
                        speed_factor = max(0.1, self.ramp_profile_up_x[profile_index])
                        step_interval_x = 1.0 / (effective_speed_x * speed_factor)

                    elif steps_performed_x >= (total_steps_x - self.ramp_steps_x):
                        # Ramp down exponencial
                        decel_progress = steps_performed_x - (
                            total_steps_x - self.ramp_steps_x
                        )
                        profile_index = min(
                            int(decel_progress), len(self.ramp_profile_down_x) - 1
                        )
                        speed_factor = max(0.1, self.ramp_profile_down_x[profile_index])
                        step_interval_x = 1.0 / (effective_speed_x * speed_factor)

                    else:
                        # Constant speed
                        step_interval_x = 1.0 / effective_speed_x

                last_step_time_x = current_time

            # Y axis movement
            if (
                steps_remaining_y > 0
                and current_time - last_step_time_y >= step_interval_y
            ):
                GPIO.output(STEP_PIN_Y, not GPIO.input(STEP_PIN_Y))

                if GPIO.input(STEP_PIN_Y):
                    self.curr_position_y += dir_y
                    steps_remaining_y -= 1
                    self.pos[1] = self.curr_position_y/80

                steps_performed_y = total_steps_y - steps_remaining_y

                # Calcular velocidade atual com perfil exponencial para Y
                if total_steps_y > 0:
                    if steps_performed_y <= self.ramp_steps_y:
                        # Ramp up exponencial
                        profile_index = min(
                            int(steps_performed_y), len(self.ramp_profile_up_y) - 1
                        )
                        speed_factor = max(0.1, self.ramp_profile_up_y[profile_index])
                        step_interval_y = 1.0 / (effective_speed_y * speed_factor)

                    elif steps_performed_y >= (total_steps_y - self.ramp_steps_y):
                        # Ramp down exponencial
                        decel_progress = steps_performed_y - (
                            total_steps_y - self.ramp_steps_y
                        )
                        profile_index = min(
                            int(decel_progress), len(self.ramp_profile_down_y) - 1
                        )
                        speed_factor = max(0.1, self.ramp_profile_down_y[profile_index])
                        step_interval_y = 1.0 / (effective_speed_y * speed_factor)

                    else:
                        # Constant speed
                        step_interval_y = 1.0 / effective_speed_y

                last_step_time_y = current_time

    def __handle_endstop_x(self):
        pressed = []
        if GPIO.input(ENDSTOP_X_MIN) == GPIO.HIGH:
            pressed.append("X Min")
        if GPIO.input(ENDSTOP_X_MAX) == GPIO.HIGH:
            pressed.append("X Max")

        print(f"X axis endstop triggered ({', '.join(pressed)})! Reversing...")
        self.__reverse_motion(STEP_PIN_X, DIR_PIN_X, "x")

    def __handle_endstop_y(self):
        pressed = []
        if GPIO.input(ENDSTOP_Y_MIN) == GPIO.HIGH:
            pressed.append("Y Min")
        if GPIO.input(ENDSTOP_Y_MAX) == GPIO.HIGH:
            pressed.append("Y Max")

        print(f"Y axis endstop triggered ({', '.join(pressed)})! Reversing...")
        self.__reverse_motion(STEP_PIN_Y, DIR_PIN_Y, "y")

    def __reverse_motion(self, step_pin, dir_pin, axis):
        current_dir = GPIO.input(dir_pin)
        new_dir = not current_dir
        GPIO.output(dir_pin, new_dir)

        steps = 0
        while steps < 1000:  # Move back fixed number of steps
            GPIO.output(step_pin, True)
            time.sleep(DEFAULT_INTERVAL / 2)
            GPIO.output(step_pin, False)
            time.sleep(DEFAULT_INTERVAL / 2)
            steps += 1

            # Update position
            if axis == "x":
                self.curr_position_x += -1 if new_dir else 1
            else:
                self.curr_position_y += -1 if new_dir else 1

        print(f"{axis.upper()} axis endstop cleared! Reverse motion completed.")
        self.emergency_stop = True

    def cleanup(self):
        """Clean up GPIO resources"""
        GPIO.cleanup()
