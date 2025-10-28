
'use client';
import StudentDirectoryClient from '@/components/student-directory-client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './loading';

export default function StudentDirectory() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // This effect handles redirection for unauthenticated users.
  useEffect(() => {
    // Wait until the auth check is complete.
    if (!isUserLoading && !user) {
      // If no user is logged in, redirect them to the login page.
      router.replace('/login');
    }
    // REMOVED: The redirect for teachers to the dashboard.
    // Teachers will now use this page.
  }, [user, isUserLoading, router]);

  // While we're checking the user's auth state, show a loading spinner.
  if (isUserLoading || !user) {
    return <Loading />;
  }

  // If we reach this point, the user is authenticated.
  // Render the student directory component. It will handle role-specific UI.
  return <StudentDirectoryClient />;
}
