# Supabase Authentication Setup Guide

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

### How to get these values:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

⚠️ **IMPORTANT**: Never commit `.env.local` to version control. Add it to `.gitignore`.

---

## Authentication System Overview

### Files Created:

```
lib/
  ├── auth.ts                 # Browser-side Supabase client
  ├── supabase-server.ts      # Server-side Supabase client with cookies
  └── supabaseClient.ts       # (existing) Legacy client
  
app/
  ├── login/
  │   └── page.tsx            # Login page with form
  ├── actions/
  │   └── auth.ts             # Server action for logout
  └── dashboard/
      └── layout.tsx          # Protected dashboard with logout button
      
middleware.ts                 # Route protection middleware
```

---

## How the System Works

### 1. **Login Flow**

1. User enters email and password on `/login`
2. `supabase.auth.signInWithPassword()` authenticates the user
3. Session is stored in secure cookies (handled by `@supabase/ssr`)
4. User is redirected to `/dashboard`

### 2. **Session Persistence**

- Sessions are stored in **secure HTTP-only cookies**
- Cookies persist across browser refreshes
- `middleware.ts` validates sessions on every request
- No sensitive data stored in localStorage

### 3. **Protected Routes**

- `middleware.ts` intercepts all requests
- Unauthenticated users trying to access `/dashboard/*` are redirected to `/login`
- Authenticated users trying to access `/login` are redirected to `/dashboard`

### 4. **Logout**

1. User clicks logout button in dashboard sidebar
2. `logout()` server action is called
3. `supabase.auth.signOut()` clears the session
4. Cookies are cleared
5. User is redirected to `/login`

---

## Security Features

✅ **Passwords** - Never stored manually (handled by Supabase Auth)
✅ **Session Tokens** - Stored in secure, HTTP-only cookies
✅ **CSRF Protection** - Built into Next.js App Router
✅ **Secret Keys** - Never exposed on frontend
✅ **Middleware Validation** - All routes checked server-side
✅ **RTL Support** - Arabic/RTL interfaces supported

---

## Usage Guide

### Accessing Current User (Client-side)

```typescript
"use client";

import { createClient } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function MyComponent() {
  const supabase = createClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  return <div>{user?.email}</div>;
}
```

### Accessing Current User (Server-side)

```typescript
import { createClient } from "@/lib/supabase-server";

export default async function MyComponent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <div>{user?.email}</div>;
}
```

### Checking Session in Route Handlers

```typescript
import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
```

---

## Creating Admin Users

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Create user**

These credentials can now be used to log in to the dashboard.

---

## Testing the Authentication

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Try accessing `/dashboard` → should redirect to login
4. Log in with valid credentials → redirects to dashboard
5. Click logout → clears session and redirects to login

---

## Troubleshooting

### "Cookies are not being set"

- Ensure `middleware.ts` is in the root directory
- Restart dev server after creating middleware

### "User stays logged in after logout"

- Check browser cookies (Dev Tools → Storage → Cookies)
- Ensure `logout()` server action is being called

### "Login always fails"

- Verify Supabase credentials in `.env.local`
- Check that user exists in Supabase Auth dashboard
- Look for errors in browser console and terminal

---

## Next Steps

- Add user profiles table to Supabase
- Implement email verification
- Add password reset functionality
- Set up role-based access control (RBAC)
- Add social authentication (Google, GitHub, etc.)

---

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [@supabase/ssr Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
