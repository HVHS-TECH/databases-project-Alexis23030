let userDisplayName;
let userEmail;
let userPhotoURL;
let uid;
let userGameName;
let userAge;

/*******************************************************/
// fb_authenticate()
/*******************************************************/
async function fb_authenticate() {
  let user;
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      user = firebase.auth().currentUser;
      if (user !== null) {

        userGameName = (await firebase.database().ref('/userInfo/' + user.uid + '/gameName').once('value')).val()
        sessionStorage.setItem('userGameName', userGameName);
        if (userGameName == null) {
          userGameName = prompt("Please enter your game name:");
          sessionStorage.setItem('userGameName', userGameName);
          //Validation Needed
        }

        userAge = (await firebase.database().ref('/userInfo/' + user.uid + '/age').once('value')).val()
        sessionStorage.setItem('userAge', userAge);
        if (userAge == null) {
          userAge = prompt("Please enter your age:");
          sessionStorage.setItem('userAge', userAge);
          //Validation Needed
        }

        console.log("User Logged In")

        uid = user.uid;
        sessionStorage.setItem('uid', uid);

        userDisplayName = user.displayName;
        sessionStorage.setItem('userDisplayName', userDisplayName);
        firebase.database().ref('/userInfo/' + uid + '/displayName').set(userDisplayName);

        userEmail = user.email;
        sessionStorage.setItem('userEmail', userEmail);
        firebase.database().ref('/userInfo/' + uid + '/email').set(userEmail);

        userPhotoURL = user.photoURL;
        sessionStorage.setItem('UserPhotoURL', userPhotoURL);
        firebase.database().ref('/userInfo/' + uid + '/photoURL').set(userPhotoURL);

        firebase.database().ref('/userInfo/' + uid + '/gameName').set(userGameName);
        firebase.database().ref('/userInfo/' + uid + '/age').set(userAge);
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
function fb_writeHighScore(_score, _game) {
  console.log("fb_writeHighScore")
  firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).set(_score);
}
