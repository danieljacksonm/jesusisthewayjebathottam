const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const peerIdInput = document.getElementById('peerIdInput');
const localAudio = document.getElementById('localAudio');
const remoteAudios = document.getElementById('remoteAudios');

let localStream;
let peers = {}; // peerId -> RTCPeerConnection
let room;
let peerId;
let pollingInterval;

const signalingUrl = 'signaling.php';

// STUN servers config for NAT traversal
const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

joinBtn.onclick = async () => {
  room = roomInput.value.trim();
  peerId = peerIdInput.value.trim();

  if (!room || !peerId) {
    alert('Please enter room and unique peer ID');
    return;
  }

  joinBtn.disabled = true;
  roomInput.disabled = true;
  peerIdInput.disabled = true;

  await startLocalAudio();
  startSignalingLoop();
};

async function startLocalAudio() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localAudio.srcObject = localStream;
  } catch (e) {
    alert('Could not get audio: ' + e.message);
  }
}

async function startSignalingLoop() {
  await sendSignalingData(null); // send empty data on join

  pollingInterval = setInterval(async () => {
    await pollSignalingData();
  }, 2000);
}

async function sendSignalingData(data) {
  return fetch(`${signalingUrl}?room=${encodeURIComponent(room)}&peer=${encodeURIComponent(peerId)}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data || {})
  }).then(res => res.json());
}

async function pollSignalingData() {
  try {
    const res = await fetch(`${signalingUrl}?room=${encodeURIComponent(room)}&peer=${encodeURIComponent(peerId)}`);
    const data = await res.json();

    // For each remote peer signaling data
    for (const otherPeerId in data) {
      if (!peers[otherPeerId]) {
        createPeerConnection(otherPeerId, true);
      }

      const msg = data[otherPeerId];

      if (msg.sdp) {
        const desc = new RTCSessionDescription(msg.sdp);
        await peers[otherPeerId].setRemoteDescription(desc);

        if (desc.type === 'offer') {
          const answer = await peers[otherPeerId].createAnswer();
          await peers[otherPeerId].setLocalDescription(answer);
          await sendSignalingData({ sdp: peers[otherPeerId].localDescription });
        }
      }

      if (msg.candidate) {
        try {
          await peers[otherPeerId].addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    }
  } catch (e) {
    console.error('Polling signaling error:', e);
  }
}

function createPeerConnection(otherPeerId, isOfferer) {
  const pc = new RTCPeerConnection(rtcConfig);

  pc.onicecandidate = async event => {
    if (event.candidate) {
      await sendSignalingData({ candidate: event.candidate });
    }
  };

  pc.ontrack = event => {
    let remoteAudio = document.getElementById('remoteAudio-' + otherPeerId);
    if (!remoteAudio) {
      remoteAudio = document.createElement('audio');
      remoteAudio.id = 'remoteAudio-' + otherPeerId;
      remoteAudio.autoplay = true;
      remoteAudio.controls = true;
      remoteAudios.appendChild(remoteAudio);
    }
    remoteAudio.srcObject = event.streams[0];
  };

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  peers[otherPeerId] = pc;

  if (isOfferer) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer).then(() => {
        sendSignalingData({ sdp: pc.localDescription });
      });
    });
  }

  return pc;
}
