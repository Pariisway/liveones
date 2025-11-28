require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // ← From .env
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (your HTML, CSS, JS)
app.use(express.static('.'));

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { daterId } = req.body;
        
        // Create payment intent - $15.00 = 1500 cents
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1500,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                dater_id: daterId,
                product: '5_min_chat'
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
        
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook endpoint (for production)
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const daterId = paymentIntent.metadata.dater_id;
            
            // Here you would update your database
            console.log(`💰 Payment successful for dater: ${daterId}`);
            console.log(`💵 Amount: $${paymentIntent.amount / 100}`);
            
            // You could call platformManager here to record the payment
        }
        
        res.json({received: true});
    } catch (err) {
        console.log(`❌ Webhook error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'House of Whispers API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💳 Stripe mode: ${process.env.STRIPE_SECRET_KEY ? 'TEST' : 'NOT CONFIGURED'}`);
});
