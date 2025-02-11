'use client';

import { Doc } from '@/convex/_generated/dataModel';
import { Metrics } from '@/convex/events';
import { useStorageUrl } from '@/lib/utils';
import {
  Ban,
  Banknote,
  CalendarDays,
  Edit,
  InfoIcon,
  Ticket,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CancelEventButton from './CancelEventButton';

function SellerEventCard({
  event,
}: {
  event: Doc<'events'> & {
    metrics: Metrics;
  };
}) {
  const imageUrl = useStorageUrl(event.imageStorageId);
  const isPastEvent = event.eventDate <= Date.now();

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm ${event.is_cancelled ? 'border-red-200' : 'border-gray-200'} overflow-hidden`}
    >
      <div className='p-6'>
        <div className='flex items-start gap-6'>
          {/* Event Image */}
          {imageUrl && (
            <div className='relative size-32 shrink-0 overflow-hidden rounded-lg'>
              <Image
                src={imageUrl}
                alt={event.name}
                // width={300}
                // height={300}
                fill
                className='object-cover'
              />
            </div>
          )}

          {/* Event Details */}
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {event.name}
                </h3>
                <p className='mt-1 text-gray-500'>{event.description}</p>
                {event.is_cancelled && (
                  <div className='mt-2 flex items-center gap-2 text-red-600'>
                    <Ban className='size-4' />
                    <span className='text-sm font-medium'>
                      Event Cancelled & Refunded
                    </span>
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2'>
                {!isPastEvent && !event.is_cancelled && (
                  <>
                    <Link
                      href={`/seller/events/${event._id}/edit`}
                      className='text-gary-700 flex shrink-0 items-center gap-2 rounded-lg bg-gray-100 px-4 py-4 text-sm font-medium transition-colors hover:bg-gray-200'
                    >
                      <Edit className='size-4' />
                      Edit
                    </Link>
                    <CancelEventButton eventId={event._id} />
                  </>
                )}
              </div>
            </div>

            <div className='mt-4 grid grid-cols-3 gap-4 md:grid-cols-4'>
              <div className='bg-gray50 rounded-lg p-3'>
                <div className='text-gary-600 mb-1 flex items-center gap-2'>
                  <Ticket className='size-4' />
                  <span className='text-sm font-medium'>
                    {event.is_cancelled ? 'Tickets Refunded' : 'Tickets Sold'}
                  </span>
                </div>
                <p className='text-2xl font-semibold text-gray-900'>
                  {event.is_cancelled ? (
                    <>
                      {event.metrics.refundedTickets}
                      <span className='text-sm font-normal text-gray-500'>
                        {' '}
                        refunded
                      </span>
                    </>
                  ) : (
                    <>
                      {event.metrics.soldTickets}
                      <span className='text-sm font-normal text-gray-500'>
                        /{event.totalTickets}
                        {/* /{event.metrics.totalTickets}  */}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className='rounded-lg bg-gray-50 p-3'>
                <div className='mb-1 flex items-center gap-2 text-gray-600'>
                  <Banknote className='size-4' />
                  <span className='text-sm font-medium'>
                    {event.is_cancelled ? 'Amount Refunde' : 'Revenue'}
                  </span>
                </div>
                <p className='text-2xl font-semibold text-gray-900'>
                  €{' '}
                  {event.is_cancelled
                    ? event.metrics.refundedTickets * event.price
                    : event.metrics.revenue}
                </p>
              </div>

              <div className='rounded-lg bg-gray-50 p-3'>
                <div className='mb-1 flex items-center gap-2 text-gray-600'>
                  <CalendarDays className='size-4' />
                  <span className='text-sm font-medium'>Date</span>
                </div>
                <p className='text-2xl font-semibold text-gray-900'>
                  {new Date(event.eventDate).toLocaleDateString()}
                </p>
              </div>

              <div className='rounded-lg bg-gray-50 p-3'>
                <div className='mb-1 flex items-center gap-2 text-gray-600'>
                  <InfoIcon className='size-4' />
                  <span className='text-sm font-medium'>Status</span>
                </div>

                <p className='text-xl font-semibold text-gray-900'>
                  {event.is_cancelled
                    ? 'Cancelled'
                    : isPastEvent
                      ? 'Ended'
                      : 'Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerEventCard;
