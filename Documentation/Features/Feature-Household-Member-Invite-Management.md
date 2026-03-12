# Feature: Household Member & Invite Management

## Overview

Enhance the existing user invite system to provide full invite lifecycle management. Currently, admins can invite users via email but have **no visibility** into pending invites, no ability to resend or cancel invites, no way to see when members joined, and no ability to remove members.

---

## Current State Analysis

### What exists today:

- **Invite flow:** Admin sends invite via `POST /api/auth/invite` → Supabase `auth.admin.inviteUserByEmail()` → email sent to invitee
- **User list:** `GET /api/users` returns `users` table rows (only people who have **completed** registration)
- **Role management:** Admin can change a member's role between `admin` and `contributor`
- **Registration:** Invited user clicks email link → completes registration → `handle_new_user()` trigger creates `users` row → user links to household

### What's missing:

1. **No `household_invites` table** — invites are fire-and-forget via Supabase Auth; no tracking
2. **No pending invite visibility** — admin cannot see who has been invited but hasn't joined yet
3. **No resend capability** — if the invite email was lost, admin must re-invite from scratch
4. **No join timestamp visibility** — `created_at` exists in `users` but is not displayed in the UI
5. **No cancel invite** — once sent, an invite cannot be revoked
6. **No remove member** — admin cannot remove a member from the household

---

## Requirements

### R1: Household Invites Table (Database)

Create a new `household_invites` table to track invite lifecycle:

```sql
CREATE TABLE household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('admin', 'contributor')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Only one pending invite per email per household (allows multiple cancelled/expired rows)
CREATE UNIQUE INDEX idx_invites_one_pending
  ON household_invites (household_id, email)
  WHERE status = 'pending';

CREATE INDEX idx_invites_household ON household_invites(household_id);
CREATE INDEX idx_invites_email ON household_invites(email);
CREATE INDEX idx_invites_status ON household_invites(household_id, status);
```

**RLS Policies:**

- Members can view invites within their household (`SELECT`)
- Admins can create invites (`INSERT`)
- Admins can update invite status — cancel (`UPDATE`)
- Admins can delete invites (`DELETE`)

### R2: Update Invite API (`POST /api/auth/invite`)

Modify the existing invite endpoint to:

1. Check for existing **pending** invite (same email + household) before sending
2. Create a row in `household_invites` with status `pending`
3. Send the Supabase invite email (existing logic)
4. If invite send fails, rollback the `household_invites` row
5. Return the created invite record in the response

### R3: List Invites API (`GET /api/invites`)

New endpoint — returns all invites for the current household:

```typescript
// Response shape
{
  data: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    status: 'pending' | 'accepted' | 'cancelled' | 'expired';
    invited_by: string; // user id
    invited_by_name: string; // JOIN with users table
    invited_at: string;
    expires_at: string;
  }>;
}
```

- Admin-only endpoint
- Order by `invited_at DESC`
- Optionally filter by `status` query parameter

### R4: Resend Invite API (`POST /api/invites/[id]/resend`)

New endpoint — resends an invite email:

1. Verify invite exists, belongs to household, and status is `pending`
2. Check if invite has not expired; if expired, update status to `expired` and return error
3. Call `auth.admin.inviteUserByEmail()` again with the same data
4. Update `expires_at` to a new 7-day window
5. Return success

### R5: Cancel Invite API (`PUT /api/invites/[id]/cancel`)

New endpoint — cancels a pending invite:

1. Verify invite exists, belongs to household, and status is `pending`
2. Update status to `cancelled`, set `cancelled_at = NOW()`
3. Return updated invite

### R6: Remove Household Member API (`DELETE /api/users/[id]`)

New endpoint — removes a member from the household:

1. Admin-only
2. Cannot remove yourself
3. Cannot remove the last admin (ensure at least one admin remains)
4. Set the user's `household_id` to `NULL` (soft removal — they lose access via RLS)
5. Force sign-out the removed user via `auth.admin.signOut(userId)` so their session is invalidated immediately
6. Return success

**Note:** The removed user's historical transactions, goal contributions, etc. remain visible in the household (referenced by `user_id`). Their name continues to display on past records. A removed user **can** be re-invited to the same household.

### R7: Invite Accept Page (New Route)

Create a **separate invite-accept page** at `/accept-invite` for invited users:

**Route:** `src/app/(auth)/accept-invite/page.tsx`

