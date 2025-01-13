# Linter Issues Checklist

## Unused Variables/Imports
- [x] Remove unused `signUpData` in `src/app/(auth)/register/page.tsx`
- [x] Remove unused `data` in `src/app/auth/login/page.tsx`
- [x] Remove unused `data` in `src/app/auth/register/page.tsx`
- [x] Remove unused imports in `src/app/chat/channels/[channelId]/page.tsx`:
  - [x] `Textarea`
  - [x] `usePolling`
  - [x] `User`
- [x] Remove unused `handleKeyPress` in `src/app/chat/channels/[channelId]/page.tsx`
- [x] Remove unused `DialogDescription` in `src/components/chat/channel-info.tsx`
- [x] Remove unused imports in `src/components/chat/direct-message-dialog.tsx`:
  - [x] `DialogTrigger`
  - [x] `Smile`
  - [x] `Link`
- [x] Remove unused `Button` in `src/components/chat/file-upload.tsx`
- [x] Remove unused imports in `src/components/chat/MessageThread.tsx`:
  - [x] `MessageCircle`
  - [x] `usePolling`
- [x] Remove unused `useState` in `src/components/chat/RichTextInput.tsx`
- [x] Remove unused `channelApi` in `src/components/chat/search-dialog.tsx`
- [x] Remove unused `channelId` in `src/components/chat/search-dialog.tsx`
- [x] Remove unused imports/variables in `src/components/chat/top-nav.tsx`:
  - [x] `User`
  - [x] `updateCurrentUserStatus`
  - [x] `refreshUser`
  - [x] `bucketData`
- [x] Remove unused `fallback` in `src/components/ui/avatar.tsx`
- [x] Remove unused `createClientComponentClient` in `src/lib/api/messages.ts`
- [x] Remove unused imports/variables in `src/lib/api/search.ts`:
  - [x] `channelId`

## React Hooks Issues
- [x] Fix complex dependency array in `src/app/chat/channels/[channelId]/page.tsx` (line 78)
- [x] Wrap 'messages' initialization in useMemo in `src/components/chat/direct-message-dialog.tsx`
- [x] Add missing dependency 'checkMembership' in `src/components/chat/join-channel-button.tsx`
- [x] Add missing dependency 'refreshChannels' in `src/components/chat/sidebar.tsx` (two instances)

## Type Issues
- [x] Fix empty interface in `src/components/ui/command.tsx`
- [x] Fix empty interface in `src/components/ui/input.tsx`
- [x] Fix empty interface in `src/components/ui/textarea.tsx`
- [x] Replace `any` types in `src/lib/api/channels.ts` (two instances)
- [x] Replace `any` types in `src/lib/hooks/useDebounce.ts` (two instances)

## Code Style
- [x] Use `const` instead of `let` for `intervalId` in `src/components/chat/MessageThread.tsx`
- [x] Use `const` instead of `let` for `otherUser` in `src/components/chat/search-dialog.tsx`

## Progress Tracking
- [x] Fixed unused variables/imports (19/19)
- [x] Fixed React hooks issues (4/4)
- [x] Fixed type issues (5/5)
- [x] Fixed code style issues (2/2) 