/*******************************************************/
// fb_io.js
// Contains all needed firebase functions
/*******************************************************/
let userDisplayName;
let userEmail;
let userPhotoURL;
let uid;
let userGameName;
let userAge;
let userAdmin;
let popUp;

//Check if user is logged in, display high scores if on the game pages, and display profile info on home page
fb_isLoggedIn();
if (window.location.pathname.endsWith("/JetFighter.html")) {
  fb_readHighScores("JetFighter");
} else if (window.location.pathname.endsWith("/GeoDash.html")) {
  fb_readHighScores("GeoDash");
} else if (window.location.pathname.endsWith("/admin.html")) {
  fb_adminRead();
} else if (window.location.pathname === "/" || window.location.pathname.endsWith("/index.html")) {
  console.log('run')
  fb_displayProfile();
}

/*******************************************************/
// fb_isLoggedIn()
// Checks if user info is stored in sessionStorage
// Run at the start of this file, and when user is logged in, in fb_authenticate
/*******************************************************/
function fb_isLoggedIn() {
  if (sessionStorage.getItem('userAge') == null || sessionStorage.getItem('uid') == null || sessionStorage.getItem('userEmail') == null
    || sessionStorage.getItem('userDisplayName') == null || sessionStorage.getItem('userPhotoURL') == null || sessionStorage.getItem('userGameName') == null
    || sessionStorage.getItem('userAdmin') == null || sessionStorage.getItem('userAge') == 'null' || sessionStorage.getItem('uid') == 'null'
    || sessionStorage.getItem('userEmail') == 'null' || sessionStorage.getItem('userDisplayName') == 'null' || sessionStorage.getItem('userPhotoURL') == 'null'
    || sessionStorage.getItem('userGameName') == 'null' || sessionStorage.getItem('userAdmin') == 'null') {
    //If any user info is not found, then open the loginPopup
    document.getElementById("adminButton").style.display = "none"
    popUp = document.getElementById("loginPopUp");
    if (popUp) {
      popUp.style.display = "block"
    }
  } else {
  }
}

