// const socket = io()
const content = document.querySelector('#user-content')
const mapArea = document.querySelector('#mapArea')
const canvasArea = document.querySelector('#canvas')
const historyBtn = document.querySelector('#history-btn')
const forwardBtn = document.querySelector('#forward-btn')
const backwardBtn = document.querySelector('#backward-btn')
const forwardBackwardBtn = document.querySelector('#forwardBackward-btn')
const whenLogOut = document.querySelector('#whenLogOut')
const historyCard = document.querySelector('#history-card')
const navColor = document.querySelector('#nav-color')
const passwordError = document.querySelector('#error-password')
let labelsDate = []
let durationData = []
let labelsChart = []
let dataChart = []
let historyFlag = 11
let toSkip = 0
let iCount = 5

auth.onAuthStateChanged(user => {
    if (user) {
        console.log('user logged in : ', user.email)
        UserIN = user.email
        content.style.display = 'flex'
        whenLogOut.style.display = 'none'
        navColor.style.backgroundColor = '#26a69a'

        setupUI(user);
        creatMapElements()
        creatCanvasElements()
        initMap()
        
    } else {
        console.log('user logged out.', user)
        content.style.display = 'none'
        whenLogOut.style.display = 'block'
        UserIN = user
        setupUI();
        navColor.style.backgroundColor = '#00000038'
        removeMapElements()
        removeCanvasElements()
    }
})
// signup 
const signupForm = document.querySelector('#signup-form')
signupForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = signupForm['signup-email'].value
    const password = signupForm['signup-password'].value

    // sign up the user
    auth.createUserWithEmailAndPassword(email, password).then(cred => {
        socket.emit('newUser', email)
        const modal = document.querySelector('#modal-signup')
        M.Modal.getInstance(modal).close()
        signupForm.reset()
    })
})
// logout
const logout = document.querySelector('#logout')
logout.addEventListener('click', (e) => {
    e.preventDefault()
    auth.signOut()
})
// login
const loginForm = document.querySelector('#login-form')
loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = loginForm['login-email'].value
    const password = loginForm['login-password'].value
    auth.signInWithEmailAndPassword(email, password).then((cred) => {
        passwordError.style.display = 'none'
        const modal = document.querySelector('#modal-login')
        M.Modal.getInstance(modal).close()
        loginForm.reset()
    }).catch(error => {
        passwordError.innerText = error.message
        passwordError.style.color = 'red'
        passwordError.style.display = 'block'
    })
})

