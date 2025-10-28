
'use client';
import Loading from '../loading';
import StudentAnalytics from '@/components/student-analytics';
import Breadcrumbs from '@/components/breadcrumbs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Student } from '@/lib/definitions';
import { collection, query } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import initialData from '@/data/students.json';


export default function AnalyticsPage() {
  const firestore = useFirestore();

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'students'));
  }, [firestore]);

  const { data: firestoreStudents, isLoading, error } = useCollection<Student>(studentsQuery);
  const [displayData, setDisplayData] = useState<Student[]>([]);

  useEffect(() => {
    if (firestoreStudents && firestoreStudents.length > 0) {
      setDisplayData(firestoreStudents);
    } else if (!isLoading && (!firestoreStudents || firestoreStudents.length === 0)) {
      // If firestore is empty or there was a permission error for a non-admin, use the sample data.
      setDisplayData(initialData as Student[]);
    }
  }, [firestoreStudents, isLoading]);

  if (isLoading && displayData.length === 0) {
    return <Loading />;
  }

  // NOTE: This allows teachers to see analytics based on the fallback data if they don't have full read permissions.
  // In a production app, you might fetch aggregated data from a secure endpoint.
  if (error && (!displayData || displayData.length === 0)) {
     return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs
                breadcrumbs={[
                { label: 'All Students', href: '/' },
                { label: 'Analytics', href: '/analytics', active: true },
                ]}
            />
            <h1 className="text-3xl font-headline font-bold mb-8">
                Student Analytics Dashboard
            </h1>
            <p className='text-muted-foreground'>Could not load live analytics data due to permissions. Displaying sample data instead.</p>
            <StudentAnalytics students={initialData as Student[]} />
        </div>
     )
  }


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <Breadcrumbs
        breadcrumbs={[
          { label: 'All Students', href: '/' },
          { label: 'Analytics', href: '/analytics', active: true },
        ]}
      />
      <h1 className="text-3xl font-headline font-bold mb-8">
        Student Analytics Dashboard
      </h1>
      <StudentAnalytics students={displayData || []} />
    </div>
  );
}
