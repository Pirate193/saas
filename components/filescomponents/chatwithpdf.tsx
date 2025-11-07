import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react';
import React from 'react'

interface ChatwithpdfProps {
    fileId:Id<'files'>;
}
const Chatwithpdf = ({fileId}:ChatwithpdfProps) => {
    const file = useQuery(api.files.getFile,{fileId:fileId});
  return (
    <div>Chatwithpdf</div>
  )
}

export default Chatwithpdf