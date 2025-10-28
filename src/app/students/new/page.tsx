
'use client';
import StudentForm from '@/components/student-form';
import Breadcrumbs from '@/components/breadcrumbs';
import Loading from '@/app/loading';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function NewStudentPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== 'admin@panpacificu.edu.ph') {
        router.replace('/');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || user.email !== 'admin@panpacificu.edu.ph') {
    return <Loading />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'All Students', href: '/' },
          { label: 'Add New Student', href: '/students/new', active: true },
        ]}
      />
      <h1 className="text-3xl font-headline font-bold mb-8">Add New Student</h1>
      <StudentForm />
    </div>
  );
}
