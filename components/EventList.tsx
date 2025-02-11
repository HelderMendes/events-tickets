'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import Spinner from './Spinner';
import { CalendarDays, Ticket } from 'lucide-react';
import EventCard from './EventCard';

function EventList() {
  const events = useQuery(api.events.get);
  // console.log(events);

  if (!events) {
    return (
      <div className='flex min-h-[400px] items-center'>
        <Spinner />
      </div>
    );
  }

  const upcomingEvents = events
    .filter((event) => event.eventDate > Date.now())
    .sort((a, b) => a.eventDate - b.eventDate);

  const pastEvents = events
    .filter((event) => event.eventDate <= Date.now())
    .sort((a, b) => b.eventDate - a.eventDate);

  return (
    <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Upcoming Events</h1>
          <p className='mt-2 text-gray-600'>
            Discover and book tickets for the best events
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white px-4 py-2 shadow-sm'>
          <div className='flex items-center gap-2 text-gray-600'>
            <CalendarDays className='size-5' />
            <span className='font-medium'>
              {upcomingEvents.length} Upcoming Events
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Events Grid */}
      {upcomingEvents.length > 0 ? (
        <div className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {upcomingEvents.map((event) => (
            <EventCard key={event._id} eventId={event._id} />
          ))}
        </div>
      ) : (
        <div className='bg-gary-50 mb-12 rounded-lg p-12 text-center'>
          <Ticket className='mx-auto mb-4 size-12 text-gray-400' />
          <h3 className='text-lg font-medium text-gray-900'>
            No upcoming events
          </h3>
          <p className='mt-1 text-gray-600'>Check ba ck for new events</p>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <>
          <h2 className='mb-6 text-2xl font-bold text-gray-900'>Past Events</h2>
          <div className='mf:grid-cols-2 grid grid-cols-1 gap-6 lg:grid-cols-3'>
            {pastEvents.map((event) => (
              <EventCard key={event._id} eventId={event._id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default EventList;
