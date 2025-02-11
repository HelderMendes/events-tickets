import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from './constants';
import { internal } from './_generated/api';
import { processQueue } from './waitingList';

export type Metrics = {
  soldTickets: number;
  refundedTickets: number;
  cancelledTickets: number;
  // remainingTickets: number;
  // totalTickets: number;
  revenue: number;
};

export const updateEvent = mutation({
  args: {
    eventId: v.id('events'),
    name: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(), //timestamp
    price: v.number(),
    totalTickets: v.number(),
    // userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;

    //Get current event and check sold tickets
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('ERvent not found');

    const soldTickets = await ctx.db
      .query('tickets')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .filter((q) =>
        q.or(q.eq(q.field('status'), 'valid'), q.eq(q.field('status'), 'used')),
      )
      .collect();

    //Check and make sure that total tickets !<= sold tickets
    if (updates.totalTickets < soldTickets.length) {
      throw new Error(
        `Cannot reduce Total Tickets below ${soldTickets.length} (number of tickets already sold)`,
      );
    }

    await ctx.db.patch(eventId, updates);
    return eventId;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(), //timestamp
    price: v.number(),
    totalTickets: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert('events', {
      name: args.name,
      description: args.description,
      location: args.location,
      eventDate: args.eventDate,
      price: args.price,
      totalTickets: args.totalTickets,
      userId: args.userId,
    });
    return eventId;
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('events')
      .filter((q) => q.eq(q.field('is_cancelled'), undefined))
      .collect();
  },
});

export const getById = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return await ctx.db.get(eventId);
  },
});

export const getEventAvailability = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('Event not found');

    //Count total purchased tickets
    const purchasedCount = await ctx.db
      .query('tickets')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (t) =>
              t.status === TICKET_STATUS.VALID ||
              t.status === TICKET_STATUS.USED,
          ).length,
      );

    //Count Current Valid Offers
    const now = Date.now();
    const activeOffers = await ctx.db
      .query('waitingList')
      .withIndex('by_event_status', (q) =>
        q.eq('eventId', eventId).eq('status', WAITING_LIST_STATUS.OFFERED),
      )
      .collect()
      .then(
        (entries) =>
          entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length,
      );

    const totalReserved = purchasedCount + activeOffers;

    return {
      isSoldOut: totalReserved >= event.totalTickets,
      totalTickets: event.totalTickets,
      purchasedCount,
      activeOffers,
      remainingTickets: Math.max(0, event.totalTickets - totalReserved),
    };
  },
});

//Helper function to check: "Is ticket available for an event?"
export const checkAvailability = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('Event not found');

    //Count total purchased tickets
    const purchasedCount = await ctx.db
      .query('tickets')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (t) =>
              t.status === TICKET_STATUS.VALID ||
              t.status === TICKET_STATUS.USED,
          ).length,
      );

    //Count current valid offers
    const now = Date.now();
    const activeOffers = await ctx.db
      .query('waitingList')
      .withIndex('by_event_status', (q) =>
        q.eq('eventId', eventId).eq('status', WAITING_LIST_STATUS.OFFERED),
      )
      .collect()
      .then(
        (entries) =>
          entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length,
      );

    const availableSpots = event.totalTickets - (purchasedCount + activeOffers);

    return {
      available: availableSpots > 0,
      availableSpots,
      totalTickets: event.totalTickets,
      purchasedCount,
      activeOffers,
    };
  },
});

//Join waiting list for an event
export const joinWaitingList = mutation({
  //Function takes an eventId and userId as arguments
  args: {
    eventId: v.id('events'),
    userId: v.string(),
  },
  handler: async (ctx, { eventId, userId }) => {
    //TODO: Rate limit check
    // const status = await rateLimiter.limit(ctx, 'queueJoin', { key: userId });
    // if (!status.ok) {
    //   throw new ConvexError(
    //     `You've joined the waiting list too many times. Please wait ${Math.ceil(status.retryAfter / (60 * 1000))} minutes before trying again`,
    //   );
    // }

    //First check if user already has an active entry in the waitingListForThisEvent (means all status except expired)
    const existingEntry = await ctx.db
      .query('waitingList')
      .withIndex('by_user_event', (q) =>
        q.eq('userId', userId).eq('eventId', eventId),
      )
      .filter((q) => q.neq(q.field('status'), WAITING_LIST_STATUS.EXPIRED))
      .first();

    //Don't allow duplicate entries
    if (existingEntry)
      throw new Error('You are already in the waiting list for this Event');

    //Verify if the event exists
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('Event not found');

    //Check if there ara available tickets at this moment/right now
    const { available } = await checkAvailability(ctx, { eventId });

    const now = Date.now();

    if (available) {
      //Create an offer entry
      const waitingListId = await ctx.db.insert('waitingList', {
        eventId,
        userId,
        status: WAITING_LIST_STATUS.OFFERED, //set status to offered
        offerExpiresAt: now + DURATIONS.TICKET_OFFER, //Set the expiration time
      });

      // Schedule a job to expire this offer after the offer duration
      await ctx.scheduler.runAfter(
        DURATIONS.TICKET_OFFER,
        internal.waitingList.expireOffer,
        {
          waitingListId,
          eventId,
        },
      );
    } else {
      //if no tickets available => add to waiting list
      await ctx.db.insert('waitingList', {
        eventId,
        userId,
        status: WAITING_LIST_STATUS.WAITING,
      });
    }

    //Return appropriate status message
    return {
      success: true,
      status: available
        ? WAITING_LIST_STATUS.OFFERED // if ticket available
        : WAITING_LIST_STATUS.WAITING, // if no available ticket
      message: available
        ? `Ticket offered – you have ${DURATIONS.TICKET_OFFER / (60 * 1000)} minutes to purchase you tickets`
        : "You are in waiting list – you'll be notified when a ticket becomes available",
    };
  },
});

