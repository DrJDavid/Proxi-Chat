import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  helperText?: string
  maxLength?: number
  showCharacterCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, maxLength, showCharacterCount, ...props }, ref) => {
    const characterCount = props.value?.toString().length || 0

    return (
      <div>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {helperText && (
            <p className={cn(
              "text-sm",
              error ? "text-destructive" : "text-muted-foreground"
            )}>
              {helperText}
            </p>
          )}
          {showCharacterCount && maxLength && (
            <p className="text-sm text-muted-foreground">
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea } 