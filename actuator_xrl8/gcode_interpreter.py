import re

class Lexer:
    def __init__(self, gcode: str):
        Lexer.pattern = r'([\w]\-?[\d\.]+|"[\w ]*")'
        self._tokens = re.findall(Lexer.pattern, gcode.upper())
        self._i = 0

    def available(self):
        return self._i < len(self._tokens)

    def get_next_token(self):
        if self.available():
            self._i += 1
            return self._tokens[self._i - 1]
        else:
            return None

class GcodeInterpreter:
    def __init__(self, gcode: str, gcode_machine):
        self._lexer = Lexer(gcode)
        self._machine = gcode_machine

    def run(self):
        if self._lexer.available():
            tok = self._lexer.get_next_token()

            if tok == 'G0':
                tok = self._lexer.get_next_token()
                x = float(tok[1:]) if type(tok) is str and tok[0] == 'X' else False
                tok = self._lexer.get_next_token()
                y = float(tok[1:]) if type(tok) is str and tok[0] == 'Y' else False

                if (x, y) != (False, False):
                    self._machine.g0(x, y)
                    return True
                else:
                    return 'gcode error: malformed G0'

            elif tok == 'G1':
                tok = self._lexer.get_next_token()
                x = float(tok[1:]) if type(tok) is str and tok[0] == 'X' else False
                tok = self._lexer.get_next_token()
                y = float(tok[1:]) if type(tok) is str and tok[0] == 'Y' else False
                tok = self._lexer.get_next_token()
                s = float(tok[1:]) if type(tok) is str and tok[0] == 'S' else False

                if all([x, y, s]):
                    self._machine.g1(x, y, s)
                    return True
                else:
                    return 'gcode error: malformed G1'

            elif tok == 'G4':
                tok = self._lexer.get_next_token()
                p = int(tok[1:]) if type(tok) is str and tok[0] == 'P' else False

                if p:
                    self._machine.g4(p)
                    return True
                else:
                    return 'gcode error: malformed G4'

            elif tok == 'M1000':
                tok = self._lexer.get_next_token()
                f = int(tok[1:]) if type(tok) is str and tok[0] == 'F' else False
                s = self._lexer.get_next_token()[1:-1]

                if all([f, s]):
                    self._machine.m1000(f, s)
                    return True
                else:
                    return 'gcode error: malformed M1000'
                
            elif tok == 'M1004':
                tok = self._lexer.get_next_token()
                e = int(tok[1:]) if type(tok) is str and tok[0] == 'E' else False

                if e:
                    self._machine.m1004(e)
                    return True
                else:
                    return 'gcode error: malformed M1004'

            elif tok == 'G28':
                self._machine.g28()
                
            elif tok == 'G90':
                self._machine.g90()
                
            elif tok == 'G91':
                self._machine.g91()
                
            elif tok == 'M1001':
                self._machine.m1001()
                
            elif tok == 'M1002':
                self._machine.m1002()
                
            elif tok == 'M1003':
                self._machine.m1003()

            else:
                return f'gcode error: invalid "{tok}" code'
        else:
            return None

            
