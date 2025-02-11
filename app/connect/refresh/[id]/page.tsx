'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createStripeConnectAccountLink } from '@/app/actions/createStripeConnectAccountLink';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ConnectRefreshPage() {
  const params = useParams();
  const connectedAccountId = params.id as string;
  const [accountLinkCreatePending, setAccountLinkCreatePending] =
    useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const createAccountLink = async () => {
      if (connectedAccountId) {
        setAccountLinkCreatePending(true);
        setError(false);
        try {
          const { url } =
            await createStripeConnectAccountLink(connectedAccountId);
          window.location.href = url;
        } catch (error) {
          console.error('Error creating account link:', error);
          setError(true);
        }
        setAccountLinkCreatePending(false);
      }
    };

    createAccountLink();
  }, [connectedAccountId]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
      <div className='w-full max-w-md'>
        <div className='overflow-hidden rounded-xl bg-white shadow-lg'>
          {/* Header */}
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white'>
            <h2 className='mb-2 text-2xl font-bold'>Account Setup</h2>
            <p className='text-blue-100'>
              Complete your account setup to start selling tickets
            </p>
          </div>

          {/* Content */}
          <div className='p-6'>
            {error ? (
              <div className='flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4'>
                <AlertCircle className='mt-0.5 h-5 w-5 text-red-600' />
                <div>
                  <h3 className='mb-1 font-medium text-red-900'>
                    Something went wrong
                  </h3>
                  <p className='text-sm text-red-700'>
                    We couldn&apos;t refresh your account link. Please try again
                    or contact support if the problem persists.
                  </p>
                </div>
              </div>
            ) : (
              <div className='py-8 text-center'>
                <Loader2 className='mx-auto mb-4 h-12 w-12 animate-spin text-blue-600' />
                <p className='text-gray-600'>
                  {accountLinkCreatePending
                    ? 'Creating your account link...'
                    : 'Redirecting to Stripe...'}
                </p>
                {connectedAccountId && (
                  <p className='mt-4 text-xs text-gray-500'>
                    Account ID: {connectedAccountId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
