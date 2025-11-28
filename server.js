require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { daterId } = req.body;
        
        console.log('💰 Creating payment intent for dater:', daterId);
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1500, // $15.00 in cents
            currency: 'usd',
            automatic_payment_methods: { 
                enabled: true 
            },
            metadata: { 
                dater_id: daterId, 
                product: '5_min_chat' 
            }
        });

        console.log('✅ Payment intent created:', paymentIntent.id);
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
        
    } catch (error) {
        console.error('❌ Payment intent error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'House of Whispers API is running',
        stripe: process.env.STRIPE_SECRET_KEY ? 'CONFIGURED' : 'MISSING'
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💳 Stripe mode: TEST`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});
