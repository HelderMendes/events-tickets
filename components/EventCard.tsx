'use client';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useStorageUrl } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import {
  CalendarDays,
  Check,
  CircleArrowRight,
  LoaderCircle,
  MapPin,
  PencilIcon,
  StarIcon,
  Ticket,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PurchaseTicket from './PurchaseTicket';

function EventCard({ eventId }: { eventId: Id<'events'> }) {
  const { user } = useUser();
  const router = useRouter();
  const event = useQuery(api.events.getById, { eventId });
  const availability = useQuery(api.events.getEventAvailability, { eventId });

  const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
    eventId,
    userId: user?.id ?? '',
  });

  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId: user?.id ?? '',
  });

  const imageUrl = useStorageUrl(event?.imageStorageId);

  if (!event || !availability) return null;

  const isPastEvent = event.eventDate < Date.now();
  const isEventOwner = user?.id === event?.userId;

  const renderQueuePosition = () => {
    if (!queuePosition || queuePosition.status === 'waiting') return null;

    if (availability.purchasedCount >= availability.totalTickets) {
      return (
        <div className='flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3'>
          <div className='flex items-center'>
            <Ticket className='mr-2 size-5 text-gray-400' />
            <span className='text-gray-600'>Event is sold out</span>
          </div>
        </div>
      );
    }

    if (queuePosition.position === 2) {
      return (
        <div className='flex flex-col items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-3 lg:flex-row'>
          <div className='flex items-center'>
            <CircleArrowRight className='mr-2 size-5 text-amber-500' />
            <span className='font-medium text-amber-700'>
              You&apos;re next in line! (Queue position:{' '}
              {queuePosition.position})
            </span>
          </div>
          <div className='flex items-center'>
            <LoaderCircle className='mr-1 size-4 animate-spin text-amber-500' />
            <span className='text-sm text-amber-600'>Waiting fot ticket</span>
          </div>
        </div>
      );
    }

    return (
      <div className='flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-3'>
        <div className='flex items-center'>
          <LoaderCircle className='mr-2 size-4 text-blue-500' />
          <span className='text-blue-700'>Queue position</span>
        </div>
        <span className='rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700'>
          #{queuePosition.position}
        </span>
      </div>
    );
  };

  const renderTicketStatus = () => {
    if (!user) return null;
    if (isEventOwner) {
      return (
        <div className='mt-4'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/seller/events/${eventId}/edit`);
            }}
            className='flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-200'
          >
            <PencilIcon className='size-5' />
            Edit Event
          </button>
        </div>
      );
    }

    if (userTicket) {
      return (
        <div className='mt-4 flex items-center justify-between rounded-lg border border-green-100 bg-green-50 p-3'>
          <div className='flex items-center'>
            <Check className='mr-2 size-5 text-green-600' />
            <span className='font-medium text-green-700'>
              You have a ticket!
            </span>
          </div>
          <button
            onClick={() => router.push(`/tickets/${userTicket._id}`)}
            className='flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-green-700'
          >
            View your ticket
          </button>
        </div>
      );
    }

    if (queuePosition) {
      return (
        <div className='mt-4'>
          {queuePosition.status === 'offered' && (
            <PurchaseTicket eventId={eventId} />
          )}

          {renderQueuePosition()}
          {queuePosition.status === 'expired' && (
            <div className='rounded-lg border border-red-100 bg-red-50 p-3'>
              <span className='tex-red-700 flex items-center font-medium'>
                <XCircle className='mr-2 size-5' />
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      onClick={() => router.push(`/event/${eventId}`)}
      className={`duration-all relative cursor-pointer overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${isPastEvent ? 'opacity-75 hover:opacity-100' : ''}`}
    >
      {/* Event Image */}
      {imageUrl && (
        <div className='relative h-48 w-full'>
          <Image
            className='object-cover'
            src={imageUrl}
            alt={event.name}
            fill
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
        </div>
      )}

      {/* Event Details */}
      <div className={`p-6 ${imageUrl ? 'relative' : ''}`}>
        <div className='flex items-start justify-between'>
          {/* Event Name & Owner Badge */}
          <div>
            <div className='flex flex-col items-start gap-2'>
              {isEventOwner && (
                <span className='inline-flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-1 text-xs font-medium text-white'>
                  <StarIcon className='size-3' />
                  Your Event
                </span>
              )}
              <h2 className='text-2xl/7 font-bold text-gray-900'>
                {event.name}
              </h2>
            </div>
            {isPastEvent && (
              <span className='mt-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800'>
                Past Event
              </span>
            )}
          </div>

          {/* Event Price tag */}
          <div className='ml-2 flex flex-col'>
            <span
              className={`text-nowrap rounded-full px-4 py-1.5 font-semibold ${
                isPastEvent
                  ? 'bg-cyan-50 text-sm text-cyan-800'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              € {event.price.toFixed(2)}
            </span>
            {availability.purchasedCount >= availability.totalTickets && (
              <span className='rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-700'>
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className='mt-4 space-y-3'>
          <div className='flex items-center text-gray-600'>
            <MapPin className='mr-2 size-4' />
            <span>{event.location}</span>
          </div>

          <div className='flex items-center text-gray-600'>
            <CalendarDays className='mr-2 size-4' />
            <span>
              {new Date(event.eventDate).toLocaleDateString()}{' '}
              {isPastEvent && '(🥺 Ended)'}
            </span>
          </div>

          <div className='flex items-center text-gray-600'>
            <Ticket className='mr-2 size-4' />
            <span>
              {availability.totalTickets - availability.purchasedCount} /{' '}
              {availability.totalTickets} available
              {!isPastEvent && availability.activeOffers > 0 && (
                <span className='ml-2 text-sm text-amber-600'>
                  ({availability.activeOffers}{' '}
                  {availability.activeOffers === 1 ? 'person' : 'people'} are
                  trying to buy)
                </span>
              )}
            </span>
          </div>
        </div>

        <p className='mt-4 line-clamp-2 text-base text-gray-600'>
          {event.description}
        </p>

        <div onClick={(e) => e.stopPropagation()}>
          {!isPastEvent && renderTicketStatus()}
        </div>
      </div>
    </div>
  );
}

export default EventCard;
