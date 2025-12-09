// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAoZ5Dmv_PdW69d-q8f1AQ2WfA6urY4-8",
  authDomain: "whisperchatapp.firebaseapp.com",
  projectId: "whisperchatapp",
  storageBucket: "whisperchatapp.appspot.com",
  messagingSenderId: "141884801138",
  appId: "1:141884801138:web:ab7868d670d4845142dbf4",
  measurementId: "G-L0QLX00S7K"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Global variables
let currentUser = null;
let currentUserData = null;
let unsubscribeUserData = null;

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Check auth state
firebase.auth().onAuthStateChanged((user) => {
  currentUser = user;
  
  if (user) {
    console.log("User signed in:", user.uid);
    loadUserData(user.uid);
    
    // Dispatch auth-ready event
    window.dispatchEvent(new Event('auth-ready'));
  } else {
    console.log("No user signed in");
    // Redirect to login if on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
      window.location.href = 'index.html';
    }
  }
});

// Load user data from Firestore
function loadUserData(uid) {
  if (!firebase.firestore) {
    console.error("Firestore not available");
    return;
  }
  
  try {
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(uid);
    
    unsubscribeUserData = userRef.onSnapshot((doc) => {
      if (doc.exists) {
        currentUserData = doc.data();
        console.log("User data loaded:", currentUserData);
        updateUIWithUserData();
      } else {
        // Create user document if it doesn't exist
        createUserDocument(uid);
      }
    }, (error) => {
      console.error("Error loading user data:", error);
    });
  } catch (error) {
    console.error("Error in loadUserData:", error);
  }
}

// Create user document
function createUserDocument(uid) {
  const db = firebase.firestore();
  const userData = {
    uid: uid,
    email: firebase.auth().currentUser.email,
    displayName: firebase.auth().currentUser.displayName || 'User',
    coins: 0,
    mode: 'caller',
    available: true,
    createdAt: new Date().toISOString(),
    category: 'General',
    bio: 'New user on WhisperChat'
  };
  
  db.collection('users').doc(uid).set(userData)
    .then(() => {
      console.log("User document created");
      currentUserData = userData;
      updateUIWithUserData();
    })
    .catch((error) => {
      console.error("Error creating user document:", error);
    });
}

// Update UI with user data
function updateUIWithUserData() {
  if (!currentUserData) return;
  
  // Update dashboard elements
  document.querySelectorAll('#userGreeting').forEach(el => {
    el.textContent = `Hi, ${currentUserData.displayName}`;
  });
  
  document.querySelectorAll('#userCoinBalance').forEach(el => {
    el.textContent = currentUserData.coins;
  });
  
  // Update mode toggle
  const modeToggle = document.getElementById('modeToggle');
  if (modeToggle) {
    modeToggle.checked = currentUserData.mode === 'whisper';
    updateModeStatus();
  }
  
  // Update profile form
  if (document.getElementById('editDisplayName')) {
    document.getElementById('editDisplayName').value = currentUserData.displayName || '';
    document.getElementById('editCategory').value = currentUserData.category || 'lifestyle';
    document.getElementById('editBio').value = currentUserData.bio || '';
    document.getElementById('editInstagram').value = currentUserData.socialLinks?.instagram || '';
    document.getElementById('editTwitter').value = currentUserData.socialLinks?.twitter || '';
    document.getElementById('editTikTok').value = currentUserData.socialLinks?.tiktok || '';
    document.getElementById('editYouTube').value = currentUserData.socialLinks?.youtube || '';
    
    // Update bio character count
    const bioTextarea = document.getElementById('editBio');
    if (bioTextarea) {
      updateCharCount(bioTextarea);
    }
  }
}

// ============================================
// UPDATED LOAD WHISPERS FUNCTION (WITH FALLBACK)
// ============================================

function loadWhispers() {
  console.log("loadWhispers called");
  const whispersContainer = document.getElementById('whispersContainer');
  const loadingIndicator = document.querySelector('.loading-indicator');
  
  if (!whispersContainer) {
    console.error("Whispers container not found");
    return;
  }
  
  // Check if user is authenticated
  if (!currentUser) {
    console.log("User not authenticated, showing static whispers");
    showStaticWhispers();
    return;
  }
  
  // Check if Firestore is available
  if (!firebase.firestore) {
    console.error("Firestore not available");
    showStaticWhispers();
    return;
  }
  
  try {
    const db = firebase.firestore();
    
    // Show loading state
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
    
    // Query for whispers: users with mode='whisper' and available=true
    db.collection('users')
      .where('mode', '==', 'whisper')
      .where('available', '==', true)
      .limit(12) // Limit to 12 for performance
      .get()
      .then((querySnapshot) => {
        console.log(`Found ${querySnapshot.size} whispers`);
        
        if (querySnapshot.empty) {
          console.log("No whispers found in database, showing static whispers");
          showStaticWhispers();
          return;
        }
        
        let whispersHTML = '';
        querySnapshot.forEach((doc) => {
          const user = doc.data();
          whispersHTML += createWhisperCard(user, doc.id);
        });
        
        whispersContainer.innerHTML = whispersHTML;
        setupWhisperCardEvents();
        
        // Hide loading indicator
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
      })
      .catch((error) => {
        console.error("Error loading whispers from Firestore:", error);
        showStaticWhispers();
        
        // Hide loading indicator
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
      });
      
  } catch (error) {
    console.error("Error in loadWhispers:", error);
    showStaticWhispers();
  }
}

