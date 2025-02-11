import Image from 'next/image';
import Link from 'next/link';
import logo from '@/images/logo.png';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import SearchBar from './SearchBar';

function Header() {
  return (
    <div className='border-b'>
      <div className='flex flex-col items-center gap-4 p-4 lg:flex-row'>
        <div className='flex w-full items-center justify-between lg:w-auto'>
          <Link href={'/'} className='shrink-0 font-bold'>
            <Image
              src={logo}
              width={120}
              height={100}
              alt='Logo Tickets'
              className='w-28 lg:w-36'
            />
          </Link>

          <div className='lg:hidden'>
            <SignedIn>
              <UserButton />
            </SignedIn>

            <SignedOut>
              <SignInButton mode='modal'>
                <button className='rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-800 transition hover:bg-gray-200'>
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
        <div className='w-full lg:max-w-2xl'>
          <SearchBar />
        </div>
        <div className='ml-auto hidden lg:block'>
          <SignedIn>
            <div className='flex items-center gap-3'>
              <Link href={'/seller'}>
                <button className='whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700'>
                  Sell Tickets
                </button>
              </Link>

              <Link href={'/tickets'}>
                <button className='inline-block whitespace-nowrap rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-800 transition hover:bg-gray-200'>
                  My Tickets
                </button>
              </Link>
              <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode='modal'>
              <button className='inline-block whitespace-nowrap rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-800 transition hover:bg-gray-200'>
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Mobile Action and Buttons */}
        <div className='flex w-full justify-center gap-3 lg:hidden'>
          <SignedIn>
            <Link href={'/seller'} className='flex-1'>
              <button className='w-full whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700'>
                Sell Tickets
              </button>
            </Link>

            <Link href={'/tickets'} className='flex-1'>
              <button className='inline-block w-full whitespace-nowrap rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-800 transition hover:bg-gray-200'>
                My Tickets
              </button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

export default Header;
