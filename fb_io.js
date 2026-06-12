let userDisplayName;
let userEmail;
let userPhotoURL;
let uid;
let userGameName;
let userAge;
let popUp;

fb_isLoggedIn();
if (window.location.pathname.endsWith("/JetFighter.html")) {
  fb_readHighScores("JetFighter");
} else if (window.location.pathname.endsWith("/GeoDash.html")) {
  fb_readHighScores("GeoDash");
}

/*******************************************************/
// fb_isLoggedIn()
/*******************************************************/
function fb_isLoggedIn() {
  if (sessionStorage.getItem('userAge') == null || sessionStorage.getItem('uid') == null || sessionStorage.getItem('userEmail') == null || sessionStorage.getItem('userDisplayName') == null || sessionStorage.getItem('userPhotoURL') == null || sessionStorage.getItem('userGameName') == null
    || sessionStorage.getItem('userAge') == 'null' || sessionStorage.getItem('uid') == 'null' || sessionStorage.getItem('userEmail') == 'null' || sessionStorage.getItem('userDisplayName') == 'null' || sessionStorage.getItem('userPhotoURL') == 'null' || sessionStorage.getItem('userGameName') == 'null') {
    popUp = document.getElementById("loginPopUp");
    if (popUp) {
      popUp.style.display = "block"
    }
  } else {
    profile = document.getElementById("profilePic");
    if (profile) {
      profile.innerHTML = `<img src="${sessionStorage.getItem('userPhotoURL')}" alt="User profile picture" 
      width="50px" height="50px" style="border-radius: 50%"> <div class="profileInfo"><b>Name: </b><br>
      ${sessionStorage.getItem('userDisplayName')} ~ ${sessionStorage.getItem('userGameName')}<br><b>Email: 
      <br></b>${sessionStorage.getItem('userEmail')}<br><b>Age: </b><br>${sessionStorage.getItem('userAge')}</div>`
    }
  }
}

/*******************************************************/
// fb_authenticate()
/*******************************************************/
async function fb_authenticate() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      user = firebase.auth().currentUser;
      if (user !== null) {
        //UID (from Google)
        uid = user.uid;
        sessionStorage.setItem('uid', uid);
        //User Display Name (from Google)
        userDisplayName = user.displayName;
        sessionStorage.setItem('userDisplayName', userDisplayName);
        firebase.database().ref('/userInfo/' + uid + '/displayName').set(userDisplayName);
        //User Email (from Google)
        userEmail = user.email;
        sessionStorage.setItem('userEmail', userEmail);
        firebase.database().ref('/userInfo/' + uid + '/email').set(userEmail);
        //User Profile Photo URL (from Google)
        userPhotoURL = user.photoURL;
        sessionStorage.setItem('userPhotoURL', userPhotoURL);
        firebase.database().ref('/userInfo/' + uid + '/photoURL').set(userPhotoURL);
        //User Profile Photo URL (from Google)
        userPhotoURL = user.photoURL;
        sessionStorage.setItem('userPhotoURL', userPhotoURL);
        firebase.database().ref('/userInfo/' + uid + '/photoURL').set(userPhotoURL);

        popUp = document.getElementById("loginPopUp");
        if (popUp) {
          popUp.style.display = "none"
          fb_popUpChecker();
          fb_isLoggedIn();
        }
        console.log("User Logged In")
      }
    } else {
      console.log("User Not Logged In")
      let provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      firebase.auth().signInWithPopup(provider).then(function (result) {
        let token = result.credential.accessToken;
      });
    }
  });
}

/*******************************************************/
// fb_writeHighScore(_score, _game)
/*******************************************************/
async function fb_writeHighScore(_score, _game) {
  console.log("fb_writeHighScore")
  let currentDBScore = (await firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).once('value')).val()

  console.log("Current: " + currentDBScore)
  console.log("New: " + _score)
  if (_game == "JetFighter") {
    if (currentDBScore == null) {
      currentDBScore = Number.MAX_VALUE;
    }
    if (currentDBScore >= _score && _score !== 0) {
      console.log("You got a new High Score!")
      firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).set(_score);
    }
  } else if (_game == "GeoDash") {
    if (currentDBScore == null) {
      currentDBScore = 0;
    }
    if (currentDBScore < _score) {
      console.log("You got a new High Score!")
      firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).set(_score);
    }
  }
  fb_readHighScores(_game);
}


/*******************************************************/
// fb_writeForm(_type)
/*******************************************************/
function fb_writeForm(_type) {
  if (_type == "age") {
    popUp = document.getElementById("agePopUp");
    if (popUp) {
      userAge = document.getElementById('ageInput').value
      if (userAge == null || !Number.isInteger(Number(userAge)) || userAge < 1 || userAge > 99) {
        ageValidationAlert.innerHTML = "You must enter an age between 1-99";
      } else {
        sessionStorage.setItem('userAge', userAge);
        firebase.database().ref('/userInfo/' + uid + '/' + _type).set(userAge);
        popUp.style.display = "none"
        fb_popUpChecker();
      }
    }
  } else if (_type == "gameName") {
    popUp = document.getElementById("namePopUp");
    if (popUp) {
      userGameName = document.getElementById('nameInput').value
      if (userGameName == null || userGameName.includes('<') || userGameName.includes('>') || userGameName.includes('$') || userGameName.length > 20) {
        nameValidationAlert.innerHTML = "You must enter a game name (without <, >, $), and less than 20 characters";
      } else {
        sessionStorage.setItem('userGameName', userGameName);
        firebase.database().ref('/userInfo/' + uid + '/' + _type).set(userGameName);
        popUp.style.display = "none"
        fb_popUpChecker();
      }
    }
  }
}

/*******************************************************/
// fb_popUpChecker()
/*******************************************************/
async function fb_popUpChecker() {
  userGameName = (await firebase.database().ref('/userInfo/' + uid + '/gameName').once('value')).val()
  sessionStorage.setItem('userGameName', userGameName);
  if (userGameName == null) {
    document.getElementById("namePopUp").style.display = "block";
  } else {
    userAge = (await firebase.database().ref('/userInfo/' + uid + '/age').once('value')).val()
    sessionStorage.setItem('userAge', userAge);
    if (userAge == null) {
      document.getElementById("agePopUp").style.display = "block"
    }
  }
}


/*******************************************************/
// fb_readHighScores(_game)
/*******************************************************/
async function fb_readHighScores(_game) {
  console.log("fb_readHighScores()")
  let highScoreTable = (await firebase.database().ref('/' + _game).once('value')).val()
  let highScoreInfo = Object.values(highScoreTable);
  if (_game === "GeoDash") {
    highScoreInfo.sort((a, b) => {
      let keyA = Object.keys(a)[0];
      let keyB = Object.keys(b)[0];
      return b[keyB] - a[keyA];
    });
  } else if (_game === "JetFighter") {
    highScoreInfo.sort((a, b) => {
      let keyA = Object.keys(a)[0];
      let keyB = Object.keys(b)[0];
      return a[keyA] - b[keyB];
    });
  }
  let highScoreTableDisplay = document.getElementById("highScoreTableJetFighter");
  if (highScoreTableDisplay) {
    highScoreTableDisplay.innerHTML = ``


    for (i = 0; i < highScoreInfo.length; i++) {
      console.log(Object.keys(highScoreInfo[i])[0] + ": " + Object.values(highScoreInfo[i])[0])
      highScoreTableDisplay.innerHTML += `<div class="score-row"><span>${i + 1}. </span> <span>${Object.keys(highScoreInfo[i])[0]}: </span> <span>${Object.values(highScoreInfo[i])[0]}</span></div>`
    }
  }
}

