
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, ListFilter, Search as SearchIconLucide } from 'lucide-react';
import Search from '@/components/search';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ExportButton from '@/components/export-button';
import { useState, useMemo, useEffect } from 'react';
import type { Student } from '@/lib/definitions';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Loading from '@/app/loading';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ImportDialog from './import-dialog';
import { collection, query, orderBy, where } from 'firebase/firestore';
import initialData from '@/data/students.json'; // Import the sample data

/**
 * A client component that provides the UI for sorting the student directory.
 * It interacts with the URL search parameters to control the sorting state.
 */
function SortMenu() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Updates the 'sortBy' URL parameter, or navigates for department sort.
  const handleSortChange = (sortByValue: string) => {
    const params = new URLSearchParams(searchParams);
    const currentQuery = params.get('query');
    
    if (sortByValue === 'department') {
      let destination = '/departments';
      if (currentQuery) {
        // If there's a search query, carry it over to the departments page.
        destination += `?query=${encodeURIComponent(currentQuery)}`;
      }
      router.push(destination);
      return;
    }
    
    if (sortByValue) {
      params.set('sortBy', sortByValue);
    } else {
      params.delete('sortBy');
    }
    // This navigation event causes the useEffect in the parent component to re-run.
    router.replace(`${pathname}?${params.toString()}`);
  };

  const currentSort = searchParams.get('sortBy');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ListFilter className="mr-2 h-4 w-4" />
           {currentSort ? `Sort by: ${currentSort.replace(/_/g, ' ')}` : 'Sort by'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sort Students</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleSortChange('name_asc')}>Name (A-Z)</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleSortChange('name_desc')}>Name (Z-A)</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleSortChange('department')}>Department</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleSortChange('')}>Clear Sort</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


/**
 * The main client component for rendering the student directory.
 * It handles data fetching, searching, sorting, and displaying the list of students.
 * This component is responsible for much of the client-side interactivity.
 */
