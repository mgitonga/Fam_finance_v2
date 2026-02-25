# API Route Patterns — FamFin

## Overview

This prompt defines the standard pattern for creating Next.js App Router API routes in FamFin. All API routes follow the same structure for consistency, type safety, and security.

## References

- Specification Document: `Documentation/Specification Document.md` §9 (API Specification)
- Implementation Plan: `Documentation/Implementation Plan.md` §1 (Technical Decisions)

---

## Route File Location

All API routes live under `src/app/api/`. Follow Next.js App Router conventions:

```
src/app/api/
├── accounts/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       └── route.ts          # GET (single), PUT (update), DELETE (deactivate)
├── categories/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── transactions/
│   ├── route.ts
│   ├── [id]/
│   │   └── route.ts
│   └── upload-receipt/
│       └── route.ts
├── budgets/
│   ├── route.ts
│   ├── overall/
│   │   └── route.ts
│   └── copy/
│       └── route.ts
...
```

---

## Standard Route Template

Every API route handler follows this pattern:

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ---- 1. Zod Schema for validation ----
const createResourceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['type_a', 'type_b']),
  // ... fields per spec
});

// ---- 2. GET handler (list) ----
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with household_id
    const { data: profile } = await supabase
      .from('users')
      .select('household_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 403 });
    }

    // Parse query params (optional)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query with RLS (household_id scoped via RLS policy)
    const { data, error, count } = await supabase
      .from('resource_table')
      .select('*', { count: 'exact' })
      .eq('household_id', profile.household_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/resource error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---- 3. POST handler (create) ----
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('household_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 403 });
    }

    // Role check (for admin-only operations)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = createResourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Insert
    const { data, error } = await supabase
      .from('resource_table')
      .insert({
        ...parsed.data,
        household_id: profile.household_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/resource error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Single Resource Route Template (`[id]/route.ts`)

```typescript
// src/app/api/[resource]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['type_a', 'type_b']).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.from('resource_table').select('*').eq('id', id).single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/resource/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('household_id, role')
      .eq('id', user.id)
      .single();

    // Role check if needed
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateResourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('resource_table')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('PUT /api/resource/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Soft delete (set is_active = false)
    const { error } = await supabase
      .from('resource_table')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deactivated successfully' });
  } catch (error) {
    console.error('DELETE /api/resource/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Auth Helper (Reusable)

To reduce boilerplate, extract common auth logic into a helper:

```typescript
// src/lib/supabase/auth-helpers.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export type AuthContext = {
  userId: string;
  householdId: string;
  role: 'admin' | 'contributor';
};

export async function getAuthContext(): Promise<
  { success: true; context: AuthContext } | { success: false; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.household_id) {
    return {
      success: false,
      response: NextResponse.json({ error: 'No household found' }, { status: 403 }),
    };
  }

  return {
    success: true,
    context: {
      userId: user.id,
      householdId: profile.household_id,
      role: profile.role as 'admin' | 'contributor',
    },
  };
}

export function requireAdmin(context: AuthContext): NextResponse | null {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  return null;
}
```

Usage in route handlers:

```typescript
export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth.success) return auth.response;

  const adminCheck = requireAdmin(auth.context);
  if (adminCheck) return adminCheck;

  // ... proceed with auth.context.householdId, auth.context.userId
}
```

---

## Conventions

### Response Format

All API responses follow this structure:

```typescript
// Success (single item)
{ data: { ... } }

// Success (list with pagination)
{ data: [...], pagination: { page, limit, total, totalPages } }

// Error
{ error: "Error message" }

// Validation error
{ error: "Validation failed", details: { field: ["error"] } }
```

### HTTP Status Codes

| Code | Usage                                       |
| ---- | ------------------------------------------- |
| 200  | Successful GET, PUT, DELETE                 |
| 201  | Successful POST (created)                   |
| 400  | Validation error                            |
| 401  | Not authenticated                           |
| 403  | Not authorized (wrong role or no household) |
| 404  | Resource not found                          |
| 500  | Internal server error                       |

### Permission Matrix

| Operation                           | Admin | Contributor |
| ----------------------------------- | ----- | ----------- |
| List resources                      | ✅    | ✅          |
| Create resource (admin-only tables) | ✅    | ❌          |
| Create transaction                  | ✅    | ✅          |
| Edit own transaction                | ✅    | ✅          |
| Edit any transaction                | ✅    | ❌          |
| Delete own transaction              | ✅    | ✅          |
| Delete any transaction              | ✅    | ❌          |

### Zod Schemas

- Place all Zod schemas in `src/lib/validations/` organized by resource
- Export both create and update schemas
- Reuse schemas between API validation and form validation (client-side)

```typescript
// src/lib/validations/account.ts
import { z } from 'zod';

export const accountTypeEnum = z.enum(['bank', 'mobile_money', 'cash', 'credit_card', 'other']);

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: accountTypeEnum,
  balance: z.number().default(0),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
```
