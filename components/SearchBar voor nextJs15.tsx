'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };
  return (
    <div>
      <form onSubmit={handleSearch} className='relative'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search for events...'
          className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-12 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <Search className='absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400' />
        <button
          type='submit'
          className='absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700'
        >
          Search
        </button>
      </form>
    </div>
  );
}

export default SearchBar;
