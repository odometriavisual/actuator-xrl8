# Supported GCODE commands

## G0 Xn Yn Sn
Fast linear movement. Used when the acquire is disabled.

## G1 Xn Yn Sn
Linear movement. Used when the acquire is enabled.

## G2 Xn Yn Sn Rn
Clockwise arc movement. 

## G3 Xn Yn Sn Rn
Counterclockwise arc movement. 

## G4 Pn
Dwell. Stops for n millisecons.

## G28
Auto home. Find home by moving to the endstops.

## G90
Absolute coordinates. Movement commands use absolute coordinates.

## G91
Relative coordinates. Movement commands use relative coordinates.

## M1000 Fn "str"
Start encoder. Sends the command `start_acquisition` to the virtual encoder.
The parameter `pulses_per_second` is given by n and `reason` is given by the quoted string.

## M1001
Stop encoder. Sends the command `stop_acquisition` to the virtual encoder.

## M1002
Streaming on. Sends the command `start_stream` to the virtual encoder.

## M1003
Streaming off. Sends the command `stop_stream` to the virtual encoder.

## M1004 En
Set exposure. Sets the camera's exposture to n microseconds.
