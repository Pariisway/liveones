// Stripe Payment Handler - Client Side Only
class StripePayment {
    constructor() {
        this.stripe = Stripe('pk_test_51SPYHwRvETRK3Zx7mnVDTNyPB3mxT8vbSIcSVQURp8irweK0lGznwFrW9sjgju2GFgmDiQ5GkWYVlUQZZVNrXkJb00q2QOCC3I');
    }

    async initializePayment(whisperId) {
        try {
            console.log('💰 Initializing payment for whisper:', whisperId);
            
            // For static hosting, we'll use Stripe Checkout instead of custom form
            this.whisperId = whisperId;
            
            // Create a checkout session using client-only approach
            // In production, you'd need a server, but for demo we'll simulate
            this.showCheckoutButton();
            
            return true;
        } catch (error) {
            console.error('❌ Payment initialization error:', error);
            this.showMessage('Payment system loading...', 'info');
            return false;
        }
    }

    showCheckoutButton() {
        const paymentElement = document.getElementById('payment-element');
        if (paymentElement) {
            paymentElement.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3>Ready to Connect!</h3>
                    <p>5-minute voice call with whisper</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <p><strong>Service:</strong> 5-Minute Voice Call</p>
                        <p><strong>Duration:</strong> 5 minutes</p>
                        <p><strong>Total:</strong> $15.00</p>
                    </div>
                    <button id="checkout-button" class="call-button" style="font-size: 16px; padding: 15px 30px;">
                        🎙️ Pay $15 & Start Call
                    </button>
                    <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                        🔒 Secure payment powered by Stripe
                    </p>
                </div>
            `;

            document.getElementById('checkout-button').addEventListener('click', () => {
                this.handleDemoPayment();
            });
        }
    }

    async handleDemoPayment() {
        const submitButton = document.getElementById('checkout-button');
        const messageDiv = document.getElementById('payment-message');

        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        messageDiv.textContent = '';

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // For demo purposes, we'll simulate successful payment
            // In production, you'd integrate with Stripe Checkout
            console.log('✅ Demo payment successful for whisper:', this.whisperId);
            
            // Redirect to voice call page
            window.location.href = `voice-call.html?whisperId=${this.whisperId}&demo=true`;
            
        } catch (error) {
            this.showMessage('Payment failed: ' + error.message, 'error');
            submitButton.disabled = false;
            submitButton.textContent = '🎙️ Pay $15 & Start Call';
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('payment-message');
        messageDiv.textContent = message;
        messageDiv.className = `payment-message ${type}`;
    }
}

// Initialize when page loads
let paymentHandler;

document.addEventListener('DOMContentLoaded', function() {
    paymentHandler = new StripePayment();
    
    // Get whisper ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const whisperId = urlParams.get('whisperId');
    
    if (whisperId) {
        paymentHandler.initializePayment(whisperId);
    }

    // Handle form submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            paymentHandler.handleDemoPayment();
        });
    }
});
