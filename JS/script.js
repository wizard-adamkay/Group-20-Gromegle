const roomHash = location.hash.substring(1);
console.log(roomHash);
//Variables
const drone = new ScaleDrone('BIZhUxYEmI9Hwh9I');
const roomName = 'observable-' + roomHash;
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

const configuration = {
  iceServers: [{
      url: 'stun:stun.l.google.com:19302'
    },
    {
      url: 'stun:stun1.l.google.com:19302'
    },
    {
      url: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    },
    {
      url: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    }
  ]
};
let room;
let members;
let pcs = [];
let localStream;
//Booleans for whether certain events have taken place.
let finishedMedia = false;
let finishedAuth = false;
let name = "";

function onSuccess() {
  console.log("success");
};

function onError(error) {
  console.error(error);
};
//Gets the user video and audio streams and then initiates WebRTC connection
navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
}).then(stream => {
  console.log(stream);
  localStream = stream;
  localVideo.srcObject = stream;
  finishedMedia = true;
}, onError);
drone.on('open', error => {
  if (error) {
    return console.error(error);
  }
  room = drone.subscribe(roomName);
  room.on('open', error => {
    if (error) {
      onError(error);
    }
  });
  // We're connected to the room and received an array of 'members'
  // connected to the room (including us). Signaling server is ready.
  room.on('members', memberList => {
    console.log('MEMBERS', memberList);
    members = memberList;
    if (members.length > 4) {
      window.location.href = window.location.href.substring(0, window.location.href - 14) + "home.html";
    }
    //Launches startWebRTC
    waitForStreams();
  });
});

//Promise function that waits for user media to finish completely.
function waitForStreams() {
  if (finishedMedia == true && finishedAuth == true) {
    console.log("finished waiting for streams");
    startWebRTC();
  } else {
    setTimeout(waitForStreams, 1000);
  }
  console.log("heyo");
}

function createOffer(pc) {
  pc.onnegotiationneeded = () => {
    console.log("sending offer");
    setTimeout(function () {
      pc.createOffer().then(event => localDescCreated(event, pc.id)).catch(onError);
    }, 500);
  }
}

