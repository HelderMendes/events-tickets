'use client';

import TicketCard from '@/components/TicketCard';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { Ticket } from 'lucide-react';

function TicketsPage() {
  const { user } = useUser();
  const tickets = useQuery(api.events.getUserTickets, {
    userId: user?.id ?? '',
  });

  if (!tickets) return null;

  const validTickets = tickets.filter((t) => t.status === 'valid');
  const otherTickets = tickets.filter((t) => t.status !== 'valid');

  const upcomingTickets = validTickets.filter(
    (t) => t.event && t.event.eventDate > Date.now(),
  );
  const pastTickets = validTickets.filter(
    (t) => t.event && t.event.eventDate <= Date.now(),
  );

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-blue-700'>My Tickets</h1>
            <p className='mt-2 text-gray-600'>
              Manage and view all your tickets in one place
            </p>
          </div>
          <div className='rounded-lg border border-gray-100 bg-white px-4 py-2 shadow-md'>
            <div className='flex items-center gap-2 text-gray-600'>
              <Ticket className='size-5' />
              <span className='font-medium'>
                {tickets.length} Total Tickets
              </span>
            </div>
          </div>
        </div>

        {upcomingTickets.length > 0 && (
          <div className='mb-12'>
            <h2 className='mb-4 text-xl font-semibold text-gray-900'>
              Upcoming Tickets
            </h2>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {upcomingTickets.map((ticket) => (
                <TicketCard key={ticket._id} ticketId={ticket._id} />
              ))}
            </div>
          </div>
        )}

        {pastTickets.length > 0 && (
          <div className='mb-12'>
            <h2 className='mb-4 text-xl font-semibold text-gray-900'>
              Past Tickets
            </h2>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {pastTickets.map((ticket) => (
                <TicketCard key={ticket._id} ticketId={ticket._id} />
              ))}
            </div>
          </div>
        )}

        {otherTickets.length > 0 && (
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-900'>
              Other Tickets
            </h2>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {otherTickets.map((ticket) => (
                <TicketCard key={ticket._id} ticketId={ticket._id} />
              ))}
            </div>
          </div>
        )}

        {tickets.length === 0 && (
          <div className='my-12 text-center'>
            <Ticket className='mx-auto mb-4 size-12 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900'>
              You have no tickets
            </h3>
            <p className='mt-1 text-gray-600'>
              When you purchase tickets, they will appear here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketsPage;
