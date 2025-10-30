'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from './ui/button';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-xl font-bold">
          Your App
        </Link>
      </div>
      <div className="flex items-center space-x-4">

    
          <Button asChild >
          <Link 
            href="/sign-in" 
            className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Link>
          </Button>
          <Button asChild >
          <Link 
            href="/sign-up" 
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Sign Up
          </Link>
          </Button>
       
      </div>
    </nav>
  );
}