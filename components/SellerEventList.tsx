'use client';

import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import SellerEventCard from './SellerEventCard';

function SellerEventList() {
  const { user } = useUser();
  const events = useQuery(api.events.getSellerEvent, {
    userId: user?.id ?? '',
  });

  if (!events) return null;

  const upcomingEvents = events.filter((e) => e.eventDate > Date.now());
  const pastEvents = events.filter((e) => e.eventDate <= Date.now());

  return (
    <div className='mx-auto space-y-8'>
      {/* Upcoming events */}
      <div>
        <h2 className='mb-4 text-2xl font-semibold text-gray-900'>
          Upcoming Events
        </h2>
        <div className='grid grid-cols-1 gap-6'>
          {upcomingEvents.map((event) => (
            <SellerEventCard event={event} key={event._id} />
          ))}
          {upcomingEvents.length === 0 && (
            <p className='text-gray-500'>No upcoming events</p>
          )}
        </div>
      </div>

      {/* Past events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className='mb-4 text-2xl font-semibold text-gray-900'>
            Past Events
          </h2>
          <div className='grid grid-cols-1 gap-6'>
            {pastEvents.map((event) => (
              <SellerEventCard event={event} key={event._id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerEventList;
