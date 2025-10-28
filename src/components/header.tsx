'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FolderKanban, LayoutDashboard, LogIn, LogOut, PieChart } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';

export default function Header() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();


  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return '?';
    return email[0].toUpperCase();
  }

  const isAdmin = user && user.email === 'admin@panpacificu.edu.ph';
  const isTeacher = user && !isAdmin;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 font-headline text-lg font-bold">
          <Image src="https://images.squarespace-cdn.com/content/v1/62f5a8b114e7bb1cddb411ea/ab314db3-8392-4a63-9d79-06e436e740bd/Screen+Shot+2024-05-29+at+6.57.21+AM.png" alt="University Logo" width={36} height={36} className="rounded-full" />
          <span className="hidden sm:inline text-green-800">Panpacific University</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {isUserLoading ? (
            <>
              <Skeleton className="h-9 w-24 hidden sm:block" />
              <Skeleton className="h-9 w-10 sm:hidden" />
              <Skeleton className="h-9 w-28 hidden sm:block" />
              <Skeleton className="h-9 w-10 sm:hidden" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </>
          ) : (
            <>
              {isTeacher && (
                <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-0 sm:mr-2" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                  </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/analytics">
                  <PieChart className="mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/departments">
                  <FolderKanban className="mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Departments</span>
                </Link>
              </Button>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {isAdmin ? 'Admin' : 'Teacher'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
