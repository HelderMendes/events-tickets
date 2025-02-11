'use client';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

function TicketCard({ ticketId }: { ticketId: Id<'tickets'> }) {
  const ticket = useQuery(api.tickets.getTicketWithDetails, { ticketId });

  if (!ticket || !ticket.event) return null;

  const isPastEvent = ticket.event.eventDate < Date.now();

  const statusColors = {
    valid: isPastEvent
      ? 'bg-green-500 text-gar-600 border-gray-200'
      : 'bg-green-50 text-green-700 border-green-100',
    used: 'bg-gray-50 text-gray-600 border-gray-200',
    refunded: 'bg-red-50 text-red-700 border-red-100',
    cancelled: 'bg-red-50 text-red-700 border-red-100',
  };

  const statusText = {
    valid: isPastEvent ? 'Ended' : 'Valid',
    used: 'Used',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
  };

  return (
    <Link
      href={`/tickets/${ticketId}`}
      className={`block rounded-lg border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${ticket.event.is_cancelled ? 'border-red-200' : 'border-gray-100'} overflow-hidden ${isPastEvent ? 'opacity-75 hover:opacity-100' : ''}`}
    >
      <div className='p-5'>
        <div className='mb-4 flex items-start justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              {ticket.event.name}
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Purchase on {new Date(ticket.purchasedAt).toLocaleString()}
            </p>
            {ticket.event.is_cancelled && (
              <p className='mt-1 flex items-center gap-1 text-sm text-red-600'>
                <AlertTriangle size={4} />
                Event Cancelled
              </p>
            )}
          </div>
          <div className='flex flex-col items-end gap-2'>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${ticket.event.is_cancelled ? 'border-red-100 bg-red-50 text-red-700' : statusColors[ticket.status]}`}
            >
              {ticket.event.is_cancelled
                ? 'Cancelled'
                : statusText[ticket.status]}
            </span>
            {isPastEvent && !ticket.event.is_cancelled && (
              <span className='flex items-center gap-1 text-sm text-gray-500'>
                <Clock className='size-3' />
              </span>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center text-gray-600'>
            <Calendar
              className={`mr-2 size-4 ${ticket.event.is_cancelled ? 'text-red-600' : ''}`}
            />
            <span className='text-sm'>
              {new Date(ticket.event.eventDate).toLocaleDateString()}
            </span>
          </div>

          <div className='flex items-center text-gray-600'>
            <MapPin
              className={`mr-2 size-4 ${ticket.event.is_cancelled ? 'text-red-600' : ''}`}
            />
            <span className='text-sm'>{ticket.event.location}</span>
          </div>
        </div>

        <div className='mb-4 flex items-start justify-between text-sm'>
          <span
            className={`font-medium ${ticket.event.is_cancelled ? 'text-red-600' : isPastEvent ? 'text-gray-600' : 'text-blue-600'}`}
          >
            € {ticket.event.price.toFixed(2)}
          </span>
          <span className='flex items-center text-gray-600'>
            View Ticket <ArrowRight className='ml-1 size-4' />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default TicketCard;
