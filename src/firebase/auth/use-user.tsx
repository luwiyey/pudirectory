'use client';
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider'; 

/**
 * Interface for the return value of the useUser hook.
 */
export interface UseUserResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * React hook to get the current authenticated user from Firebase.
 *
 * @returns {UseUserResult} An object containing the user, loading state, and error.
 */
export const useUser = (): UseUserResult => {
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