function showStaticWhispers() {
  console.log("Showing static whispers fallback");
  const whispersContainer = document.getElementById('whispersContainer');
  if (!whispersContainer) return;
  
  const staticWhispers = [
    {
      displayName: "Sarah",
      category: "Lifestyle",
      bio: "Let's have a meaningful conversation about life",
      rating: 4.9,
      totalCalls: 124
    },
    {
      displayName: "Alex",
      category: "Gaming",
      bio: "PC & Console gamer, let's talk games!",
      rating: 4.8,
      totalCalls: 89
    },
    {
      displayName: "Maya",
      category: "Music",
      bio: "Singer and songwriter, love all genres",
      rating: 5.0,
      totalCalls: 156
    },
    {
      displayName: "Jordan",
      category: "Fitness",
      bio: "Personal trainer and nutrition enthusiast",
      rating: 4.7,
      totalCalls: 67
    }
  ];
  
  let whispersHTML = '';
  staticWhispers.forEach((whisper, index) => {
    whispersHTML += `
    <div class="whisper-card" data-whisper-id="static-${index}">
      <div class="whisper-avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <div class="whisper-info">
        <h3 class="whisper-name">${whisper.displayName}</h3>
        <div class="whisper-category">${whisper.category}</div>
        <div class="whisper-bio">
          <p>${whisper.bio}</p>
        </div>
      </div>
      <div class="whisper-stats">
        <div class="stat">
          <i class="fas fa-phone-alt"></i>
          <span>${whisper.totalCalls} calls</span>
        </div>
        <div class="stat">
          <i class="fas fa-star"></i>
          <span>${whisper.rating}</span>
        </div>
      </div>
      <div class="whisper-actions">
        <button class="btn-primary btn-small start-call-btn" data-whisper-id="static-${index}">
          <i class="fas fa-phone-alt"></i> Call Now (1 coin)
        </button>
      </div>
    </div>
    `;
  });
  
  whispersContainer.innerHTML = whispersHTML;
  setupWhisperCardEvents();
}

function createWhisperCard(user, userId) {
  return `
  <div class="whisper-card" data-whisper-id="${userId}">
    <div class="whisper-avatar">
      ${user.photoURL ? 
        `<img src="${user.photoURL}" alt="${user.displayName}">` : 
        `<i class="fas fa-user-circle"></i>`
      }
    </div>
    <div class="whisper-info">
      <h3 class="whisper-name">${user.displayName || 'User'}</h3>
      <div class="whisper-category">${user.category || 'General'}</div>
      <div class="whisper-bio">
        <p>${user.bio || 'Available for conversation'}</p>
      </div>
    </div>
    <div class="whisper-stats">
      <div class="stat">
        <i class="fas fa-phone-alt"></i>
        <span>${user.totalCalls || 0} calls</span>
      </div>
      <div class="stat">
        <i class="fas fa-star"></i>
        <span>${user.rating || 5.0}</span>
      </div>
    </div>
    <div class="whisper-actions">
      <button class="btn-primary btn-small start-call-btn" data-whisper-id="${userId}">
        <i class="fas fa-phone-alt"></i> Call Now (1 coin)
      </button>
    </div>
  </div>
  `;
}

function setupWhisperCardEvents() {
  // Add click event to whisper cards
  document.querySelectorAll('.whisper-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.closest('.start-call-btn') && !e.target.closest('.whisper-actions')) {
        const whisperId = this.getAttribute('data-whisper-id');
        const whisperName = this.querySelector('.whisper-name').textContent;
        viewWhisperProfile(whisperId, whisperName);
      }
    });
  });
  
  // Add click event to call buttons
  document.querySelectorAll('.start-call-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const whisperId = this.getAttribute('data-whisper-id');
      const whisperName = this.closest('.whisper-card').querySelector('.whisper-name').textContent;
      startCall(whisperId, whisperName);
    });
  });
}

