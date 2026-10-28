'use client';
import { signIn, signOut } from 'next-auth/react';

export async function signInWithGoogle() {
  // A login starts a new identity; never let Auth.js interpret it as account linking.
  await signOut({ redirect: false });
  await signIn('google', { callbackUrl: '/' }, { prompt: 'select_account' });
}
