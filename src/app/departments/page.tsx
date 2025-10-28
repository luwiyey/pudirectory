
'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building } from 'lucide-react';
import Breadcrumbs from '@/components/breadcrumbs';
import { useState, useMemo, useEffect } from 'react';
import Loading from '../loading';
import Search from '@/components/search';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Student } from '@/lib/definitions';
import { collection, query } from 'firebase/firestore';
import initialData from '@/data/students.json';


type DepartmentGroup = {
  name: string;
  children: DepartmentGroup[];
  students: Student[];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('');
};

function buildHierarchy(students: Student[]): DepartmentGroup[] {
  const hierarchy: DepartmentGroup[] = [
    {
      name: 'ECOAST (College of Engineering, Computer Studies and Architecture)',
      students: [],
      children: [
        {
          name: 'Engineering',
          students: students.filter((s) => s.department === 'Engineering'),
          children: [],
        },
        {
          name: 'Computer Science',
          students: students.filter(
            (s) => s.department === 'Computer Science'
          ),
          children: [],
        },
        {
          name: 'Information Technology',
          students: students.filter(
            (s) => s.department === 'Information Technology'
          ),
          children: [],
        },
      ],
    },
    {
      name: 'RPSEA (College of Teacher Education)',
      students: [],
      children: [
        {
          name: 'Education Major in English',
          students: students.filter(
            (s) => s.department === 'Education Major in English'
          ),
          children: [],
        },
        {
          name: 'Education Major in Filipino',
          students: students.filter(
            (s) => s.department === 'Education Major in Filipino'
          ),
          children: [],
        },
        {
          name: 'Education Major in Math',
          students: students.filter(
            (s) => s.department === 'Education Major in Math'
          ),
          children: [],
        },
      ],
    },
  ];

  // Recursive function to calculate student counts for all levels.
  const setStudentCounts = (dept: DepartmentGroup): number => {
    let childCount = 0;
    if (dept.children && dept.children.length > 0) {
      childCount = dept.children.reduce((acc, child) => acc + setStudentCounts(child), 0);
    }
    const totalStudents = dept.students.length + childCount;
    (dept as any).totalStudents = totalStudents;
    return totalStudents;
  };
  
  // Set counts for all departments and then filter out empty ones.
  hierarchy.forEach(setStudentCounts);

  return hierarchy.filter(dept => (dept as any).totalStudents > 0);
}


export default function DepartmentsPage() {
  const [queryParam, setQueryParam] = useState('');
  const firestore = useFirestore();
  
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'students'));
  }, [firestore]);
  
  const { data: allStudents, isLoading, error } = useCollection<Student>(studentsQuery);

  const [displayData, setDisplayData] = useState<Student[]>([]);

  useEffect(() => {
    if (allStudents && allStudents.length > 0) {
      setDisplayData(allStudents);
    } else if (!isLoading && (!allStudents || allStudents.length === 0)) {
       // If firestore is empty or there was a permission error for a non-admin, use the sample data.
      setDisplayData(initialData as Student[]);
    }
  }, [allStudents, isLoading]);

  const filteredStudents = useMemo(() => {
    if (!displayData) return [];
    if (!queryParam) return displayData;
    return displayData.filter(student => 
      student.name.toLowerCase().includes(queryParam.toLowerCase()) ||
      student.email.toLowerCase().includes(queryParam.toLowerCase()) ||
      student.department?.toLowerCase().includes(queryParam.toLowerCase())
    )
  }, [displayData, queryParam]);

  if (isLoading && displayData.length === 0) {
    return <Loading />;
  }

  // NOTE: This allows teachers to see department data based on the fallback data if they don't have full read permissions.
  if (error && (!displayData || displayData.length === 0)) {
     return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs
                breadcrumbs={[
                { label: 'All Students', href: '/' },
                { label: 'Departments', href: '/departments', active: true },
                ]}
            />
            <h1 className="text-3xl font-headline font-bold mb-8">
                Student Departments
            </h1>
            <p className='text-muted-foreground mb-4'>Could not load live department data due to permissions. Displaying sample data instead.</p>
            <Card>
                <Accordion type="multiple" className="w-full">
                    {buildHierarchy(initialData as Student[]).map(renderDepartment)}
                </Accordion>
            </Card>
        </div>
     )
  }

  const departmentHierarchy = buildHierarchy(filteredStudents);

  const renderStudentList = (students: Student[]) => {
    if (students.length === 0) {
      return (
        <p className="text-sm text-muted-foreground px-4 py-2">
          No students found in this department.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {students.map((student) => (
          <Link key={student.id} href={`/students/${student.id}`} className="block">
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12 border">
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
          </Link>
        ))}
      </div>
    );
  };

  const renderDepartment = (dept: DepartmentGroup) => (
    <AccordionItem key={dept.name} value={dept.name}>
      <AccordionTrigger className="text-xl font-headline px-4 hover:no-underline">
        <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {dept.name} ({(dept as any).totalStudents})
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {dept.students.length > 0 && renderStudentList(dept.students)}
        {dept.children && dept.children.length > 0 && (
          <div className="pl-4 border-l ml-4 mt-4">
             <Accordion type="multiple" className="w-full">
                {dept.children.map(renderDepartment)}
             </Accordion>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <Breadcrumbs
        breadcrumbs={[
          { label: 'All Students', href: '/' },
          { label: 'Departments', href: '/departments', active: true },
        ]}
      />
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-3xl font-headline font-bold">
          Student Departments
        </h1>
        <div className="w-full sm:w-auto">
          <Search placeholder="Search all departments..." onSearch={setQueryParam} />
        </div>
      </div>
      <Card>
        {departmentHierarchy.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {departmentHierarchy.map(renderDepartment)}
          </Accordion>
        ) : (
           <CardContent className="py-16 text-center">
            <h2 className="text-2xl font-headline font-semibold">No Departments Found</h2>
            <p className="text-muted-foreground mt-2">
              No students match your search criteria. Try a different search.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
