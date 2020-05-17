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
                const friends = myData.friends;
                currentuserinterests = myData.interests;
                addToList(friends, "#friendTable", user);
                currentuserinterests.forEach(interest=>{
                    let chk = document.getElementById(interest).checked = true;
                })
            }
        }).catch(function (error) {
            console.log("Got an error: ", error);
        });
    }
});

function addToList(from, to, user) {
    from.forEach(stored => {
        let tr = document.createElement('tr');
        tr.id = stored;
        let info = document.createElement('td');
        info.scope = 'row';
        let cross = document.createElement('td');
        cross.classList = ('close');
        cross.scope = 'row';
        info.textContent = stored;
        cross.textContent = "X";
        tr.appendChild(info);
        tr.appendChild(cross);
        $(to).append(tr);
        // deleting data
        cross.addEventListener('click', (e) => {
            e.stopPropagation();
            cross.parentElement.style = "display: none;";
            let userRef = db.collection('users').doc(user.uid);
            userRef.update({
                friends: firebase.firestore.FieldValue.arrayRemove(stored)
            });
        });
    });
}

$(":checkbox").click(function(){
    var id = $(this).attr('id');
    let user = firebase.auth().currentUser;
    if(this.checked){
        db.collection("users").doc(user.uid).update({
            interests: firebase.firestore.FieldValue.arrayUnion(id)
        });
        currentuserinterests.push(this.id);
    } else{
        db.collection("users").doc(user.uid).update({
            interests: firebase.firestore.FieldValue.arrayRemove(id)
        });
        currentuserinterests = currentuserinterests.filter(e => e !== this.id);
    }
});



function showFriendsOption() {
    document.getElementById("friendForm").style.display = "block";
    return false;
}

function closeFriends() {
    document.getElementById("friendForm").style.display = "none";
    return false;
}

function callInterestGroup() {
    let selection = currentuserinterests[Math.floor(Math.random() * currentuserinterests.length)];
    console.log(selection);
    interestGroup(selection + "_rooms");
}

function interestGroup(selectedinterest) {
    selectedinterest = selectedinterest || "rooms";
    let count = 0;
    db.collection(selectedinterest).where("memberCount", "<", 4)
        .get()
        .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                const data = doc.data();
                db.collection(selectedinterest).doc(doc.id).update({
                    "memberCount": data.memberCount + 1
                }).then(() => {
                    window.location.href = window.location.href.substring(0, window.location.href - 4) + "room.html#" + data.hash;
                });
                console.log(data);
                count++;
            });
        }).then(() => {
            if (count == 0) {
                var hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
                var roomHash = hash.substring(1);
                db.collection(selectedinterest).add({
                    hash: roomHash,
                    memberCount: 1,
                }).then(function (docRef) {
                    console.log(docRef);
                    docRef.get().then(function (doc) {
                        if (doc.exists) {
                            const data = doc.data();
                            window.location.href = window.location.href.substring(0, window.location.href - 4) + "room.html#" + data.hash;
                        } else {
                            // doc.data() will be undefined in this case
                            console.log("No such document!");
                        }
                    }).catch(function (error) {
                        console.log("Error getting document:", error);
                    });
                })
            }
        });
    console.log("interestGroup()");
    return false;
}

function addFriend() {
    var provEmail = $("input[type=email][name=email]").val();
    var users = db.collection("users");
    users.where("email", "==", provEmail).get()
        .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                let user = firebase.auth().currentUser;
                db.collection("users").doc(user.uid).update({
                    friends: firebase.firestore.FieldValue.arrayUnion(doc.data().email)
                });
            });
        })
        .catch(function (error) {
            console.log("Error getting documents: ", error);
        });
    setTimeout("location.reload(true);", 1000);
}