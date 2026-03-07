'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function login(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function register(formData: {
  name: string;
  email: string;
  password: string;
  householdName: string;
}) {
  const supabase = await createClient();

  // 1. Sign up the user with metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        name: formData.name,
        role: 'admin',
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Registration failed. Please try again.' };
  }

  // 2. Create the household (use admin client to bypass RLS — user has no household yet)
  const adminClient = createAdminClient();

  const { data: household, error: householdError } = await adminClient
    .from('households')
    .insert({ name: formData.householdName })
    .select()
    .single();

  if (householdError) {
    return { error: 'Failed to create household. Please try again.' };
  }

  // 3. Link user to household and set as admin
  const { error: updateError } = await adminClient
    .from('users')
    .update({
      household_id: household.id,
      role: 'admin',
      name: formData.name,
    })
    .eq('id', authData.user.id);

  if (updateError) {
    return { error: 'Failed to set up user profile. Please try again.' };
  }

  // 4. Seed default categories for the household
  const { error: seedError } = await adminClient.rpc('seed_default_categories', {
    p_household_id: household.id,
  });

  if (seedError) {
    console.error('Failed to seed categories:', seedError.message);
    // Non-fatal — don't block registration
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forgotPassword(formData: { email: string }) {
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "We've sent a password reset link to your email. Please check your inbox (and spam folder). The link expires in 1 hour.",
  };
}

export async function resetPassword(formData: { password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Sign out after password reset so user logs in with new credentials
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login?message=Password+updated+successfully.+Please+sign+in.');
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*, households(*)')
    .eq('id', user.id)
    .single();

  return profile;
}
