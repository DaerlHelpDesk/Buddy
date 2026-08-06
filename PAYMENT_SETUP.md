# TaskRabbit Payment Setup

## Stripe Configuration

To enable payments, you need to set up Stripe:

1. **Create a Stripe account** at https://stripe.com
2. **Get your API keys** from the Stripe dashboard:
   - Publishable key (starts with `pk_test_` for test mode)
   - Secret key (starts with `sk_test_` for test mode)

3. **Update the keys in the code:**
   - In `src/components/StripePayment.jsx`: Replace `'pk_test_your_stripe_publishable_key_here'` with your publishable key
   - In `stripe-server.js`: Replace `'sk_test_your_stripe_secret_key_here'` with your secret key

## Running the Application

### Development Mode (Frontend + Backend)
```bash
npm run dev:full
```
This runs both the React frontend and Express backend concurrently.

### Production Build
```bash
npm run build
npm run server
```

## Payment Flow

1. User completes a task
2. Tasker marks task as completed
3. User sees payment section in UserDashboard
4. User clicks "Pay Now" to open Stripe payment form
5. User enters card details
6. Payment is processed through Stripe
7. Task is marked as paid in Firebase
8. Success confirmation is shown

## Testing Payments

Use Stripe's test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future expiry date and any CVC

## Security Notes

- Never commit real Stripe keys to version control
- Use environment variables for production
- Implement proper error handling and logging
- Consider adding payment webhooks for production