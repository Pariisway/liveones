// Stripe Payment Integration
const stripePublicKey = 'pk_test_51Q8tL2P7Vbu8koyhTajjEOSbbZPvfxvZQYl3LlPhN21RqL5duU9gN8q4G3gHfjDpU1Bqg72h4MZqFmH2X4CBRqhA00Rnm0orZx'; // Replace with your actual publishable key

let stripe;
let elements;
let paymentElement;

async function initializeStripe() {
    try {
        // Load Stripe.js
        if (!window.Stripe) {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            document.head.appendChild(script);
            
            // Wait for Stripe to load
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        // Initialize Stripe
        stripe = Stripe(stripePublicKey);
        
        // Create payment elements
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: 1500, // $15.00 in cents
                currency: 'usd',
                listenerId: selectedListenerId,
                callerEmail: document.getElementById('callerEmail').value
            })
        });
        
        const { clientSecret } = await response.json();
        
        elements = stripe.elements({ clientSecret });
        paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
        
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        alert('Payment system error. Please try again.');
    }
}

async function handlePaymentSubmit() {
    const email = document.getElementById('callerEmail').value;
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    
    // Show loading state
    document.getElementById('stripeCheckoutBtn').disabled = true;
    document.getElementById('stripeCheckoutBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Confirm the payment
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment-success.html`,
                receipt_email: email,
            },
            redirect: 'if_required'
        });
        
        if (error) {
            throw error;
        }
        
        if (paymentIntent.status === 'succeeded') {
            // Payment successful
            const listener = listeners.find(l => l.id === selectedListenerId);
            
            // Store call information
            localStorage.setItem('currentCall', JSON.stringify({
                listenerId: selectedListenerId,
                listenerName: listener.name,
                callerEmail: email,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                timestamp: new Date().toISOString()
            }));
            
            // Redirect to waiting room
            window.location.href = 'chat-waiting.html';
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        alert(error.message || 'Payment failed. Please try again.');
        
        // Reset button
        document.getElementById('stripeCheckoutBtn').disabled = false;
        document.getElementById('stripeCheckoutBtn').innerHTML = '<i class="fas fa-lock"></i> Pay Securely with Stripe';
    }
}
