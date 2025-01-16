import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    userId: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DirectMessagePage({ params, searchParams }: PageProps) {
  const { userId } = await params
  await searchParams // Need to await even if we don't use it
  redirect(`/chat/direct/${userId}`)
}
