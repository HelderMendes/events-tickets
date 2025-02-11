'use client';

import { api } from '@/convex/_generated/api';
import { useStorageUrl } from '@/lib/utils';
import { useQuery } from 'convex/react';
import React from 'react';
import Spinner from './Spinner';
import Image from 'next/image';
import { Id } from '@/convex/_generated/dataModel';
import { CalendarDays, IdCard, MapPin, TicketIcon, User } from 'lucide-react';
import QrCode from 'react-qr-code';

function Ticket({ ticketId }: { ticketId: Id<'tickets'> }) {
  const ticket = useQuery(api.tickets.getTicketWithDetails, { ticketId });
  const user = useQuery(api.users.getUserById, {
    userId: ticket?.userId ?? '',
  });
  const imageUrl = useStorageUrl(ticket?.event?.imageStorageId);

  if (!ticket || !ticket.event || !user) {
    return <Spinner />;
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-xl ${ticket.event.is_cancelled ? 'border-red-200' : 'border-gray-100'}`}
    >
      {/* Event header with Image */}
      <div className='relative'>
        {imageUrl && (
          <div className='relative aspect-[21/9] w-full'>
            <Image
              src={imageUrl}
              alt={ticket.event.name}
              fill
              className={`object-cover object-center ${ticket.event.is_cancelled ? 'opacity-50' : ''}`}
              priority
            />

            <div className='absolute inset-0 top-44 bg-gradient-to-b from-black/0 to-black/100' />
          </div>
        )}
        <div
          className={`px-6 py-4 ${imageUrl ? 'absolute bottom-0 left-0 right-0' : ticket.event.is_cancelled ? 'bg-red-600' : 'bg-blue-600'}`}
        >
          <h2
            className={`text-2xl font-bold ${imageUrl || !imageUrl ? 'text-white' : 'text-black'}`}
          >
            {ticket.event.name}
          </h2>
          {ticket.event.is_cancelled && (
            <p className='mt-1 text-red-300'>This event has been cancelled</p>
          )}
        </div>
      </div>

      {/* Ticket Content */}
      <div className='p-6'>
        <div className='grid grid-cols-2 gap-6'>
          {/* Left Column – Event Details */}
          <div className='space-y-4'>
            <div className='flex items-center text-gray-600'>
              <CalendarDays
                className={`mr-4 mt-4 size-5 ${ticket.event.is_cancelled ? 'text-red-600' : 'text-blue-600'}`}
              />
              <div>
                <p className='text-xs font-bold uppercase text-blue-700'>
                  Event Date
                </p>
                <p className='font-medium'>
                  {new Date(ticket.event.eventDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className='flex items-center text-gray-600'>
              <MapPin
                className={`mr-4 mt-4 size-5 ${ticket.event.is_cancelled ? 'text-red-600' : 'text-blue-600'}`}
              />
              <div>
                <p className='text-xs font-bold uppercase text-blue-700'>
                  Location
                </p>
                <p className='font-medium'>{ticket.event.location}</p>
              </div>
            </div>

            <div className='flex items-center text-gray-600'>
              <User
                className={`mr-4 mt-4 size-5 ${ticket.event.is_cancelled ? 'text-red-600' : 'text-blue-600'}`}
              />
              <div>
                <p className='text-xs font-bold uppercase text-blue-700'>
                  Ticket Holder
                </p>
                <p className='font-medium'>{user.name}</p>
                <p className='text-sm text-gray-500'>{user.email}</p>
              </div>
            </div>

            <div className='flex items-center break-all text-gray-600'>
              <IdCard
                className={`mr-4 mt-4 size-5 ${ticket.event.is_cancelled ? 'text-red-600' : 'text-blue-600'}`}
              />
              <div>
                <p className='text-xs font-bold uppercase text-blue-700'>
                  Ticket Holder ID
                </p>
                <p className='font-medium'>{user.userId}</p>
              </div>
            </div>

            <div className='flex items-center text-gray-600'>
              <TicketIcon
                className={`mr-4 mt-4 size-5 ${ticket.event.is_cancelled ? 'text-red-600' : 'text-blue-600'}`}
              />
              <div>
                <p className='text-xs font-bold uppercase text-blue-700'>
                  Ticket Price
                </p>
                <p className='font-medium'>€ {ticket.event.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Right Column – QR Code */}
          <div className='flex flex-col items-center justify-center border-l border-gray-200 pl-6'>
            <div
              className={`rounded-lg bg-gray-100 p-4 ${ticket.event.is_cancelled ? 'opacity-50' : ''}`}
            >
              <QrCode value={ticket._id} className='size-32' />
            </div>
            <p className='text0gray-500 mt-2 max-w-[200px] break-all text-center text-sm md:max-w-full'>
              <span className='text-xs font-bold uppercase text-blue-700'>
                ticket Id:
              </span>{' '}
              {ticket._id}
            </p>
          </div>
        </div>

        {/* Additional information */}
        <div className='mt-6 border-t border-gray-200 pt-6'>
          <h3 className='mb-2 text-sm font-medium text-gray-900'>
            Important Information
          </h3>
          {ticket.event.is_cancelled ? (
            <p className='text-sm text-red-600'>
              This event has been cancelled. A refund will be processed if it
              was not yen been refunded!
            </p>
          ) : (
            <ul className='space-y-1 text-sm text-gray-600'>
              <li>
                <span className='font-bold text-blue-700'>•</span> Please arrive
                at least 30 minutes before the event starts!
              </li>
              <li>
                <span className='font-bold text-blue-700'>•</span> Have your
                ticket QR Code ready for scanning!
              </li>
              <li>
                <span className='font-bold text-blue-700'>•</span>This ticket is
                non-transferable!
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Ticket Footer */}
      <div
        className={`${ticket.event.is_cancelled ? 'bg-red-50' : 'bg-gray-50'} flex items-center justify-between px-6 py-4`}
      >
        <span className='text-sm text-gray-500'>
          Purchase Date: {new Date(ticket.purchasedAt).toLocaleString()}
        </span>
        <span
          className={`text-sm font-medium ${ticket.event.is_cancelled ? 'text-red-600' : 'text-blue-600'}`}
        >
          {ticket.event.is_cancelled
            ? 'Cancelled'
            : 'Valid Ticket – ready to use'}
        </span>
      </div>
    </div>
  );
}

export default Ticket;
