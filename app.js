
let inCall = false;

const firebaseConfig = {
    apiKey: "AIzaSyAM5RxaJWdcImoTxEVKzshUUD8Gvvdwnt4",
    authDomain: "blog-46883.firebaseapp.com",
    databaseURL: "https://blog-46883-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "blog-46883",
    storageBucket: "blog-46883.appspot.com",
    messagingSenderId: "604907905454",
    appId: "1:604907905454:web:f5fff79b410cca9bcd683f",
    measurementId: "G-Z4CT90CNL8"
};

firebase.initializeApp(firebaseConfig);


function createRoom(event) {
    event.preventDefault();

    const roomName = document.getElementById('roomName').value;
    const duration = document.getElementById('duration').value;
    const password = document.getElementById('password').value;
    let startDate = document.getElementById('startDate').value || new Date().getTime();
    let server = document.getElementById('server').value;

    switch (server) {
        case "0":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "1":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "2":
            server = "https://video2.erzen.tk/?roomID=";
            break;
        case "3":
            server = "https://us2-conference.erzen.tk/?roomID";
            break;
        case "4":
            server = "https://us1-conference.erzen.tk/?roomID=";
            break;
        case "5":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "6":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "7":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "8":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "9":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "10":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        case "11":
            server = "https://conference.erzen.tk/?roomID=";
            break;
        default:
            server = "https://conference.erzen.tk/?roomID=";

    }

    // Turn start date into a timestamp

    startDate = new Date(startDate).getTime();

    let salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    let tt = roomName + duration + password + startDate + salt;

    // Encrypt roomName using AES-256 and generate a 64-character code
    const encryptedRoomName = CryptoJS.AES.encrypt(tt, 'secretKey').toString();
    const roomCode = encryptedRoomName.substring(0, 64).replace(/[^a-zA-Z0-9]/g, '');


    // Generate a 12-digit room ID

    let roomID = Math.floor(100000000000 + Math.random() * 900000000000);

    // Check if room ID already exists
    firebase.database().ref('meetings/' + roomID).once('value', (snapshot) => {
        if (snapshot.exists()) {
            roomID = Math.floor(100000000000 + Math.random() * 900000000000);
        }
    });


    let videoLink = server + roomCode;


    // Upload room data to Firebase Realtime Database
    const roomData = {
        roomName: roomName,
        duration: duration,
        password: password,
        startDate: startDate,
        roomCode: roomCode,
        videoLink: videoLink
    };


    const roomRef = firebase.database().ref('meetings/' + roomID);

    roomRef.set(roomData)
        .then(() => {
            const roomID = roomRef.key;
            console.log("Room ID: " + roomID);
            showPopup(roomName, duration, startDate, roomID, videoLink, password);
        })
        .catch((error) => {
            console.error('Error creating room:', error);
        });

}

const createRoomForm = document.getElementById('createRoomForm');
createRoomForm.addEventListener('submit', createRoom);

function showPopup(roomName, duration, startDate, roomCode, videoLink, password) {
    const popup = document.createElement('div');
    popup.classList.add('fixed', 'top-0', 'left-0', 'right-0', 'bottom-0', 'flex', 'items-center', 'justify-center', 'bg-gray-900', 'bg-opacity-50', 'z-50');

    let time = new Date(startDate).toLocaleString();
    let rCode = formatCardNumber2(roomCode);

    const content = `
      <div class="bg-white rounded-lg p-8 text-center">
        <h2 class="text-xl font-bold mb-4">Room Created</h2>
        <p class="mb-4">Room Name: ${roomName}</p>
        <p class="mb-4">Duration: ${duration} minutes</p>
        <p class="mb-4">Start Date: ${time}</p>
        <p class="mb-4">Room Code: ${rCode}</p>
        <p class="mb-4">Password: ${password || "No password"}</p>

        <button id="shareRoom" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="shareRoom('${roomCode}')">Share Room</button>
        <button id="joinRoom" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="joinRoom('${roomCode}')">Join Room</button>
        <button id="closePopup" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Close</button>
      </div>
    `;

    popup.innerHTML = content;
    document.body.appendChild(popup);

    const closePopupButton = document.getElementById('closePopup');
    closePopupButton.addEventListener('click', () => {
        popup.remove();
    });
}

