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
- [ ] Remove unused imports in `src/components/chat/direct-message-dialog.tsx`:
  - [ ] `DialogTrigger`
  - [ ] `Smile`
  - [ ] `Link`
- [ ] Remove unused `fileName` in `src/components/chat/direct-message-dialog.tsx`
- [ ] Remove unused `Button` in `src/components/chat/file-upload.tsx`
- [ ] Remove unused imports in `src/components/chat/MessageThread.tsx`:
  - [ ] `MessageCircle`
  - [ ] `usePolling`
- [ ] Remove unused `useState` in `src/components/chat/RichTextInput.tsx`
- [ ] Remove unused `channelApi` in `src/components/chat/search-dialog.tsx`
- [ ] Remove unused `channelId` in `src/components/chat/search-dialog.tsx`
- [ ] Remove unused imports/variables in `src/components/chat/top-nav.tsx`:
  - [ ] `User`
  - [ ] `updateCurrentUserStatus`
  - [ ] `refreshUser`
  - [ ] `bucketData`
- [ ] Remove unused `fallback` in `src/components/ui/avatar.tsx`
- [ ] Remove unused `actionTypes` in `src/components/ui/use-toast.ts`
- [ ] Remove unused `data` in `src/lib/api/channels.ts`
- [ ] Remove unused `createClientComponentClient` in `src/lib/api/messages.ts`
- [ ] Remove unused imports in `src/lib/api/search.ts`:
  - [ ] `Message`
  - [ ] `User`
  - [ ] `channelId`

## React Hooks Issues
- [ ] Fix complex dependency array in `src/app/chat/channels/[channelId]/page.tsx` (line 78)
- [ ] Wrap 'messages' initialization in useMemo in `src/components/chat/direct-message-dialog.tsx`
- [ ] Add missing dependency 'checkMembership' in `src/components/chat/join-channel-button.tsx`
- [ ] Add missing dependency 'refreshChannels' in `src/components/chat/sidebar.tsx` (two instances)

## Type Issues
- [ ] Fix empty interface in `src/components/ui/command.tsx`
- [ ] Fix empty interface in `src/components/ui/input.tsx`
- [ ] Fix empty interface in `src/components/ui/textarea.tsx`
- [ ] Replace `any` types in `src/lib/api/channels.ts` (two instances)
- [ ] Replace `any` types in `src/lib/hooks/useDebounce.ts` (two instances)

## Code Style
- [ ] Use `const` instead of `let` for `intervalId` in `src/components/chat/MessageThread.tsx`
- [ ] Use `const` instead of `let` for `otherUser` in `src/components/chat/search-dialog.tsx`

## Progress Tracking
- [x] Fixed unused variables/imports (6/23)
- [ ] Fixed React hooks issues (0/4)
- [ ] Fixed type issues (0/5)
- [ ] Fixed code style issues (0/2) 