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

// Holds interests of logged in user.
var currentuserinterests = [];

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        var docRef = db.collection("users").doc(user.uid);
        docRef.get().then(function (doc) {
            if (doc && doc.exists) {
                const myData = doc.data();
                currentuserinterests = myData.interests;
                myData.friends.forEach(friend => {
                  var friendRef = db.collection('users').doc(friend);
                  friendRef.get().then(function(friendDoc) {
                    var data = friendDoc.data();
                    addToList(data.email, data.currentRoom, data.selectedInterest, "#friendTable", user);
                  })
                    
                });
                currentuserinterests.forEach(interest => {
                    document.getElementById(interest).checked = true;
                })
            }
        }).catch(function (error) {
            console.log("Got an error: ", error);
        });
    }
});

function addToList(friend, roomHash, interest, to, user) {
    console.log(roomHash);
    console.log(friend);
    let line = document.createElement('tr');
    let pop = '<div class="popuptext"><button>join room</button></div>';
    let userd = "<td class='popup' scope='row'>" + friend + pop + "</td>";
    let cross = "<td id='" + friend + "'class='close' scope='row'>X</td>";
    $(line).append(userd, cross);
    $(to).append(line);
    $(".popup").click(function(event){
        $(this).children("div").toggleClass("show");
    });
    $(".popup div").children("button").click(function(event){
        findRoom(roomHash, interest);
    });
    // deleting data
    let hold = document.getElementById(friend);
    $(hold).on('click', e => {
        e.stopPropagation();
        $(hold).parent().css("display", "none");
        db.collection('users').doc(user.uid).update({
            friends: firebase.firestore.FieldValue.arrayRemove(friend)
        });
    });
}


$(":checkbox").click(function () {
    var id = $(this).attr('id');
    let user = firebase.auth().currentUser;
    if (this.checked) {
        db.collection("users").doc(user.uid).update({
            interests: firebase.firestore.FieldValue.arrayUnion(id)
        });
        currentuserinterests.push(this.id);
    } else {
        db.collection("users").doc(user.uid).update({
            interests: firebase.firestore.FieldValue.arrayRemove(id)
        });
        currentuserinterests = currentuserinterests.filter(e => e !== this.id);
    }
});

function callInterestGroup() {
    let selection = currentuserinterests[Math.floor(Math.random() * currentuserinterests.length)];
    interestGroup(selection + "rooms");
}


function findRoom(room, selectedinterest) {
    let user = firebase.auth().currentUser;
    console.log(room);
    console.log(selectedinterest);
    db.collection(selectedinterest).doc(room).get()
      .then((doc) => {
        const data = doc.data();
        if (data.memberCount < 4) {
          db.collection(selectedinterest).doc(room).update({
                    "memberCount": data.memberCount + 1
          }).then(() => {
              db.collection("users").doc(user.uid).update({
                  currentRoom: doc.id,
                  selectedInterest: "rooms"
              }).then(event => {
                window.location.href = window.location.href.substring(0, window.location.href - 4) + "room.html#" + data.hash;
              });
          })
        }
    });
    return false;
}

function interestGroup(selectedinterest) {
    selectedinterest = selectedinterest || "rooms";
    let count = 0;
    let user = firebase.auth().currentUser;
    db.collection(selectedinterest).where("memberCount", "<", 4).get()
        .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                count++;
                const data = doc.data();
                db.collection(selectedinterest).doc(doc.id).update({
                    "memberCount": data.memberCount + 1
                }).then(() => {
                    db.collection("users").doc(user.uid).update({
                        currentRoom: doc.id,
                        selectedInterest: "rooms"
                    }).then(event => {
                      window.location.href = window.location.href.substring(0, window.location.href - 4) + "room.html#" + data.hash;
                    });
                })
            });
            if (count !== 0) {
                return false;
            }
            var roomHash = Math.floor(Math.random() * 0xFFFFFF).toString(16).substring(1);
            db.collection(selectedinterest).add({
                hash: roomHash,
                memberCount: 1,
            }).then(function (docRef) {
                docRef.get().then(function (doc) {
                    if (doc.exists) {
                        const data = doc.data();
                        db.collection("users").doc(user.uid).update({
                          currentRoom: doc.id,
                          selectedInterest: selectedinterest
                        }).then(event => {
                          window.location.href = window.location.href.substring(0, window.location.href - 4) + "room.html#" + data.hash;
                        });
                    }
                }).catch(function (error) {
                    console.log("Error getting document:", error);
                });
            })
        });
    return false;
}

function addFriend() {
    $("#friendForm").toggle();
    var provEmail = $("input[type=email][name=email]").val();
    var users = db.collection("users");
    users.where("email", "==", provEmail).get()
        .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                let user = firebase.auth().currentUser;
                db.collection("users").doc(user.uid).update({
                    friends: firebase.firestore.FieldValue.arrayUnion(doc.data().friendid)
                });
                addToList(doc.data().email, doc.data().currentRoom, doc.data().selectedInterest, "#friendTable", user);
            });
        })
        .catch(function (error) {
            console.log("Error getting documents: ", error);
        });
}
function signOut(){
firebase.auth().signOut().then(function() {
    console.log('Signed Out');
    window.location.assign("../index.html");
  }, function(error) {
    console.error('Sign Out Error', error);
  });
}