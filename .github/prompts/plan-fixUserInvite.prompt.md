# Fix: User Invite — Use Admin Client

**Issue:** "Failed to send invite: User not allowed"
**Root Cause:** The invite API route uses `createClient()` (anon key) but calls `supabase.auth.admin.inviteUserByEmail()` which requires the service role key.

---

## Fix

Update `src/app/api/auth/invite/route.ts`:

1. Import `createAdminClient` from `@/lib/supabase/admin`
2. Use admin client for the `auth.admin.inviteUserByEmail()` call
3. Keep the regular client for RLS-scoped queries (checking existing users)

### Changes

**Add import (line 3):**

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
```

**Replace line 25 (`const supabase = await createClient();`) with:**

```typescript
const supabase = await createClient();
const adminSupabase = createAdminClient();
```

**Replace line 43 (`await supabase.auth.admin.inviteUserByEmail`) with:**

```typescript
const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(parsed.data.email, {
  data: {
    name: parsed.data.name,
    role: 'contributor',
    household_id: auth.context.householdId,
  },
});
```

### After fix, commit and push:

```bash
git add -A && git commit -m "fix: use admin client for user invite (service role required)" && git push
```