// this function to create map div and color palette when user loged in
function creatMapElements() {
    // map div
    var mapDiv = document.createElement('DIV')
    var att = document.createAttribute("id");
    att.value = "map";
    mapDiv.setAttributeNode(att);
    // color palette div
    var colorPalette = document.createElement('DIV')
    var att2 = document.createAttribute("id");
    att2.value = "color-palette";
    colorPalette.setAttributeNode(att2);
    // space element
    var space = document.createElement('BR')
    var att3 = document.createAttribute("id");
    att3.value = "space";
    space.setAttributeNode(att3);
    // append all element in mapArea div
    mapArea.appendChild(colorPalette)
    mapArea.appendChild(space)
    mapArea.appendChild(mapDiv)
}
// this function to create myChart canvas when user loged in
function creatCanvasElements() {
    // map div
    var chartCanvas = document.createElement('CANVAS')
    var att = document.createAttribute("id");
    att.value = "myChart";
    chartCanvas.setAttributeNode(att);

    // append element in canvasArea 

    canvasArea.appendChild(chartCanvas)
    // canvasArea.style.display = 'none'
    // forwardBackwardBtn.style.display = 'none'
  


}
// this function to remove canvas element we created when user logOut
function removeCanvasElements() {

    // The Node.contains() method is check if an element called “myChart” exists or not
    if (document.body.contains(document.getElementById('myChart'))) {
        document.querySelector('#myChart').remove()
    }

}
// this function to remove all element we created when user logOut
function removeMapElements() {
    // remove all previous data of the previous user
    pyData = undefined
	temperature = undefined
	humidity = undefined
	soilStatus = undefined
	sensorsLocation = undefined
    sensorIDs = undefined
	dateToday = undefined
    // The Node.contains() method is check if an element called “map and space and color-palette” exists or not
    if (document.body.contains(document.getElementById('map'))) {
        document.querySelector('#map').remove()

    }
    if (document.body.contains(document.getElementById('space'))) {
        document.querySelector('#space').remove()
    }
    if (document.body.contains(document.getElementById('color-palette'))) {
        document.querySelector('#color-palette').remove()
    }

}
historyBtn.addEventListener('click',(e)=>{
    e.preventDefault()
    if (historyFlag == 11){
        db.collection("history").where("user", "==", UserIN).orderBy('myTimeStamp')
        .get()
        .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                var str = "sensorID "+doc.data().sensorID+" at "+doc.data().startIrrigationDate
                    labelsDate.push(str)
                    durationData.push(doc.data().durationOfIrrigation)

    
            })
            for (let index = 0; index < 5; index++) {
                labelsChart.push(labelsDate[index])
                dataChart.push(durationData[index])
                
            }
            initChart()
        })
        historyCard.style.display = 'block'
        // canvasArea.style.display = 'block'
        // forwardBackwardBtn.style.display = 'block'
        let x = setInterval(() => {
            window.scrollTo(0,document.body.scrollHeight);
            clearInterval(x);
        }, 1000);
        historyFlag = 0
    }else if(historyFlag == 0 ){
        historyCard.style.display = 'none'
        // canvasArea.style.display = 'none'
        // forwardBackwardBtn.style.display = 'none'
        historyFlag = 1
    }else if(historyFlag == 1){
        historyCard.style.display = 'block'
        // canvasArea.style.display = 'block'
        // forwardBackwardBtn.style.display = 'block'
        let x = setInterval(() => {
            window.scrollTo(0,document.body.scrollHeight);
            clearInterval(x);
        }, 100);

        
        historyFlag = 0
    }


})
// let labelsDate = []
// let durationData = []
forwardBtn.addEventListener('click',(e)=>{
    e.preventDefault()
  
    if(iCount < labelsDate.length){
        removeCanvasElements()
        creatCanvasElements()
        labelsChart = []
        dataChart = []
        // canvasArea.style.display = 'block'
        // forwardBackwardBtn.style.display = 'block'
        for (let index =iCount; index < iCount+5; index++){
            if(labelsDate[index] != undefined || durationData[index]!= undefined){
                labelsChart.push(labelsDate[index])
                dataChart.push(durationData[index])
            }

           
        }
    
        initChart()
        iCount = iCount + 5
        let x = setInterval(() => {
            window.scrollTo(0,document.body.scrollHeight);
            clearInterval(x);
        }, 100);
        console.log(iCount)
    }else {
        alert("there is no more history.")
    }
})
backwardBtn.addEventListener('click',(e)=>{
    e.preventDefault()
    if(iCount > 5){
        iCount = iCount - 5
        console.log(iCount)
        removeCanvasElements()
        creatCanvasElements()
        labelsChart = []
        dataChart = []
        // canvasArea.style.display = 'block'
        // forwardBackwardBtn.style.display = 'block'
        for (let index =iCount-5; index < iCount; index++){
            labelsChart.push(labelsDate[index])
            dataChart.push(durationData[index])
           
        }
    
        initChart()
        let x = setInterval(() => {
            window.scrollTo(0,document.body.scrollHeight);
            clearInterval(x);
        }, 100);
    }else {
        alert("there is no more history.")
    }
})
// durationOfIrrigation: "7.89813"
// myTimeStamp: ho {seconds: 1599050365, nanoseconds: 236000000}
// sensorID: 1
// startIrrigationDate: "2020-09-02 03:39:14.157917"
// user: "moha@gmail.com"

function initChart(){
    let myChart = document.getElementById('myChart').getContext('2d');
    let massPopChart = new Chart(myChart,{
        type:'bar',
        data:{
            labels:labelsChart,
            datasets:[{
                label:'duration',
                data:dataChart,
                backgroundColor:'#1CA3EC',
                borderWidth:1,
                borderColor:'#777',
                hoverBorderWidth:3,
                hoverBorderColor:'#000'     
            }]
        },
        option:{}

    }) 

}

moisture = []
testcount = []
numi = 0

setInterval(()=>{
    // console.log('mohaaaaaaaaaa',soilStatus)
    numi++
    M = (1/soilStatus[1])*3
    moisture.push(M)
    testcount.push(numi)
    console.log(testcount)
    let AChart = document.getElementById('AChart').getContext('2d');
    let massPopChart = new Chart(AChart,{
        type:'line',
        data:{
            labels:testcount,
            datasets:[{
                label:'moisture level',
                data:moisture,
                backgroundColor:'#1CA3EC',
                borderWidth:1,
                borderColor:'#777',
                hoverBorderWidth:3,
                hoverBorderColor:'#000'     
            }]
        },
        option:{}

    }) 
},3000)

