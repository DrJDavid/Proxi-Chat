import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    channelId: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ChannelPage({ params, searchParams }: PageProps) {
  const { channelId } = await params
  await searchParams // Need to await even if we don't use it
  redirect(`/chat/channels/${channelId}`)
}
