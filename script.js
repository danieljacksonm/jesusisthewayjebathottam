let localStream;
let peers = {};
let roomName = '';

const videoContainer = document.getElementById('videos');

async function joinRoom() {
  roomName = document.getElementById('roomInput').value.trim();
  if (!roomName) return alert('Enter a room name');

  // Get local media
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const localVideo = document.createElement('video');
  localVideo.srcObject = localStream;
  localVideo.autoplay = true;
  localVideo.muted = true;
  videoContainer.appendChild(localVideo);

  // Start polling signaling server every 2 seconds
  setInterval(fetchSignals, 2000);
}

async function fetchSignals() {
  const response = await fetch('signaling.php?room=' + roomName);
  const messages = await response.json();

  for (const msg of messages) {
    const { from, data } = msg;

    if (!peers[from]) {
      createPeer(from, false);
    }

    const pc = peers[from];
    if (data.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from, answer);
    } else if (data.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    } else if (data.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }
}

function sendSignal(to, data) {
  fetch('signaling.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: roomName, to, data })
  });
}

function createPeer(id, initiator = true) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.onicecandidate = e => {
    if (e.candidate) {
      sendSignal(id, { candidate: e.candidate });
    }
  };

  pc.ontrack = e => {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = e.streams[0];
    remoteVideo.autoplay = true;
    videoContainer.appendChild(remoteVideo);
  };

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  peers[id] = pc;

  if (initiator) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      sendSignal(id, offer);
    });
  }
}