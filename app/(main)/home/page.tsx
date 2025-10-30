

import { ModeToggle } from '@/components/themetoggle';
import { api } from '@/convex/_generated/api';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';

export default function HomePage() {
 

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">My App</h1>
      
      <div className="flex gap-4 items-center mt-4">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <ModeToggle />
      </div>

    
    </div>
  );
}