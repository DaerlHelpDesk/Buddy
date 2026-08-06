 import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe('pk_test_your_stripe_publishable_key_here');

const PaymentForm = ({ amount, taskId, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
 
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent on your backend
      const response = await fetch('http://localhost:3001/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          taskId: taskId,
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        onPaymentError(stripeError.message);
      } else {
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
      onPaymentError('Payment failed. Please try again.');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={cardElementStyle}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          ...paymentBtn,
          opacity: processing ? 0.6 : 1,
          cursor: processing ? 'not-allowed' : 'pointer'
        }}
      >
        {processing ? 'Processing...' : `Pay R${amount}`}
      </button>
    </form>
  );
};

const StripePayment = ({ amount, taskId, onPaymentSuccess, onPaymentError }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        amount={amount}
        taskId={taskId}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};

export default StripePayment;

// Styles
const formStyle = {
  maxWidth: '400px',
  margin: '0 auto',
};

const cardElementStyle = {
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  marginBottom: '12px',
  backgroundColor: '#fff',
};

const errorStyle = {
  color: '#dc3545',
  fontSize: '14px',
  marginBottom: '12px',
  textAlign: 'center',
};

const paymentBtn = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#6772e5',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};