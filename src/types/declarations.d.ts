// This file is used to help TypeScript understand our module structure
declare module '@/components/ui/*' {
  import { ComponentType, ReactNode } from 'react'
  interface BaseProps {
    children?: ReactNode
    className?: string
  }
  const Component: ComponentType<BaseProps>
  export default Component
}

// Declare shadcn/ui component types
declare module '@/components/ui/button' {
  import { ButtonHTMLAttributes } from 'react'
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
  }
  export const Button: React.FC<ButtonProps>
}

declare module '@/components/ui/input' {
  import { InputHTMLAttributes } from 'react'
  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean
    helperText?: string
  }
  export const Input: React.FC<InputProps>
}

declare module '@/components/ui/label' {
  import { LabelHTMLAttributes } from 'react'
  export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}
  export const Label: React.FC<LabelProps>
}

declare module '@/components/ui/card' {
  import { HTMLAttributes } from 'react'
  export interface CardProps extends HTMLAttributes<HTMLDivElement> {}
  export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
  export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}
  export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
  export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
  export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

  export const Card: React.FC<CardProps>
  export const CardHeader: React.FC<CardHeaderProps>
  export const CardFooter: React.FC<CardFooterProps>
  export const CardTitle: React.FC<CardTitleProps>
  export const CardDescription: React.FC<CardDescriptionProps>
  export const CardContent: React.FC<CardContentProps>
}

declare module '@/components/ui/tabs' {
  import { HTMLAttributes } from 'react'
  export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
  }
  export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
    value: string
  }
  export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}
  export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
    value: string
  }

  export const Tabs: React.FC<TabsProps>
  export const TabsContent: React.FC<TabsContentProps>
  export const TabsList: React.FC<TabsListProps>
  export const TabsTrigger: React.FC<TabsTriggerProps>
}

// Declare lib module types
declare module '@/lib/supabase/client' {
  import { SupabaseClient } from '@supabase/supabase-js'
  const supabase: SupabaseClient
  export default supabase
}

declare module '@/lib/utils' {
  export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]): string
  export function getInitials(name: string): string
}

// Declare type module exports
declare module '@/types' {
  export * from '@/types/index'
} 