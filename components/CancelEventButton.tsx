'use client';

import { refundEventTickets } from '@/app/actions/refundEventTickets';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from 'convex/react';
import { Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CancelEventButton({
  eventId,
}: {
  eventId: Id<'events'>;
}) {
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const cancelEvent = useMutation(api.events.cancelEvent);

  const handleCancel = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel this event? All tickets will be refunded and the event event will be cancel permanently.',
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      await refundEventTickets(eventId);
      await cancelEvent({ eventId });
      toast({
        title: 'Event cancelled',
        description: 'All Tickets have been refundeed sussessfully',
      });
      router.push('/seller/events');
    } catch (error) {
      console.error('Failed to cancel event: ', error);
      toast({
        variant: 'destructive',
        title: 'There was an error cancelling the event',
        description: 'Failed to cancel the event. Please try again...',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isCancelling}
      className='flex items-center gap-2 rounded-lg px-4 py-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700'
    >
      <Ban className='size-4' />
      <span>{isCancelling ? 'Processing...' : 'Cancel Event'}</span>
    </button>
  );
}
