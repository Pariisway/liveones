// Agora Voice Chat Configuration
const AGORA_CONFIG = {
    appId: '966c8e41da614722a88d4372c3d95dba',
    token: null, // Set to null for testing, use token server for production
    channel: null, // Will be set when joining a room
    uid: null // Will be set when user joins
};

// Initialize Agora Client
let agoraClient = null;

async function initializeAgora() {
    try {
        // Create Agora client
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        console.log("✅ Agora client initialized with App ID:", AGORA_CONFIG.appId);
        return true;
    } catch (error) {
        console.error("❌ Agora initialization failed:", error);
        return false;
    }
}

// Rest of your Agora functions...
