import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe('sk_test_your_stripe_secret_key_here', {
  apiVersion: '2023-10-16',
});

const createPaymentIntent = async (amount, taskId) => {
  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'zar', // South African Rand
      metadata: {
        taskId: taskId,
      },
      // You can add more options here like:
      // payment_method_types: ['card'],
      // receipt_email: customerEmail,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export {
  createPaymentIntent,
};