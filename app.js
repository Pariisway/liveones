// app.js — Agora Voice Chat for "The Live Ones"

const APP_ID = "966c8e41da614722a88d4372c3d95dba"; // Your new App ID
const CHANNEL = "The Live Ones"; // Channel name
let client;
let localAudioTrack;

const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");
const muteBtn = document.getElementById("muteBtn");
const statusDiv = document.getElementById("status");
const peopleDiv = document.getElementById("people");
const userCountDiv = document.getElementById("userCount");

let muted = false;

// Initialize Agora client
async function initClient() {
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    if (mediaType === "audio") {
      const audioTrack = user.audioTrack;
      audioTrack.play(); // Play remote audio
    }
    updateUserList();
  });

  client.on("user-unpublished", (user) => {
    updateUserList();
  });

  client.on("user-joined", updateUserList);
  client.on("user-left", updateUserList);
}

// Join the voice channel
async function joinChannel() {
  joinBtn.disabled = true;
  statusDiv.textContent = "Status: Connecting...";

  try {
    await client.join(APP_ID, CHANNEL, null, null); // token=null
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish([localAudioTrack]);

    statusDiv.textContent = "Status: Connected!";
    leaveBtn.disabled = false;
    muteBtn.disabled = false;

    updateUserList();
  } catch (err) {
    console.error("Failed to join channel:", err);
    statusDiv.textContent = "Status: Error joining channel. See console.";
    joinBtn.disabled = false;
  }
}

// Leave the channel
async function leaveChannel() {
  if (localAudioTrack) {
    localAudioTrack.close();
    localAudioTrack = null;
  }
  await client.leave();

  statusDiv.textContent = "Status: Not connected";
  peopleDiv.innerHTML = "";
  joinBtn.disabled = false;
  leaveBtn.disabled = true;
  muteBtn.disabled = true;
}

// Toggle mute
function toggleMute() {
  if (!localAudioTrack) return;
  muted = !muted;
  localAudioTrack.setEnabled(!muted);
  muteBtn.textContent = muted ? "Unmute" : "Mute";
}

// Update user list
function updateUserList() {
  const users = client.remoteUsers ? Object.values(client.remoteUsers) : [];
  peopleDiv.innerHTML = users.map(u => `<div>${u.uid}</div>`).join("");
  userCountDiv.textContent = `Users: ${users.length + 1}`; // +1 for self
}

// Event listeners
joinBtn.addEventListener("click", joinChannel);
leaveBtn.addEventListener("click", leaveChannel);
muteBtn.addEventListener("click", toggleMute);

// Initialize client on page load
initClient();  setStatus(isMuted ? 'You are muted' : 'You are live');
  toggleLocalMutedClass(isMuted);
});

client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  if (mediaType === 'audio') {
    const audioTrack = user.audioTrack;
    audioTrack.play(); // plays in the page
  }
  remoteUsers.set(user.uid, user);
  addPerson(user.uid, false);
  updateCount();
});

client.on('user-unpublished', (user) => {
  remoteUsers.delete(user.uid);
  removePerson(user.uid);
  updateCount();
});

client.on('user-left', (user) => {
  remoteUsers.delete(user.uid);
  removePerson(user.uid);
  updateCount();
});

function addPerson(uid, isLocal = false) {
  if (document.getElementById('p-' + uid)) return;
  const div = document.createElement('div');
  div.className = 'person';
  div.id = 'p-' + uid;
  div.innerHTML = `<div style="font-weight:700">${isLocal ? 'You' : 'User ' + uid}</div>
                   <div style="font-size:12px;color:#bfa8ff">${isLocal ? 'Local (publishing)' : 'Remote (listening)'}</div>`;
  if (isLocal) div.setAttribute('data-local', 'true');
  peopleEl.appendChild(div);
}
function removePerson(uid) {
  const el = document.getElementById('p-' + uid);
  if (el) el.remove();
}
function toggleLocalMutedClass(m) {
  const el = document.querySelector('[data-local]');
  if (!el) return;
  if (m) el.classList.add('muted'); else el.classList.remove('muted');
}
function clearPeople() {
  peopleEl.innerHTML = '';
  remoteUsers.clear();
}
function updateCount() {
  const count = remoteUsers.size + (localAudioTrack ? 1 : 0);
  userCountEl.textContent = 'Users: ' + count;
}

// optional: leave on page close
window.addEventListener('beforeunload', async () => {
  try { await client.leave(); } catch (e) {}
});
