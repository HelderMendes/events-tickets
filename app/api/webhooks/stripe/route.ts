import { StripeCheckoutMetaData } from '@/app/actions/createStripeCheckoutSession';
import { api } from '@/convex/_generated/api';
import stripe from '@/lib/stripe';
import { getConvexClient } from '@/lib/convex';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(req: Request) {
  console.log('Webhook Received...');

  const body = await req.text();
  // const headersList=await req.headers.get('stripe-signature');
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  console.log('Webhook signature: ', signature ? 'Present' : 'Missing');

  let event: Stripe.Event;

  try {
    console.log('Attempting to verify webhook event...');
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
    console.log('Webhook event verified and constructed successfully...');
  } catch (error) {
    console.error('Error processing webhook: ', error);
    return new Response(`Webhook Error: ${(error as Error).message}`, {
      status: 400,
    });
  }

  const convex = getConvexClient();

  if (event.type === 'checkout.session.completed') {
    console.log('Checkout session completed event received...');
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata as StripeCheckoutMetaData;
    console.log('Session metadata: ', metadata);
    console.log('Convex client: ', convex);

    try {
      const result = await convex.mutation(api.events.purchaseTicket, {
        eventId: metadata.eventId,
        userId: metadata.userId,
        waitingListId: metadata.waitingListId,
        paymentInfo: {
          paymentIntentId: session.payment_intent as string,
          amount: session.amount_total ?? 0,
        },
      });
      console.log('Purchase ticket mutation completed successfully: ', result);
    } catch (error) {
      console.error('Error processing webhook event: ', error);
      return new Response('Error processing webhook event', { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
