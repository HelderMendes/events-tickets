'use server';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getConvexClient } from '@/lib/convex';
import stripe from '@/lib/stripe';

export async function refundEventTickets(eventId: Id<'events'>) {
  const convex = getConvexClient();

  // Get event details
  const event = await convex.query(api.events.getById, { eventId });
  if (!event) throw new Error('Event not found');

  // Get event owner's stripe connect Id
  const stripeConnectId = await convex.query(
    api.users.getUsersStripeConnectId,
    { userId: event.userId },
  );

  if (!stripeConnectId) throw new Error('User does not have stripe connect Id');

  // Get All valid tickets for the event
  const tickets = await convex.query(api.tickets.getValidTicketsForEvent, {
    eventId,
  });

  // Refund all tickets (process refund for each ticket)
  const results = await Promise.allSettled(
    tickets.map(async (ticket) => {
      try {
        if (!ticket.paymentIntentId)
          throw new Error('Payment info not found for this ticket');

        //Problems refund through stripe
        await stripe.refunds.create(
          {
            payment_intent: ticket.paymentIntentId,
            reason: 'requested_by_customer',
          },
          {
            stripeAccount: stripeConnectId,
          },
        );

        // Update ticket status to refunded
        await convex.mutation(api.tickets.updateTicketStatus, {
          ticketId: ticket._id,
          status: 'refunded',
        });

        return { success: true, ticketId: ticket._id };
      } catch (error) {
        console.error(`Failed to refund ticket ${ticket._id}: ${error}`);
        return { success: false, ticketId: ticket._id, error };
      }
    }),
  );

  // Check if all refunds were successful
  const allSuccessfull = results.every(
    (result) => result.status === 'fulfilled' && result.value.success,
  );

  if (!allSuccessfull)
    throw new Error('Some refunds failed. Please Check the logs and try again');

  // Cancel the event instead of deleting it
  await convex.mutation(api.events.cancelEvent, { eventId });

  return { success: true };
}