/*******************************************************/
// fb_authenticate()
// Signs in user with Google
// If already logged in, save info to sessionStorage and write to the DB
// Then runs fb_popUpChecker() to gain non-google info and fb_isLoggedIn()
// Run when loginPopup button is pressed
/*******************************************************/
async function fb_authenticate() {
  let user;

  firebase.auth().onAuthStateChanged(async (user) => {
    user = firebase.auth().currentUser;

    if (user) {
      //Already logged in
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

        //User Admin boolean, default false unless otherwise changed
        let userAdmin = (await firebase.database().ref('/userInfo/' + uid + '/admin').once('value')).val()
        if (userAdmin !== true) {
          userAdmin = false
        }
        //Save the admin value to sessionStorage
        sessionStorage.setItem('userAdmin', userAdmin);

        await fb_popUpChecker(); // Gets non-google info
        await fb_isLoggedIn();   // Runs to check everything is entered
        await fb_displayProfile(); // Displays profile info
        document.getElementById("loginPopUp").style.display = "none" // Hides loginPopUp
        console.log("User Logged In")
      }
    } else {
      //Not logged in, runs Google pop up
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
// Writes high score from game to DB
// Runs fb_readHighScores(_game) to display high scores
// Called from game js files when game ends
/*******************************************************/
async function fb_writeHighScore(_score, _game) {
  //Gets score from DB
  let currentDBScore = (await firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).once('value')).val()

  if (_game == "JetFighter") {
    //If high score is for JetFighter game
    if (currentDBScore == null) {
      //If there is no score in DB set it to max value
      currentDBScore = Number.MAX_VALUE;
    }
    if (currentDBScore >= _score && _score !== 0) {
      //If new score is smaller than old one and not 0, set new high score, write to DB
      firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).set(_score);
    }
  } else if (_game == "GeoDash") {
    //If high score is for GeoDash game
    if (currentDBScore == null) {
      //If there is no score in DB set it to 0
      currentDBScore = 0;
    }
    if (currentDBScore < _score) {
      //If new score is bigger than old one, set new high score, write to DB
      firebase.database().ref('/' + _game + '/' + sessionStorage.getItem('uid') + '/' + sessionStorage.getItem('userGameName')).set(_score);
    }
  }
  // Display high scores
  fb_readHighScores(_game);
}


/*******************************************************/
// fb_writeForm(_type)
// Writes form data to DB and Session Storage, with validation
// Called when submit button pressed for age and gameName popups
/*******************************************************/
function fb_writeForm(_type) {
  if (_type == "age") {
    popUp = document.getElementById("agePopUp"); //Get popUp
    if (popUp) {
      userAge = Number(document.getElementById('ageInput').value) //Get user age from form
      if (userAge == null || !Number.isInteger(Number(userAge)) || userAge < 1 || userAge > 99) {
        ageValidationAlert.innerHTML = "You must enter an age between 1-99";
      } else {
        sessionStorage.setItem('userAge', userAge); //Write to sessionStorage
        firebase.database().ref('/userInfo/' + uid + '/' + _type).set(userAge); //Write to DB
        popUp.style.display = "none" //Hide popUp
        fb_popUpChecker(); //Runs to check if there are any other values still needing to be entered
      }
    }
  } else if (_type == "gameName") {
    popUp = document.getElementById("namePopUp"); //Get popUp
    if (popUp) {
      userGameName = document.getElementById('nameInput').value //get user name from form
      if (userGameName == null || userGameName.includes('<') || userGameName.includes('>') || userGameName.includes('$') || userGameName.length > 20) {
        nameValidationAlert.innerHTML = "You must enter a game name (without <, >, $), and less than 20 characters";
      } else {
        sessionStorage.setItem('userGameName', userGameName); //Write to sessionStorage
        firebase.database().ref('/userInfo/' + uid + '/' + _type).set(userGameName); //Write to DB
        popUp.style.display = "none" //Hide popUp
        fb_popUpChecker(); //Runs to check if there are any other values still needing to be entered
      }
    }
  }
}

/*******************************************************/
// fb_popUpChecker()
// Checks for non google info
// First checks is they already exist, then opens popUp if not
// Called in fb_writeForm() and fb_authenticate()
/*******************************************************/
async function fb_popUpChecker() {
  //Checks if game name is already in DB, and writes to sessionStorage
  userGameName = (await firebase.database().ref('/userInfo/' + uid + '/gameName').once('value')).val()
  sessionStorage.setItem('userGameName', userGameName);
  //Checks if user age is already in DB, and write to sessionStorage
  userAge = (await firebase.database().ref('/userInfo/' + uid + '/age').once('value')).val()
  sessionStorage.setItem('userAge', userAge);
  if (userGameName == null) {
    //If userGameName doesn't exist. then open name popUp
    document.getElementById("namePopUp").style.display = "block";
  } else if (userAge == null) {
    //If userAge doesn't exist. then open age popUp
    document.getElementById("agePopUp").style.display = "block";
  }
}



/*******************************************************/
// fb_readHighScores(_game)
// Reads highscores from DB and displays them
// Called at the start of this file when on the game pages
// And called when a high score is entered to the DB
/*******************************************************/
async function fb_readHighScores(_game) {
  //Get high score from DB as an object
  let highScoreTable = (await firebase.database().ref('/' + _game).once('value')).val()
  //Transform object to an array
  let highScoreArray = Object.values(highScoreTable);

  if (_game === "GeoDash") {
    // Sorts biggest to smallest if game is GeoDash
    highScoreArray.sort((a, b) => {
      let keyA = Object.keys(a)[0];
      let keyB = Object.keys(b)[0];
      return b[keyB] - a[keyA];
    });
  } else if (_game === "JetFighter") {
    // Sorts smallest to biggest if game is JetFighter
    highScoreArray.sort((a, b) => {
      let keyA = Object.keys(a)[0];
      let keyB = Object.keys(b)[0];
      return a[keyA] - b[keyB];
    });
  }
  //Gets HTML display div 
  let highScoreTableDisplay = document.getElementById("highScoreTable" + _game);
  if (highScoreTableDisplay) {
    highScoreTableDisplay.innerHTML = `` //Clears display
    for (i = 0; i < highScoreArray.length; i++) {
      //Writes display with position, name, and score
      highScoreTableDisplay.innerHTML += `<div class="score-row"><span>${i + 1}. </span> <span>${Object.keys(highScoreArray[i])[0]}: </span> <span>${Object.values(highScoreArray[i])[0]}</span></div>`
    }
  }
}



/*******************************************************/
// fb_adminRead()
// Reads Info from DB, displays any given users info
// Called if on Admin Page, in fb_adminWrite, and from Cancel Button
/*******************************************************/
async function fb_adminRead() {
  // Hides write buttons for user info
  document.getElementById('saveButton').style.display = "none";
  document.getElementById('cancelButton').style.display = "none";
  document.getElementById('editButton').style.display = "block";
  document.getElementById('userDropdown').disabled = false;

  //Gets user info from DB, user scores from DB
  let userInfo = (await firebase.database().ref('/userInfo').once('value')).val()
  let GeoDashScore = (await firebase.database().ref('/GeoDash').once('value')).val()
  let JetFighterScore = (await firebase.database().ref('/JetFighter').once('value')).val()
  //Converts them to arrays
  let userInfoArray = Object.values(userInfo);
  let GeoDashScoreArray = Object.values(GeoDashScore);
  let JetFighterScoreArray = Object.values(JetFighterScore);

  //Creates dropdown list of users in Db to view
  document.getElementById("userDropdown").innerHTML = ``
  for (i = 0; i < userInfoArray.length; i++) {
    document.getElementById("userDropdown").innerHTML += "<option value='" + i + "'>" + userInfoArray[i].displayName + " ~ " + userInfoArray[i].gameName + "</option>";
  }

  //Event listener for a change in the dropdown
  document.getElementById('userDropdown').addEventListener('change', (_value) => {
    //Shows edit button
    document.getElementById('editButton').style.display = "block";
    // Input from dropdown
    let selectedValue = _value.target.value;
    //Displays all user info
    let adminContent = document.getElementById('adminContent')
    adminContent.innerHTML = `
    <b>User Info:</b><br><br>
    <b>Display Name: </b>${userInfoArray[selectedValue].displayName}<br>
    <b>Game Name: </b>${userInfoArray[selectedValue].gameName}<br>
    <b>Email: </b>${userInfoArray[selectedValue].email}<br>
    <b>Age: </b>${userInfoArray[selectedValue].age}<br>
    <b>Admin: </b>${userInfoArray[selectedValue].admin}<br>
    <img src="${userInfoArray[selectedValue].photoURL}" alt="User profile picture" 
    width="50px" height="50px" style="border-radius: 50%"><br><br>
    <b>Scores:</b><br><br>
    <b>GeoDash Score: </b>${(GeoDashScoreArray.find(item => userInfoArray[selectedValue].gameName in item) || {})[userInfoArray[selectedValue].gameName]}<br>
    <b>JetFighter Score: </b>${(JetFighterScoreArray.find(item => userInfoArray[selectedValue].gameName in item) || {})[userInfoArray[selectedValue].gameName]}`
  });
  //Runs the script inside of the Event Listener when the function is first run
  document.getElementById('userDropdown').dispatchEvent(new Event('change'));
}


/*******************************************************/
// fb_adminEdit()
// Provides the option to edit fields in the Admin View
// Called from Edit Button
/*******************************************************/
async function fb_adminEdit() {
  //Shows save and cancel buttons, hides edit button, disables dropdown
  document.getElementById('saveButton').style.display = "block";
  document.getElementById('cancelButton').style.display = "block";
  document.getElementById('editButton').style.display = "none";
  document.getElementById('userDropdown').disabled = true

  //Gets user info from DB, converts to Array
  let userInfo = (await firebase.database().ref('/userInfo').once('value')).val()
  let userInfoArray = Object.values(userInfo);
  //Input from dropdown
  let selectedValue = document.getElementById('userDropdown').value;
  //Displays non editable info, and input boxes for editable info
  let adminContent = document.getElementById('adminContent')
  adminContent.innerHTML = `
    <b>User Info:</b><br><br>
    <b>Display Name: </b>${userInfoArray[selectedValue].displayName}<br>
    <b>Game Name: </b>      
    <input class="adminInput" type="text" id="adminNameInput" name="adminNameInput"><br>
    <b>Email: </b>${userInfoArray[selectedValue].email}<br>
    <b>Age: </b>    
    <input class="adminInput" type="number" id="adminAgeInput" name="adminAgeInput"><br>
    <b>Admin: </b>    
    <input class="adminInput" type="checkbox" value="true" id="adminValueInput" name="adminValueInput"><br>
    <img src="${userInfoArray[selectedValue].photoURL}" alt="User profile picture" 
    width="50px" height="50px" style="border-radius: 50%"><br><br>
    <b>Scores:</b><br><br>
    <b>GeoDash Score: </b>    
    <input class="adminInput" type="number" id="adminGeoDashInput" name="adminGeoDashInput"><br>
    <b>JetFighter Score: </b>    
    <input class="adminInput" type="number" id="adminJetFighterInput" name="adminJetFighterInput">`
}


/*******************************************************/
// fb_adminWrite()
// Writes all edited info to DB
// Called from Save Button
/*******************************************************/
async function fb_adminWrite() {
  //Gets user info from DB
  //converts to user info to one array, and UIDs to another array
  let userInfo = (await firebase.database().ref('/userInfo').once('value')).val()
  let userInfoArray = Object.values(userInfo);
  let userIDArray = Object.keys(userInfo)
  //Input from dropdown
  let selectedValue = document.getElementById('userDropdown').value;

  //Gets info to be written to DB from html form, gameName, Age, admin boolean, and game scores
  let adminNewName = document.getElementById("adminNameInput").value
  let adminNewAge = Number(document.getElementById("adminAgeInput").value)
  let adminNewGeoDash = Number(document.getElementById("adminGeoDashInput").value)
  let adminNewJetFighter = Number(document.getElementById("adminJetFighterInput").value)
  let adminNewValue = document.getElementById("adminValueInput").checked

  //Write age to DB if not empty and meets validation criteria
  if (adminNewAge !== null && adminNewAge !== "" && Number.isInteger(Number(adminNewAge)) && adminNewAge > 1 && adminNewAge < 99) {
    sessionStorage.setItem('userAge', adminNewAge);
    firebase.database().ref('/userInfo/' + userIDArray[selectedValue] + '/age').set(adminNewAge);
  }

  //Write gameName to DB if not empty and meets validation criteria
  if (adminNewName !== null && adminNewName !== "" && !adminNewName.includes('<') && !adminNewName.includes('>') && !adminNewName.includes('$') && adminNewName.length < 20) {
    sessionStorage.setItem('userDisplayName', adminNewName);
    firebase.database().ref('/userInfo/' + userIDArray[selectedValue] + '/gameName').set(adminNewName);
  }

  //Write admin boolean to DB if not empty
  if (adminNewValue !== null && adminNewValue !== "") {
    sessionStorage.setItem('userAdmin', adminNewValue);
    firebase.database().ref('/userInfo/' + userIDArray[selectedValue] + '/admin').set(adminNewValue);
  }

  //Write geoDash score to DB if not empty and meets validation criteria
  if (adminNewGeoDash !== null && adminNewGeoDash !== "" && Number.isInteger(Number(adminNewGeoDash)) && adminNewGeoDash > 1) {
    firebase.database().ref('/GeoDash/' + userIDArray[selectedValue]).set(null);
    firebase.database().ref('/GeoDash/' + userIDArray[selectedValue] + '/' + userInfoArray[selectedValue].gameName).set(adminNewGeoDash);

  }

  //Write JetFighter score to DB if not empty and meets validation criteria
  if (adminNewJetFighter !== null && adminNewJetFighter !== "" && Number.isInteger(Number(adminNewJetFighter)) && adminNewJetFighter > 1) {
    firebase.database().ref('/JetFighter/' + userIDArray[selectedValue]).set(null);
    firebase.database().ref('/JetFighter/' + userIDArray[selectedValue] + '/' + userInfoArray[selectedValue].gameName).set(adminNewJetFighter);
  }

  //Run adminRead to display these new values, and go back to view mode
  fb_adminRead();
}

/*******************************************************/
// fb_displayProfile()
// Displays profile pic, profile info, greeting, and aadmin butoon
// Called if on home page, and in fb_authenticate
// NEEDS COMMENTS
/*******************************************************/
function fb_displayProfile() {
  //Gets profile pic html element
  let profile = document.getElementById("profilePic");

  //If profile element exists, display profile pic
  //Display profile info (displayName, gameName, email, age) on hover
  if (profile) {
    profile.innerHTML = `<img src="${sessionStorage.getItem('userPhotoURL')}" alt="User profile picture" 
      width="50px" height="50px" style="border-radius: 50%"> <div class="profileInfo"><b>Name: </b><br>
      ${sessionStorage.getItem('userDisplayName')} ~ ${sessionStorage.getItem('userGameName')}<br><b>Email: 
      <br></b>${sessionStorage.getItem('userEmail')}<br><b>Age: </b><br>${sessionStorage.getItem('userAge')}</div>`
  }

  //If profile element exists, and user is admin then display admin button
  //Otherwise hide admin button
  if (profile && sessionStorage.getItem('userAdmin') == true) {
    document.getElementById("adminButton").style.display = "block"
  } else {
    console.log('hide')
    document.getElementById("adminButton").style.display = "none"
  }

  //Gets greeting html element
  let greeting = document.getElementById("greeting");
  //If greeting element exists, and userGameName is not null, display greeting
  if (greeting && sessionStorage.getItem('userGameName') !== null && sessionStorage.getItem('userGameName') !== 'null') {
    let currentHour = new Date().getHours();
    if (currentHour < 12) {
      //If before 12pm , display good morning
      greeting.innerHTML = `Good Morning ${sessionStorage.getItem('userGameName')}!`
    } else if (currentHour >= 12 && currentHour < 17) {
      //If after 12pm, and before 5pm , display good afternoon
      greeting.innerHTML = `Good Afternoon ${sessionStorage.getItem('userGameName')}!`
    } else if (currentHour >= 17) {
      //If after 5pm, display good evening
      greeting.innerHTML = `Good Evening ${sessionStorage.getItem('userGameName')}!`
    }
  }
}