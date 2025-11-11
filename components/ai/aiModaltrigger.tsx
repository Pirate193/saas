
'use client';
import { Button } from '@/components/ui/button';
import { AiContext, useAiStore } from '@/stores/aiStore';
import { Sparkles } from 'lucide-react';

export function AiTriggerButton({ context }: { context?: AiContext }) {
  const { onOpen } = useAiStore();
  return (
    <div className='absolute bottom-2 right-4 rounded-full ' >
    <Button 
      size="icon" 
      onClick={() => onOpen(context)}
      title="Ask AI"
      className=' rounded-full '
    >
      <Sparkles className="size-4" />
    </Button>
    </div>
  );
}