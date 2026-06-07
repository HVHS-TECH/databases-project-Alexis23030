let userDisplayName;
let userEmail;
let userPhotoURL;
let uid;
let userGameName;
let userAge;
let isLoggedIn;

fb_isLoggedIn();

function fb_isLoggedIn() {
  if (!isLoggedIn && (sessionStorage.getItem('userAge') ==null || sessionStorage.getItem('uid') == null || sessionStorage.getItem('userEmail') == null || sessionStorage.getItem('userDisplayName') == null || sessionStorage.getItem('userPhotoURL') == null || sessionStorage.getItem('userGameName') == null)) {
    const popUp = document.getElementById("loginPopUp");
    if (popUp) {
      popUp.style.display = "block"
    }
  }
}



/*******************************************************/
// fb_authenticate()
/*******************************************************/
async function fb_authenticate() {
  let user;
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      user = firebase.auth().currentUser;
      if (user !== null) {
        uid = user.uid;
        sessionStorage.setItem('uid', uid);

        userDisplayName = user.displayName;
        sessionStorage.setItem('userDisplayName', userDisplayName);
        firebase.database().ref('/userInfo/' + uid + '/displayName').set(userDisplayName);

        userEmail = user.email;
        sessionStorage.setItem('userEmail', userEmail);
        firebase.database().ref('/userInfo/' + uid + '/email').set(userEmail);

        userPhotoURL = user.photoURL;
        sessionStorage.setItem('userPhotoURL', userPhotoURL);
        firebase.database().ref('/userInfo/' + uid + '/photoURL').set(userPhotoURL);

        userGameName = (await firebase.database().ref('/userInfo/' + user.uid + '/gameName').once('value')).val()
        sessionStorage.setItem('userGameName', userGameName);

        if (userGameName == null) {
          userGameName = prompt("Please enter your game name:");
          sessionStorage.setItem('userGameName', userGameName);
          //Validation Needed
        }
        firebase.database().ref('/userInfo/' + uid + '/gameName').set(userGameName);

        userAge = (await firebase.database().ref('/userInfo/' + user.uid + '/age').once('value')).val()
        sessionStorage.setItem('userAge', userAge);
        if (userAge == null) {
          userAge = prompt("Please enter your age:");
          sessionStorage.setItem('userAge', userAge);
          //Validation Needed
        }
        firebase.database().ref('/userInfo/' + uid + '/age').set(userAge);

        console.log("User Logged In")
        isLoggedIn = true;
        const popUp = document.getElementById("loginPopUp");
        if (popUp) {
          popUp.style.display = "none"
        }
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

