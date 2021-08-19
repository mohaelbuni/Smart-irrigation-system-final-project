const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
var data = []
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))
const port = process.env.PORT || 4000

// config service Account to make connection between server and firebase firestore database
var admin = require("firebase-admin");
var serviceAccount = require("./iot-plant-e048f-firebase-adminsdk-cfmld-########.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "##############"
});

let db = admin.firestore();
const auth = admin.auth();

// --------------------------------------------------------------------------------------------------------
// config Pubnub cloud
var PubNub = require('pubnub')

var pubnub = new PubNub({
    publishKey: '###########',
    subscribeKey: '###########',
});


// to publish something from server to hardwere
// function publish(a) {
    
    
//     var publishConfig = {
//         channel: "ch1",
//         message: a
//     };
//     pubnub.publish(publishConfig, function (status, response) {
//         // console.log(status, response);
//     });
// }

// to listen all pubnub channels

pubnub.addListener({
    message: function (m) {
        // handle message
        var channelName = m.channel; // The channel for which the message belongs
        var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
        var pubTT = m.timetoken; // Publish timetoken
        var msg = m.message; // The Payload
        var publisher = m.publisher; //The Publisher
      
        
        data = msg
      
        if (msg[6][0]!='0' || msg[7][0] != '0'){
            // store to data base
           
            if(msg[6][0]!='0'){
                db.collection("history").add({
                    user : channelName,
                    sensorID:1,
                    startIrrigationDate:msg[6][1],
                    durationOfIrrigation:msg[6][0],
                    myTimeStamp:admin.firestore.FieldValue.serverTimestamp()
                })
            }
            if(msg[7][0]!='0'){
                db.collection("history").add({
                    user : channelName,
                    sensorID:2,
                    startIrrigationDate:msg[7][1],
                    durationOfIrrigation:msg[7][0],
                    myTimeStamp:admin.firestore.FieldValue.serverTimestamp()
                })
            }
            
        }


    }
});
// ----------------------------------------------------------------------------------------------
var ts = []
// fetch all users in firestore and add them in array ts[].
// then and pubnub.subscribe ts[]
auth.listUsers(100).then((userRecords) => {
    userRecords.users.forEach((user) => {
      
        ts.push(user.email)

    });
    console.log('Retrieved users list successfully.');
    console.log('channels: ', ts)
    pubnub.subscribe({
        channels: ts,
    });
}).catch((error) => console.log(error));
// socket.io connection between server and web page 
io.on('connection', (socket) => {
    setInterval(() => {
        socket.emit('some', data)
    }, 500)
    socket.on('newUser', (val) => {
        ts.push(val)
        pubnub.subscribe({
            channels: ts,
        });
    })
})
server.listen(port, () => {
    console.log(`server running on port ${port}`)
});