// Send signaling data via Scaledrone
function sendMessage(message) {
  drone.publish({
    room: roomName,
    message
  });
}
//Checks for other members in room and creates a new PeerConnection offer for each one.
function startWebRTC() {
  console.log(members);
  var i;
  for (i = 0; i < members.length; i++) {
    if (members[i].id !== drone.clientId) {
      var newPc = {
        pc: new RTCPeerConnection(configuration),
        id: members[i].id
      };
      newPc.pc.onicecandidate = event => {
        console.log("sending candidate");
        if (event.candidate) {
          console.log(event.currentTarget.id);
          setTimeout(function () {
            sendMessage({
              'candidate': event.candidate,
              'id': drone.clientId,
              'target': event.currentTarget.id
            });
          }, 1000);
        }
      };
      localStream.getTracks().forEach(track => {
        newPc.pc.addTrack(track, localStream);
      });
      newPc.pc.id = newPc.id;
      createOffer(newPc.pc);
      setOnTrack(newPc.pc);
      pcs.push(newPc);
      console.log(pcs);
    }
  }

  function setOnTrack(pc) {
    pc.ontrack = event => {
      var id = event.currentTarget.id;
      var stream = event.streams[0];
      console.log(remoteVideo);
      console.log(id);
      if (remoteVideo.attribute != id && remoteVideo1.attribute != id && remoteVideo2.attribute != id) {
        if (!(remoteVideo.srcObject || remoteVideo.attribute === id)) {
          remoteVideo.srcObject = stream;
          remoteVideo.attribute = id;
          console.log("adding to remoteVideo");
        } else if (!(remoteVideo1.srcObject || remoteVideo1.attribute === id)) {
          remoteVideo1.srcObject = stream;
          remoteVideo1.attribute = id;
          console.log("adding to remoteVideo1");
        } else if (!(remoteVideo2.srcObject || remoteVideo2.attribute === id)) {
          remoteVideo2.srcObject = stream;
          remoteVideo2.attribute = id;
          console.log("adding to remoteVideo2");
        }
      }
    };
  }

  // Listen to signaling data from Scaledrone
  room.on('data', (message, client) => {
    // Message was sent by us
    if (client.id === drone.clientId) {
      return;
    }
    var i;
    console.log(JSON.stringify(message, null, 4));
    //message.sdp implies that an offer/answer is being received.
    if (message.sdp) {
      var n = -1;
      for (i = 0; i < pcs.length; i++) {
        if (pcs[i].id === client.id) {
          n = i
          break;
        }
      }
      if (n == -1) {
        console.log("creating new pcs");
        var newPc = {
          pc: new RTCPeerConnection(configuration),
          id: client.id
        };
        newPc.pc.onicecandidate = event => {
          console.log("sending candidate");
          if (event.candidate) {
            console.log(event.currentTarget.id);
            setTimeout(function () {
              sendMessage({
                'candidate': event.candidate,
                'id': drone.clientId,
                'target': event.currentTarget.id
              });
            }, 1000);
          }
        };
        localStream.getTracks().forEach(track => {
          console.log("adding tracks");
          newPc.pc.addTrack(track, localStream);
        });
        newPc.pc.id = newPc.id;
        setOnTrack(newPc.pc);
        pcs.push(newPc);
        console.log(newPc)
        n = pcs.length - 1;
      }
      // This is called after receiving an offer or answer from another peer
      if (message.target === drone.clientId) {
        pcs[n].pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
          // When receiving an offer lets answer it
          if (pcs[n].pc.remoteDescription.type === 'offer') {
            setTimeout(function () {
              pcs[n].pc.createAnswer().then(event => {
                localDescCreated(event, client.id);
                console.log("making a new connection from offer");
              }).catch(onError);
            }, 500);
            console.log("sending answer");
          }
        }, onError);
      }
      //message.candidate implies an ICE candidate being sent
    } else if (message.candidate) {
      if (message.target === drone.clientId) {
        console.log("taking a candidate");
        var n = -1;
        console.log(pcs.length);
        for (i = 0; i < pcs.length; i++) {
          console.log(pcs[i].id);
          if (pcs[i].id === client.id) {
            n = i;
            break;
          }
        }
        console.log(JSON.stringify(pcs[n]));
        setTimeout(() => {
          sendMessage({
          'name': name,
          'id': drone.clientId,
          'target': pcs[n].id
        });
        }, 1500);
        
        // Add the new ICE candidate to our connections remote description
        pcs[n].pc.addIceCandidate(
          new RTCIceCandidate(message.candidate), onSuccess, onError);
      }
      //message.text implies that the incoming message should be converted into HTML.
    } else if (message.text) {
      insertMessageToDOM(String(message.text), String(message.author), message.id, false)
      //message.name implies that the incoming message specifies a name for a connection.
    } else if (message.name) {
      if (message.target === drone.clientId) {
        setName(String(message.name), message.id);
      }
    }
  });
  
  //Scans for the correct remoteVideo id to apply a new name to.
  function setName(text, id) {
    for (i = 0; i < pcs.length; i++) {
      console.log(pcs[i].id);
      console.log(id);
      if (pcs[i].id === id) {
        console.log("somethin should be happening");
        if (remoteVideo.attribute === id) {
          name2.innerHTML = text;
        }
        if (remoteVideo1.attribute === id) {
          name3.innerHTML = text;
        }
        if (remoteVideo2.attribute === id) {
          name4.innerHTML = text;
        }
        break;
      }
    }
  }

  //Runs on a member leaving.
  room.on('member_leave', member => {
    console.log(roomHash);
    //Updates members.length for the room.
    db.collection("rooms").where("hash", "==", roomHash)
      .get()
      .then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
          console.log(members.length);
          db.collection("rooms").doc(doc.id).update({
            "memberCount": members.length
          });

        });
      });
    //Clears the matching video element's srcObject and name.
    for (i = 0; i < pcs.length; i++) {
      console.log(pcs[i].id);
      if (pcs[i].id === member.id) {
        pcs.splice(i, 1);
        if (remoteVideo.attribute === member.id) {
          remoteVideo.srcObject = null;
          remoteVideo.attribute = "";
          name2.innerHTML = "Name2";
        }
        if (remoteVideo1.attribute === member.id) {
          remoteVideo1.srcObject = null;
          remoteVideo1.attribute = "";
          name3.innerHTML = "Name3";
        }
        if (remoteVideo2.attribute === member.id) {
          remoteVideo2.srcObject = null;
          remoteVideo2.attribute = "";
          name4.innerHTML = "Name4";
        }
        break;
      }
    }
  });
}
//Converts a message into HTML.
function insertMessageToDOM(text, author, id, isFromMe) {
  const template = document.querySelector('template[data-template="message"]');
  const nameEl = template.content.querySelector('.message__name');
  template.content.querySelector('.message__bubble').innerHTML = text + '<br><i style="font-size: 0.75em" >' + author + '</i>';
  const clone = document.importNode(template.content, true);
  const messageEl = clone.querySelector('.message');
  if (isFromMe) {
    messageEl.classList.add('message--mine');
  } else {
    messageEl.classList.add('message--theirs');
  }
  const messagesEl = document.querySelector('.messages');
  messagesEl.appendChild(clone);

  messagesEl.scrollTop = messagesEl.scrollHeight - messagesEl.clientHeight;
}
//Event handler for the message form.
const form = document.querySelector('form');
form.addEventListener('submit', () => {
  const input = document.querySelector('input[type="text"]');
  const value = input.value;
  input.value = '';
  const data = {
    name,
    content: value,
  };
  sendMessage({
    'text': value,
    'author': name,
    'id': drone.clientId
  });

  insertMessageToDOM(value, name, drone.clientId, true);
});
//Updates the local description for a PC sdp
function localDescCreated(desc, id) {
  var n = -1;

  for (i = 0; i < pcs.length; i++) {
    if (pcs[i].id === id) {
      n = i;
      break;
    }
  }
  console.log(desc);
  console.log("setting local description for " + id + ' ' + pcs[n].pc.localDescription);
  pcs[n].pc.setLocalDescription(
    desc,
    () => sendMessage({
      'sdp': pcs[n].pc.localDescription,
      'target': id
    }),
    onError
  );

}

