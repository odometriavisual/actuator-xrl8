import RPi.GPIO as GPIO
import time
import multiprocessing

GPIO.setwarnings(False)  
GPIO.cleanup()  

# Pin definitions (adjust according to your wiring)
STEP_PIN_X = 10      # Step pin for X axis
DIR_PIN_X = 22       # Direction pin for X axis
STEP_PIN_Y = 27      # Step pin for Y axis
DIR_PIN_Y = 17       # Direction pin for Y axis

# Endstop pins
BUTTON = 14
ENDSTOP_X_MIN = 15  # Endstop for X min
ENDSTOP_X_MAX = 18   # Endstop for X max
ENDSTOP_Y_MIN = 23   # Endstop for Y min
ENDSTOP_Y_MAX = 24   # Endstop for Y max


RETURN_SPEED = 500   # Default return speed (steps/s)
DEFAULT_INTERVAL = 0.0005  # Default step interval

class Motor:
    def __init__(self, rampup_proportion=0.1, rampdown_proportion=0.1,
                 max_position=130000, min_position=-130000):

        GPIO.setwarnings(False)
        GPIO.cleanup()
        
        # Movement parameters
        self.rampup_proportion = rampup_proportion
        self.rampdown_proportion = rampdown_proportion
        self.max_position = max_position
        self.min_position = min_position
        self.curr_position_x = 0
        self.curr_position_y = 0
        
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


    
    def move(self, speed_x, position_x, speed_y, position_y):

        self.emergency_stop = False
        self.movement_done.clear()
        
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
        if (position_x > self.max_position or position_x < self.min_position or 
            position_y > self.max_position or position_y < self.min_position):
            raise ValueError("Desired position out of bounds")
            
        # Setup X axis movement
        dir_x = 1 if position_x > self.curr_position_x else -1
        GPIO.output(DIR_PIN_X, dir_x == 1)
        total_steps_x = abs(position_x - self.curr_position_x)
        steps_remaining_x = total_steps_x
        initial_slow_steps_x = int(total_steps_x * self.rampup_proportion)
        final_slow_steps_x = int(total_steps_x * self.rampdown_proportion)
        step_interval_x = 1.0 / speed_x if speed_x > 0 else float('inf')
        
        # Setup Y axis movement
        dir_y = 1 if position_y > self.curr_position_y else -1
        GPIO.output(DIR_PIN_Y, dir_y == 1)
        total_steps_y = abs(position_y - self.curr_position_y)
        steps_remaining_y = total_steps_y
        initial_slow_steps_y = int(total_steps_y * self.rampup_proportion)
        final_slow_steps_y = int(total_steps_y * self.rampdown_proportion)
        step_interval_y = 1.0 / speed_y if speed_y > 0 else float('inf')
        
        # Initialize timing
        last_step_time_x = last_step_time_y = time.time()
        
        while (steps_remaining_x > 0 or steps_remaining_y > 0) and not self.emergency_stop:
            current_time = time.time()
            
            # Check endstops
            if GPIO.input(ENDSTOP_X_MIN) == GPIO.HIGH or GPIO.input(ENDSTOP_X_MAX) == GPIO.HIGH:
                self.__handle_endstop_x()
                return
                
            if GPIO.input(ENDSTOP_Y_MIN) == GPIO.HIGH or GPIO.input(ENDSTOP_Y_MAX) == GPIO.HIGH:
                self.__handle_endstop_y()
                return
            
            # X axis movement
            if steps_remaining_x > 0 and current_time - last_step_time_x >= step_interval_x:
                GPIO.output(STEP_PIN_X, not GPIO.input(STEP_PIN_X))
                
                if GPIO.input(STEP_PIN_X):
                    self.curr_position_x += dir_x
                    steps_remaining_x -= 1
                    
                    # Calculate current speed for next step
                    steps_completed_x = total_steps_x - steps_remaining_x
                    if steps_completed_x <= initial_slow_steps_x:
                        # Ramp up
                        factor = steps_completed_x / initial_slow_steps_x
                        step_interval_x = (1.0 / (speed_x * factor)) if factor > 0 else 0.1
                    elif steps_completed_x > (total_steps_x - final_slow_steps_x):
                        # Ramp down
                        factor = (total_steps_x - steps_completed_x) / final_slow_steps_x
                        step_interval_x = (1.0 / (speed_x * factor)) if factor > 0 else 0.1
                    else:
                        # Constant speed
                        step_interval_x = 1.0 / speed_x
                
                last_step_time_x = current_time
            
            # Y axis movement
            if steps_remaining_y > 0 and current_time - last_step_time_y >= step_interval_y:
                GPIO.output(STEP_PIN_Y, not GPIO.input(STEP_PIN_Y))
                
                if GPIO.input(STEP_PIN_Y):
                    self.curr_position_y += dir_y
                    steps_remaining_y -= 1
                    
                    # Calculate current speed for next step
                    steps_completed_y = total_steps_y - steps_remaining_y
                    if steps_completed_y <= initial_slow_steps_y:
                        # Ramp up
                        factor = steps_completed_y / initial_slow_steps_y
                        step_interval_y = (1.0 / (speed_y * factor)) if factor > 0 else 0.1
                    elif steps_completed_y > (total_steps_y - final_slow_steps_y):
                        # Ramp down
                        factor = (total_steps_y - steps_completed_y) / final_slow_steps_y
                        step_interval_y = (1.0 / (speed_y * factor)) if factor > 0 else 0.1
                    else:
                        # Constant speed
                        step_interval_y = 1.0 / speed_y
                
                last_step_time_y = current_time

    
    def __handle_endstop_x(self):
        pressed = []
        if GPIO.input(ENDSTOP_X_MIN) == GPIO.HIGH:
            pressed.append("X Min")
        if GPIO.input(ENDSTOP_X_MAX) == GPIO.HIGH:
            pressed.append("X Max")
        
        print(f"X axis endstop triggered ({', '.join(pressed)})! Reversing...")
        self.__reverse_motion(STEP_PIN_X, DIR_PIN_X, 'x')

    def __handle_endstop_y(self):
        pressed = []
        if GPIO.input(ENDSTOP_Y_MIN) == GPIO.HIGH:
            pressed.append("Y Min")
        if GPIO.input(ENDSTOP_Y_MAX) == GPIO.HIGH:
            pressed.append("Y Max")
        
        print(f"Y axis endstop triggered ({', '.join(pressed)})! Reversing...")
        self.__reverse_motion(STEP_PIN_Y, DIR_PIN_Y, 'y')

    def __reverse_motion(self, step_pin, dir_pin, axis):
        current_dir = GPIO.input(dir_pin)
        new_dir = not current_dir
        GPIO.output(dir_pin, new_dir)
        
        steps = 0
        while steps < 1000:  # Move back fixed number of steps
            GPIO.output(step_pin, True)
            time.sleep(DEFAULT_INTERVAL/2)
            GPIO.output(step_pin, False)
            time.sleep(DEFAULT_INTERVAL/2)
            steps += 1
            
            # Update position
            if axis == 'x':
                self.curr_position_x += -1 if new_dir else 1
            else:
                self.curr_position_y += -1 if new_dir else 1
        
        print(f"{axis.upper()} axis endstop cleared! Reverse motion completed.")
        self.emergency_stop = True


    def cleanup(self):
        """Clean up GPIO resources"""
        GPIO.cleanup()

