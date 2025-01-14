# ProxiChat Linter Errors Documentation

## TypeScript and ESLint Errors

### Channel Page (`src/app/chat/channels/[channelId]/page.tsx`)
- 🔴 Unused variable: `KeyboardEvent` is defined but never used
- ⚠️ React Hook warning: useEffect has a complex dependency array expression

### Direct Message Dialog (`src/components/chat/direct-message-dialog.tsx`)
- 🔴 Unused variable: `fileName` is assigned but never used

### Search Dialog (`src/components/chat/search-dialog.tsx`)
- 🔴 Unused variable: `params` is assigned but never used

### Toast Hook (`src/components/ui/use-toast.ts`)
- 🔴 Type-only import: `actionTypes` is assigned a value but only used as a type

### Channels API (`src/lib/api/channels.ts`)
- 🔴 Unused variable: `data` is assigned but never used

### Search API (`src/lib/api/search.ts`)
- 🔴 Unused imports: 
  - `Message` is defined but never used
  - `User` is defined but never used

### Type Declarations (`src/types/declarations.d.ts`)
- 🔴 ESLint errors:
  - Unexpected `any` type used in multiple places
  - Invalid module variable assignment (Next.js specific rule)

## How to Fix

1. Remove unused variables and imports:
   ```typescript
   // Remove or use the imported/declared variables
   ```

2. Fix React Hook dependencies:
   - Extract complex expressions into variables
   - Review useEffect dependencies

3. Fix type declarations:
   - Replace `any` with specific types
   - Follow Next.js module declaration guidelines

4. General guidelines:
   - Use strict TypeScript types
   - Remove unused code
   - Follow React hooks best practices
   - Use proper module declarations 