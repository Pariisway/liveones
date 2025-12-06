// Simple Node.js server for Stripe integration
const express = require('express');
const Stripe = require('stripe');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Stripe configuration
const stripe = Stripe('sk_test_51Q8tL2P7Vbu8koyh9F8ZB0w1q2R4Y7v6H1T2z3D4E5F6G7H8I9J0K1L2M3N4'); // Replace with your secret key

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', listenerId, callerEmail } = req.body;
        
        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // in cents
            currency: currency,
            metadata: {
                listenerId: listenerId,
                callerEmail: callerEmail
            }
        });
        
        res.json({
            clientSecret: paymentIntent.client_secret
        });
        
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_...'; // Your webhook secret
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id);
            // Here you would:
            // 1. Store the payment in your database
            // 2. Create a call session
            // 3. Notify the listener
            break;
            
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.id);
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
