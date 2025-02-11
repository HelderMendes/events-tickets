'use server';

import { Id } from '@/convex/_generated/dataModel';
import { auth } from '@clerk/nextjs/server';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { DURATIONS } from '@/convex/constants';
import stripe from '@/lib/stripe';
import baseUrl from '@/lib/baseUrl';

export type StripeCheckoutMetaData = {
  eventId: Id<'events'>;
  userId: string;
  waitingListId: Id<'waitingList'>;
};

export async function createStripeCheckoutSession({
  eventId,
}: {
  eventId: Id<'events'>;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated! – Please sigh in');

  const convex = getConvexClient();

  //Get event details
  const event = await convex.query(api.events.getById, {
    eventId,
  });
  if (!event) throw new Error('Event not found');

  //Get waiting list entry
  const queuePosition = await convex.query(api.waitingList.getQueuePosition, {
    eventId,
    userId,
  });
  if (!queuePosition || queuePosition.status !== 'offered') {
    throw new Error('No valid ticket offer found');
  }

  const stripeConnectId = await convex.query(
    api.users.getUsersStripeConnectId,
    {
      userId: event.userId,
    },
  );

  if (!stripeConnectId)
    throw new Error(
      'Stripe Connect Id has not found for the owner of the event',
    );

  if (!queuePosition.offerExpiresAt)
    throw new Error('Ticket offer has no expiration date');

  const metadata: StripeCheckoutMetaData = {
    eventId,
    userId,
    waitingListId: queuePosition._id,
  };

  //Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ['card', 'ideal', 'multibanco', 'paypal'],
      mode: 'payment',

      line_items: [
        {
          price_data: {
            currency: 'EUR',
            product_data: {
              name: event.name,
              description: event.description,
            },
            unit_amount: Math.round(event.price * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(event.price * 100 * 0.01),
      },
      expires_at: Math.floor(Date.now() / 1000) + DURATIONS.TICKET_OFFER / 1000, // 30 minutes for stripe Checkout min expiration time
      success_url: `${baseUrl}/tickets/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/event/${eventId}`,
      metadata,
    },
    { stripeAccount: stripeConnectId }, // Stripe connect Id for the event owner (seller)
  );

  return { sessionId: session.id, sessionUrl: session.url };
}
