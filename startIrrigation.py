
import sys
from gpiozero import LED, Button
from time import sleep
import time
from datetime import date



# Pump is connected to GPIO4 as an LED
pump = LED(4)
# Pump2 is connected to GPIO3 as an LED
pump2 = LED(3)
# Soil Moisture sensor is connected to GPIO14 as a button
soil = Button(14)
# Soil2 Moisture sensor is connected to GPIO15 as a button
soil2 = Button(15)
# make sure the program starts with the pump turned off
# (conventions are backwards for the pump i.e. .on()=='off' and .off()=='on')

pump.on()
pump2.on()

if sys.argv[2] == '1':
    pump.off()
    sleep(int(sys.argv[1]))
    pump.on()
elif sys.argv[2] == '2':
    pump2.off()
    sleep(int(sys.argv[1]))
    pump2.on()  


print('irrigation is done.')
