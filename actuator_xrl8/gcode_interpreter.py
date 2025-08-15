import re

class Lexer:
    def __init__(self, gcode: str):
        Lexer.pattern = r'([GMXYSPFE][\d\.]+|"[\w ]*")'
        self._tokens = re.findall(Lexer.pattern, gcode)

    def __iter__(self):
        return self._tokens.__iter__()


## G0 Xn Yn Sn
## G1 Xn Yn Sn
## G4 Pn
## G28
## G90
## G91
## M1000 Fn "str"
## M1001
## M1002
## M1003
## M1004 En
