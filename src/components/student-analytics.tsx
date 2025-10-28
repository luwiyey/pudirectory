
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type Student } from '@/lib/definitions';
import { Trophy } from 'lucide-react';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-background border rounded-md shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-muted-foreground">{`Students: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
}

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-background border rounded-md shadow-lg">
        <p className="font-bold">{`${payload[0].name}: ${payload[0].value} (${(payload[0].percent * 100).toFixed(0)}%)`}</p>
      </div>
    );
  }
  return null;
}


export default function StudentAnalytics({ students }: { students: Student[] }) {
  const analyticsData = useMemo(() => {
    if (!students || students.length === 0) {
      return { byDepartment: [], byCourse: [], totalStudents: 0, averageGwa: 0, scholarStatus: [] };
    }

    const departmentMap = new Map<string, number>();

    const departmentHierarchy = {
      'ECOAST': ['Engineering', 'Computer Science', 'Information Technology'],
      'RPSEA': ['Education Major in English', 'Education Major in Filipino', 'Education Major in Math']
    };
    
    const topLevelDepartments = ['Business Administration', 'Arts and Sciences', 'ECOAST', 'RPSEA'];
    topLevelDepartments.forEach(dept => departmentMap.set(dept, 0));

    const courseMap = new Map<string, number>();
    const studentGwas: number[] = [];
    let scholarCount = 0;
    let nonScholarCount = 0;


    students.forEach(student => {
      // Department count - grouped by hierarchy
      if (student.department) {
        let parentDept: string | undefined = undefined;
        for (const [parent, children] of Object.entries(departmentHierarchy)) {
          if (children.includes(student.department)) {
            parentDept = parent;
            break;
          }
        }
        const deptToIncrement = parentDept || student.department;
        if(departmentMap.has(deptToIncrement)) {
          departmentMap.set(deptToIncrement, (departmentMap.get(deptToIncrement) || 0) + 1);
        } else if (!parentDept) {
            // Handle cases where a department might not be in the hierarchy (for future-proofing)
            departmentMap.set(student.department, (departmentMap.get(student.department) || 0) + 1);
        }
      }

      // Course enrollment count
      student.currentCourses?.forEach(course => {
        courseMap.set(course.name, (courseMap.get(course.name) || 0) + 1);
      });
      
      // Calculate each student's GWA and scholar status
      if (student.grades && student.grades.length > 0) {
        const totalGrade = student.grades.reduce((acc, g) => acc + g.grade, 0);
        const gwa = totalGrade / student.grades.length;
        studentGwas.push(gwa);
        if (gwa >= 85) {
            scholarCount++;
        } else {
            nonScholarCount++;
        }
      } else {
        nonScholarCount++;
      }
    });

    const byDepartment: { name: string; value: number }[] = [];
    departmentMap.forEach((value, name) => {
        if (value > 0) { // Only add departments that have students
            byDepartment.push({ name, value })
        }
    });
    
    const byCourse: { name: string; value: number }[] = [];
    courseMap.forEach((value, name) => byCourse.push({ name, value }));

    const averageGwa = studentGwas.length > 0 
      ? studentGwas.reduce((acc, gwa) => acc + gwa, 0) / studentGwas.length
      : 0;

    const scholarStatus = [
        { name: 'Scholars', value: scholarCount },
        { name: 'Non-Scholars', value: nonScholarCount },
    ];

    return { 
        byDepartment: byDepartment.sort((a,b) => b.value - a.value), 
        byCourse: byCourse.sort((a,b) => b.value - a.value),
        totalStudents: students.length,
        averageGwa: Math.round(averageGwa),
        scholarStatus,
    };
  }, [students]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle>Overall Statistics</CardTitle>
                <CardDescription>A high-level overview of the student body.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6 text-center">
                <div className="p-6 bg-muted/50 rounded-lg">
                    <h3 className="text-4xl font-bold font-headline">{analyticsData.totalStudents}</h3>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
                 <div className="p-6 bg-muted/50 rounded-lg">
                    <h3 className="text-4xl font-bold font-headline">{analyticsData.averageGwa > 0 ? analyticsData.averageGwa : 'N/A'}<span className='text-xl text-muted-foreground'>%</span></h3>
                    <p className="text-sm text-muted-foreground">Average Student GWA</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Students per Department</CardTitle>
            <CardDescription>Distribution of students across different university departments.</CardDescription>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analyticsData.byDepartment} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="value" name="Students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Scholarship Status</CardTitle>
                <CardDescription>Percentage of scholars (GWA &ge; 85) vs. non-scholars.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie data={analyticsData.scholarStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false}>
                        <Cell key="cell-0" fill="hsl(var(--chart-1))" />
                        <Cell key="cell-1" fill="hsl(var(--chart-2))" />
                    </Pie>
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry, index) => {
                            const percent = analyticsData.scholarStatus.length > 0 ? (entry.payload?.value / analyticsData.totalStudents) * 100 : 0;
                            return `${value} (${percent.toFixed(0)}%)`;
                        }}
                    />
                </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>Course Popularity</CardTitle>
             <CardDescription>Enrollment numbers for all courses.</CardDescription>
            </CardHeader>
            <CardContent>
             <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  layout="vertical"
                  data={analyticsData.byCourse}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={150}
                    interval={0}
                  />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="value" name="Students" radius={[0, 4, 4, 0]}>
                     {analyticsData.byCourse.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
}
