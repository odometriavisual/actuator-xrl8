from flask import Flask, render_template, request, jsonify
import subprocess
import json
import time
from motor import Motor  # Assumindo que este módulo existe

app = Flask(__name__)

# Variáveis de estado
current_position_x = 0
current_position_y = 0

class MotorController:
    def __init__(self):
        self.motor = Motor()
    
    def move(self, speed_x, position_x, speed_y, position_y):
        """Move os motores para as posições especificadas"""
        # Implementação depende da sua classe Motor
        print("entrou no app")
        self.motor.move(speed_x, position_x, speed_y, position_y)
        self.motor.movement_done.wait()
        self.motor.movement_done.clear()
        return position_x, position_y

motor_controller = MotorController()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run_acquisition', methods=['POST'])
def run_acquisition_route():
    global current_position_x, current_position_y
    
    try:
        data = request.get_json()
        speed_x = float(data.get('speedX', 0))
        position_x = float(data.get('loocalX', 0))
        speed_y = float(data.get('speedY', 0))
        position_y = float(data.get('loocalY', 0))

        # Move os motores
        new_x, new_y = motor_controller.move(speed_x, position_x, speed_y, position_y)
        
        # Atualiza posições
        current_position_x += new_x
        current_position_y += new_y
        
        return jsonify({
            "status": "success",
            "message": "Acquisition completed",
            "current_position_x": current_position_x,
            "current_position_y": current_position_y
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/return_to_initial', methods=['POST'])
def return_to_initial():
    global current_position_x, current_position_y
    
    try:
        # Move de volta para a posição (0,0)
        motor_controller.move(7000, -current_position_x, 7000, -current_position_y)
        
        # Reseta as posições
        current_position_x = 0
        current_position_y = 0
        
        return jsonify({
            "status": "success",
            "message": "Motores retornaram ao ponto inicial"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/shutdown', methods=['POST'])
def shutdown():
    try:
        subprocess.run(['sudo', 'shutdown', 'now'], check=True)
        return jsonify({
            "status": "success",
            "message": "Raspberry Pi está desligando..."
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