function viewWhisperProfile(whisperId, whisperName) {
  // Navigate to profile page
  window.location.href = `profile.html?id=${whisperId}&name=${encodeURIComponent(whisperName)}`;
}

function startCall(whisperId, whisperName) {
  if (!currentUser) {
    alert("Please log in to start a call.");
    window.location.href = 'index.html';
    return;
  }
  
  // Check if user has coins
  if (currentUserData && currentUserData.coins < 1) {
    alert("You need at least 1 coin to start a call. Please buy coins first.");
    window.location.href = 'index.html#pricing';
    return;
  }
  
  console.log(`Starting call with ${whisperName} (${whisperId})`);
  
  // In a real implementation, this would:
  // 1. Deduct 1 coin from caller
  // 2. Create a call session in Firestore
  // 3. Initialize Agora call
  
  // For now, simulate starting a call
  alert(`Starting call with ${whisperName}...\n\nThis would initiate an Agora video call.`);
  
  // Redirect to call page or open call interface
  // window.location.href = `call.html?whisperId=${whisperId}&whisperName=${encodeURIComponent(whisperName)}`;
}

// Call loadWhispers when auth is ready
window.addEventListener('auth-ready', function() {
  console.log("Auth ready, loading whispers...");
  setTimeout(loadWhispers, 1000);
});

// Also load whispers on page load as fallback
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, attempting to load whispers...");
  setTimeout(loadWhispers, 2000);
});

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

function updateModeStatus() {
  if (!currentUserData) return;
  
  const modeToggle = document.getElementById('modeToggle');
  const modeStatus = document.getElementById('modeStatus');
  const whisperControls = document.getElementById('whisperControls');
  
  if (!modeToggle || !modeStatus || !whisperControls) return;
  
  if (modeToggle.checked) {
    // Whisper mode
    modeStatus.innerHTML = '<i class="fas fa-user-check"></i> You are in Whisper Mode';
    whisperControls.style.display = 'block';
  } else {
    // Caller mode
    modeStatus.innerHTML = '<i class="fas fa-phone-alt"></i> You are in Caller Mode';
    whisperControls.style.display = 'none';
  }
}

function updateAvailability() {
  if (!currentUserData) return;
  
  const availabilityToggle = document.getElementById('availabilityToggle');
  const availabilityStatus = document.getElementById('availabilityStatus');
  
  if (!availabilityToggle || !availabilityStatus) return;
  
  if (availabilityToggle.checked) {
    availabilityStatus.innerHTML = '<i class="fas fa-circle online"></i> Available for calls';
  } else {
    availabilityStatus.innerHTML = '<i class="fas fa-circle offline"></i> Not available';
  }
}

