const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51SPYHwRvETRK3Zx7lkX8AQDofsjmMVJGoz6KJfRFQDfMoUOIZ4ehFHHjxPIbFXrHgum6avy8dyvh9UnvHy65ksDW00PIUHc1Pu');

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1500, // $15.00
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                service: '5-minute-voice-chat'
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle successful payment webhook
router.post('/payment-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, 'wh_xxx_replace_with_your_webhook_secret');
    } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the payment succeeded event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Here you would:
        // 1. Create a call session in Firestore
        // 2. Notify the whisper
        // 3. Start the 5-minute timer
    }

    res.json({received: true});
});

module.exports = router;