When an invited user clicks the Supabase email link:

1. They land on the Supabase auth callback which confirms their account
2. They are redirected to `/accept-invite` (configure via Supabase `redirectTo`)
3. The accept-invite page detects the user's `raw_user_meta_data` (which contains `household_id`, `name`, `role` set during `inviteUserByEmail`)
4. The page shows a simple form: **Name** (pre-filled), **Password** (set new password)
5. On submit:
   a. Link user to the household from metadata (`household_id`)
   b. Set user role from metadata
   c. Check `household_invites` for matching `email` + `household_id` with `status = 'pending'`
   d. If invite was **cancelled** → block joining, show error: _"This invitation has been cancelled. Please contact the household admin."_
   e. If invite is **pending** → mark as `accepted`, set `accepted_at = NOW()`
   f. Redirect to `/dashboard`

**Key difference from register page:** No "Household Name" field, no household creation, no category seeding. The user joins an existing household.

### R7b: Update handle_new_user() Trigger

Update the database trigger to handle invited users:

1. When a new user is created via `inviteUserByEmail`, their `raw_user_meta_data` contains `household_id`
2. The trigger should set `household_id` from metadata if present
3. The trigger should set `role` from metadata if present (defaults to `contributor`)

### R8: Update Users Settings UI

Redesign the **Settings → Users** page to show two sections:

#### Section A: Household Members (Active Users)

| Column  | Source                                                               |
| ------- | -------------------------------------------------------------------- |
| Name    | `users.name`                                                         |
| Email   | `users.email`                                                        |
| Role    | `users.role` (editable dropdown for non-self users)                  |
| Joined  | `users.created_at` formatted as relative date (e.g., "3 months ago") |
| Actions | Role change dropdown, **Remove** button (with confirmation dialog)   |

- Show "(you)" badge next to the current user
- Disable Remove for self
- Show confirmation dialog before removing: _"Remove {name} from this household? They will lose access to all household data."_

#### Section B: Pending Invites (Admin-only)

| Column  | Source                                                         |
| ------- | -------------------------------------------------------------- |
| Name    | `household_invites.name`                                       |
| Email   | `household_invites.email`                                      |
| Status  | Badge: `pending` (yellow), `expired` (gray), `cancelled` (red) |
| Sent    | `household_invites.invited_at` relative date                   |
| Expires | `household_invites.expires_at` relative date or "Expired"      |
| Actions | **Resend** button, **Cancel** button                           |

- Show expired invites with muted styling
- Resend button disabled if status is `cancelled`
- Cancel button triggers confirmation: _"Cancel invite to {email}?"_
- After cancel/resend, invalidate queries to refresh the list

#### Invite Form (Existing — Minor Updates, Admin-only)

- After successful invite, refresh both the members list and the pending invites list
- Show inline error if there's already a pending invite for that email

#### Contributor View

- Contributors see the member list (Section A) in **read-only** mode
- No invite form, no action buttons (no role change, no remove)
- No pending invites section

### R9: Invite Expiry Handling

- Invites expire after **7 days** by default
- The UI should display expired invites as "Expired" with the option to resend (which creates a fresh invite)
- When listing invites, the API should auto-update any invites where `expires_at < NOW()` from `pending` to `expired`
- No background job needed — expire lazily on read

---

## API Summary

| Method   | Endpoint                   | Auth  | Description                                                 |
| -------- | -------------------------- | ----- | ----------------------------------------------------------- |
| `POST`   | `/api/auth/invite`         | Admin | Send invite (update to also create `household_invites` row) |
| `GET`    | `/api/invites`             | Admin | List all household invites                                  |
| `POST`   | `/api/invites/[id]/resend` | Admin | Resend pending invite email                                 |
| `PUT`    | `/api/invites/[id]/cancel` | Admin | Cancel pending invite                                       |
| `DELETE` | `/api/users/[id]`          | Admin | Remove member from household                                |

---

## Database Migration

File: `supabase/migrations/00009_household_invites.sql`

Contents:

1. Create `household_invites` table (as defined in R1)
2. Enable RLS on `household_invites`
3. Create RLS policies for the table
4. Add RLS policy for admin DELETE on `users` table (needed for R6 soft-remove approach — or the UPDATE policy to null out `household_id`)

---

## Validation Schemas

Add to `src/lib/validations/user.ts`:

