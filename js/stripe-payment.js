// Stripe Payment Handler
class StripePayment {
    constructor() {
        this.stripe = Stripe('pk_test_51SPYHwRvETRK3Zx7mnVDTNyPB3mxT8vbSIcSVQURp8irweK0lGznwFrW9sjgju2GFgmDiQ5GkWYVlUQZZVNrXkJb00q2QOCC3I');
        this.elements = null;
        this.paymentIntentId = null;
    }

    async initializePayment(whisperId) {
        try {
            console.log('💰 Initializing payment for whisper:', whisperId);
            
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ daterId: whisperId })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Payment initialization failed');
            }

            this.paymentIntentId = result.paymentIntentId;
            
            const appearance = {
                theme: 'night',
                variables: {
                    colorPrimary: '#8B5CF6',
                    colorBackground: '#1F2937',
                    colorText: '#F9FAFB',
                }
            };

            this.elements = this.stripe.elements({
                appearance,
                clientSecret: result.clientSecret
            });

            const paymentElement = this.elements.create('payment');
            paymentElement.mount('#payment-element');

            return true;
        } catch (error) {
            console.error('❌ Payment initialization error:', error);
            this.showMessage(error.message, 'error');
            return false;
        }
    }

    async handlePaymentSubmit(event) {
        event.preventDefault();
        
        const submitButton = document.getElementById('submit-payment');
        const messageDiv = document.getElementById('payment-message');

        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        messageDiv.textContent = '';

        try {
            const { error } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/call-success.html?payment_intent=${this.paymentIntentId}`,
                },
            });

            if (error) {
                this.showMessage(error.message, 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Pay $15';
            }
        } catch (error) {
            this.showMessage('Payment failed: ' + error.message, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Pay $15';
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
    
    // Get whisper ID from URL or data attribute
    const urlParams = new URLSearchParams(window.location.search);
    const whisperId = urlParams.get('whisperId') || document.body.dataset.whisperId;
    
    if (whisperId) {
        paymentHandler.initializePayment(whisperId);
    }

    // Handle form submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => paymentHandler.handlePaymentSubmit(e));
    }
});
