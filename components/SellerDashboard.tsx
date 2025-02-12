'use client';

import { createStripeConnectLoginLink } from '@/app/actions/createStripeConnectLoginLink';
import {
  AccountStatus,
  getStripeConnectAccountStatus,
} from '@/app/actions/getStripeAccountAccountStatus';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Spinner from './Spinner';
import Link from 'next/link';
import { CalendarDays, Cog, Plus } from 'lucide-react';
import { createStripeConnectCustomer } from '@/app/actions/createStripeConnectCustomer';
import { createStripeConnectAccountLink } from '@/app/actions/createStripeConnectAccountLink';

export default function SellerDashboard() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [accountLinkCreatePending, setAccountLinkCreatePending] =
    useState(false);
  const [error, setError] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null,
  );
  const router = useRouter();
  const { user } = useUser();
  const stripeConnectId = useQuery(api.users.getUsersStripeConnectId, {
    userId: user?.id || '',
  });

  useEffect(() => {
    if (stripeConnectId) {
      fetchAccountStatus();
    }
  }, [stripeConnectId]);

  if (stripeConnectId === undefined) {
    return <Spinner />;
  }

  const isReadyToAcceptPayments =
    accountStatus?.isActive && accountStatus?.payoutsEnabled;

  const handleManageAccount = async () => {
    try {
      if (stripeConnectId && accountStatus?.isActive) {
        const loginUrl = await createStripeConnectLoginLink(stripeConnectId);
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.error('Error accessing Stripe Connect portal: ', error);
      setError(true);
    }
  };

  const fetchAccountStatus = async () => {
    if (stripeConnectId) {
      try {
        const status = await getStripeConnectAccountStatus(stripeConnectId);
        setAccountStatus(status);
      } catch (error) {
        console.error('Error fetching account status:', error);
      }
    }
  };

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <div className='overflow-hidden rounded-lg bg-white shadow-lg'>
        {/* Seller Header Section */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white'>
          <h2 className='text-2xl font-bold'>Seller Dashboard</h2>
          <p className='mt-2 text-blue-100'>
            Manage your seller profile and payments settings
          </p>
        </div>

        {/* Main content */}
        {isReadyToAcceptPayments && (
          <>
            <div className='rounded-lg bg-white p-8'>
              <h2 className='font-semi-bold mb-6 text-2xl text-gray-900'>
                Sell tickets for your events
              </h2>
              <p className='mb-8 text-gray-600'>
                List your tickets for sale and manage your listings
              </p>
              <div className='rounded-lx grid grid-cols-2 gap-2 bg-white py-2 shadow-sm'>
                <Link
                  href={'/seller/new-event'}
                  className='flex justify-center gap-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
                >
                  <Plus className='size-5' />
                  Create Event
                </Link>
                <Link
                  href={'/seller/events'}
                  className='flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-400'
                >
                  <CalendarDays className='size-5' />
                  View My Events
                </Link>
              </div>
            </div>
          </>
        )}

        <div className='p-6'>
          {/* Account Creation Section */}
          {!stripeConnectId && !accountCreatePending && (
            <div className='py-8 text-center'>
              <h3 className='font-semi-bold mb-6 text-xl'>
                Start Accepting Payments
              </h3>
              <p className='mb-6 text-gray-600'>
                Create your seller account to start receiving payments securely
                through you Stripe account...
              </p>
              <button
                onClick={async () => {
                  setAccountCreatePending(true);
                  setError(false);
                  try {
                    await createStripeConnectCustomer();
                    setAccountCreatePending(false);
                  } catch (error) {
                    console.error(
                      'Error creating Stripe Connect Customer: ',
                      error,
                    );
                    setError(true);
                    setAccountCreatePending(false);
                  }
                }}
                className='rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
              >
                Create Seller Account
              </button>
            </div>
          )}

          {/* Account Status Section */}
          {stripeConnectId && accountStatus && (
            <div className='space-y-6'>
              {/* Status Cards */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Account Status Card */}
                <div className='rounded-lg bg-gray-50 p-4'>
                  <h3 className='text-sm font-medium text-gray-500'>
                    Account Status
                  </h3>
                  <div className='mt-2 flex items-center'>
                    <div
                      className={`mr-2 size-3 rounded-full ${accountStatus.isActive ? 'bg-green-500' : 'bg-yellow-500'}`}
                    />
                    <span className='text-lg font-semibold'>
                      {accountStatus.isActive ? 'Active' : 'Pending Setup'}
                    </span>
                  </div>
                </div>

                {/* Payments Status Card */}
                <div className='rounded-lg bg-gray-50 p-4'>
                  <h3 className='text-sm font-medium text-gray-500'>
                    Payment Capability
                  </h3>
                  <div className='mt-2 space-y-1'>
                    <div className='flex items-center'>
                      <svg
                        className={`h-5 w-5 ${
                          accountStatus.chargesEnabled
                            ? 'text-green-500'
                            : 'text-gray-400'
                        }`}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='ml-2'>
                        {accountStatus.chargesEnabled
                          ? 'Can accept payments'
                          : 'Cannot accept payments yet'}
                      </span>
                    </div>
                    <div className='flex items-center'>
                      <svg
                        className={`h-5 w-5 ${
                          accountStatus.payoutsEnabled
                            ? 'text-green-500'
                            : 'text-gray-400'
                        }`}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='ml-2'>
                        {accountStatus.payoutsEnabled
                          ? 'Can receive payouts'
                          : 'Cannot receive payouts yet'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              {accountStatus.requiresInformation && (
                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                  <h3 className='mb-3 text-sm font-medium text-yellow-800'>
                    Required Information
                  </h3>
                  {accountStatus.requirements.currently_due.length > 0 && (
                    <div className='mb-3'>
                      <p className='mb-2 font-medium text-yellow-800'>
                        Action Required:
                      </p>
                      <ul className='list-disc pl-5 text-sm text-yellow-700'>
                        {accountStatus.requirements.currently_due.map((req) => (
                          <li key={req}>{req.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {accountStatus.requirements.eventually_due.length > 0 && (
                    <div>
                      <p className='mb-2 font-medium text-yellow-800'>
                        Eventually Needed:
                      </p>
                      <ul className='list-disc pl-5 text-sm text-yellow-700'>
                        {accountStatus.requirements.eventually_due.map(
                          (req) => (
                            <li key={req}>{req.replace(/_/g, ' ')}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                  {/* Only show Add Information button if there are requirements */}
                  {!accountLinkCreatePending && (
                    <button
                      onClick={async () => {
                        setAccountLinkCreatePending(true);
                        setError(false);
                        try {
                          // const { url } =
                          //   await createStripeConnectAccountLink(
                          //     stripeConnectId,
                          //   );
                          // router.push(url);

                          const response =
                            await createStripeConnectAccountLink(
                              stripeConnectId,
                            );
                          if (!response || !response.url) {
                            throw new Error('Invalid response from Stripe');
                          }
                          router.push(response.url);
                        } catch (error) {
                          console.error(
                            'Error creating Stripe Connect account link:',
                            error,
                          );
                          setError(true);
                        }
                        setAccountLinkCreatePending(false);
                      }}
                      className='mt-4 rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700'
                    >
                      Complete Requirements
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className='mt-6 flex flex-wrap gap-3'>
                {accountStatus.isActive && (
                  <button
                    onClick={handleManageAccount}
                    className='flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
                  >
                    <Cog className='mr-2 h-4 w-4' />
                    Seller Dashboard
                  </button>
                )}
                <button
                  onClick={fetchAccountStatus}
                  className='rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200'
                >
                  Refresh Status
                </button>
              </div>

              {error && (
                <div className='mt-4 rounded-lg bg-red-50 p-3 text-red-600'>
                  Unable to access Stripe dashboard. Please complete all
                  requirements first.
                </div>
              )}
            </div>
          )}

          {/* Loading States */}
          {accountCreatePending && (
            <div className='py-4 text-center text-gray-600'>
              Creating your seller account...
            </div>
          )}
          {accountLinkCreatePending && (
            <div className='py-4 text-center text-gray-600'>
              Preparing account setup...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
