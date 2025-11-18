// app.js - Agora voice room logic
// IMPORTANT: This uses "no-token" mode (testing). For production, create and use a server token.
const APP_ID = '19383786453e4bae98ee25658adf5a4c'; // <- your App ID
const CHANNEL = 'The Live Ones'; // channel name
const TOKEN = null; // for testing leave as null

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
let localAudioTrack = null;
let remoteUsers = new Map();
let isMuted = false;

const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const muteBtn = document.getElementById('muteBtn');
const statusEl = document.getElementById('status');
const peopleEl = document.getElementById('people');
const userCountEl = document.getElementById('userCount');

function setStatus(s){ statusEl.textContent = 'Status: ' + s; }

joinBtn.addEventListener('click', async () => {
  setStatus('Requesting microphone...');
  try {
    // create local track (prompts for mic)
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    setStatus('Joining channel...');
    const uid = await client.join(APP_ID, CHANNEL, TOKEN, null);
    await client.publish([localAudioTrack]);
    setStatus('Connected — you are live');
    addPerson(uid, true);
    updateCount();

    // enable UI
    joinBtn.disabled = true;
    leaveBtn.disabled = false;
    muteBtn.disabled = false;
  } catch (err) {
    console.error(err);
    setStatus('Error: ' + (err.message || err));
  }
});

leaveBtn.addEventListener('click', async () => {
  try {
    if (localAudioTrack) {
      await client.unpublish([localAudioTrack]);
      localAudioTrack.close();
      localAudioTrack = null;
    }
    await client.leave();
    setStatus('Left the channel');
    clearPeople();
    joinBtn.disabled = false;
    leaveBtn.disabled = true;
    muteBtn.disabled = true;
  } catch (err) {
    console.error(err);
    setStatus('Error leaving: ' + (err.message || err));
  }
});

muteBtn.addEventListener('click', async () => {
  if (!localAudioTrack) return;
  isMuted = !isMuted;
  await localAudioTrack.setEnabled(!isMuted);
  muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
  setStatus(isMuted ? 'You are muted' : 'You are live');
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