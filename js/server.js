const express = require('express');
const stripe = require('stripe')('sk_your_secret_key_here'); // Your secret key
const app = express();

app.use(express.json());

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { paymentMethodId, daterId, amount, currency } = req.body;
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // 1500 = $15.00
            currency: currency,
            payment_method: paymentMethodId,
            confirm: true,
            return_url: 'https://yourdomain.com/payment-success.html',
            metadata: {
                dater_id: daterId
            }
        });
        
        res.json({
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret
        });
        
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Webhook for payment confirmation (optional but recommended)
app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, 'wh_your_webhook_secret');
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const daterId = paymentIntent.metadata.dater_id;
        
        // Record payment in your database
        console.log(`Payment successful for dater: ${daterId}`);
    }

    res.json({received: true});
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