function joinRoom(roomCode) {
    // Check if room exists
    toast('Connecting to the rooms database...', 500);
    firebase.database().ref('meetings/' + roomCode).once('value', async (snapshot) => {
        if (snapshot.exists()) {

            // Check if room is expired
            const roomData = snapshot.val();
            const startDate = roomData.startDate;
            const duration = roomData.duration;
            const currentDate = new Date().getTime();
            const expiryDate = startDate + (duration * 60000);
            let link = roomData.videoLink;

            if (currentDate > expiryDate) {
                toast('This room has expired on ' + new Date(expiryDate).toLocaleString() + '.');
            } else {

                // Check if the room has not started yet
                if (currentDate < startDate) {
                    toast('This room has not started yet! it will start at ' + new Date(startDate).toLocaleString() + '.');
                } else {
                    // Check if room is password-protected
                    const password = roomData.password;
                    if (password) {
                        // Ask for password
                        let userPassword;

                        await askForPassword(password)
                            .then((password) => {
                                console.log("Entered password:", password);
                                userPassword = password;
                            })
                            .catch((error) => {
                                console.log(error);
                            });


                        if (userPassword === password) {
                            // Redirect to room
                            makeCall(link, startDate, duration);
                            let toast1 = false;

                            // Set an interval every 500ms to check if the duration is over
                            const intervalId = setInterval(() => {
                                if (!checkTimeLeft(startDate, duration)) {
                                    toast('This room has ended!');
                                    closeVideo();
                                    clearInterval(intervalId); // Remove the interval
                                    return;
                                }

                                let timeLeft = checkTimeLeft2(startDate, duration);


                                if (timeLeft < 300 || timeLeft === 10 || timeLeft === 5 || timeLeft === 4 || timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
                                    if (!toast1) {
                                        toast('This room will end in ' + timeLeft + ' seconds!');
                                    }
                                    toast1 = true;
                                }

                                if (timeLeft === 120 || timeLeft === 60 || timeLeft === 10 || timeLeft === 5 || timeLeft === 4 || timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
                                    toast('This room will end in ' + timeLeft + ' seconds!');
                                }

                                console.log("Time left: " + timeLeft);

                            }, 500);


                        } else {
                            toast('Incorrect password!');
                        }
                    } else {
                        // Redirect to room
                        makeCall(link);
                        let toast1 = false;

                        // Set an interval every 500ms to check if the duration is over
                        const intervalId = setInterval(() => {
                            if (!checkTimeLeft(startDate, duration)) {
                                toast('This room has ended!');
                                closeVideo();
                                clearInterval(intervalId); // Remove the interval
                                return;
                            }

                            let timeLeft = checkTimeLeft2(startDate, duration);


                            if (timeLeft < 300 || timeLeft === 10 || timeLeft === 5 || timeLeft === 4 || timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
                                if (!toast1) {
                                    toast('This room will end in ' + timeLeft + ' seconds!');
                                }
                                toast1 = true;
                            }

                            if (timeLeft === 120 || timeLeft === 60 || timeLeft === 10 || timeLeft === 5 || timeLeft === 4 || timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
                                toast('This room will end in ' + timeLeft + ' seconds!');
                            }

                            console.log("Time left: " + timeLeft);

                        }, 500);

                    }
                }

            }

        } else {
            toast('This room does not exist!');
        }
    });
}

const joinRoomForm = document.getElementById('joinRoomForm');
joinRoomForm.addEventListener('submit', roomJoin);

function roomJoin(event) {
    event.preventDefault();

    let roomCode = document.getElementById('roomCode').value;

    roomCode = unformatCardNumber(roomCode);

    joinRoom(roomCode);
}

function checkTimeLeft(startDate, duration) {
    const currentDate = new Date().getTime();
    const expiryDate = startDate + (duration * 60000);

    if (currentDate > expiryDate) {
        return false;
    } else {
        return true;
    }
}

function checkTimeLeft2(startDate, duration) {
    const currentDate = new Date().getTime();
    const expiryDate = new Date(startDate).getTime() + duration * 60000;

    if (currentDate > expiryDate) {
        return 0; // Time has expired
    } else {
        const timeLeftInSeconds = Math.floor((expiryDate - currentDate) / 1000);
        return timeLeftInSeconds;
    }
}

function toast(message, duration = 4500, delay = 0) {

    // Check for existing toast class elements

    const existingToast = document.querySelector('.toast');

    if (existingToast) {
        existingToast.remove();
    }


    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '1rem';
    toastContainer.style.right = '1rem';
    toastContainer.style.display = 'flex';
    toastContainer.style.alignItems = 'center';
    toastContainer.style.justifyContent = 'center';
    toastContainer.style.width = '16rem';
    toastContainer.style.padding = '1rem';
    toastContainer.style.backgroundColor = '#1F2937';
    toastContainer.style.color = '#FFF';
    toastContainer.style.borderRadius = '0.25rem';
    toastContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
    toastContainer.style.overflow = 'auto';
    toastContainer.style.maxHeight = '500px';
    toastContainer.style.minWidth = '200px';
    toastContainer.style.width = 'fit-content';
    toastContainer.style.zIndex = '9999';
    toastContainer.setAttribute('class', 'toast');

    const toastText = document.createElement('span');
    toastText.style.whiteSpace = 'nowrap';
    toastText.style.overflow = 'hidden';
    toastText.style.textOverflow = 'ellipsis';
    toastText.textContent = message;
    toastContainer.appendChild(toastText);

    document.body.appendChild(toastContainer);

    setTimeout(() => {
        toastContainer.style.opacity = '0';
        setTimeout(() => {
            toastContainer.remove();
        }, 300);
    }, duration + delay);

    toast.dismiss = function () {
        toastContainer.style.opacity = '0';
        setTimeout(() => {
            toastContainer.remove();
        }, 300);
    };
}

