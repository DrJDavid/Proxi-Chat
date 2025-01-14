import { MessageSquareText, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  channels?: { id: string; name: string }[];
  directMessages?: { id: string; name: string }[];
}

export function Sidebar({ className, channels = [], directMessages = [], ...props }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Channels
          </h2>
          <div className="space-y-1">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className="w-full justify-start flex gap-2"
              >
                <Hash className="h-4 w-4" />
                {channel.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2"
            >
              <Hash className="h-4 w-4" />
              general
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Direct Messages
          </h2>
          <div className="space-y-1">
            {directMessages.map((dm) => (
              <Button
                key={dm.id}
                variant="ghost"
                className="w-full justify-start flex gap-2"
              >
                <MessageSquareText className="h-4 w-4" />
                {dm.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start flex gap-2 text-muted-foreground"
            >
              <MessageSquareText className="h-4 w-4" />
              RAG Assistant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 