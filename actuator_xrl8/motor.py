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
STEPS_PER_MM = 5 * 16


class MotorGcodeMachine(NullGcodeMachine):
    def __init__(
        self,
        accelerate=0.01,
        max_position=130000 * STEPS_PER_MM,
        min_position=-130000 * STEPS_PER_MM,
    ):
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

    def is_calibrated(self):
        "Returns true after homing"
        return self.calibrated

    def get_position(self) -> (float, float):
        "Returns position in mm"
        return (
            -self.curr_position_x / STEPS_PER_MM,
            -self.curr_position_y / STEPS_PER_MM,
        )

    def g0(self, x, y) -> bool:
        """
        Fast linear movement. Used when the acquire is disabled.
        Returns false if movement was not finished
        Returns true if movement was finished
        """
        return self.g1(x, y, 50)

    def g1(self, x, y, s) -> bool:
        """
        Linear movement. Used when the acquire is enabled.
        Returns false if movement was not finished
        Returns true if movement was finished
        """

        dx = x - self.curr_position_x / -STEPS_PER_MM
        dy = y - self.curr_position_y / -STEPS_PER_MM
        position = math.sqrt(dx**2 + dy**2)

        if position == 0:
            return True

        speed_x = (abs(dx) / position) * s
        speed_y = (abs(dy) / position) * s

        return self.move(speed_x, x, speed_y, y)

    def g2(self, x, y, s, raio) -> bool:
        x0 = self.curr_position_x / -STEPS_PER_MM
        y0 = self.curr_position_y / -STEPS_PER_MM
        dx = x - x0
        dy = y - y0
        x_time = x
        y_time = y

        speed_x = []
        speed_y = []
        position = math.sqrt(dx**2 + dy**2)

        distancia = np.sqrt((x - x0) ** 2 + (y - y0) ** 2)

        if distancia > 2 * raio:
            # precisa colocar uma condição na interface para que o raio, seja no minimo distancia/2
            print(f"Erro: o raio deve ser maior que ({distancia / 2:.2f}) ")
            return
        meio_x, meio_y = (x0 + x) / 2, (y0 + y) / 2
        distancia_meio = np.sqrt(meio_x**2 + meio_y**2)

        if distancia_meio == 0 and x0 == 0 and y0 == 0:
            centro_x, centro_y = raio, 0
        else:
            h = np.sqrt(raio**2 - (distancia / 2) ** 2)
            perp_x = -dy
            perp_y = dx

            # sentido horario
            comprimento_perp = np.sqrt(perp_x**2 + perp_y**2)
            if comprimento_perp > 0:
                perp_x /= comprimento_perp
                perp_y /= comprimento_perp

            centro_x = meio_x + h * perp_x
            centro_y = meio_y + h * perp_y

        angulo_inicial = np.arctan2(y0 - centro_y, x0 - centro_x)
        angulo_final = np.arctan2(y - centro_y, x - centro_x)
        # sentido horario
        if angulo_final < angulo_inicial:
            angulo_final += 2 * np.pi

        theta = np.linspace(angulo_inicial, angulo_final, int(position * 1.5))

        x_semi = centro_x + raio * np.cos(theta)
        y_semi = centro_y + raio * np.sin(theta)

        """os pontos q fazem a curva estao listados em (x_semi,y_semi), se quiser fazer uma estimativa da curva que ele vai fazer
        no web, para visualizar melhor a trajetoria, é só reutilizar o codigo daqui pra cima, nao utilizei a velocidade para nada acima deste comentário,
        se achar que vai facilitar a implementação fazer uma função só para gerar esses pontos e depois a gente integra com o g2(), me da um toque
        """

        for i in range(len(x_semi)):
            x_semi[i] = round(x_semi[i] * 80, 0) / 80
            y_semi[i] = round(y_semi[i] * 80, 0) / 80

            x_time = x_semi[i] - x_time
            y_time = y_semi[i] - y_time
            position = math.sqrt(x_time**2 + y_time**2)

            if position == 0:
                return True
            speed_x.append((abs(x_time) / position) * s)
            speed_y.append((abs(y_time) / position) * s)

            x_time = x_semi[i]
            y_time = y_semi[i]

        return all(
            self.move(speed_x[i], x_semi[i], speed_y[i], y_semi[i])
            for i in range(0, len(x_semi))
        )

    def g3(self, x, y, s, raio) -> bool:
        """a diferença do g2 para o g3 é só a parte que esta comentada "sentido anti horario" """

        x0 = self.curr_position_x / -STEPS_PER_MM
        y0 = self.curr_position_y / -STEPS_PER_MM
        dx = x - x0
        dy = y - y0

        x_time = x
        y_time = y

        speed_x = []
        speed_y = []
        position = math.sqrt(dx**2 + dy**2)

        distancia = np.sqrt((x - x0) ** 2 + (y - y0) ** 2)

        if distancia > 2 * raio:
            # precisa colocar uma condição na interface para que o raio, seja no minimo distancia/2
            print(f"Erro: o raio deve ser maior que ({distancia / 2:.2f}) ")
            return

        meio_x, meio_y = (x0 + x) / 2, (y0 + y) / 2
        distancia_meio = np.sqrt(meio_x**2 + meio_y**2)

        if distancia_meio == 0 and x0 == 0 and y0 == 0:
            centro_x, centro_y = raio, 0
        else:
            h = np.sqrt(raio**2 - (distancia / 2) ** 2)

            perp_x = dy
            perp_y = -dx

            # sentido anti horario
            comprimento_perp = np.sqrt(perp_x**2 + perp_y**2)
            if comprimento_perp > 0:
                perp_x /= comprimento_perp
                perp_y /= comprimento_perp

            centro_x = meio_x + h * perp_x
            centro_y = meio_y + h * perp_y

        angulo_inicial = np.arctan2(y0 - centro_y, x0 - centro_x)
        angulo_final = np.arctan2(y - centro_y, x - centro_x)
        # sentido anti horario
        if angulo_final > angulo_inicial:
            angulo_final -= 2 * np.pi

        theta = np.linspace(angulo_inicial, angulo_final, int(position * 1.5))

        x_semi = centro_x + raio * np.cos(theta)
        y_semi = centro_y + raio * np.sin(theta)

        for i in range(len(x_semi)):
            x_semi[i] = round(x_semi[i] * 80, 0) / 80
            y_semi[i] = round(y_semi[i] * 80, 0) / 80

            x_time = x_semi[i] - x_time
            y_time = y_semi[i] - y_time
            position = math.sqrt(x_time**2 + y_time**2)

            if position == 0:
                return True
            speed_x.append((abs(x_time) / position) * s)
            speed_y.append((abs(y_time) / position) * s)
            x_time = x_semi[i]
            y_time = y_semi[i]

        return all(
            self.move(speed_x[i], x_semi[i], speed_y[i], y_semi[i])
            for i in range(0, len(x_semi))
        )

    def g28(self) -> bool:
        """
        Auto home. Finds home position by moving to the endstops.
        Returns false if calibration was not finished
        Returns true if calibration was finished
        """
        if self.move(0, 0, 50, -30000) and self.move(50, -30000, 0, 0):
            # Verifica se o movimento foi pausado, o 2o move só é chamado se o primeiro não foi pausado
            self.calibrated = True
            self.curr_position_x = 0
            self.curr_position_y = 0
            return True

        return False

    def move(self, speed_x, position_x, speed_y, position_y):
        # print(position_x, position_y)

        position_x *= -STEPS_PER_MM
        position_y *= -STEPS_PER_MM
        speed_x *= STEPS_PER_MM
        speed_y *= STEPS_PER_MM

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
            self.__move(speed_x * 2, position_x, speed_y * 2, position_y)
        except Exception as e:
            print(f"Movement error: {e}")
            raise
        finally:
            GPIO.output(STEP_PIN_X, False)
            GPIO.output(STEP_PIN_Y, False)
            self.movement_done.set()

            if self.pause_requested:
                self.pause_requested = False
                return False

            return True

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
            if self.pause_requested:
                return False

            current_time = time.time()

            # Check endstops
            if (
                GPIO.input(ENDSTOP_X_MIN) == GPIO.HIGH
                or GPIO.input(ENDSTOP_X_MAX) == GPIO.HIGH
            ):
                self.__handle_endstop_x()
                return True

            if (
                GPIO.input(ENDSTOP_Y_MIN) == GPIO.HIGH
                or GPIO.input(ENDSTOP_Y_MAX) == GPIO.HIGH
            ):
                self.__handle_endstop_y()
                return True

            # X axis movement
            # print(steps_remaining_x, steps_remaining_y)

            if (
                steps_remaining_x > 0
                and current_time - last_step_time_x >= step_interval_x
            ):
                GPIO.output(STEP_PIN_X, not GPIO.input(STEP_PIN_X))

                if GPIO.input(STEP_PIN_X):
                    self.curr_position_x += dir_x
                    steps_remaining_x -= 1

                steps_performed_x = total_steps_x - steps_remaining_x

                # Calcular velocidade atual com perfil exponencial para X
                if total_steps_x > 100:
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

                steps_performed_y = total_steps_y - steps_remaining_y

                # Calcular velocidade atual com perfil exponencial para Y
                if total_steps_y > 100:
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

        return True

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
