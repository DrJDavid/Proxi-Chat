import { MessageSquareText, Hash, Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Sidebar() {
  return (
    <div className="pb-12 w-full">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Channels
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2"
            >
              <Hash className="h-4 w-4" />
              gauntlet-ai
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2"
            >
              <Hash className="h-4 w-4" />
              test
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2"
            >
              <Hash className="h-4 w-4" />
              testing
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2"
            >
              <Hash className="h-4 w-4" />
              work
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Direct Messages
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2"
            >
              <MessageSquareText className="h-4 w-4" />
              John David
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2 text-muted-foreground"
            >
              <MessageSquareText className="h-4 w-4" />
              Ask About Gauntlet AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 