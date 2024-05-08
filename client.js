const signalingServerUrl = 'ws://localhost:8080';
const userId = Math.random().toString(36).substr(2, 9); // Generate a random user ID

let localStream;
let remoteStream;
let peerConnection;

const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const muteButton = document.getElementById('muteButton'); // Added mute button reference

const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');

startButton.addEventListener('click', startCall);
endButton.addEventListener('click', endCall);
muteButton.addEventListener('click', toggleMute); // Added event listener for mute button

async function startCall() {
    const offer = await createOffer();
    sendMessage({
        type: 'offer',
        from: userId,
        to: otherUserId,
        data: offer
    });
}

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    localAudio.srcObject = null;
    remoteAudio.srcObject = null;
}

async function createOffer() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localAudio.srcObject = localStream;

    peerConnection = new RTCPeerConnection();
    peerConnection.addStream(localStream);

    peerConnection.onicecandidate = handleICECandidate;
    peerConnection.onaddstream = handleRemoteStreamAdded;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return peerConnection.localDescription;
}

function handleICECandidate(event) {
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            from: userId,
            to: otherUserId,
            data: event.candidate
        });
    }
}

function handleRemoteStreamAdded(event) {
    remoteStream = event.stream;
    remoteAudio.srcObject = remoteStream;
}

function toggleMute() {
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            if (audioTracks[0].enabled) {
                muteButton.textContent = "Mute Call";
            } else {
                muteButton.textContent = "Unmute Call";
            }
        }
    }
}

function sendMessage(message) {
    const ws = new WebSocket(signalingServerUrl);
    ws.onopen = function () {
        ws.send(JSON.stringify(message));
        ws.close();
    };
}

const otherUserId = prompt('Enter the other user ID:');
