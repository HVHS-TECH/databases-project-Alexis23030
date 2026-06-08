let userDisplayName;
let userEmail;
let userPhotoURL;
let uid;
let userGameName;
let userAge;
let isLoggedIn;
let popUp;
fb_isLoggedIn();

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

        popUp = document.getElementById("loginPopUp");
        if (popUp) {
          popUp.style.display = "none"
          fb_popUpChecker();
        }
        console.log("User Logged In")
        isLoggedIn = true;

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
// fb_writeHighScore(score)
/*******************************************************/
async function fb_writeHighScore(_score, _game) {
  console.log("fb_writeHighScore")
  let currentDBScore = (await firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).once('value')).val()
  if (currentDBScore == null) {
    currentDBScore = 0;
  }
  console.log("Current: " + currentDBScore)
  console.log("New: " + _score)
  if (_game == "JetFighter") {
    if (currentDBScore > _score && _score != 0) {
      console.log("You got a new High Score!")
      firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).set(_score);
    }
  } else if (_game == "GeoDash") {
    if (currentDBScore < _score) {
      console.log("You got a new High Score!")
      firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).set(_score);
    }
  }
}


//Asking when already there

function fb_writeForm(_type) {
  if (_type == "age") {
    popUp = document.getElementById("agePopUp");
    if (popUp) {
      userAge = document.getElementById('ageInput').value
      if (userAge == null || !Number.isInteger(Number(userAge)) || userAge < 1 || userAge > 99) {
        console.log("You must enter an age between 1-99")
        ageValidationAlert.innerHTML = "You must enter an age between 1-99";
      } else {
        sessionStorage.setItem('userAge', userAge);
        firebase.database().ref('/userInfo/' + uid + '/' + _type).set(userAge);
        popUp.style.display = "none"
        fb_popUpChecker();
      }
    }
  } else if (_type == "name") {
    popUp = document.getElementById("namePopUp");
    if (popUp) {
      userGameName = document.getElementById('nameInput').value
      if (userGameName == null || userGameName.includes('<') || userGameName.includes('>') || userGameName.includes('$') || userGameName.length > 20) {
        console.log("You must enter a game name (without <, >, $), and less than 20 characters")
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


async function fb_popUpChecker() {
  if (userGameName == null) {
    console.log("run")
    userGameName = (await firebase.database().ref('/userInfo/' + uid + '/gameName').once('value')).val()
    sessionStorage.setItem('userGameName', userGameName);
    popUp = document.getElementById("namePopUp");
    console.log(userGameName)
    if (popUp && userGameName == null) {
      popUp.style.display = "block"
    }
  }

  if (userAge == null) {
    userAge = (await firebase.database().ref('/userInfo/' + uid + '/age').once('value')).val()
    sessionStorage.setItem('userAge', userAge);
    popUp = document.getElementById("agePopUp");
    if (popUp && document.getElementById("namePopUp").style.display == "none" && userAge == null) {
      popUp.style.display = "block"
    }
  }
}