// Save profile/settings
function saveProfile() {
  if (!currentUser || !firebase.firestore) {
    alert("Please log in to save profile.");
    return;
  }
  
  const displayName = document.getElementById('editDisplayName').value.trim();
  const category = document.getElementById('editCategory').value;
  const bio = document.getElementById('editBio').value.trim();
  const instagram = document.getElementById('editInstagram').value.trim();
  const twitter = document.getElementById('editTwitter').value.trim();
  const tiktok = document.getElementById('editTikTok').value.trim();
  const youtube = document.getElementById('editYouTube').value.trim();
  
  if (!displayName || !category || !bio) {
    alert("Please fill in all required fields.");
    return;
  }
  
  const db = firebase.firestore();
  const updateData = {
    displayName: displayName,
    category: category,
    bio: bio,
    updatedAt: new Date().toISOString()
  };
  
  // Add social links if provided
  const socialLinks = {};
  if (instagram) socialLinks.instagram = instagram;
  if (twitter) socialLinks.twitter = twitter;
  if (tiktok) socialLinks.tiktok = tiktok;
  if (youtube) socialLinks.youtube = youtube;
  
  if (Object.keys(socialLinks).length > 0) {
    updateData.socialLinks = socialLinks;
  }
  
  // Update in Firestore
  db.collection('users').doc(currentUser.uid).update(updateData)
    .then(() => {
      alert("Profile updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    });
}

// Buy coins function
function buyCoins() {
  window.location.href = 'index.html#pricing';
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, setting up event listeners...");
  
  // Auth buttons
  document.getElementById('loginBtn')?.addEventListener('click', function() {
    window.location.href = 'dashboard.html';
  });
  
  document.getElementById('logoutBtn')?.addEventListener('click', function() {
    firebase.auth().signOut().then(() => {
      window.location.href = 'index.html';
    });
  });
  
  // Mode toggle
  const modeToggle = document.getElementById('modeToggle');
  if (modeToggle) {
    modeToggle.addEventListener('change', function() {
      if (!currentUser || !firebase.firestore) {
        alert("Please log in to change mode.");
        modeToggle.checked = !modeToggle.checked;
        return;
      }
      
      const db = firebase.firestore();
      const newMode = this.checked ? 'whisper' : 'caller';
      
      db.collection('users').doc(currentUser.uid).update({
        mode: newMode,
        updatedAt: new Date().toISOString()
      })
      .then(() => {
        updateModeStatus();
      })
      .catch((error) => {
        console.error("Error updating mode:", error);
        alert("Error updating mode. Please try again.");
        modeToggle.checked = !modeToggle.checked;
      });
    });
  }
  
  // Availability toggle
  const availabilityToggle = document.getElementById('availabilityToggle');
  if (availabilityToggle) {
    availabilityToggle.addEventListener('change', function() {
      if (!currentUser || !firebase.firestore) {
        alert("Please log in to change availability.");
        availabilityToggle.checked = !availabilityToggle.checked;
        return;
      }
      
      const db = firebase.firestore();
      
      db.collection('users').doc(currentUser.uid).update({
        available: this.checked,
        updatedAt: new Date().toISOString()
      })
      .then(() => {
        updateAvailability();
      })
      .catch((error) => {
        console.error("Error updating availability:", error);
        alert("Error updating availability. Please try again.");
        availabilityToggle.checked = !availabilityToggle.checked;
      });
    });
  }
  
  // Profile form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveProfile();
    });
    
    // Bio character count
    const bioTextarea = document.getElementById('editBio');
    if (bioTextarea) {
      bioTextarea.addEventListener('input', function() {
        updateCharCount(this);
      });
    }
  }
  
  // Buy coins buttons
  document.querySelectorAll('#buyCoinsBtn, #buyCoinsBtnDashboard').forEach(btn => {
    btn.addEventListener('click', buyCoins);
  });
  
  // Stripe connect button
  document.getElementById('connectStripeBtn')?.addEventListener('click', function() {
    alert("Stripe Connect integration would be implemented here.\n\nIn production, this would redirect to Stripe OAuth flow.");
  });
  
  // Reset settings button
  document.getElementById('resetSettingsBtn')?.addEventListener('click', function() {
    if (confirm("Reset all settings to default?")) {
      // Reset toggles
      document.getElementById('enableNotifications').checked = true;
      document.getElementById('autoAcceptCalls').checked = true;
      document.getElementById('showOnlineStatus').checked = true;
      alert("Settings reset to defaults.");
    }
  });
  
  // Mobile menu toggle
  document.querySelector('.mobile-menu-btn')?.addEventListener('click', function() {
    const navMenu = document.querySelector('.nav-menu');
    const navActions = document.querySelector('.nav-actions');
    
    if (navMenu && navActions) {
      navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
      navActions.style.display = navActions.style.display === 'flex' ? 'none' : 'flex';
    }
  });
});

// Helper function for bio character count
function updateCharCount(textarea) {
  const charCount = document.getElementById('bioCharCount');
  if (charCount) {
    const count = textarea.value.length;
    charCount.textContent = `${count}/500`;
    
    if (count > 500) {
      charCount.style.color = '#ff4757';
    } else if (count > 400) {
      charCount.style.color = '#ffa502';
    } else {
      charCount.style.color = 'var(--gray)';
    }
  }
}

// ============================================
// CALL NOTIFICATION SYSTEM
// ============================================

let incomingCallNotifications = [];
let notificationInterval = null;

function setupCallNotifications() {
  if (!currentUser) return;
  
  console.log("Setting up call notifications for user:", currentUser.uid);
  
  // Check if user is a whisper
  if (currentUserData && currentUserData.mode === 'whisper' && currentUserData.available) {
    startNotificationListener();
  }
  
  // Listen for mode changes
  if (unsubscribeUserData) {
    // We're already listening to user data changes
  } else {
    // Set up listener for user data
    const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
    unsubscribeUserData = userRef.onSnapshot((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        if (userData.mode === 'whisper' && userData.available) {
          startNotificationListener();
        } else {
          stopNotificationListener();
        }
      }
    });
  }
}

function startNotificationListener() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  
  // Simulate incoming calls for testing
  notificationInterval = setInterval(() => {
    // 10% chance of getting a call every 30 seconds
    if (Math.random() < 0.1) {
      simulateIncomingCall();
    }
  }, 30000);
  
  console.log("Call notification listener started");
}

function stopNotificationListener() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  console.log("Call notification listener stopped");
}

