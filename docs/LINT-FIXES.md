# Linting Issues Fix Plan

## 1. Toast Action Types Issue
**File**: `src/components/ui/use-toast.ts`
**Error**: `'actionTypes' is assigned a value but only used as a type`
**Fix Plan**: 
- Convert `actionTypes` to a type instead of a value
- Update type references throughout the file

## 2. Unused Variables in API Files
**File**: `src/lib/api/channels.ts`
**Error**: Unused `data` variable
**Fix Plan**:
- Remove unused `data` variable or use it in implementation
- Add comment explaining why it's kept if needed for future use

**File**: `src/lib/api/search.ts`
**Error**: Unused `Message` and `User` imports
**Fix Plan**:
- Remove unused imports
- Document if these types will be needed in future implementations

## 3. Empty Interface Issues
**File**: `src/types/declarations.d.ts`
**Error**: Multiple empty interfaces
**Fix Plan**:
1. Add meaningful properties to interfaces or
2. Extend base interfaces with additional properties or
3. Remove interfaces if truly not needed

### Priority Order:
1. Fix toast action types (affects functionality)
2. Clean up unused imports/variables (code cleanliness)
3. Address empty interfaces (type safety)

### Alternative Approach:
If these issues are determined to be false positives or necessary for the codebase:
1. Add `// eslint-disable-next-line` comments with explanations
2. Update ESLint configuration to ignore specific files
3. Document decisions in this file

### Next Steps:
1. Review each file individually
2. Make minimal necessary changes
3. Test functionality after each change
4. Update documentation as needed 