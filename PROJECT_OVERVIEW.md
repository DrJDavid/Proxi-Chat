# ProxiChat Project Overview

## Stack Breakdown

### Frontend Framework
- Next.js 15.1.4 (App Router)
- React 18
- TypeScript 5

### UI Layer
- Tailwind CSS (Styling)
- shadcn/ui (Component Library)
- Radix UI (Primitive Components)
- Lucide React (Icons)
- next-themes (Dark Mode)
- class-variance-authority (Component Variants)

### State Management
- Zustand (Global State)
- React Hooks (Local State)
- next-themes (Theme State)

### Backend & Data
- Supabase (Backend as a Service)
  - Authentication
  - Database
  - Real-time (Not implemented yet)
- PostgreSQL (Database)

### Data Fetching
- Custom Polling Implementation
- Supabase Client

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID REFERENCES auth.users PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Channels Table
```sql
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_by UUID REFERENCES users(id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    channel_id UUID REFERENCES channels(id),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    has_attachment BOOLEAN DEFAULT false,
    parent_message_id UUID REFERENCES messages(id),
    CONSTRAINT channel_or_dm CHECK (
        (channel_id IS NOT NULL AND receiver_id IS NULL) OR 
        (channel_id IS NULL AND receiver_id IS NOT NULL)
    )
);
```

### Attachments Table
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id),
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL
);
```

### Reactions Table
```sql
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id),
    user_id UUID NOT NULL REFERENCES users(id),
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT valid_emoji CHECK (emoji != ''),
    CONSTRAINT unique_user_reaction UNIQUE (message_id, user_id, emoji)
);
```

## Dependencies

### Production Dependencies
```json
{
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-tooltip": "^1.0.7",
  "@supabase/auth-helpers-nextjs": "latest",
  "@supabase/supabase-js": "latest",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "lucide-react": "^0.303.0",
  "next": "15.1.4",
  "next-themes": "^0.2.1",
  "react": "^18",
  "react-dom": "^18",
  "sonner": "^1.3.1",
  "tailwind-merge": "^2.2.0",
  "tailwindcss-animate": "^1.0.7",
  "zustand": "^4.4.7"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "autoprefixer": "^10.0.1",
  "eslint": "^8",
  "eslint-config-next": "14.0.4",
  "postcss": "^8",
  "tailwindcss": "^3.3.0",
  "typescript": "^5"
}
```

## Component Architecture

### Layout Components
- `RootLayout`: Base layout with providers
- `ChatLayout`: Layout for chat interface
- `AuthLayout`: Layout for authentication pages

### Core Components
- `TopNav`: Main navigation with user menu
- `Sidebar`: Channel and DM navigation
- `ChannelPage`: Main chat interface
- `MessageList`: Message display
- `MessageInput`: Message composition

### UI Components (shadcn/ui)
- Avatar
- Button
- Dialog
- DropdownMenu
- Input
- Textarea
- Toast
- Tooltip

## State Management

### Zustand Stores
- `useMessagesStore`: Message state and operations
- More stores planned for:
  - User presence
  - Channel management
  - Typing indicators

### Authentication State
- Handled by Supabase Auth
- Protected routes via middleware
- User session management

## Current Features

### Implemented
- ✅ Authentication (Login/Register)
- ✅ Channel-based chat UI
- ✅ Message composition
- ✅ Basic polling
- ✅ Dark/Light theme
- ✅ Responsive design
- ✅ Avatar system with fallbacks

### In Progress
- 🔄 Real-time message updates
- 🔄 User presence system
- 🔄 Message persistence
- 🔄 Channel management

### Planned
- ⏳ File attachments
- ⏳ Emoji reactions
- ⏳ Message threading
- ⏳ User profiles
- ⏳ Direct messages
- ⏳ Typing indicators
- ⏳ Message search
- ⏳ User settings

## Performance Considerations
1. Message pagination
2. Optimistic updates
3. Debounced polling
4. Image optimization
5. Component code splitting

## Security Measures
1. Row Level Security in Supabase
2. Protected API routes
3. Input sanitization
4. Session management
5. Content validation

## Known Issues
1. Authentication error handling needs improvement
2. Message polling needs optimization
3. Missing proper error boundaries
4. Need proper loading states
5. Missing type definitions for some components

## Next Steps
1. Implement real message persistence
2. Add proper error handling
3. Implement user profiles
4. Add loading states
5. Set up proper error boundaries 

## Version Management

### Core Framework Versions
- Next.js: 15.1.4 (Latest with App Router improvements)
- React: 18.x (For concurrent features)
- TypeScript: 5.x (For enhanced type safety)

### Version Update Policy
- Next.js: Track latest stable version
- Dependencies: Pin versions for stability
- Security updates: Applied immediately
- Major version upgrades: Evaluated for breaking changes

### Version Constraints
- Next.js >=15.1.4 required for latest App Router features
- React 18 required for concurrent features
- TypeScript 5 required for latest type system features 