
'use client';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FilePenLine, Trash, ListChecks, BookOpen, History, Building, Calendar, GraduationCap, Award } from 'lucide-react';
import AttendanceAnalytics from '@/components/attendance-analytics';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Student } from '@/lib/definitions';
import Loading from './loading';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { format } from 'date-fns';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import initialData from '@/data/students.json';


function DeleteConfirmation({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleDelete = async () => {
    if (!firestore) return;
    const studentRef = doc(firestore, 'students', studentId);
    deleteDoc(studentRef)
      .then(() => {
        toast({
          title: 'Student Deleted',
          description: 'The student record has been permanently removed.',
        });
        router.push('/');
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          path: studentRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not delete student. You may not have permission."
        });
      });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete Student
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the student's record from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
};

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const studentDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'students', id);
  }, [firestore, id]);

  const { data: firestoreStudent, isLoading: isStudentLoading, error } = useDoc<Student>(studentDocRef);

  useEffect(() => {
    setIsLoading(true);
    if (isAuthLoading || isStudentLoading) {
      return;
    }
  
    if (firestoreStudent) {
      setStudent(firestoreStudent);
    } else {
      const studentFromSample = (initialData as Student[]).find(s => s.id === id);
      setStudent(studentFromSample || null);
    }
    setIsLoading(false);
  
  }, [firestoreStudent, isStudentLoading, isAuthLoading, id]);


  if (isLoading) {
    return <Loading />;
  }
  
  if (!student || error) {
    if (error) console.error("Firestore error:", error);
    notFound();
  }

  const breadcrumbs = [
    { label: 'All Students', href: '/' },
    { label: 'Departments', href: '/departments' },
  ];
  
  if (['Engineering', 'Computer Science', 'Information Technology'].includes(student.department || '')) {
     breadcrumbs.push({ label: 'ECOAST', href: '/departments#ECOAST' });
  } else if (['Education Major in English', 'Education Major in Filipino', 'Education Major in Math'].includes(student.department || '')) {
     breadcrumbs.push({ label: 'RPSEA', href: '/departments#RPSEA' });
  }
  
  if (student.department) {
      breadcrumbs.push({ label: student.department, href: `/departments#${student.department.replace(/\s+/g, '-')}` });
  }
  
  breadcrumbs.push({ label: student.name, href: `/students/${id}`, active: true });

  const isAdmin = user && user.email === 'admin@panpacificu.edu.ph';
  const canEdit = !!user; // Any logged-in user (teacher or admin) can edit

  const gwa = student.grades && student.grades.length > 0 
    ? student.grades.reduce((acc, g) => acc + g.grade, 0) / student.grades.length
    : 0;

  const isScholar = gwa >= 85;

  return (
    <div className="container mx-auto px-4 py-8">
       <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarFallback className="text-3xl font-bold">{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-headline font-bold">{student.name}</h1>
                <p className="text-muted-foreground">{student.email}</p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                    {student.department && (
                        <Badge variant="outline" className="gap-1 self-start">
                          <Building className="h-3 w-3" />
                          {student.department}
                        </Badge>
                      )}
                    {student.dateOfBirth && (
                        <div className='flex items-center gap-1'>
                           <Calendar className="h-4 w-4" />
                           <span>Born {format(new Date(student.dateOfBirth), "PPP")}</span>
                        </div>
                    )}
                    {student.graduationDate && (
                         <div className='flex items-center gap-1'>
                           <GraduationCap className="h-4 w-4" />
                           <span>Graduates {format(new Date(student.graduationDate), "PPP")}</span>
                        </div>
                    )}
                </div>
              </div>
              {canEdit && (
                <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center w-full sm:w-auto">
                    <Button variant="outline" asChild>
                    <Link href={`/students/${id}/edit`}>
                        <FilePenLine className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                    </Button>
                    {isAdmin && <DeleteConfirmation studentId={id} />}
                </div>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Academic History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {student.academicHistory || 'No academic history provided.'}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-8 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Current Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {student.currentCourses && student.currentCourses.length > 0 ? (
                  <ul className="space-y-2">
                    {student.currentCourses.map((course, index) => (
                      <li key={index} className="flex justify-between items-center text-sm">
                        <span>{course.name}</span>
                        <Badge variant="secondary">{course.credits} Credits</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No current courses listed.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Grades</CardTitle>
                 <CardDescription>GWA: {gwa > 0 ? gwa.toFixed(2) : 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent>
                {student.grades && student.grades.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead className="text-right">Grade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {student.grades.map((grade, index) => (
                            <TableRow key={index}>
                                <TableCell>{grade.courseName}</TableCell>
                                <TableCell className="text-right font-medium">{grade.grade}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">No grades recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Scholarship Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {gwa > 0 ? (
                isScholar ? (
                  <>
                    <p className="text-2xl font-headline font-bold text-green-600">University Scholar</p>
                    <p className="text-muted-foreground">Congratulations! This student meets the GWA requirement.</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-headline font-bold">Not a Scholar</p>
                    <p className="text-muted-foreground">GWA is below the 85 requirement.</p>
                  </>
                )
              ) : (
                <p className="text-muted-foreground">No grade data available to determine status.</p>
              )}
            </CardContent>
          </Card>
          <AttendanceAnalytics studentId={student.id} />
        </div>
      </div>
    </div>
  );
}
