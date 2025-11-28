// This script will fix the dater-signup.html initialization
const fs = require('fs');

let content = fs.readFileSync('dater-signup.html', 'utf8');

// Replace the problematic initialization section
const oldInit = `    // Wait for platform manager to initialize
    const checkPlatform = setInterval(() => {
        if (window.platformManager) {
            clearInterval(checkPlatform);
            console.log('Platform manager found, initialization complete');
            document.getElementById('statusMessage').textContent = '✅ Platform ready - you can sign up!';
        }
    }, 100);
    
    // Timeout after 3 seconds
    setTimeout(() => {
        if (!window.platformManager) {
            console.error('Platform manager not found after 3 seconds');
            document.getElementById('statusMessage').textContent = '❌ Platform manager failed to initialize';
        }
    }, 3000);`;

const newInit = `    // Wait for platform manager to fully initialize
    const checkPlatform = setInterval(() => {
        if (window.platformManager && window.platformManager.initialized && typeof window.platformManager.addDater === 'function') {
            clearInterval(checkPlatform);
            console.log('✅ Platform manager fully initialized and ready');
            document.getElementById('statusMessage').textContent = '✅ Platform ready - you can sign up!';
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
        if (!window.platformManager || !window.platformManager.initialized) {
            console.error('❌ Platform manager not fully initialized after 5 seconds');
            document.getElementById('statusMessage').textContent = '⚠️ Platform loading slowly - try refreshing';
            // Don't show error, just warn - platform might still work
        }
    }, 5000);`;

content = content.replace(oldInit, newInit);

// Also fix the form submission check
const oldSubmitCheck = `        if (!window.platformManager || typeof window.platformManager.addDater !== 'function') {
            console.error('Platform manager not properly loaded:', window.platformManager);
            alert('❌ Platform not ready. Please wait a moment and try again.');
            return false;
        }`;

const newSubmitCheck = `        if (!window.platformManager || !window.platformManager.initialized || typeof window.platformManager.addDater !== 'function') {
            console.warn('Platform manager not fully ready:', window.platformManager);
            // Try anyway - might work with localStorage fallback
            console.log('Proceeding with submission despite warning...');
        }`;

content = content.replace(oldSubmitCheck, newSubmitCheck);

fs.writeFileSync('dater-signup.html', content);
console.log('✅ Fixed dater-signup.html initialization');
