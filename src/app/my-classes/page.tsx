
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/breadcrumbs';
import Loading from '../loading';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Student } from '@/lib/definitions';
import { collection, query } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookCopy, Download, ListFilter, Upload, Users } from 'lucide-react';
import initialData from '@/data/students.json';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GradeImportDialog from '@/components/grade-import-dialog';
import Search from '@/components/search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ImportDialog from '@/components/import-dialog';


interface ClassData {
  name: string;
  enrolledStudents: Student[];
}

const getInitials = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('');
};

type SortKey = 'name_asc' | 'name_desc' | '';

function ClassRoster({ classData }: { classData: ClassData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('');

  const filteredAndSortedStudents = useMemo(() => {
    let students = [...classData.enrolledStudents];

    // Filter by search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      students = students.filter(
        (student) =>
          student.name.toLowerCase().includes(lowercasedTerm) ||
          student.email.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Sort the students
    if (sortKey) {
        students.sort((a, b) => {
            switch(sortKey) {
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });
    }

    return students;
  }, [classData.enrolledStudents, searchTerm, sortKey]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div className='flex-1'>
                <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                Student Roster
                </CardTitle>
                <CardDescription>
                Showing all students enrolled in {classData.name}.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Search placeholder="Search roster..." onSearch={setSearchTerm} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                        <ListFilter className="mr-2 h-4 w-4" />
                        {sortKey ? `Sort by: ${sortKey.replace(/_/g, ' ')}` : 'Sort by'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Sort Roster</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setSortKey('name_asc')}>Name (A-Z)</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setSortKey('name_desc')}>Name (Z-A)</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setSortKey('')}>Clear Sort</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAndSortedStudents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  <TableCell>
                     <Link href={`/students/${student.id}`} className="block w-full h-full">
                        <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>
                            {getInitials(student.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium hover:underline">
                            {student.name}
                        </span>
                        </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                     <Link href={`/students/${student.id}`} className="block w-full h-full">
                        {student.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                     <Link href={`/students/${student.id}`} className="block w-full h-full">
                        <Badge variant="outline">{student.department}</Badge>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No students found for this class or matching your search.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ClassListActions({ allClassData }: { allClassData: ClassData[] }) {
    const { toast } = useToast();

    const handleExportClassList = () => {
        if (allClassData.length === 0) {
            toast({ variant: 'destructive', title: 'Export Failed', description: 'No class data to export.' });
            return;
        }

        const exportData = allClassData.map(cls => ({
            className: cls.name,
            studentCount: cls.enrolledStudents.length,
            students: cls.enrolledStudents.map(s => ({ name: s.name, email: s.email })),
        }));

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'class-list.json');
        linkElement.click();

        toast({ title: 'Class List Exported', description: 'The list of all classes has been downloaded.' });
    };

    return (
        <div className="flex gap-2">
            <ImportDialog />
            <Button variant="outline" onClick={handleExportClassList}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        </div>
    )
}

function ClassItemActions({ classData }: { classData: ClassData }) {
    const { toast } = useToast();

    const handleExportGrades = () => {
        if (classData.enrolledStudents.length === 0) {
            toast({ variant: 'destructive', title: 'Export Failed', description: 'No students in this class to export grades for.' });
            return;
        }

        const exportData = classData.enrolledStudents.map(student => {
            const studentGrade = student.grades?.find(g => g.courseName === classData.name);
            return {
                studentEmail: student.email,
                studentName: student.name,
                grade: studentGrade ? studentGrade.grade : 'N/A'
            };
        });
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const fileName = `${classData.name.replace(/\s+/g, '-')}-grades.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', fileName);
        linkElement.click();

        toast({ title: 'Grades Exported', description: `Grades for ${classData.name} have been downloaded.` });
    };

    return (
        <div className="flex items-center gap-1">
            <GradeImportDialog courseName={classData.name} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportGrades}>
                <Download className="h-4 w-4" />
                <span className="sr-only">Export Grades</span>
            </Button>
        </div>
    );
}

export default function MyClassesPage() {
  const firestore = useFirestore();

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'students'));
  }, [firestore]);

  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  
  const [displayData, setDisplayData] = useState<Student[]>([]);

  useEffect(() => {
    if (students && students.length > 0) {
      setDisplayData(students);
    } else if (!isLoading && (!students || students.length === 0)) {
      setDisplayData(initialData as Student[]);
    }
  }, [students, isLoading]);

  const allClassData = useMemo(() => {
    if (!displayData || displayData.length === 0) return [];
    
    const classMap = new Map<string, Student[]>();

    displayData.forEach(student => {
      student.currentCourses?.forEach(course => {
        if (!classMap.has(course.name)) {
          classMap.set(course.name, []);
        }
        classMap.get(course.name)?.push(student);
      });
    });

    return Array.from(classMap, ([name, enrolledStudents]) => ({
      name,
      enrolledStudents,
    })).sort((a,b) => a.name.localeCompare(b.name));
  }, [displayData]);
  
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  useEffect(() => {
    if(allClassData.length > 0 && !selectedClass) {
        setSelectedClass(allClassData[0]);
    }
  }, [allClassData, selectedClass]);


  if (isLoading && displayData.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Classes', href: '/my-classes', active: true },
        ]}
      />
      <h1 className="text-3xl font-headline font-bold mb-8">All Classes</h1>
      {allClassData.length === 0 && !isLoading ? (
        <Card>
            <CardContent className="py-16 text-center">
                <h2 className="text-2xl font-headline font-semibold">No Classes Found</h2>
                <p className="text-muted-foreground mt-2">
                    There are no classes with enrolled students in the directory. You can add courses to students to populate this list.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
            <div className="md:col-span-1 lg:col-span-1">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-3">
                            <BookCopy className="h-5 w-5 text-primary" />
                            Class List
                        </CardTitle>
                    </div>
                    <CardDescription>Select a class to view its roster.</CardDescription>
                     <div className="pt-2">
                        <ClassListActions allClassData={allClassData} />
                     </div>
                </CardHeader>
                <CardContent className="p-2">
                    <div className="flex flex-col gap-1">
                    {allClassData.map((cls) => (
                        <div
                            key={cls.name}
                            className={`flex justify-between items-center w-full text-left p-2 rounded-md transition-colors ${
                                selectedClass?.name === cls.name
                                ? 'bg-primary/10'
                                : 'hover:bg-muted/50'
                            }`}
                        >
                            <button
                                onClick={() => setSelectedClass(cls)}
                                className="flex-1 text-left"
                            >
                                <p className={`font-medium ${selectedClass?.name === cls.name ? 'text-primary' : ''}`}>{cls.name}</p>
                                <p className="text-xs text-muted-foreground">{cls.enrolledStudents.length} student(s)</p>
                            </button>
                            <ClassItemActions classData={cls} />
                        </div>
                    ))}
                    </div>
                </CardContent>
            </Card>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
            {selectedClass ? (
                <ClassRoster classData={selectedClass} />
            ) : (
                <Loading />
            )}
            </div>
        </div>
      )}
    </div>
  );
}
