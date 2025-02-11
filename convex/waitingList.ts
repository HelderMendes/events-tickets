import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from './constants';
import { internal } from './_generated/api';

// get the user's current position on the waiting list
// Returns null if the user is not in the queue
export const getQueuePosition = query({
  args: {
    eventId: v.id('events'),
    userId: v.string(),
  },
  handler: async (ctx, { eventId, userId }) => {
    //Get reference (entry) from the user and event combination
    const entry = await ctx.db
      .query('waitingList')
      .withIndex('by_user_event', (q) =>
        q.eq('userId', userId).eq('eventId', eventId),
      )
      .filter((q) => q.neq(q.field('status'), WAITING_LIST_STATUS.EXPIRED))
      .first();

    if (!entry) return null;

    //Get Nr of people ahead in the queue
    const peopleAhead = await ctx.db
      .query('waitingList')
      .withIndex('by_event_status', (q) => q.eq('eventId', eventId))
      .filter((q) =>
        q.and(
          //Get all entries before this one
          q.lt(q.field('_creationTime'), entry._creationTime),
          //Or only get the entries that are either waiting or offered
          q.or(
            q.eq(q.field('status'), WAITING_LIST_STATUS.WAITING),
            q.eq(q.field('status'), WAITING_LIST_STATUS.OFFERED),
          ),
        ),
      )
      .collect()
      .then((entries) => entries.length);

    return {
      ...entry,
      position: peopleAhead + 1,
    };
  },
});

//Internal mutation to expire a single offer and process queue for next person.
export const expireOffer = internalMutation({
  args: {
    waitingListId: v.id('waitingList'),
    eventId: v.id('events'),
  },
  handler: async (ctx, { waitingListId, eventId }) => {
    const offer = await ctx.db.get(waitingListId);
    //No offer return null
    if (!offer || offer.status !== WAITING_LIST_STATUS.OFFERED) return;

    //Update db
    await ctx.db.patch(waitingListId, {
      status: WAITING_LIST_STATUS.EXPIRED,
    });

    //process Queue
    await processQueue(ctx, { eventId });
  },
});

// Mutation to process the waiting list queue and offer tickets to next eligible Users.
// Check current availability considering purchases tickets and active offers.
export const processQueue = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('Event not found');

    const { availableSpots } = await ctx.db
      .query('events')
      .filter((q) => q.eq(q.field('_id'), eventId))
      .first()
      .then(async (event) => {
        if (!event) throw new Error('Event not found');

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

        return {
          availableSpots: event.totalTickets - (purchasedCount + activeOffers),
        };
      });

    if (availableSpots <= 0) return;

    //Get next waiting in line user
    const waitingUsers = await ctx.db
      .query('waitingList')
      .withIndex('by_event_status', (q) =>
        q.eq('eventId', eventId).eq('status', WAITING_LIST_STATUS.WAITING),
      )
      .order('asc')
      .take(availableSpots);

    //We need a time-limited offers for the selected users
    const now = Date.now();
    for (const user of waitingUsers) {
      //Update the waiting list offered status entry
      await ctx.db.patch(user._id, {
        status: WAITING_LIST_STATUS.OFFERED,
        offerExpiresAt: now + DURATIONS.TICKET_OFFER,
      });

      //Schedule expiration job for this offer
      await ctx.scheduler.runAfter(
        DURATIONS.TICKET_OFFER,
        internal.waitingList.expireOffer,
        { waitingListId: user._id, eventId },
      );
    }
  },
});

export const releaseTicket = mutation({
  args: {
    eventId: v.id('events'),
    waitingListId: v.id('waitingList'),
  },
  handler: async (ctx, { eventId, waitingListId }) => {
    const entry = await ctx.db.get(waitingListId);

    if (!entry || entry.status !== WAITING_LIST_STATUS.OFFERED) {
      throw new Error('No valid ticket offer found');
    }

    //The Entry as expired (show/mark)
    await ctx.db.patch(waitingListId, {
      status: WAITING_LIST_STATUS.EXPIRED,
    });

    //Process queue to offer ticket to next in line client
    await processQueue(ctx, { eventId });
  },
});
