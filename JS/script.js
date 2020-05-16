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
  iceServers: [
            {
              url : 'stun:stun.l.google.com:19302'
            },
            {
              url : 'stun:stun1.l.google.com:19302'
            },
            {
              url : 'turn:turn.bistri.com:80',
              credential: 'homeo',
              username: 'homeo'
            },
            {
              url : 'turn:turn.anyfirewall.com:443?transport=tcp',
              credential: 'webrtc',
              username: 'webrtc'
            }
        ]
};
let room;
let members;
let pcs = [];
let localStream;
let finishedMedia = false;
function onSuccess() {
  console.log("success");
};
function onError(error) {
  console.error(error);
};
//Gets the user video and audio streams
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
  if (finishedMedia == true) {
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
      setTimeout(function(){ pc.createOffer().then(event => localDescCreated(event, pc.id)).catch(onError); }, 500);
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
      var newPc = {pc: new RTCPeerConnection(configuration), id: members[i].id};
      newPc.pc.onicecandidate = event => {
        console.log("sending candidate");
        if (event.candidate) {
          console.log(event.currentTarget.id);
          setTimeout(function(){ sendMessage({'candidate': event.candidate, 'id': drone.clientId, 'target': event.currentTarget.id}); }, 1000);
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
        var newPc = {pc: new RTCPeerConnection(configuration), id: client.id};
        newPc.pc.onicecandidate = event => {
          console.log("sending candidate");
          if (event.candidate) {
            console.log(event.currentTarget.id);
            setTimeout(function(){ sendMessage({'candidate': event.candidate, 'id': drone.clientId, 'target': event.currentTarget.id}); }, 1000);
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
            setTimeout(function(){ pcs[n].pc.createAnswer().then(event => {
              localDescCreated(event, client.id);
            console.log("making a new connection from offer");
            }).catch(onError);}, 500);
            console.log("sending answer");
          }
        }
      , onError);
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
        // Add the new ICE candidate to our connections remote description
        pcs[n].pc.addIceCandidate(
          new RTCIceCandidate(message.candidate), onSuccess, onError);
      }
    }
  });
  
  room.on('member_leave', member => {
    console.log(roomHash);
    db.collection("rooms").where("hash", "==", roomHash)
    .get()
    .then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            const data = doc.data();
          console.log(members.length);
            db.collection("rooms").doc(doc.id).update({
                "memberCount": members.length
            });

        });
    });
    for (i = 0; i < pcs.length; i++) {
        console.log(pcs[i].id);
        if (pcs[i].id === member.id) {
          pcs.splice(i, 1);
          if (remoteVideo.attribute === member.id) {
            remoteVideo.srcObject = null;
            remoteVideo.attribute = "";
          }
          if (remoteVideo1.attribute === member.id) {
            remoteVideo1.srcObject = null;
            remoteVideo1.attribute = "";
          }
          if (remoteVideo2.attribute === member.id) {
            remoteVideo2.srcObject = null;
            remoteVideo2.attribute = "";
          }
          break;
        }
      }
  });
  
}

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
    () => sendMessage({'sdp': pcs[n].pc.localDescription, 'target': id}),
    onError
  );
  
}
//this is a rewrite of the functions toggling the overlays for the videos.
let count1 = 0;
let count2 = 0;
let count3 = 0;
let count4 = 0;
//these two functions toggle on and off overlay1
function overlay1on(){
  count1+= 1;
  if (count1 > 5){
    document.getElementById("overlay1").style.display= "block";
  }
}
function overlay1off(){
    document.getElementById("overlay1").style.display= "none";
}
//these two functions toggle on and off overlay2
function overlay2on(){
  count2+= 1;
  if (count2 > 5){
    document.getElementById("overlay2").style.display= "block";
  }
}
function overlay2off(){
    document.getElementById("overlay2").style.display= "none";
}
//these two functions toggle on and off overlay3
function overlay3on(){
  count3+= 1;
  if (count3 > 5){
    document.getElementById("overlay3").style.display= "block";
  }
}
function overlay3off(){
    document.getElementById("overlay3").style.display= "none";
}
//these two functions toggle on and off overlay4
function overlay4on(){
  count4+= 1;
  if (count4 > 5){
    document.getElementById("overlay4").style.display= "block";
  }
}
function overlay4off(){
    document.getElementById("overlay4").style.display= "none";
}
function showPcs() {
  var b;
  for (b = 0; b < pcs.length; b++) {
    console.log(pcs[b]);
  }
  console.log(remoteVideo.srcObject);
  console.log(remoteVideo1.srcObject);
  console.log(remoteVideo2.srcObject);

}