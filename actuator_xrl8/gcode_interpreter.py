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

        self._commands = []
        self._parse()

    def _parse(self):
        while self._lexer.available():
            tok = self._lexer.get_next_token()

            if tok == "G0":
                tok = self._lexer.get_next_token()
                x = float(tok[1:]) if type(tok) is str and tok[0] == "X" else None
                tok = self._lexer.get_next_token()
                y = float(tok[1:]) if type(tok) is str and tok[0] == "Y" else None

                if (x, y) != (None, None):
                    self._commands.append(("G0", x, y))
                else:
                    print(f"gcode error: malformed G0: {x = }, {y = }")

            elif tok == "G1":
                tok = self._lexer.get_next_token()
                x = float(tok[1:]) if type(tok) is str and tok[0] == "X" else None
                tok = self._lexer.get_next_token()
                y = float(tok[1:]) if type(tok) is str and tok[0] == "Y" else None
                tok = self._lexer.get_next_token()
                s = float(tok[1:]) if type(tok) is str and tok[0] == "S" else None

                if all(i is not None for i in [x, y, s]):
                    self._commands.append(("G1", x, y, s))
                else:
                    print(f"gcode error: malformed G1: {x = }, {y = }, {s = }")

            elif tok == "G2":
                tok = self._lexer.get_next_token()
                x = float(tok[1:]) if type(tok) is str and tok[0] == "X" else None
                tok = self._lexer.get_next_token()
                y = float(tok[1:]) if type(tok) is str and tok[0] == "Y" else None
                tok = self._lexer.get_next_token()
                s = float(tok[1:]) if type(tok) is str and tok[0] == "S" else None
                tok = self._lexer.get_next_token()
                r = float(tok[1:]) if type(tok) is str and tok[0] == "R" else None

                if all(i is not None for i in [x, y, s, r]):
                    self._commands.append(("G2", x, y, s, r))
                else:
                    print(f"gcode error: malformed G2: {x = }, {y = }, {s = }, {r = }")

            elif tok == "G3":
                tok = self._lexer.get_next_token()
                x = float(tok[1:]) if type(tok) is str and tok[0] == "X" else None
                tok = self._lexer.get_next_token()
                y = float(tok[1:]) if type(tok) is str and tok[0] == "Y" else None
                tok = self._lexer.get_next_token()
                s = float(tok[1:]) if type(tok) is str and tok[0] == "S" else None
                tok = self._lexer.get_next_token()
                r = float(tok[1:]) if type(tok) is str and tok[0] == "R" else None

                if all(i is not None for i in [x, y, s, r]):
                    self._commands.append(("G3", x, y, s, r))
                else:
                    print(f"gcode error: malformed G3: {x = }, {y = }, {s = }, {r = }")

            elif tok == "G4":
                tok = self._lexer.get_next_token()
                p = int(tok[1:]) if type(tok) is str and tok[0] == "P" else None

                if p is not None:
                    self._commands.append(("G4", p))
                else:
                    print(f"gcode error: malformed G4: {p = }")

            elif tok == "M1000":
                tok = self._lexer.get_next_token()
                f = int(tok[1:]) if type(tok) is str and tok[0] == "F" else None
                s = self._lexer.get_next_token()[1:-1]

                if all(i is not None for i in [f, s]):
                    self._commands.append(("M1000", f, s))
                else:
                    print(f"gcode error: malformed M1000: {f = }, {s = }")

            elif tok == "M1004":
                tok = self._lexer.get_next_token()
                e = int(tok[1:]) if type(tok) is str and tok[0] == "E" else None

                if e:
                    self._commands.append(("M1004", e))
                else:
                    print(f"gcode error: malformed M1004: {e = }")

            elif tok in ["G28", "G90", "G91", "M1001", "M1002", "M1003"]:
                self._commands.append((tok,))

            else:
                print(f'gcode error: invalid "{tok}" code')

    def is_finished(self):
        return len(self._commands) == 0

    def step(self):
        if not self.is_finished():
            comm = self._commands[0][0]

            if comm == "G0":
                x = self._commands[0][1]
                y = self._commands[0][2]

                if (x, y) != (None, None):
                    if self._machine.g0(x, y):
                        self._commands.pop(0)
                        return True
                    else:
                        return False
                else:
                    return "interpreter error: malformed G0"

            elif comm == "G1":
                x, y, s = self._commands[0][1:]

                if all(i is not None for i in [x, y, s]):
                    if self._machine.g1(x, y, s):
                        self._commands.pop(0)
                        return True
                    else:
                        return False
                else:
                    return "interpreter error: malformed G1"

            elif comm == "G2":
                x, y, s, r = self._commands[0][1:]

                if all(i is not None for i in [x, y, s]):
                    if self._machine.g2(x, y, s, r):
                        self._commands.pop(0)
                        return True
                    else:
                        return False
                else:
                    return "interpreter error: malformed G2"

            elif comm == "G3":
                x, y, s, r = self._commands[0][1:]

                if all(i is not None for i in [x, y, s]):
                    if self._machine.g3(x, y, s, r):
                        self._commands.pop(0)
                        return True
                    else:
                        return False
                else:
                    return "interpreter error: malformed G3"

            elif comm == "G4":
                p = self._commands[0][1]

                if p is not None:
                    self._machine.g4(p)
                    self._commands.pop(0)
                    return True
                else:
                    return "interpreter error: malformed G4"

            elif comm == "M1000":
                f = self._commands[0][1]
                s = self._commands[0][2]

                if all(i is not None for i in [f, s]):
                    self._machine.m1000(f, s)
                    self._commands.pop(0)
                    return True
                else:
                    return "interpreter error: malformed M1000"

            elif comm == "M1004":
                e = self._commands[0][1]

                if e:
                    self._machine.m1004(e)
                    self._commands.pop(0)
                    return True
                else:
                    return "interpreter error: malformed M1004"

            elif comm == "G28":
                if self._machine.g28():
                    self._commands.pop(0)
                    return True
                else:
                    return False

            elif comm == "G90":
                self._machine.g90()
                self._commands.pop(0)

            elif comm == "G91":
                self._machine.g91()
                self._commands.pop(0)

            elif comm == "M1001":
                self._machine.m1001()
                self._commands.pop(0)

            elif comm == "M1002":
                self._machine.m1002()
                self._commands.pop(0)

            elif comm == "M1003":
                self._machine.m1003()
                self._commands.pop(0)

            else:
                return f'interpreter error: invalid command {comm}"'

            return True
        else:
            return None
