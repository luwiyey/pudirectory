
'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import StudentForm from '@/components/student-form';
import Breadcrumbs from '@/components/breadcrumbs';
import { useEffect, useState } from 'react';
import type { Student } from '@/lib/definitions';
import Loading from '../loading';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import initialData from '@/data/students.json';


export default function EditStudentPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a memoized document reference
  const studentDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'students', id);
  }, [firestore, id]);

  // Use the useDoc hook to get real-time data
  const { data: firestoreStudent, isLoading: isStudentLoading, error } = useDoc<Student>(studentDocRef);

  useEffect(() => {
    if (!isUserLoading) {
        if (!user) { // Any user not logged in is redirected
          router.replace(`/students/${id}`);
        }
    }
  }, [user, isUserLoading, router, id]);

  useEffect(() => {
    setIsLoading(true);
    if (isUserLoading || isStudentLoading) {
      return;
    }
  
    if (firestoreStudent) {
      setStudent(firestoreStudent);
    } else {
      const studentFromSample = (initialData as Student[]).find(s => s.id === id);
      setStudent(studentFromSample || null);
    }
    setIsLoading(false);
  
  }, [firestoreStudent, isStudentLoading, isUserLoading, id]);


  if (isLoading || isUserLoading || !user) {
    return <Loading />;
  }

  // Handle case where student is not found after loading
  if (!isLoading && !student) {
    notFound();
  }

  // Handle firestore errors, e.g., permissions
  if (error) {
    console.error("Firestore error:", error);
    // You might want to show a specific error component here
    return <div>Error loading student data. You might not have permission to view this.</div>;
  }
  
  if (!student) {
      // This case is for when student is still loading or null/undefined
      return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'All Students', href: '/' },
          { label: student.name, href: `/students/${id}` },
          { label: 'Edit', href: `/students/${id}/edit`, active: true },
        ]}
      />
      <h1 className="text-3xl font-headline font-bold mb-8">Edit Student</h1>
      <StudentForm student={student} />
    </div>
  );
}
