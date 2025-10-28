
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import type { Student, Department } from '@/lib/definitions';
import { StudentSchema, departments } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash, Loader2, CalendarIcon } from 'lucide-react';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { addDoc, collection, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type StudentFormProps = {
  student?: Student;
};

export default function StudentForm({ student }: StudentFormProps) {
  const isEditing = !!student;
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = user && user.email === 'admin@panpacificu.edu.ph';

  const form = useForm<Omit<Student, 'id'>>({
    resolver: zodResolver(StudentSchema.omit({ id: true })),
    defaultValues: {
      name: student?.name ?? '',
      email: student?.email ?? '',
      department: student?.department,
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString() : undefined,
      graduationDate: student?.graduationDate ? new Date(student.graduationDate).toISOString() : undefined,
      academicHistory: student?.academicHistory ?? '',
      currentCourses: student?.currentCourses ?? [],
      grades: student?.grades ?? [],
    },
  });

  const { fields: courseFields, append: appendCourse, remove: removeCourse } = useFieldArray({
    control: form.control,
    name: 'currentCourses',
  });

  const { fields: gradeFields, append: appendGrade, remove: removeGrade } = useFieldArray({
    control: form.control,
    name: 'grades',
  });
  
  useEffect(() => {
    // If auth is done loading and there's no logged-in user, redirect them.
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (data: Omit<Student, 'id'>) => {
    setIsSubmitting(true);
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You must be logged in to perform this action.' });
        setIsSubmitting(false);
        return;
    }
    
    const canPerformAction = isAdmin || (isEditing && !isAdmin);
    
    if (!canPerformAction) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to perform this action.' });
        setIsSubmitting(false);
        return;
    }

    if (isEditing && student?.id) {
      const studentRef = doc(firestore, 'students', student.id);
      // Teachers can edit everything except name, email, DOB, and department
      const dataToSubmit = isAdmin ? data : {
        graduationDate: data.graduationDate,
        academicHistory: data.academicHistory,
        currentCourses: data.currentCourses,
        grades: data.grades
      };

      setDoc(studentRef, dataToSubmit, { merge: true })
        .then(() => {
            toast({
              title: "Update Successful",
              description: `${student.name}'s record has been updated.`
            });
            router.push(`/students/${student.id}`);
            router.refresh(); // Re-fetches server components on the new page
        })
        .catch(error => {
            errorEmitter.emit(
              'permission-error',
              new FirestorePermissionError({
                path: studentRef.path,
                operation: 'update',
                requestResourceData: dataToSubmit,
              })
            );
            toast({
              variant: "destructive",
              title: "Update Failed",
              description: "Could not update student record. You may not have permission."
            });
        })
        .finally(() => {
          setIsSubmitting(false);
        });

    } else if (isAdmin) { // Only admin can create
      const studentsCollection = collection(firestore, 'students');
      addDoc(studentsCollection, data)
        .then(newStudentRef => {
            toast({
              title: "Student Created",
              description: `${data.name} has been added to the directory.`
            });
            router.push(`/students/${newStudentRef.id}`);
            router.refresh();
        })
        .catch(error => {
            errorEmitter.emit(
              'permission-error',
              new FirestorePermissionError({
                path: studentsCollection.path,
                operation: 'create',
                requestResourceData: data,
              })
            );
            toast({
              variant: "destructive",
              title: "Creation Failed",
              description: "Could not create student record. You may not have permission."
            });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  }

  if (isUserLoading || !user) {
      return null;
  }
  
  const isTeacher = !isAdmin;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the student's name, email address, and department.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} disabled={isTeacher} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane.doe@panpacificu.edu.ph" {...field} disabled={isTeacher} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isTeacher}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                             disabled={isTeacher}
                            >
                            {field.value ? (
                                format(new Date(field.value), "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString())}
                            disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="graduationDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Expected Graduation</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(new Date(field.value), "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString())}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
            <CardDescription>Provide details about the student's courses, grades, and academic history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="academicHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic History / Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="E.g., previous achievements, areas of improvement..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div>
              <FormLabel>Current Courses</FormLabel>
              <div className="space-y-4 mt-2">
                {courseFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4">
                    <FormField
                      control={form.control}
                      name={`currentCourses.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Course Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Advanced Mathematics" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`currentCourses.${index}.credits`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Credits</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="3" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeCourse(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendCourse({ name: '', credits: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Course
              </Button>
            </div>

            <Separator />

            <div>
              <FormLabel>Grades</FormLabel>
              <div className="space-y-4 mt-2">
                {gradeFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4">
                    <FormField
                      control={form.control}
                      name={`grades.${index}.courseName`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Course Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Advanced Mathematics" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`grades.${index}.grade`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Grade (0-100)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="92" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeGrade(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
               <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendGrade({ courseName: '', grade: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
           <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Update Student' : 'Create Student'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
