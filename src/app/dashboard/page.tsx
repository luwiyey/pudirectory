
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, FolderKanban, PieChart, Users, Building, History, BookUser } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Loading from "../loading";
import type { Student } from "@/lib/definitions";
import { collection, query } from "firebase/firestore";
import initialData from '@/data/students.json';


function StatCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function ActionCard({ title, description, href, icon: Icon, buttonText }: { title: string, description: string, href: string, icon: React.ElementType, buttonText: string }) {
    return (
        <Card className="hover:border-primary transition-colors flex flex-col">
            <Link href={href} className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Icon className="text-primary" />
                        {title}
                    </CardTitle>
                    <CardDescription>
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                    <Button>{buttonText}</Button>
                </CardContent>
            </Link>
        </Card>
    )
}


export default function DashboardPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const [displayData, setDisplayData] = useState<Student[]>([]);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'students'));
      }, [firestore]);

    const { data: students, isLoading: isStudentsLoading } = useCollection<Student>(studentsQuery);
    
    useEffect(() => {
        if (students && students.length > 0) {
            setDisplayData(students);
        } else if (!isStudentsLoading && (!students || students.length === 0)) {
            setDisplayData(initialData as Student[]);
        }
    }, [students, isStudentsLoading]);


    const departmentCount = useMemo(() => {
        if (!displayData) return 0;
        const topLevelDepartments = new Set<string>();
        const departmentHierarchy = {
          ECOAST: ['Engineering', 'Computer Science', 'Information Technology'],
          RPSEA: ['Education Major in English', 'Education Major in Filipino', 'Education Major in Math'],
        };
      
        displayData.forEach(student => {
          if (student.department) {
            let parentDept: string | undefined = undefined;
            for (const [parent, children] of Object.entries(departmentHierarchy)) {
              if (children.includes(student.department)) {
                parentDept = parent;
                break;
              }
            }
            if (parentDept) {
              topLevelDepartments.add(parentDept);
            } else if (student.department === 'Business Administration' || student.department === 'Arts and Sciences') {
              // These are also considered top-level in the hierarchy
            }
          }
        });

        // Based on the provided hierarchy, we expect two main departments.
        // We will manually return 2 if students exist in those departments.
        const hasECOAST = displayData.some(s => departmentHierarchy.ECOAST.includes(s.department || ''));
        const hasRPSEA = displayData.some(s => departmentHierarchy.RPSEA.includes(s.department || ''));
        
        let count = 0;
        if(hasECOAST) count++;
        if(hasRPSEA) count++;
        
        return count;
    }, [displayData]);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
        if (!isUserLoading && user && user.email === 'admin@panpacificu.edu.ph') {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || (isStudentsLoading && displayData.length === 0) || !user) {
        return <Loading />
    }

    return (
        <div className="flex flex-1 flex-col bg-muted/40">
           <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
               <div className="grid gap-4">
                   <h1 className="text-3xl font-headline font-bold">Teacher Dashboard</h1>
                   <p className="text-muted-foreground">Welcome back, {user.email}. Here's your overview.</p>
               </div>
               <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <StatCard title="Total Students" value={displayData?.length ?? 0} icon={Users} description="Total students in the university directory" />
                    <StatCard title="Departments" value={departmentCount} icon={Building} description="Number of university departments" />
               </div>

                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                         <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Access key features of the student directory.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <ActionCard
                                    title="My Classes"
                                    description="View the classes you teach and manage your student rosters."
                                    href="/my-classes"
                                    icon={BookUser}
                                    buttonText="View My Classes"
                                />
                                <ActionCard 
                                    title="Student Directory"
                                    description="View the complete list of students in the university. All data is read-only."
                                    href="/"
                                    icon={BookOpen}
                                    buttonText="View Directory"
                                />
                                 <ActionCard 
                                    title="Departments"
                                    description="Browse students organized by college and department."
                                    href="/departments"
                                    icon={FolderKanban}
                                    buttonText="Browse Departments"
                                />
                                 <ActionCard 
                                    title="Analytics"
                                    description="Visualize student data and enrollment statistics."
                                    href="/analytics"
                                    icon={PieChart}
                                    buttonText="See Analytics"
                                />
                            </CardContent>
                        </Card>
                    </div>

                     <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                             <CardDescription>A log of recent system events and updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                   <History className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">System Update</p>
                                    <p className="text-muted-foreground">Student directory features are now available.</p>
                                </div>
                                <time className="text-xs text-muted-foreground">Now</time>
                            </div>
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                   <History className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Initial Setup</p>
                                    <p className="text-muted-foreground">Teacher dashboard initialized.</p>
                                </div>
                                <time className="text-xs text-muted-foreground">1h ago</time>
                            </div>
                        </CardContent>
                    </Card>
                </div>
           </main>
        </div>
    )
}
