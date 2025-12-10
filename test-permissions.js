// Quick test to check Firestore permissions
async function testPermissions() {
    console.log("Testing Firestore permissions...");
    
    try {
        // Test 1: Can we read users without auth?
        console.log("Test 1: Reading users collection (should work for everyone)...");
        const users = await db.collection('users')
            .where('role', '==', 'whisper')
            .where('isAvailable', '==', true)
            .limit(1)
            .get();
        console.log("✅ Test 1 PASSED: Can read whispers without login");
        
        // Test 2: Can we write to users when logged in?
        if (currentUser) {
            console.log("Test 2: Writing to user document (should work when logged in)...");
            await db.collection('users').doc(currentUser.uid).update({
                test: Date.now()
            });
            console.log("✅ Test 2 PASSED: Can write to own user document");
            
            // Clean up test field
            await db.collection('users').doc(currentUser.uid).update({
                test: firebase.firestore.FieldValue.delete()
            });
        } else {
            console.log("⚠️ Test 2 SKIPPED: Not logged in");
        }
        
        // Test 3: Can we read calls when logged in?
        if (currentUser) {
            console.log("Test 3: Reading calls collection (should work when logged in)...");
            const calls = await db.collection('calls')
                .where('participants', 'array-contains', currentUser.uid)
                .limit(1)
                .get();
            console.log("✅ Test 3 PASSED: Can read calls when logged in");
        } else {
            console.log("⚠️ Test 3 SKIPPED: Not logged in");
        }
        
        console.log("🎉 All permission tests passed!");
        
    } catch (error) {
        console.error("❌ Permission test failed:", error.message);
        console.error("Error code:", error.code);
        console.error("Make sure Firestore rules are correctly set!");
    }
}

// Run test when page loads
if (typeof db !== 'undefined') {
    setTimeout(testPermissions, 2000);
}
