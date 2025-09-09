import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createCheckoutSession } from '../controllers/paymentsController.js';

const router = express.Router();

// POST /api/payments/checkout - create Stripe Checkout session
router.post('/checkout', authenticate, createCheckoutSession);

export default router;


