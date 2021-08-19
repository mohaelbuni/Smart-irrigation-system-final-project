var markerColor1 = 'yellow-dot.png'
var markerColor2 = 'blue-dot.png'
var drawingManager;
var selectedShape;
var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
var selectedColor;
var colorButtons = {};
var allShapes = []
var checkedDays = []
var firebaseShapes = []
var markers = []
var infoWindow
var linkedSensorID
var cronRule 


function deleteFromFirebase() {
    db.collection("shapes").where("shapeID", "==", selectedShape.overlayID).delete().then(function () {
        console.log("Document successfully deleted!");
    }).catch(function (error) {
        console.error("Error removing document: ", error);
    });
}
// generateUniqueID function
function generateUniqueID() {
    var rand;
    var exist;
    do {
        exist = 0;
        rand = Math.random() * Math.floor(Math.pow(10, 16));
        for (var i = 0; i < allShapes.length; i++) {
            if (allShapes[i].overlayID == rand)
                exist = exist + 1;
        }
    }
    while (exist > 0);
    return rand;
}

function clearSelection() {
    if (selectedShape) {
        if (selectedShape.type !== 'marker') {
            selectedShape.setEditable(false);
        }

        selectedShape = null;
    }
}

function setSelection(shape) {
    if (shape.type !== 'marker') {
        clearSelection();
        shape.setEditable(true);
        selectColor(shape.get('fillColor') || shape.get('strokeColor'));
    }
    selectedShape = shape;
}

function deleteSelectedShape() {
    console.log(selectedShape)
    if (selectedShape) {
        selectedShape.setMap(null);

        for (var i = 0; i < allShapes.length; i++) {
            if (allShapes[i].shapeID === selectedShape.overlayID) {
                console.log(selectedShape)
                allShapes.splice(i, 1);
            }

        }
    }
}

function selectColor(color) {
    selectedColor = color;
    for (var i = 0; i < colors.length; ++i) {
        var currColor = colors[i];
        colorButtons[currColor].style.border = currColor == color ? '2px solid #789' : '2px solid #fff';
    }

    // Retrieves the current options from the drawing manager and replaces the
    // stroke or fill color as appropriate.
    var polylineOptions = drawingManager.get('polylineOptions');
    polylineOptions.strokeColor = color;
    drawingManager.set('polylineOptions', polylineOptions);

    var rectangleOptions = drawingManager.get('rectangleOptions');
    rectangleOptions.fillColor = color;
    drawingManager.set('rectangleOptions', rectangleOptions);

    var circleOptions = drawingManager.get('circleOptions');
    circleOptions.fillColor = color;
    drawingManager.set('circleOptions', circleOptions);

    var polygonOptions = drawingManager.get('polygonOptions');
    polygonOptions.fillColor = color;
    drawingManager.set('polygonOptions', polygonOptions);
}

function setSelectedShapeColor(color) {
    if (selectedShape) {
        if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
            selectedShape.set('strokeColor', color);
        } else {
            selectedShape.set('fillColor', color);
        }
    }
}

function makeColorButton(color) {
    var button = document.createElement('span');
    button.className = 'color-button';
    button.style.backgroundColor = color;
    google.maps.event.addDomListener(button, 'click', function () {
        selectColor(color);
        setSelectedShapeColor(color);
    });

    return button;
}