function simulateIncomingCall() {
  const callers = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];
  const caller = callers[Math.floor(Math.random() * callers.length)];
  
  const notification = {
    id: Date.now(),
    type: 'call',
    callerName: caller,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'waiting'
  };
  
  addIncomingCallNotification(notification);
}

function addIncomingCallNotification(notification) {
  incomingCallNotifications.unshift(notification);
  
  // Limit to 10 notifications
  if (incomingCallNotifications.length > 10) {
    incomingCallNotifications = incomingCallNotifications.slice(0, 10);
  }
  
  updateNotificationUI();
  
  // Show desktop notification if supported
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`📞 Incoming Call from ${notification.callerName}`, {
      body: 'Click to answer the call',
      icon: 'https://pariisway.github.io/liveones/favicon.ico',
      tag: 'whisperchat-call'
    });
  }
  
  // Play notification sound
  playNotificationSound();
  
  // Flash browser tab
  flashBrowserTab();
}

function updateNotificationUI() {
  const notificationBell = document.getElementById('notificationBell');
  const notificationCount = document.getElementById('notificationCount');
  const notificationList = document.getElementById('notificationList');
  
  if (!notificationBell || !notificationCount || !notificationList) return;
  
  // Update count
  const callCount = incomingCallNotifications.filter(n => n.type === 'call' && n.status === 'waiting').length;
  notificationCount.textContent = callCount;
  
  // Show/hide bell
  if (callCount > 0) {
    notificationBell.style.display = 'flex';
  } else {
    notificationBell.style.display = 'none';
  }
  
  // Update notification list
  let notificationsHTML = '';
  incomingCallNotifications.forEach(notification => {
    notificationsHTML += `
    <div class="notification-item ${notification.type}">
      <div class="notification-content">
        <div class="notification-header">
          <strong>${notification.type === 'call' ? '📞 Call' : '✉️ Message'}</strong>
          <small>${notification.timestamp}</small>
        </div>
        <p>${notification.type === 'call' 
          ? `From: ${notification.callerName}` 
          : notification.message || 'New message'}</p>
        ${notification.status === 'waiting' && notification.type === 'call' 
          ? `<button class="btn-small btn-primary answer-call-btn" data-id="${notification.id}">Answer</button>
             <button class="btn-small btn-outline decline-call-btn" data-id="${notification.id}">Decline</button>`
          : `<span class="notification-status ${notification.status}">${notification.status}</span>`
        }
      </div>
    </div>
    `;
  });
  
  notificationList.innerHTML = notificationsHTML || '<p style="text-align: center; padding: 20px; color: var(--gray);">No notifications</p>';
  
  // Add event listeners to answer/decline buttons
  document.querySelectorAll('.answer-call-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = parseInt(this.getAttribute('data-id'));
      answerCallNotification(id);
    });
  });
  
  document.querySelectorAll('.decline-call-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = parseInt(this.getAttribute('data-id'));
      declineCallNotification(id);
    });
  });
}

function answerCallNotification(id) {
  const notification = incomingCallNotifications.find(n => n.id === id);
  if (notification) {
    notification.status = 'answered';
    updateNotificationUI();
    
    // Start the call
    alert(`Answering call from ${notification.callerName}...\n\nThis would start an Agora video call.`);
    
    // In real implementation:
    // startAgoraCall(notification.callerId);
  }
}

function declineCallNotification(id) {
  const notification = incomingCallNotifications.find(n => n.id === id);
  if (notification) {
    notification.status = 'declined';
    updateNotificationUI();
  }
}

function playNotificationSound() {
  // Create notification sound
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log("Audio context not supported:", error);
  }
}

function flashBrowserTab() {
  if (!document.hidden) return;
  
  const originalTitle = document.title;
  let flashCount = 0;
  const maxFlashes = 10;
  
  const flashInterval = setInterval(() => {
    document.title = document.title === originalTitle 
      ? '📞 INCOMING CALL! - WhisperChat' 
      : originalTitle;
    
    flashCount++;
    
    if (flashCount >= maxFlashes * 2) {
      clearInterval(flashInterval);
      document.title = originalTitle;
    }
  }, 500);
}

// Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }
}

// Call this when dashboard initializes
window.addEventListener('auth-ready', function() {
  setTimeout(requestNotificationPermission, 2000);
  setTimeout(setupCallNotifications, 3000);
});

// Clear all notifications
document.addEventListener('click', function(e) {
  if (e.target.id === 'clearNotifications') {
    incomingCallNotifications = incomingCallNotifications.filter(n => n.status === 'waiting');
    updateNotificationUI();
  }
});

console.log("scripts.js loaded successfully");
