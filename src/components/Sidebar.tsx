import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            ProxiChat
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <span>Chat</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <span>Documents</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 