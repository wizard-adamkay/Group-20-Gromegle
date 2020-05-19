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
let user;
let userpath;

// This snippet goes at the JS section at the end of the body tag in "login.html"
// After firebase libraries via CDN are sourced
// After your firebase project API config is defined
// After the authentication container is created in HTML
// Meanwhile in firebase console, you need to 
// - create a project
// - know the api key config info
// - enable firestore
// - create rules to allow for read/write
// - enable authentication method (email/pwd signin)

// Initialize the FirebaseUI Widget using Firebase.
let ui = new firebaseui.auth.AuthUI(firebase.auth());
let uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.

            //------------------------------------------------------------------------------------------
            // The code below is modified from default snippet provided by the FB documentation.
            //
            // If the user is a "brand new" user, then create a new "user" in your own database.
            // Assign this user with the name and email provided.
            // Before this works, you must enable "Firestore" from the firebase console.
            // The Firestore rules must allow the user to write. 
            //------------------------------------------------------------------------------------------
            user = authResult.user;
            userpath = db.collection("users").doc(user.uid)
            if (authResult.additionalUserInfo.isNewUser) {
                userpath.set({
                    friendid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    reportcount: 0,
                    bio: "Empty",
                    pfplink: "Empty",
                    interests: [],
                    friends: [],
                    emojis: ["https://i.imgur.com/QhkFO3J.png",
                        "https://i.imgur.com/h4kBtuV.png",
                        "https://i.imgur.com/U59pzb0.png",
                        "https://i.imgur.com/070RCR6.png",
                        "https://i.imgur.com/4EJW8g3.png",
                        "https://i.imgur.com/f0Ny289.png",
                        "https://i.imgur.com/qIOg0TY.png",
                        "https://i.imgur.com/9IE3hgj.png",
                        "https://i.imgur.com/3DRphFT.png",
                        "https://i.imgur.com/53goBP7.png",
                        "https://i.imgur.com/zgtGRcx.png",
                        "https://i.imgur.com/tQnpLPr.png"
                    ]
                }).then(function () {
                    console.log("New user added to firestore");
                    window.location.assign("HTML/home.html");
                })
            } else {
                return true;
            }
            return false;
        },

        uiShown: function () {
            // The widget is rendered.s
            // Hide the loader.
            document.getElementById('loader').style.display = 'none';
        }
    },
    //disables the account chooser site
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: 'HTML/home.html',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        //firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        //firebase.auth.GithubAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //firebase.auth.PhoneAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: 'HTML/home.html',
    // Privacy policy url.
    privacyPolicyUrl: 'HTML/home.html',
    accountChooserEnabled: false
};
// The start method will wait until the DOM is loaded.
// Inject the login interface into the HTML
ui.start('#firebaseui-auth-container', uiConfig);