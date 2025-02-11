import SellerEventList from '@/components/SellerEventList';
import { auth } from '@clerk/nextjs/server';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function SellerEvenstPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='border=gray-200 mb-8 rounded-xl border bg-white p-6 shadow-sm'>
          <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
            <div className='flex items-center gap-4'>
              <Link
                href='/seller/'
                className='text-gray-500 transition-colors hover:text-gray-700'
              >
                <ArrowLeft className='size-5' />
              </Link>
              <div>
                <h1 className='text-2xl font-semibold text-gray-900'>
                  My Events
                </h1>
                <p className='mt-1 text-gray-500'>
                  Manage you events listing and track sales
                </p>
              </div>
            </div>
            <Link
              href='/seller/new-event'
              className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
            >
              <Plus size={5} />
              Create Event
            </Link>
          </div>
        </div>

        {/* Event List */}
        <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
          <SellerEventList />
        </div>
      </div>
    </div>
  );
}
