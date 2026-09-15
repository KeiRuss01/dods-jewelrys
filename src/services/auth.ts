import { supabase, requireSupabaseConfiguration } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

type RegisterInput = {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
};

async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, mobile_number, role, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function registerCustomer({
  fullName,
  email,
  mobileNumber,
  password,
}: RegisterInput) {
  requireSupabaseConfiguration();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        mobile_number: mobileNumber,
      },
    },
  });

  if (error) {
    throw error;
  }

  // Preserve the existing registration flow even when email confirmation is
  // disabled and Supabase returns an authenticated session immediately.
  if (data.session) {
    await supabase.auth.signOut();
  }

  return data.session
    ? 'Your account was created successfully.'
    : 'Your account was created. Check your email to confirm it before signing in.';
}

export async function signInForRole(
  email: string,
  password: string,
  expectedRole: UserRole
) {
  requireSupabaseConfiguration();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  try {
    const profile = await getProfile(data.user.id);

    if (profile.role !== expectedRole) {
      await supabase.auth.signOut();
      throw new Error(
        expectedRole === 'admin'
          ? 'This account does not have administrator access.'
          : 'Please use the administrator sign-in for this account.'
      );
    }

    return profile;
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
