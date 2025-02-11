import EventForm from '@/components/EventForm';

const EventPage = () => {
  return (
    <div className='mx-auto max-w-3xl p-6'>
      <div className='overflow-hidden rounded-lg bg-white shadow-lg'>
        <div className='bg-gradient-to-tr from-blue-600 to-blue-800 px-6 py-8 text-white'>
          <h2 className='text-2xl font-bold'>Create New Event</h2>
          <p className='mt-2 text-blue-100'>
            List your event and start selling tickets
          </p>
        </div>

        <div className='p-6'>
          <EventForm mode='create' />
        </div>
      </div>
    </div>
  );
};

export default EventPage;
