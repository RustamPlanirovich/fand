'use client';

import Link from 'next/link';
import { HomeIcon, StarIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-white hover:text-gray-300 transition-colors">
              <HomeIcon className="h-6 w-6 mr-2" />
              <span className="text-lg font-semibold">Crypto Funding Tracker</span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/watchlist" className="flex items-center text-gray-300 hover:text-white transition-colors">
              <StarIcon className="h-5 w-5 mr-2" />
              <span>Список наблюдения</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 