const cardNumberInput = document.getElementById('roomCode');

cardNumberInput.addEventListener('input', formatCardNumber);

function formatCardNumber() {
    let input = cardNumberInput.value;
    // Remove non-digit characters from the input
    input = input.replace(/\D/g, '');
    // Apply the desired format
    input = input.replace(/(\d{4})(?=\d)/g, '$1 ');

    cardNumberInput.value = input;
}

function unformatCardNumber(number) {
    let input = number;
    input = input.replace(/\s/g, ''); // Remove all spaces from the input
    return input;
}

function formatCardNumber2(number) {
    let input = number;
    // Remove non-digit characters from the input
    input = input.replace(/\D/g, '');
    // Apply the desired format
    input = input.replace(/(\d{4})(?=\d)/g, '$1 ');

    return input;
}

function shareRoom(code) {
    const roomCode = code;
    const link = location.origin + "/?/code/" + roomCode;
    const shareData = {
        title: 'Join my room on eMeetings!',
        text: 'Join my room on eMeetings!',
        url: link,
    }

    navigator.share(shareData);
}

// When DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    let url = window.location.href;

    var number = url.split("/").pop();

    // Check if the url contains a room code
    if (number.length > 0) {
        joinRoom(number);
    }

});


// function askForPassword(pass) {
//     return new Promise((resolve, reject) => {
//         Swal.fire({
//             title: "<span style='font-family: monospace;'>Enter password to continue</span>",
//             html: `
//           <div style='text-align: center;'>
//             <label for='password' style='display: block; margin-bottom: 10px; font-family: monospace;'>Enter password:</label>
//             <input type='password' id='password11' autocomplete="new-password" style='width: 100%; padding: 8px; font-family: monospace; outline: none;'>
//           </div>
//         `,
//             showCancelButton: true,
//             confirmButtonText: "<span style='font-family: monospace;'>Continue</span>",
//             cancelButtonText: "<span style='font-family: monospace;'>Cancel</span>",
//             allowOutsideClick: false,
//             allowEscapeKey: false,
//             preConfirm: () => {
//                 const password = document.getElementById("password11").value;
//                 return password || Swal.showValidationMessage("Enter password") || password !== pass ? Swal.showValidationMessage("Incorrect password") : null;
//             },
//         }).then((result) => {
//             if (result.isConfirmed) {
//                 resolve(result.value);
//             } else {
//                 reject("Password prompt cancelled");
//             }
//         });
//     });
// }

function askForPassword(pass) {
    console.log(pass);
    return new Promise((resolve, reject) => {
        Swal.fire({
            title: "<span style='font-family: monospace;'>Enter password to continue</span>",
            html: `
          <div style='text-align: center;'>
            <label for='password' style='display: block; margin-bottom: 10px; font-family: monospace;'>Enter password:</label>
            <input type='password' id='password11' autocomplete="new-password" style='width: 100%; padding: 8px; font-family: monospace; outline: none;'>
          </div>
        `,
            showCancelButton: true,
            confirmButtonText: "<span style='font-family: monospace;'>Continue</span>",
            cancelButtonText: "<span style='font-family: monospace;'>Cancel</span>",
            allowOutsideClick: false,
            allowEscapeKey: false,
            preConfirm: () => {
                const password = document.getElementById("password11").value;
                if (!password) {
                    Swal.showValidationMessage("Enter password");
                } else if (password !== pass) {
                    Swal.showValidationMessage("Incorrect password");
                } else {
                    return password;
                }
            },
        }).then((result) => {
            if (result.isConfirmed) {
                resolve(result.value);
            } else {
                reject("Password prompt cancelled");
            }
        });
    });
}


function createRoomS() {
    document.getElementById("createR").classList.remove("hidden");
    document.getElementById("joinR").classList.add("hidden");
}

function joinRoomS() {
    document.getElementById("joinR").classList.remove("hidden");
    document.getElementById("createR").classList.add("hidden");
}