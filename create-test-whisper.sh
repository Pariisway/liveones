#!/bin/bash
echo "Creating test whisper..."

cat > test-whisper.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Create Test Whisper</title>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
</head>
<body>
    <h1>Create Test Whisper</h1>
    <button onclick="createWhisper()">Create Online Whisper</button>
    <button onclick="createOfflineWhisper()">Create Offline Whisper</button>
    <div id="output"></div>
    
    <script>
        // Firebase config
        const firebaseConfig = {
            apiKey: "AIzaSyALbIJSI2C-p6IyMtj_F0ZqGyN1i79jOd4",
            authDomain: "whisper-chat-live.firebaseapp.com",
            projectId: "whisper-chat-live",
            storageBucket: "whisper-chat-live.firebasestorage.app",
            messagingSenderId: "302894848452",
            appId: "1:302894848452:web:61a7ab21a269533c426c91"
        };
        
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        const db = firebase.firestore();
        
        async function createWhisper() {
            const whisperId = 'test_' + Date.now();
            const output = document.getElementById('output');
            
            try {
                await db.collection('users').doc(whisperId).set({
                    email: 'test@houseofwhispers.com',
                    username: 'Test Whisper (Online)',
                    userType: 'whisper',
                    isAvailable: true,
                    bio: 'I am a test whisper for debugging. Ready to listen!',
                    profilePic: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
                    totalEarnings: 150,
                    totalCalls: 10,
                    weeklyEarnings: 60,
                    rating: 4.8,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                output.innerHTML = `
                    <div style="color: green; padding: 20px; background: #e8f5e8; border-radius: 10px; margin-top: 20px;">
                        <h3>✅ Test Whisper Created!</h3>
                        <p><strong>Name:</strong> Test Whisper (Online)</p>
                        <p><strong>Status:</strong> ONLINE</p>
                        <p><strong>ID:</strong> ${whisperId}</p>
                        <p>Now go to <a href="index.html">Homepage</a> and refresh to see this whisper.</p>
                        <p>Or <a href="become-whisper.html">create a real whisper account</a>.</p>
                    </div>
                `;
                
            } catch (error) {
                output.innerHTML = `<div style="color: red;">❌ Error: ${error.message}</div>`;
            }
        }
        
        async function createOfflineWhisper() {
            const whisperId = 'offline_test_' + Date.now();
            const output = document.getElementById('output');
            
            try {
                await db.collection('users').doc(whisperId).set({
                    email: 'offline@houseofwhispers.com',
                    username: 'Test Whisper (Offline)',
                    userType: 'whisper',
                    isAvailable: false,
                    bio: 'I am an offline test whisper.',
                    profilePic: 'https://ui-avatars.com/api/?name=Offline+Whisper&background=64748b&color=fff',
                    totalEarnings: 0,
                    totalCalls: 0,
                    rating: 0,
                    createdAt: new Date()
                });
                
                output.innerHTML = `
                    <div style="color: orange; padding: 20px; background: #fff3cd; border-radius: 10px; margin-top: 20px;">
                        <h3>⚠️ Offline Whisper Created</h3>
                        <p>This whisper is OFFLINE and won't appear on homepage.</p>
                        <p>To see whispers, they must be: 1) userType="whisper" AND 2) isAvailable=true</p>
                    </div>
                `;
                
            } catch (error) {
                output.innerHTML = `<div style="color: red;">❌ Error: ${error.message}</div>`;
            }
        }
    </script>
</body>
</html>
HTML_EOF

echo "✅ Created test-whisper.html"
echo "Open: http://localhost:8000/test-whisper.html"
echo "Click 'Create Online Whisper' then refresh homepage"
