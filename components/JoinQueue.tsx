'use client';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import Spinner from './Spinner';
import { WAITING_LIST_STATUS } from '@/convex/constants';
import { Clock, OctagonXIcon } from 'lucide-react';

function JoinQueue({
  eventId,
  userId,
}: {
  eventId: Id<'events'>;
  userId: string;
}) {
  const { toast } = useToast();
  const joinWaitingList = useMutation(api.events.joinWaitingList);
  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId,
  });
  const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
    eventId,
    userId,
  });
  const availability = useQuery(api.events.getEventAvailability, { eventId });
  const event = useQuery(api.events.getById, { eventId });
  const isEventOwner = userId === event?.userId;

  const handleJoinQueue = async () => {
    try {
      const result = await joinWaitingList({
        eventId,
        userId,
      });
      if (result.success) {
        console.log('Successfully joined waiting list');
        toast({
          title: result.message,
          duration: 5000,
        });
      }
    } catch (error) {
      if (
        error instanceof ConvexError &&
        error.message.includes('joined the waiting list too many times')
      ) {
        toast({
          variant: 'destructive',
          title: 'Slow dow there!',
          description: error.data,
          duration: 5000,
        });
      } else {
        console.error('Error joining waiting list:', error);
        toast({
          variant: 'destructive',
          title: 'There was an error... Ho No',
          description: 'Failed to join queue, Please try again later.',
        });
      }
    }
  };

  if (queuePosition === undefined || availability === undefined || !event)
    return <Spinner />;

  if (userTicket) return null;

  const isPastEvent = event.eventDate < Date.now();

  return (
    <div>
      {(!queuePosition ||
        queuePosition.status === WAITING_LIST_STATUS.EXPIRED ||
        (queuePosition.status === WAITING_LIST_STATUS.OFFERED &&
          queuePosition.offerExpiresAt &&
          queuePosition.offerExpiresAt <= Date.now())) && (
        <>
          {isEventOwner ? (
            <div className='flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-4 text-gray-700'>
              <OctagonXIcon className='size-5' />
              <span>You cannot buy a ticket for your own event</span>
            </div>
          ) : isPastEvent ? (
            <div className='flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-4 text-gray-500'>
              <Clock className='size-5' />
              <span>Event has ended</span>
            </div>
          ) : availability.purchasedCount >= availability?.totalTickets ? (
            <div className='p-4 text-center'>
              <p className='text-lg font-semibold text-red-600'>
                Sorry, this event is sold out
              </p>
            </div>
          ) : (
            <button
              onClick={handleJoinQueue}
              disabled={isPastEvent || isEventOwner}
              className='flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-md transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
            >
              Buy Ticket
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default JoinQueue;
