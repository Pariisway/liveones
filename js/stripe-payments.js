// Stripe Payment Integration for House of Whispers
class StripePaymentManager {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.paymentIntentClientSecret = null;
        this.isProcessing = false;
        
        this.db = firebase.firestore();
    }

    // Initialize Stripe with test publishable key
    initializeStripe() {
        // Test publishable key - replace with your actual test key
        this.stripe = Stripe('pk_test_51QMRt7RuP5wq3w3w6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6');
        this.elements = this.stripe.elements();
        
        // Create card element
        const style = {
            base: {
                color: '#ffffff',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        };

        this.cardElement = this.elements.create('card', { 
            style: style,
            hidePostalCode: true
        });
        
        return this.cardElement;
    }

    // Mount card element to DOM
    mountCardElement(elementId) {
        if (this.cardElement) {
            this.cardElement.mount(elementId);
        }
    }

    // Create payment intent for a call
    async createPaymentIntent(amount, whisperId, topic, callId) {
        try {
            console.log('💰 Creating payment intent for amount:', amount);
            
            // In a real implementation, this would call your backend
            // For now, we'll simulate creating a payment intent
            const paymentIntentData = {
                amount: amount * 100, // Convert to cents
                currency: 'usd',
                metadata: {
                    whisperId: whisperId,
                    topic: topic,
                    callId: callId,
                    customerId: firebase.auth().currentUser?.uid
                }
            };

            // Simulate API call to backend
            const response = await this.simulateBackendCall('/create-payment-intent', paymentIntentData);
            
            this.paymentIntentClientSecret = response.clientSecret;
            return response;

        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    }

    // Process payment
    async processPayment(whisperId, topic, callId) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            // Validate card details
            const { error: cardError } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
            });

            if (cardError) {
                throw new Error(cardError.message);
            }

            // Create payment intent
            const amount = 15; // $15 for a 5-minute call
            await this.createPaymentIntent(amount, whisperId, topic, callId);

            // Confirm payment (simulated for test mode)
            const paymentResult = await this.confirmPayment();

            if (paymentResult.success) {
                // Record successful payment in Firestore
                await this.recordPayment(whisperId, topic, callId, amount, paymentResult);
                return { success: true, paymentId: paymentResult.id };
            } else {
                throw new Error(paymentResult.error || 'Payment failed');
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    // Confirm payment (simulated for test mode)
    async confirmPayment() {
        // Simulate API call to confirm payment
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    id: 'pi_' + Math.random().toString(36).substr(2, 14),
                    status: 'succeeded',
                    amount: 1500,
                    currency: 'usd'
                });
            }, 2000);
        });
    }

    // Record payment in Firestore
    async recordPayment(whisperId, topic, callId, amount, paymentResult) {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        try {
            const paymentData = {
                whisperId: whisperId,
                customerId: user.uid,
                customerEmail: user.email,
                amount: amount,
                callId: callId,
                topic: topic,
                paymentId: paymentResult.id,
                status: paymentResult.status,
                currency: paymentResult.currency,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                testMode: true,
                type: 'call_booking'
            };

            await this.db.collection('payments').add(paymentData);
            console.log('✅ Payment recorded in Firestore');

            // Also update the call booking
            await this.createCallBooking(whisperId, topic, callId, amount, paymentResult.id);

        } catch (error) {
            console.error('Error recording payment:', error);
            throw error;
        }
    }

    // Create call booking after successful payment
    async createCallBooking(whisperId, topic, callId, amount, paymentId) {
        const user = firebase.auth().currentUser;
        
        try {
            const bookingData = {
                callId: callId,
                whisperId: whisperId,
                customerId: user.uid,
                customerEmail: user.email,
                topic: topic,
                amount: amount,
                paymentId: paymentId,
                status: 'confirmed',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                callType: 'webrtc',
                testMode: true,
                scheduledAt: new Date().toISOString()
            };

            await this.db.collection('bookings').add(bookingData);
            console.log('✅ Call booking created');

        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    }

    // Simulate backend API call
    async simulateBackendCall(endpoint, data) {
        console.log(`📡 Simulating API call to ${endpoint}`, data);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return mock response
        return {
            clientSecret: 'pi_' + Math.random().toString(36).substr(2, 14) + '_secret_' + Math.random().toString(36).substr(2, 20),
            id: 'pi_' + Math.random().toString(36).substr(2, 14),
            amount: data.amount,
            currency: data.currency,
            status: 'requires_payment_method'
        };
    }

    // Validate card input
    validateCardInput() {
        // Basic validation - in real implementation, use Stripe's validation
        const cardElement = this.cardElement;
        if (!cardElement) {
            return { isValid: false, error: 'Card element not initialized' };
        }
        
        return { isValid: true, error: null };
    }

    // Get test card information
    getTestCardInfo() {
        return {
            number: '4242424242424242',
            expiry: '12/34',
            cvc: '123',
            zip: '12345'
        };
    }

    // Clear card element
    clearCard() {
        if (this.cardElement) {
            this.cardElement.clear();
        }
    }

    // Destroy card element
    destroy() {
        if (this.cardElement) {
            this.cardElement.destroy();
        }
    }
}

// Global Stripe payment manager
let stripePaymentManager = null;

// Initialize Stripe payments
function initializeStripePayments() {
    if (!stripePaymentManager) {
        stripePaymentManager = new StripePaymentManager();
    }
    return stripePaymentManager.initializeStripe();
}

// Process payment wrapper
async function processStripePayment(whisperId, topic, callId) {
    if (!stripePaymentManager) {
        throw new Error('Stripe not initialized');
    }
    return await stripePaymentManager.processPayment(whisperId, topic, callId);
}