export default function StudentDirectoryClient() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();

  const queryParam = searchParams.get('query') || '';
  const sortByParam = searchParams.get('sortBy') as 'name_asc' | 'name_desc' | 'department' | null;
  const isAdmin = user && user.email === 'admin@panpacificu.edu.ph';

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Admins can fetch all. Teachers can only fetch if there is a search query.
    if (!isAdmin && !queryParam) return null;

    let q = query(collection(firestore, 'students'));

    // For teachers, we can only do a very basic name search for now.
    // Firestore security rules would need to be very complex to allow sorting + broad searching.
    if (!isAdmin && queryParam) {
        // This is a simplified search for non-admins.
        return query(q, where('name', '>=', queryParam), where('name', '<=', queryParam + '\uf8ff'));
    }

    // Admin sorting logic
    if (sortByParam) {
      switch (sortByParam) {
        case 'name_asc':
          q = query(q, orderBy('name', 'asc'));
          break;
        case 'name_desc':
          q = query(q, orderBy('name', 'desc'));
          break;
        case 'department':
          q = query(q, where('department', '!=', null), orderBy('department', 'asc'), orderBy('name', 'asc'));
          break;
      }
    } else {
        q = query(q, orderBy('name', 'asc'));
    }
    return q;
  }, [firestore, sortByParam, isAdmin, queryParam]);
  
  const { data: firestoreStudents, isLoading, error } = useCollection<Student>(studentsQuery);
  
  const [displayData, setDisplayData] = useState<Student[]>([]);

  useEffect(() => {
    // If we get students from Firestore, display them. This is the primary case.
    if (firestoreStudents && firestoreStudents.length > 0) {
      setDisplayData(firestoreStudents);
      return;
    }
  
    // Handle loading state for an initial empty screen
    if (isLoading) {
      setDisplayData([]);
      return;
    }
  
    // After loading, if Firestore is empty or returned no results.
    if (isAdmin) {
      // Admins fallback to the full, sorted sample data if Firestore is empty.
      let sampleData = [...initialData] as Student[];
      if (sortByParam) {
        sampleData.sort((a, b) => {
          switch (sortByParam) {
            case 'name_asc':
              return a.name.localeCompare(b.name);
            case 'name_desc':
              return b.name.localeCompare(a.name);
            case 'department':
              const deptA = a.department || '';
              const deptB = b.department || '';
              const deptCompare = deptA.localeCompare(deptB);
              return deptCompare !== 0 ? deptCompare : a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });
      }
      setDisplayData(sampleData);
    } else { // This is a non-admin user (teacher)
      // If a search was performed but Firestore returned no results, search the sample data.
      if (queryParam) {
        const sampleData = (initialData as Student[]).filter(student =>
          student.name.toLowerCase().includes(queryParam.toLowerCase()) ||
          student.email.toLowerCase().includes(queryParam.toLowerCase()) ||
          student.department?.toLowerCase().includes(queryParam.toLowerCase())
        );
        setDisplayData(sampleData);
      } else {
        // If no search was performed, the teacher sees an empty list (prompting them to search).
        setDisplayData([]);
      }
    }
  }, [firestoreStudents, isLoading, sortByParam, queryParam, isAdmin]);

  const filteredStudents = useMemo(() => {
    // Teachers' data is already filtered by the query, so we don't need to filter again.
    if (!isAdmin) return displayData;

    // For admins, we filter the displayData (which could be from Firestore or sample JSON)
    if (!displayData) return [];
    if (!queryParam) return displayData;
    
    const lowercasedQuery = queryParam.toLowerCase();
    return displayData.filter(student =>
      student.name.toLowerCase().includes(lowercasedQuery) ||
      student.email.toLowerCase().includes(lowercasedQuery) ||
      student.department?.toLowerCase().includes(lowercasedQuery)
    );
  }, [displayData, queryParam, isAdmin]);
  

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  // The loading state should cover the initial check before any data (or lack of data) is determined.
  if (isLoading && !firestoreStudents) {
    return <Loading />;
  }
  
  if (error) {
     console.error('Firestore error in StudentDirectoryClient', { message: error.message });
     return (
        <div className="text-center py-16">
          <h2 className="text-2xl font-headline font-semibold text-destructive">Error Fetching Data</h2>
          <p className="text-muted-foreground mt-2">
            Could not load student directory. You may not have the required permissions.
          </p>
        </div>
      );
  }

  const showNoResultsPrompt = !isAdmin && !queryParam;
  const showEmptyState = filteredStudents.length === 0 && !showNoResultsPrompt;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-3xl font-headline font-bold">Student Directory</h1>
        <div className="flex flex-1 sm:flex-initial items-center justify-end gap-2 sm:gap-4 flex-wrap">
          <div className="w-full sm:w-auto flex-1 sm:flex-initial">
             <Search placeholder="Search students..." />
          </div>
           <SortMenu />
          {isAdmin && (
            <>
                <ImportDialog />
                <Button asChild>
                    <Link href="/students/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Student
                    </Link>
                </Button>
            </>
          )}
          {(user) && (
             <ExportButton />
          )}
        </div>
      </div>

      {showNoResultsPrompt ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <SearchIconLucide className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-headline font-semibold mt-4">Search for a Student</h2>
          <p className="text-muted-foreground mt-2">
            To protect data, please use the search bar to find specific students.
          </p>
        </div>
      ) : showEmptyState ? (
         <div className="text-center py-16">
          <h2 className="text-2xl font-headline font-semibold">No Students Found</h2>
          <p className="text-muted-foreground mt-2">
            No students match your search criteria. Try a different search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStudents.map((student) => {
            return (
            <Card
              key={student.id}
              className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <Link href={`/students/${student.id}`} className="block h-full">
                <CardContent className="flex flex-col items-center p-6 text-center h-full">
                  <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                    <AvatarFallback className="text-3xl font-bold">{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-headline font-semibold">{student.name}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                   {student.department && (
                    <Badge variant="outline">
                      {student.department}
                    </Badge>
                  )}
                  <div className="flex flex-wrap justify-center gap-2 mt-auto">
                    {student.currentCourses && student.currentCourses.length > 0 ? (
                      student.currentCourses.slice(0, 2).map((course, index) => (
                        <Badge key={index} variant="secondary">
                          {course.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No Courses</Badge>
                    )}
                    {student.currentCourses && student.currentCourses.length > 2 && (
                       <Badge variant="outline">+{student.currentCourses.length - 2} more</Badge>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
    