```typescript
// Already exists
export const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

// New
export const cancelInviteSchema = z.object({
  id: z.string().uuid(),
});

export const resendInviteSchema = z.object({
  id: z.string().uuid(),
});
```

---

## File Changes Summary

| File                                              | Action     | Description                                                                         |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `supabase/migrations/00009_household_invites.sql` | **Create** | New table, indexes, RLS policies                                                    |
| `src/app/api/auth/invite/route.ts`                | **Modify** | Also insert into `household_invites` on invite                                      |
| `src/app/api/invites/route.ts`                    | **Create** | GET — list invites                                                                  |
| `src/app/api/invites/[id]/resend/route.ts`        | **Create** | POST — resend invite                                                                |
| `src/app/api/invites/[id]/cancel/route.ts`        | **Create** | PUT — cancel invite                                                                 |
| `src/app/api/users/[id]/route.ts`                 | **Create** | DELETE — remove household member                                                    |
| `src/lib/validations/user.ts`                     | **Modify** | Add new schemas                                                                     |
| `src/app/(dashboard)/settings/users/page.tsx`     | **Modify** | Add pending invites section, joined date, remove button, contributor read-only view |
| `src/app/(auth)/accept-invite/page.tsx`           | **Create** | Invite accept page (name + password, no household creation)                         |
| `src/lib/supabase/auth-actions.ts`                | **Modify** | Add `acceptInvite()` server action                                                  |
| `src/types/index.ts` (or new types file)          | **Modify** | Add `HouseholdInvite` type                                                          |

---

## Edge Cases & Business Rules

1. **Duplicate invite:** If a pending invite exists for the same email in the same household, reject with a clear error message
2. **Already a member:** If the email already belongs to a `users` row in the household, reject (existing logic)
3. **Last admin protection:** Cannot remove the last admin from a household
4. **Self-removal prevention:** Admin cannot remove themselves
5. **Expired invite resend:** Resending an expired invite should reset `status` to `pending`, update `expires_at`, and re-send the email
6. **Cancelled invite re-invite:** If an invite was cancelled, admin can send a brand new invite to the same email
7. **Multiple households:** A user could theoretically be invited to multiple households — each invite is household-scoped
8. **Cancelled invite enforcement:** If an invite is cancelled but the user clicks the old email link, the accept-invite flow checks `household_invites` status and **blocks** joining with a clear error message
9. **Removed user re-invite:** A user whose `household_id` was nulled out can be re-invited. The invite flow should handle this gracefully (they already have an auth account)
10. **Supabase re-invite existing auth user:** `inviteUserByEmail()` may fail if the user already has an auth account. The API should catch this and use `auth.admin.generateLink({ type: 'magiclink' })` as fallback, or handle the "User already registered" error gracefully
11. **Invite expiry:** 7 days, non-configurable for now
12. **Removed user session:** Admin removal force-signs-out the user via `auth.admin.signOut()`. On next visit, user sees the login page
13. **Historical data retention:** Removed user's transactions, contributions, etc. remain in the household. Their name continues to appear on historical records
14. **No invite rate limiting:** No limit on pending invites for v1 (can add later if needed)

---

## Testing

### Unit/Integration Tests

- Invite creation stores row in `household_invites`
- Resend updates `expires_at` and re-sends email
- Cancel sets status to `cancelled`
- Expired invites auto-update on list
- Remove member nullifies `household_id`
- Cannot remove last admin
- Cannot remove self

### E2E Tests (Playwright)

- Admin invites user → pending invite appears in list
- Admin cancels invite → invite shows as cancelled
- Admin resends invite → success message
- Admin removes member → member disappears from list → confirmation dialog works
- Non-admin cannot see invite/remove actions

---

## Implementation Order

1. **Migration** — Create `household_invites` table + RLS + update `handle_new_user()` trigger
2. **Types & Validation** — Add TypeScript types and Zod schemas
3. **API: Update invite** — Modify `POST /api/auth/invite` to track in new table
4. **API: List invites** — `GET /api/invites`
5. **API: Cancel invite** — `PUT /api/invites/[id]/cancel`
6. **API: Resend invite** — `POST /api/invites/[id]/resend`
7. **API: Remove member** — `DELETE /api/users/[id]` (with force sign-out)
8. **Accept-invite page** — New auth page for invited users (no household creation)
9. **UI: Update settings/users page** — Two sections, actions, confirmation dialogs, contributor read-only view
10. **Testing** — E2E and integration tests
