'use client';

import Ticket from '@/components/Ticket';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { redirect, useParams } from 'next/navigation';
import { useEffect } from 'react';

function TicketPage() {
  const params = useParams();
  const { user } = useUser();
  const ticket = useQuery(api.tickets.getTicketWithDetails, {
    ticketId: params.id as Id<'tickets'>,
  });

  useEffect(() => {
    if (!user) redirect('/tickets');
    if (!ticket || ticket.userId !== user.id) redirect('/tickets');
    if (!ticket.event) redirect('/tickets');
  }, [user, ticket]);

  if (!ticket || !ticket.event) return null;

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl'>
        <div className='mb-8space-y-8'>
          {/* Navigation and Actions */}
          <div className='flex items-center justify-between'>
            <Link
              href={'/tickets'}
              className='flex items-center text-gray-600 transition-colors hover:text-gray-900'
            >
              <ArrowLeft className='mr-2 size-4' />
              Back to My Tickets
            </Link>
            <div className='item-center flex gap-4'>
              <button className='py-t flex items-center gap-2 px-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'>
                <Download className='size-4' />
                <span className='text-sm'>Save</span>
              </button>
              <button className='py-t flex items-center gap-2 px-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'>
                <Share2 className='size-4' />
                <span className='text-sm'>Share</span>
              </button>
            </div>
          </div>

          {/* Event Info Summary */}
          <div
            className={`rounded-lg border bg-white p-6 shadow-sm ${ticket.event.is_cancelled ? 'border-red-200' : 'border-gray-100'}`}
          >
            <h1 className='text-2xl font-bold text-gray-900'>
              {ticket.event.name}
            </h1>
            <p className='mt-1 text-gray-600'>
              {new Date(ticket.event.eventDate).toLocaleDateString()} at{' '}
              {ticket.event.location}
            </p>
            <div className='mt-4 flex items-center gap-4'>
              <span
                className={`py- rounded-full px-3 text-sm font-medium ${ticket.event.is_cancelled ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
              >
                {ticket.event.is_cancelled ? 'Cancelled' : 'Valid Ticket'}
              </span>
              <span className='text-sm text-gray-500'>
                Purchased on {new Date(ticket.purchasedAt).toLocaleDateString()}
              </span>
            </div>
            {ticket.event.is_cancelled && (
              <p className='mt-4 text-sm text-red-600'>
                This event has been cancelled. A refund will be processed if it
                hasn&aspo;t been already.
              </p>
            )}
          </div>
        </div>

        {/* Ticket Components */}
        <Ticket ticketId={ticket._id} />

        {/* Additional Information */}
        <div
          className={`mt-8 rounded-lg p-4 ${ticket.event.is_cancelled ? 'border border-red-100 bg-red-50' : 'border border-blue-100 bg-blue-50'}`}
        >
          <h3
            className={`text-sm font-medium ${ticket.event.is_cancelled ? 'text-red-900' : 'text-blue-900'}`}
          >
            Need Help?
          </h3>
          <p
            className={`mt-1 text-sm ${ticket.event.is_cancelled ? 'text-red-700' : 'text-blue-700'}`}
          >
            {ticket.event.is_cancelled ? (
              <>
                For questions about refunds or cancellations, please contact our
                support team at{' '}
                <a
                  href='mailto:info@helderdesign.nl?subject=Ticket Cancellation'
                  className='text-blue-700 underline'
                >
                  support email
                </a>
                .
              </>
            ) : (
              <>
                If you have any issues with your ticket, please contact our
                support team at{' '}
                <a
                  href='mailto:info@helderdesign.nl?subject=Ticket Issue'
                  className='text-blue-700 underline'
                >
                  support email
                </a>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TicketPage;
