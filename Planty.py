import sys
from crontab import CronTab
# import PubNub
# from pubnub.pnconfiguration import PNConfiguration
# from pubnub.pubnub import PubNub
# from pubnub.callbacks import SubscribeCallback
# from pubnub.enums import PNOperationType, PNStatusCategory
import Adafruit_DHT
from gpiozero import LED, Button
from time import sleep
import time
from datetime import date
from datetime import datetime

from pubnub.callbacks import SubscribeCallback
from pubnub.enums import PNStatusCategory
from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
import Adafruit_ADS1x15


# Create an ADS1115 ADC (16-bit) instance.
adc = Adafruit_ADS1x15.ADS1115()




pnconfig = PNConfiguration()
pnconfig.subscribe_key = "sub-c-b3c32d9e-2321-11ea-894a-b6462cb07a90"
pnconfig.publish_key = "pub-c-207cc150-5166-4d6f-b5c8-69ad7b50f894"
pnconfig.ssl = False

pubnub = PubNub(pnconfig)

# Pump is connected to GPIO4 as an LED
# pump = LED(4)
# Pump2 is connected to GPIO3 as an LED
# pump2 = LED(3)
# Pump is connected to GPIO5 as an LED
pump = LED(5)
# Pump2 is connected to GPIO6 as an LED
pump2 = LED(6)

# DHT Sensor is connected to GPIO17
sensor = 22
pin = 17

# Soil Moisture sensor is connected to GPIO14 as a button
# soil = Button(14)
# Soil2 Moisture sensor is connected to GPIO15 as a button
# soil2 = Button(15)
# Soil Moisture sensor is connected to GPIO5 as a button
# soil = Button(5)
# Soil2 Moisture sensor is connected to GPIO6 as a button
# soil2 = Button(6)

flag = 1
xflag = 1
yflag = 1
xStartDate = ' '
yStartDate = ' '
GAIN = 2
# make sure the program starts with the pump turned off
# (conventions are backwards for the pump i.e. .on()=='off' and .off()=='on')
pump.on()
pump2.on()


class MySubscribeCallback(SubscribeCallback):

    def presence(self, pubnub, presence):
        pass  # handle incoming presence data

    def message(self, pubnub, message):
        if message.message == 'ON':
            global flag
            flag = 1
        elif message.message == 'OFF':
            flag = 0
        elif message.message == 'WATER':
            pump.off()
            pump2.off()
            sleep(5)
            pump.on()
            pump2.on()
        else:
            flag = 0  # to exit from auto mode
            pump.on()
            pump2.on()
            print('cron job sended now ...................!!!!!!!!!!!!',
                  message.message)
            cronRule = message.message
            splitedRule=cronRule.split(' ')
            minute= splitedRule[0]
            hour=splitedRule[1]   
            duration = splitedRule[4].split(':')[1]
            linkedSensor = splitedRule[4].split(':')[2]
            dayOfWeek = splitedRule[4].split(':')[0].split(',') 
            
            print('results: ',cronRule,splitedRule,minute,hour,duration,linkedSensor,dayOfWeek) 
            cron = CronTab(user=True)
            job = cron.new(command='python startIrrigation.py {} {}'.format(duration,linkedSensor))
            # job.minute.every(1)
            job.minute.on(int(minute))
            job.hour.on(int(hour))
            count = 0
            while (count < len(dayOfWeek)):     
                if count == 0:
                    job.dow.on(dayOfWeek[count])
                    count = count + 1
                else:
                    job.dow.also.on(dayOfWeek[count])
                    count = count + 1
                        
            cron.write()

pubnub.add_listener(MySubscribeCallback())
pubnub.subscribe().channels('moha@gmail').execute()

while True:
    time.sleep(5)
    if flag == 1:
        sleep(1)
        xDiff = 0
        yDiff = 0
        # Try to grab a sensor reading.  Use the read_retry method which will retry up
        # to 15 times to get a sensor reading (waiting 2 seconds between each retry).
        # humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)

        dateToday = str(date.today())
        location = [[32.881427, 13.226611], [32.881502, 13.226586]]
        sonsorID = [1,2]
        # location2 = [[32.887087, 13.203893], [32.884778, 13.202446]]
        channelName = 'moha@gmail.com'
        
        # soilStatus=[soil.is_held,soil2.is_held]
        # channelName2 = 'ali@gmail.com'
        # DHT_Read = (
        #     'Temp={0:0.1f}*  Humidity={1:0.1f}%'.format(temperature, humidity))
        # print(DHT_Read)

        
  
        cha0 = adc.read_adc(0, gain=GAIN)
        cha1 = adc.read_adc(1, gain=GAIN)
        cha2 = adc.read_adc(2, gain=GAIN)
        cha3 = adc.read_adc(3, gain=GAIN)
        
        soilLevel1 = int((cha1 * 10)/32000)
        soilLevel3 = int((cha3 * 10)/32000)
        soilStatus=[soilLevel1,soilLevel3]

        print(f' cha1 {soilLevel1}  cha3 {soilLevel3}')   


      
        if soilLevel1 == 10:
            if xflag == 1:
                xflag=0
                xStartDate = datetime.now()
                print(xStartDate)

            pump.off()
            print('soil 1 on')
        if soilLevel1 < 10:
            if xflag == 0:
                xflag=1
                xEndDate = datetime.now()
                DiffX = xEndDate - xStartDate
                xDiff = DiffX.total_seconds()
                print("this is a duration in seconds ===> ",xDiff)
                
            pump.on()  
            print('soil 1 off') 
        if soilLevel3 == 10:
            if yflag == 1:
                yflag=0
                yStartDate = datetime.now()
                print(yStartDate)
            pump2.off()
            print('soil 1 on')
        if soilLevel3 < 10:
            if yflag == 0:
                yflag=1
                yEndDate = datetime.now()
                DiffY = yEndDate - yStartDate
                yDiff = DiffY.total_seconds()
                print("this is a duration in deconds ===> ",yDiff)
            pump2.on()
            print('soil 2 off') 
        DHT = [flag,
               soilStatus, location, channelName,sonsorID, dateToday , [str(xDiff),str(xStartDate)],[str(yDiff),str(yStartDate)]]

        pubnub.publish().channel(channelName).message(DHT).sync()