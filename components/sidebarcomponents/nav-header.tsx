'use client';
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import React from 'react'

const Navheader = () => {
    const user = useQuery(api.user.getCurrentUser);
  return (
    <div>
        <p className='text-xl font-bold' >
            Hi ,{user?.name}
        </p>
    </div>
  )
}

export default Navheader