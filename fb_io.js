function fb_writeHighScore(score) {
  console.log("fb_writeHighScore - fb_io")
  console.log(score)
  firebase.database().ref('/game1/uid2/userName2').set(score);
  //uid
  //username
}