$(".screencontainer").click(function () {
  var count = $(this).data().count++;
  if (count >= 5){
    let emoji = $(this).children('span');
    $(emoji).toggle();
  }
});
//Debugging function.
function showPcs() {
  var b;
  for (b = 0; b < pcs.length; b++) {
    console.log(pcs[b]);
  }
  console.log(remoteVideo.srcObject);
  console.log(remoteVideo1.srcObject);
  console.log(remoteVideo2.srcObject);

}

var storageRef = db.collection("users");
var emojiArray;
firebase.auth().onAuthStateChanged(function (user) {

  if (user) {
    // User is signed in.
    console.log("User is signed in");
    storageRef.doc(user.uid).get().then(function (doc) {
      emojiArray = doc.data().emojis;
      name = doc.data().name;
      name1.innerHTML = name;
      console.log(name);
      finishedAuth = true;
      generateEmojis();
    })
    
  } else {
    // No user is signed in.
    console.log("User is not signed in");
  }
})
// Place emojis onto dropdown list
function generateEmojis() {
  console.log(emojiArray);
  for (let i = 0; i < emojiArray.length; i++) {
    var currentsource = emojiArray[i];
    console.log(currentsource);
    let currentemoji = document.createElement("img");
    currentemoji.src = currentsource;
    currentemoji.className = "dropdown-item";
    currentemoji.onclick = function () {
      db.collection("reactions").doc("reactionsrcs").set({
        imagetodisplay: this.src
      })
    }

    let target = document.getElementById("emojidisplay");
    target.appendChild(currentemoji);
  }
}
let skip = true;
db.collection("reactions").doc("reactionsrcs").onSnapshot(function (doc) {
  if(skip){
    skip = false;
    return;
  }
  $(".emojicontainer").attr("src", doc.data().imagetodisplay);
  $(".showemoji").toggle();
  setTimeout(() => {
    $(".showemoji").toggle()
  }, 2000);
})