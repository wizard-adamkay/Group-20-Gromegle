// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDQEP71tIIE7W4vadDEz3iu8RkxlJFe9R4",
    authDomain: "gromegle-38a5f.firebaseapp.com",
    databaseURL: "https://gromegle-38a5f.firebaseio.com",
    projectId: "gromegle-38a5f",
    storageBucket: "gromegle-38a5f.appspot.com",
    messagingSenderId: "850757928386",
    appId: "1:850757928386:web:e8c5f4b83b25abb6b6c25b",
    measurementId: "G-R6DWLFVZQY"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function showFriendsOption() {
    document.getElementById("friendForm").style.display = "block";
  }
  
  function closeFriends() {
    document.getElementById("friendForm").style.display = "none";
  }
  function showInterestsOption() {
    document.getElementById("interestForm").style.display = "block";
  }
  
  function closeInterests() {
    document.getElementById("interestForm").style.display = "none";
  }
db.collection("users").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        console.log("document data:", doc.data());
    });
});