function buildColorPalette() {
    var colorPalette = document.getElementById('color-palette');
    for (var i = 0; i < colors.length; ++i) {
        var currColor = colors[i];
        var colorButton = makeColorButton(currColor);
        colorPalette.appendChild(colorButton);
        colorButtons[currColor] = colorButton;
    }
    selectColor(colors[0]);
}
// 52.25097, 20.97114
//libya => 32.881502, 13.226586
function initMap() {
    infoWindow = new google.maps.InfoWindow;
    console.log('this is user loged in ', UserIN)
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: new google.maps.LatLng(32.881502, 13.226586),
        mapTypeId: 'terrain', //terrain,satellite
        disableDefaultUI: true,
        zoomControl: true
    });

    var polyOptions = {
        strokeWeight: 0,
        fillOpacity: 0.45,
        editable: true,
        draggable: true
    };
    // Creates a drawing manager attached to the map that allows the user to draw
    // markers, lines, and shapes.
    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        markerOptions: {
            draggable: true
        },
        polylineOptions: {
            editable: true,
            draggable: true
        },
        rectangleOptions: polyOptions,
        circleOptions: polyOptions,
        polygonOptions: polyOptions,
        map: map
    });
    // ________________________________________________________________________________________________________
    // uses setInterval function to check in every amount of time the status of soil sensor 
    // and change marker color depinding on sensor status
    setInterval(() => {
        if(sensorsLocation !== undefined){
            for (let i = 0; i < markers.length; i++) {
                markers[i].setMap(null)
                
            }
            markers = []
     
            for (let i = 0; i < sensorsLocation.length; i++) {
               
             
                    if (soilStatus[i] <10) {
                        var marker = new google.maps.Marker({
                            overlayID:sensorIDs[i],
                            soilStatus:soilStatus[i],
                            position: {
                                lat: sensorsLocation[i][0],
                                lng: sensorsLocation[i][1]
                            },
                            
                            icon: {
                                url: "http://maps.google.com/mapfiles/ms/icons/" + markerColor1
                            }
                        });
                        
                        markers.push(marker)
                        
                    
                    }
                    if (soilStatus[i] == 10) {
                        var marker = new google.maps.Marker({
                            overlayID:sensorIDs[i],
                            soilStatus:soilStatus[i],
                            position: {
                                lat: sensorsLocation[i][0],
                                lng: sensorsLocation[i][1]
                            },
                          
                            icon: {
                                url: "http://maps.google.com/mapfiles/ms/icons/" + markerColor2
                            }
                        });
                        
                        markers.push(marker)
                        
                        
                    }
                     
            }
            
            for (let i = 0; i < markers.length; i++) {
                
                markers[i].setMap(map)
       
                google.maps.event.addListener(markers[i],'rightclick',(event)=>{
                    var markercontent = '<h4 style="color:red; text-align:center;">marker Info</h4>' +
                    '<br><h5>' + 'marker ID: ' + markers[i].overlayID + '</h5>' + '<br><h5>' + 'marker status: ' + markers[i].soilStatus + '</h5>'

                // Replace the info window's content and position.
                infoWindow.setContent(markercontent);
                infoWindow.setPosition(event.latLng);

                infoWindow.open(map);
                })
                
            }
      
            
        }
        
        
    }, 1000)


    // ________________________________________________________________________________________________________________
    // this event run when user complet drawing the overlay 
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
        var newShape = e.overlay;
        newShape.type = e.type;
        newShape.overlayID = generateUniqueID()
        if (e.type !== google.maps.drawing.OverlayType.MARKER) {
            // Switch back to non-drawing mode after drawing a shape.
            drawingManager.setDrawingMode(null);
            // Add an event listener that selects the newly-drawn shape when the user
            // mouses down on it.
            google.maps.event.addListener(newShape, 'click', function (e) {
                if (e.vertex !== undefined) {
                    if (newShape.type === google.maps.drawing.OverlayType.POLYGON) {
                        var path = newShape.getPaths().getAt(e.path);

                        path.removeAt(e.vertex);
                        if (path.length < 3) {
                            newShape.setMap(null);
                        }
                    }
                    if (newShape.type === google.maps.drawing.OverlayType.POLYLINE) {
                        var path = newShape.getPath();
                        path.removeAt(e.vertex);
                        if (path.length < 2) {
                            newShape.setMap(null);
                        }
                    }
                }

                setSelection(newShape);
            });
            // polygon or polyline we use --->  getPath()
            // rectangle or circle we use --->  getBounds()
            // --------------------------------------------------
            // take every newShape properties and save them in shape object then push it in allShape array
            //  to store all these shapes in firebase
            if (newShape.type === 'polygon') {
                var shapeObj = newShape.getPath()
                var array = []
                var shapeColor = newShape.fillColor
                console.log(newShape)
                for (let j = 0; j < shapeObj.i.length; j++) {
                    var obj = {
                        lat: shapeObj.i[j].lat(),
                        lng: shapeObj.i[j].lng()
                    }
                    array.push(obj)
                }
                var shape = {
                    shapeType: newShape.type,
                    shapeID: newShape.overlayID,
                    color: shapeColor,
                    shapes: array,
                    user: UserIN
                }
                allShapes.push(shape)


            } else if (newShape.type === 'polyline') {
                var shapeObj = newShape.getPath()
                var array = []
                var shapeColor = newShape.strokeColor
                console.log(newShape)
                for (let j = 0; j < shapeObj.i.length; j++) {
                    var obj = {
                        lat: shapeObj.i[j].lat(),
                        lng: shapeObj.i[j].lng()
                    }
                    array.push(obj)
                }

                var shape = {
                    shapeType: newShape.type,
                    shapeID: newShape.overlayID,
                    color: shapeColor,
                    shapes: array,
                    user: UserIN
                }
                allShapes.push(shape)


            } else if (newShape.type === 'rectangle') {

                var shapeObj = newShape.getBounds()
                var array = []
                var shapeColor = newShape.fillColor
                var bounds = {
                    north: shapeObj.getNorthEast().lat(),
                    east: shapeObj.getNorthEast().lng(),
                    south: shapeObj.getSouthWest().lat(),
                    west: shapeObj.getSouthWest().lng()
                }
                array.push(bounds)
                var shape = {
                    shapeType: newShape.type,
                    color: shapeColor,
                    shapeID: newShape.overlayID,
                    shapes: array,
                    user: UserIN
                }
                allShapes.push(shape)



            } else if (newShape.type === 'circle') {
                var array = []
                var shapeColor = newShape.fillColor
                var obj = {
                    lat: newShape.getCenter().lat(),
                    lng: newShape.getCenter().lng(),
                    radius: newShape.getRadius()
                }
                array.push(obj)
                var shape = {
                    shapeType: newShape.type,
                    shapeID: newShape.overlayID,
                    color: shapeColor,
                    shapes: array,
                    user: UserIN
                }
                allShapes.push(shape)

            }
            google.maps.event.addListener(newShape, 'rightclick', function (event) {

                var deletedShape = db.collection('shapes').where('shapeID', '==', newShape.overlayID);
                deletedShape.get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        console.log(doc.data())
                        // "44 20 * * monday,thursday:11"
                        var temp = doc.data().cronRule
                        var durationOfIrrigation = temp.split(':')[1]
                        var temp2 = temp.split(':')[0]
                        var irrigationDays = temp2.split(' ')[4]
                        var irrigationHour = temp2.split(' ')[1]
                        var irrigationMinutes = temp2.split(' ')[0]
                        var contentString = '<h4 style="color:red; text-align:center;">Shape Info</h4>' +
                            '<br><h5>' + 'Crop Type: ' + doc.data().plantType + '</h5>' + '<br><h5>' 
                            + 'Irrigation Days: ' + irrigationDays + '</h5>'
                            + '<br><h5>' + 'Irrigation Time: ' +irrigationHour+':'+irrigationMinutes  + '</h5>'
                            + '<br><h5>' + 'Duration of Irrigation: ' + durationOfIrrigation + '</h5>'+ '<br><h5>' 
                            + 'Sensor ID: ' + doc.data().sensorID  + '</h5>'
                            

                        // Replace the info window's content and position.
                        infoWindow.setContent(contentString);
                        infoWindow.setPosition(event.latLng);

                        infoWindow.open(map);
                    });

                }).catch(function (e) {
                    console.log("error!!!")
                })



            });
            // //////////////////////////////////////////////////////////////////////////////////////////

            setSelection(newShape);
        } else {
            google.maps.event.addListener(newShape, 'click', function (e) {
                setSelection(newShape);
            });
            setSelection(newShape);
        }

    });
    // for recommendation
    // const irrigationForm = document.querySelector('#irrigation-form')
    const irrigationInput = document.querySelector('#plantType')
    const dropdown = document.querySelector('#recommendation')
    const intro = document.querySelector('#intro')
    const introBox = document.querySelector('#intro-box')

    irrigationInput.addEventListener('keyup', function (e) {

        const term = e.target.value.toLowerCase()
        const items = dropdown.getElementsByTagName('option')

        Array.from(items).forEach(function (item) {

            if (item.value.toLocaleLowerCase() == term) {

                db.collection("crops").get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        // doc.data() is never undefined for query doc snapshots
                        if (doc.data().cropType == item.value) {
                            intro.innerText = doc.data().info
                            intro.style.color = 'green'
                            intro.style.textAlign = 'left'
                            introBox.style.display = 'block'
                        }
                    });
                });

            }
        })
    })

    // Clear the current selection when the drawing mode is changed, or when the
    // map is clicked.
    google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
    google.maps.event.addListener(map, 'click', clearSelection);
    google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', () => {
        deleteSelectedShape()
        deleteFromFirebase()
    });

    // add every new shape drawing on map to firestore database
    // google.maps.event.addDomListener(document.getElementById('save-button'), 'click', saveInFireBase);
    document.getElementById('save-button').addEventListener('click',saveInFireBase)
