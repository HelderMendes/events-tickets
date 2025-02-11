'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ConnectReturnPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
      <div className='w-full max-w-md'>
        <div className='overflow-hidden rounded-xl bg-white shadow-lg'>
          {/* Success Header */}
          <div className='bg-gradient-to-r from-green-500 to-green-600 p-6 text-center text-white'>
            <div className='mb-4 flex justify-center'>
              <CheckCircle2 className='size-16' />
            </div>
            <h2 className='mb-2 text-2xl font-bold'>Account Connected!</h2>
            <p className='text-green-100'>
              Your Stripe Account has been successfully connected.
            </p>
          </div>

          {/* Content */}
          <div className='p-6'>
            <div className='space-y-4'>
              <div className='rounded-lg border border-green-100 bg-green-50 p-4'>
                <h3 className='text-bg mb-3 font-medium text-green-900'>
                  What happens next?
                </h3>
                <ul className='space-y-2 text-sm text-green-700'>
                  <li>• You can now create and sell tickets for your events</li>
                  <li>
                    • Payments will be processed through your stripe account
                  </li>
                  <li>• Founds will be transferred automatically</li>
                </ul>
              </div>

              <Link
                href={'/seller'}
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition-colors duration-200 hover:bg-blue-700'
              >
                Go to Seller Dashboard
                <ArrowRight className='size-4' />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
