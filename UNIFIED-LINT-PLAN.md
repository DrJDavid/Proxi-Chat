# Unified Linting Fix Plan

## Phase 1: Analyze and Document

1. Review each file with linting issues
2. Create backup of current code state
3. Document current functionality that must be preserved

## Phase 2: Fix Critical Issues (Toast Types)

### In `src/components/ui/use-toast.ts`:
```typescript
// Before:
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  // ...
} as const;

// After:
export type ActionTypes = 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST';
```

## Phase 3: Clean Up Unused Code

### Remove Unused Variables
1. In `src/lib/api/channels.ts`:
   - Remove unused `data` variable or add `_` prefix if needed for future
   
2. In `src/lib/api/search.ts`:
   ```typescript
   // Before:
   import { Message, User } from '~/types';
   
   // After:
   import type { Message, User } from '~/types';
   ```

### Fix Empty Interfaces
In `src/types/declarations.d.ts`:
1. Remove truly unused interfaces
2. Add properties to interfaces that need expansion:
   ```typescript
   // Before:
   interface CardProps {}
   
   // After:
   interface CardProps extends HTMLAttributes<HTMLDivElement> {
     variant?: 'default' | 'secondary';
     size?: 'sm' | 'md' | 'lg';
   }
   ```

## Phase 4: Testing and Validation

1. Run build after each major change
2. Test affected components
3. Document any breaking changes
4. Update tests if necessary

## Phase 5: Documentation Updates

1. Update PROGRESS.md with:
   - List of removed code
   - Rationale for kept interfaces
   - New type definitions
   
2. Add inline documentation for:
   - Type-only imports
   - Interface extensions
   - Preserved empty interfaces

## Execution Notes

- Make atomic commits for each change
- Run `npm run build` frequently
- Keep track of any new TypeScript errors
- Document any deviations from plan

## Fallback Options

If issues persist:
1. Use ESLint disable comments (last resort)
2. Update tsconfig.json settings
3. Consider upgrading TypeScript version 