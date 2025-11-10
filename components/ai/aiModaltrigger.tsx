
'use client';
import { Button } from '@/components/ui/button';
import { AiContext, useAiStore } from '@/stores/aiStore';
import { Sparkles } from 'lucide-react';

export function AiTriggerButton({ context }: { context?: AiContext }) {
  const { onOpen } = useAiStore();
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => onOpen(context)}
      title="Ask AI"
    >
      <Sparkles className="size-4" />
    </Button>
  );
}