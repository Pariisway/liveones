import { 
    db, realtimeDb, stripe,
    doc, getDoc, addDoc, serverTimestamp,
    dbRef, set
} from './firebase-config.js';

let selectedWhisper = null;
let stripeElements = null;
let cardElement = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initPaymentPage();
    setupStripe();
});

async function initPaymentPage() {
    // Get whisper ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const whisperId = urlParams.get('whisper');
    
    if (!whisperId) {
        window.location.href = 'search.html';
        return;
    }
    
    try {
        // Load whisper info
        const whisperDoc = await getDoc(doc(db, 'users', whisperId));
        if (!whisperDoc.exists()) {
            throw new Error('Whisper not found');
        }
        
        selectedWhisper = { id: whisperId, ...whisperDoc.data() };
        displayWhisperInfo();
        
        // Check if whisper is available
        // Note: In production, you should check real-time status
        
    } catch (error) {
        console.error('Error loading whisper:', error);
        alert('Whisper not found. Redirecting...');
        window.location.href = 'search.html';
    }
}

function displayWhisperInfo() {
    if (!selectedWhisper) return;
    
    const whisperInfo = document.getElementById('whisperInfo');
    if (whisperInfo) {
        whisperInfo.innerHTML = `
            <div class="whisper-card-small">
                <img src="${selectedWhisper.photoURL || 'https://via.placeholder.com/50'}" 
                     alt="${selectedWhisper.name}" 
                     class="whisper-avatar-small">
                <div>
                    <h4>${selectedWhisper.name}</h4>
                    <p>${selectedWhisper.bio || 'No bio'}</p>
                </div>
            </div>
        `;
    }
}

function setupStripe() {
    // Create Stripe Elements
    stripeElements = stripe.elements();
    const style = {
        base: {
            color: '#f0f0f0',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#666'
            }
        },
        invalid: {
            color: '#ff4444',
            iconColor: '#ff4444'
        }
    };
    
    cardElement = stripeElements.create('card', { style: style });
    cardElement.mount('#card-element');
    
    // Handle real-time validation errors
    cardElement.on('change', (event) => {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
    
    // Handle form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    if (!selectedWhisper) {
        alert('Whisper information is missing. Please try again.');
        return;
    }
    
    // Get form data
    const email = document.getElementById('buyerEmail').value;
    const name = document.getElementById('buyerName').value || 'Anonymous';
    
    // Disable submit button
    const submitBtn = document.getElementById('submitPayment');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Step 1: Create a call record in Firestore
        const callData = {
            whisperId: selectedWhisper.id,
            whisperName: selectedWhisper.name,
            customerEmail: email,
            customerName: name,
            amount: 1500, // $15.00 in cents
            whisperEarnings: 1200, // $12.00 in cents
            platformFee: 300, // $3.00 in cents
            status: 'pending_payment',
            createdAt: serverTimestamp()
        };
        
        const callRef = await addDoc(collection(db, 'calls'), callData);
        const callId = callRef.id;
        
        // Step 2: Create Stripe Payment Intent
        // Note: In production, you should create Payment Intent on your server
        // For now, we'll simulate with test data
        
        // Step 3: Create waiting call in Realtime Database
        await set(dbRef(realtimeDb, `calls/${selectedWhisper.id}/waiting/${callId}`), {
            id: callId,
            customerEmail: email,
            customerName: name,
            createdAt: Date.now(),
            status: 'waiting'
        });
        
        // Step 4: Show success and redirect
        alert('Payment successful! Redirecting to chat room...');
        
        // In production, you would:
        // 1. Create a Payment Intent on your server
        // 2. Confirm the payment with Stripe
        // 3. Update the call status
        // 4. Redirect to chat room
        
        // For demo, we'll redirect directly
        window.location.href = `chatroom.html?call=${callId}`;
        
    } catch (error) {
        console.error('Payment error:', error);
        alert(`Payment failed: ${error.message}`);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Pay $15.00';
    }
}

// Note: For production, you need a server to:
// 1. Create Stripe Payment Intents
// 2. Handle webhooks for payment confirmation
// 3. Generate Agora tokens