//purchaseTicket mutation
export const purchaseTicket = mutation({
  args: {
    eventId: v.id('events'),
    userId: v.string(),
    waitingListId: v.id('waitingList'),
    paymentInfo: v.object({
      paymentIntentId: v.string(),
      amount: v.number(),
    }),
  },
  handler: async (ctx, { eventId, userId, waitingListId, paymentInfo }) => {
    console.log('Starting purchase ticket handler...', {
      eventId,
      userId,
      waitingListId,
      paymentInfo,
    });

    //Verify if waiting list entry exists and it's a valid entry for the user
    const waitingListEntry = await ctx.db.get(waitingListId);
    console.log('Waiting list entry:', waitingListEntry);

    if (!waitingListEntry) {
      console.log('Waiting list entry not found');
      throw new Error('Waiting list entry not found');
    }

    if (waitingListEntry.status !== WAITING_LIST_STATUS.OFFERED) {
      console.error('Invalid waiting list entry status:', {
        status: waitingListEntry.status,
        // expected: WAITING_LIST_STATUS.OFFERED,
      });
      throw new Error(
        'Invalid waiting list entry status – this thicket offer may have expired',
      );
    }

    if (waitingListEntry.userId !== userId) {
      console.error('Invalid waiting list entry user ID – User ID mismatch:', {
        waitingListUserId: waitingListEntry.userId,
        requestUserId: userId,
      });
      throw new Error(
        'Invalid waiting list entry user ID – The waiting list entry does not belong to this user',
      );
    }

    //Verify that event exists and is not cancelled or sold out (verify availability)
    const event = await ctx.db.get(eventId);
    console.log('Event details: ', event);

    if (!event) {
      console.error('Event not found', { eventId });
      throw new Error('Event not found');
    }

    if (event.is_cancelled) {
      console.error('Attempted purchase of cancelled event', { eventId });
      throw new Error('Event is no longer active/available');
    }

    try {
      console.log(
        'Attempting to create a ticket and capture the payment information...',
      );
      //Create a ticket for the user with payment info
      await ctx.db.insert('tickets', {
        eventId,
        userId,
        purchasedAt: Date.now(),
        status: TICKET_STATUS.VALID,
        paymentIntentId: paymentInfo.paymentIntentId,
        amount: paymentInfo.amount,
      });

      console.log('Updating waiting list entry status to "purchased"');
      await ctx.db.patch(waitingListId, {
        status: WAITING_LIST_STATUS.PURCHASED,
      });

      console.log('Processing queue for the next user in the waiting list...');
      //Process the queue for the next user in the waiting list
      await processQueue(ctx, { eventId });

      console.log('Purchase ticket completed successfully');
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Error processing payment ' + error);
    }
  },
});

//Get user's tickets with event information
export const getUserTickets = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const tickets = await ctx.db
      .query('tickets')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const ticketsWithEvents = await Promise.all(
      tickets.map(async (ticket) => {
        const event = await ctx.db.get(ticket.eventId);
        return {
          ...ticket,
          event,
        };
      }),
    );

    return ticketsWithEvents;
  },
});

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const events = await ctx.db
      .query('events')
      .filter((q) => q.eq(q.field('is_cancelled'), undefined))
      .collect();

    return events.filter((event) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        event.name.toLowerCase().includes(searchTermLower) ||
        event.description.toLowerCase().includes(searchTermLower) ||
        event.location.toLowerCase().includes(searchTermLower)
      );
    });
  },
});

export const getSellerEvent = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const events = await ctx.db
      .query('events')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect();

    //For each event, get the ticket sales information (total tickets, sold tickets, remaining tickets)
    const eventsWithMetrics = await Promise.all(
      events.map(async (event) => {
        const tickets = await ctx.db
          .query('tickets')
          .withIndex('by_event', (q) => q.eq('eventId', event._id))
          .collect();

        const validTickts = tickets.filter(
          (t) => t.status === 'valid' || t.status === 'used',
        );
        const refundedTickets = tickets.filter((t) => t.status === 'refunded');
        const cancelledTickets = tickets.filter(
          (t) => t.status === 'cancelled',
        );

        const metrics: Metrics = {
          soldTickets: validTickts.length,
          refundedTickets: refundedTickets.length,
          cancelledTickets: cancelledTickets.length,
          remainingTickets: event.totalTickets - validTickts.length,
          totalTickets:
            validTickts.length +
            refundedTickets.length +
            cancelledTickets.length,
          revenue: validTickts.length * event.price,
        };

        return { ...event, metrics };
      }),
    );

    return eventsWithMetrics;
  },
});

export const cancelEvent = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('Event not found');

    //Get all tickets for this event
    const tickets = await ctx.db
      .query('tickets')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();

    if (tickets.length > 0) {
      throw new Error(
        'Cannot cancel event with active tickets. Please refund all tickets first before cancelling the event',
      );
    }

    //Update status of event to cancelled
    await ctx.db.patch(eventId, { is_cancelled: true });

    //Detele any waiting list entries for this event
    const waitingListEntries = await ctx.db
      .query('waitingList')
      .withIndex('by_event_status', (q) => q.eq('eventId', eventId))
      .collect();

    for (const entry of waitingListEntries) {
      await ctx.db.delete(entry._id);
    }

    return { success: true };
  },
});
