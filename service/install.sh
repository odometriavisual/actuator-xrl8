#!/bin/bash

# Installs system files for the actuator
# 
if [ $UID != 0 ]
then
        echo "Execute as root: sudo $0"
        echo "Exiting without any changes..."
        exit
fi

install -m 644 service/actuator-xrl8.service /etc/systemd/system

systemctl daemon-reload

systemctl enable actuator-xrl8.service

echo "Service enabled, reboot system or run 'systemctl start actuator-xrl8' to start service..."
