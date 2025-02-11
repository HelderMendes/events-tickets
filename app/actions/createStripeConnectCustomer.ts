'use server';

import { api } from '@/convex/_generated/api';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import stripe from '@/lib/stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function createStripeConnectCustomer() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('The User is not authenticated.');
  }

  //Check – has user an connect context account?
  const existingStripeConnectId = await convex.query(
    api.users.getUsersStripeConnectId,
    { userId },
  );

  if (existingStripeConnectId) {
    return { account: existingStripeConnectId };
  }

  //Create a new connect account
  const account = await stripe.accounts.create({
    type: 'express',
    capabilities: {
      card_payments: { requested: true },
      multibanco_payments: { requested: true },
      ideal_payments: { requested: true },
      blik_payments: { requested: true },
      link_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  //Update user with stripe connect Id
  await convex.mutation(api.users.updateOrCreateStripeConnectId, {
    userId,
    stripeConnectId: account.id,
  });

  return { account: account.id };
}
