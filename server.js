import express from 'express';
import cors from 'cors';
import { createPaymentIntent } from './stripe-server.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Payment intent endpoint
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, taskId } = req.body;

    if (!amount || !taskId) {
      return res.status(400).json({ error: 'Amount and taskId are required' });
    }

    const paymentIntent = await createPaymentIntent(amount, taskId);

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
