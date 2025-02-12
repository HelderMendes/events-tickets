'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useSearchParams } from 'next/navigation';
import EventCard from '@/components/EventCard';
import { Search } from 'lucide-react';
import Spinner from '@/components/Spinner';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const searchResults = useQuery(api.events.search, { searchTerm: query });

  if (!searchResults) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Spinner />
      </div>
    );
  }

  const upcomingEvents = searchResults
    .filter((event) => event.eventDate > Date.now())
    .sort((a, b) => a.eventDate - b.eventDate);

  const pastEvents = searchResults
    .filter((event) => event.eventDate <= Date.now())
    .sort((a, b) => b.eventDate - a.eventDate);

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Search Results Header */}
        <div className='mb-8 flex items-center gap-3'>
          <Search className='h-6 w-6 text-gray-400' />
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Search Results for &quot;{query}&quot;
            </h1>
            <p className='mt-1 text-gray-600'>
              Found {searchResults.length} events
            </p>
          </div>
        </div>

        {/* No Results State */}
        {searchResults.length === 0 && (
          <div className='rounded-xl bg-white py-12 text-center shadow-sm'>
            <Search className='mx-auto mb-4 h-12 w-12 text-gray-300' />
            <h3 className='text-lg font-medium text-gray-900'>
              No events found
            </h3>
            <p className='mt-1 text-gray-600'>
              Try adjusting your search terms or browse all events
            </p>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className='mb-12'>
            <h2 className='mb-6 text-xl font-semibold text-gray-900'>
              Upcoming Events
            </h2>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {upcomingEvents.map((event) => (
                <EventCard key={event._id} eventId={event._id} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className='mb-6 text-xl font-semibold text-gray-900'>
              Past Events
            </h2>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {pastEvents.map((event) => (
                <EventCard key={event._id} eventId={event._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