// link sensors form
    google.maps.event.addDomListener(document.getElementById('link-form'), 'submit', function (e) {
        e.preventDefault()
        const linkForm = document.querySelector('#link-form')

        var selectedSensor = document.querySelector('#sensors').value
        var sensorID = selectedSensor.split('-')[1]
        console.log(sensorID)
        var shape = db.collection('shapes').where('shapeID', '==', selectedShape.overlayID);
           
            shape.get().then(function (querySnapshot) {
                querySnapshot.forEach(function (doc) {
                    doc.ref.update({
                        sensorID: sensorID
                        
                    });;
                });

            }).then(function () {
                // close() and reset() irrigation data form 
                const linkModal = document.querySelector('#link-modal');
                M.Modal.getInstance(linkModal).close();
                linkForm.reset();

            }).catch(function (e) {
                console.log("error!!!")
            })
    })






 // this is an event listener for irrifation-form to get all data from it ,and save it in fireStore DB
    google.maps.event.addDomListener(document.getElementById('irrigation-form'), 'submit', function (e) {
        e.preventDefault()
        const irrigationForm = document.querySelector('#irrigation-form');

        if (selectedShape == undefined) {
            // this is a validation to be sure selectedShape not be undefined
            alert('You must select which area you want to set irrigation to it')
        } else {

            // selected Day values
            const selectedDay = document.querySelector('#selected-data').children
            for (let i = 0; i < selectedDay.length; i++) {

                if (selectedDay[i].disabled == false && selectedDay[i].selected) {
                    checkedDays.push(selectedDay[i].outerText)
                }
            }
           
        
            // time picker value
            
            
            const timePicked = document.querySelector('#timePicked').value
            var hour = timePicked.split(':')[0]
            var minute = timePicked.split(':')[1].split(' ')[0]
            var dayOrNight = timePicked.split(' ')[1]
            // change an hour form 12 format to 24 format becuz the corn rule understand 24 format
            if (dayOrNight == 'PM') {
                hour = String(Number(hour) + 12)
            }
            // duration value
            const duration = document.querySelector('#duration').value
            // plant type
            const plantType = document.querySelector('#plantType').value
            // put a selected day in cron rule format and assign them in daysOfWeek var
            if (checkedDays.length > 0) {
                for (let j = 0; j < checkedDays.length; j++) {
                    if (j == 0) {
                        daysOfWeek = ''
                        daysOfWeek = daysOfWeek.concat(checkedDays[j])
                    } else {
                        daysOfWeek = daysOfWeek.concat(',', checkedDays[j])
                    }
                }
                checkedDays = []
            } else {
                alert('your not choose irrigation days , so irrigation day as default will be everyday.')
                daysOfWeek = '*'
            }
            // cron rule job finel format  
            var linkedshape = db.collection('shapes').where('shapeID', '==', selectedShape.overlayID);
            linkedshape.get().then(function (querySnapshot) {
                querySnapshot.forEach(function (doc) {
                   linkedSensorID = doc.data().sensorID
                   if(linkedSensorID == undefined){
                       alert("you shoul link your sensor with shape.")
                   }
                   cronRule = `${minute} ${hour} * * ${daysOfWeek}:${duration}:${linkedSensorID}`
                });

            })
            // add cron Rule job and plant type for selected Shape in fireStore database using update firebase function
            var deletedShape = db.collection('shapes').where('shapeID', '==', selectedShape.overlayID);
            console.log(deletedShape)
            deletedShape.get().then(function (querySnapshot) {
                querySnapshot.forEach(function (doc) {
                    doc.ref.update({
                        cronRule: cronRule,
                        plantType: plantType
                    });;
                });
                //send cronRule data to raspberry pi using pubnub
                publish(cronRule,UserIN)
                console.log('publish don')
            }).then(function () {
                // close() and reset() irrigation data form 
                const irrigationModal = document.querySelector('#irrigation-modal');
                M.Modal.getInstance(irrigationModal).close();
                irrigationForm.reset();
                intro.innerText = ''
                introBox.style.display = 'none'
                


            }).catch(function (e) {
                console.log("error!!!")
            })
        }

    });
    // __________________________________________________________________________________________________________________
    // uses this function to save all newShapes saved in allShapes array in firebase 
    //  
    function deleteFromFirebase() {

        var deletedShape = db.collection('shapes').where('shapeID', '==', selectedShape.overlayID);
        deletedShape.get().then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                doc.ref.delete();
            });
            console.log("success")
        }).catch(function (e) {
            console.log("error!!!")
        })

    }
    function initSensorslist() {
        var links = document.querySelector('#link')
        
        // create element
      if(sensorIDs){
        for (let i = 0; i < sensorIDs.length; i++) {
        
            var option = document.createElement('option')
            option.setAttribute('value', 'sensor-'+sensorIDs[i] )
        links.appendChild(option)
            
        }
      }

        
    }
    const logout = document.querySelector('#logout')
