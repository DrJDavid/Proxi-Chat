// This file is used to help TypeScript understand our module structure
declare module '@/components/ui/*' {
  const component: any
  export default component
  export * from '@/components/ui/*'
}

declare module '@/lib/*' {
  const module: any
  export default module
  export * from '@/lib/*'
}

declare module '@/types/*' {
  const type: any
  export default type
  export * from '@/types/*'
} 