logout.addEventListener('click', (e) => {
    e.preventDefault()
    // auth.signOut()
            // Remove the event handler from <div>
document.getElementById("save-button").removeEventListener("click", saveInFireBase);
})
    function saveInFireBase() {
        
        for (let i = 0; i < allShapes.length; i++) {
            db.collection("shapes").add({
                    user: allShapes[i].user,
                    shapeType: allShapes[i].shapeType,
                    shapeID: allShapes[i].shapeID,
                    shape: allShapes[i].shapes,
                    color: allShapes[i].color
                })
            
        }
        alert('saved successfully')
        allShapes = []
    }
    // ______________________________________________________________________________________________________________________
    buildColorPalette();
    // init sensors list 
   
    //  init recommendation list from fireStore
    function getRecommendationFromFirebase() {
        db.collection("crops").get().then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                // doc.data() is never undefined for query doc snapshots
                var recommendation = document.querySelector('#recommendation')
                // create element
                var option = document.createElement('option')
                option.setAttribute('value', doc.data().cropType)
                recommendation.appendChild(option)

                // console.log(doc.id, " => ", doc.data().cropType);
            });
        });
    }

    // to get all user shapes from database and drawing these shapes on his map **********************************************************
    function getDataFromFirebase() {

        db.collection("shapes").where("user", "==", UserIN)
            .get()
            .then(function (querySnapshot) {
                querySnapshot.forEach(function (doc) {
                    // doc.data() is never undefined for query doc snapshots
                    var shapeData = doc.data()
                    firebaseShapes.push(doc.data())
                    var createdShape;
                    if (shapeData.shapeType === "circle") {
                        createdShape = new google.maps.Circle({
                            type: "circle",
                            overlayID: shapeData.shapeID,
                            map: map,
                            clickable: true,
                            editable: true,
                            fillColor: shapeData.color,
                            strokeColor: shapeData.color,
                            center: {
                                lat: shapeData.shape[0].lat,
                                lng: shapeData.shape[0].lng
                            },
                            radius: shapeData.shape[0].radius
                        });

                    } else if (shapeData.shapeType === "polygon") {
                        createdShape = new google.maps.Polygon({
                            type: "polygon",
                            overlayID: shapeData.shapeID,
                            map: map,
                            clickable: true,
                            editable: true,
                            fillColor: shapeData.color,
                            strokeColor: shapeData.color,
                            // in polygon use paths not path that is the difference betweeen polyline and polygon
                            paths: shapeData.shape
                        });
                    } else if (shapeData.shapeType === "rectangle") {
                        createdShape = new google.maps.Rectangle({
                            type: "rectangle",
                            overlayID: shapeData.shapeID,
                            map: map,
                            clickable: true,
                            editable: true,
                            fillColor: shapeData.color,
                            strokeColor: shapeData.color,
                            bounds: {
                                north: shapeData.shape[0].north,
                                east: shapeData.shape[0].east,
                                south: shapeData.shape[0].south,
                                west: shapeData.shape[0].west
                            }
                        });
                    } else if (shapeData.shapeType === "polyline") {
                        createdShape = new google.maps.Polyline({
                            type: "polyline",
                            map: map,
                            clickable: true,
                            editable: true,
                            strokeColor: shapeData.color,
                            // in polyline use path not paths
                            path: shapeData.shape
                        });
                    }

                    google.maps.event.addListener(createdShape, 'click', function () {
                        setSelection(this);
                    });
                    google.maps.event.addListener(createdShape, 'rightclick', function (event) {
                        var deletedShape = db.collection('shapes').where('shapeID', '==', createdShape.overlayID);
                        deletedShape.get().then(function (querySnapshot) {
                            querySnapshot.forEach(function (doc) {
                                console.log(doc.data())
                                var temp = doc.data().cronRule
                                    var durationOfIrrigation = temp.split(':')[1]
                                    var temp2 = temp.split(':')[0]
                                    var irrigationDays = temp2.split(' ')[4]
                                    var irrigationHour = temp2.split(' ')[1]
                                    var irrigationMinutes = temp2.split(' ')[0]

                                    var contentString = '<h4 style="color:red; text-align:center;">Shape Info</h4>' +
                                        '<br><h5>' + 'Crop Type: ' + doc.data().plantType + '</h5>' + '<br><h5>' + 'Irrigation Days: ' + irrigationDays + '</h5>'
                                        + '<br><h5>' + 'Irrigation Time: ' +irrigationHour+':'+irrigationMinutes  + '</h5>'
                                        + '<br><h5>' + 'Duration of Irrigation: ' + durationOfIrrigation + '</h5>'
                                        


                                // Replace the info window's content and position.
                                infoWindow.setContent(contentString);
                                infoWindow.setPosition(event.latLng);

                                infoWindow.open(map);
                            });

                        }).catch(function (e) {
                            console.log("error!!!")
                        })
                    });
                });


            })
            .catch(function (error) {
                console.log("Error getting documents: ", error);
            });

    }
    getDataFromFirebase()
    getRecommendationFromFirebase()
    setTimeout(function(){ 
         initSensorslist()
         }, 10000);
   
    // ***********************************************************************************************************

}