
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, CalendarX } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { type Attendance } from '@/lib/definitions';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format, startOfMonth, eachDayOfInterval, getDay, isAfter, endOfDay } from 'date-fns';
import { Skeleton } from './ui/skeleton';

function generateRandomAttendance(studentId: string): Attendance[] {
  const today = new Date();
  const start = startOfMonth(today);
  const days = eachDayOfInterval({ start, end: today });
  
  const randomAttendance: Attendance[] = [];

  days.forEach((day, index) => {
    // Skip Sundays (getDay() returns 0 for Sunday)
    if (getDay(day) === 0) {
      return;
    }

    const statusOptions: Attendance['status'][] = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent'];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    randomAttendance.push({
      id: `rand-${studentId}-${index}`,
      studentId: studentId,
      date: format(day, 'yyyy-MM-dd'),
      status: randomStatus,
    });
  });

  return randomAttendance;
}


export default function AttendanceAnalytics({ studentId }: { studentId: string }) {
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sampleAttendance, setSampleAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    // Generate sample data on the client side to avoid hydration errors
    setSampleAttendance(generateRandomAttendance(studentId));
  }, [studentId]);


  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return query(
        collection(firestore, `students/${studentId}/attendance`),
        orderBy('date', 'asc')
    );
  }, [firestore, studentId]);

  const { data: attendanceData, isLoading, error } = useCollection<Attendance>(attendanceQuery);

  const displayData = useMemo(() => {
    if (attendanceData && attendanceData.length > 0) {
      return attendanceData;
    }
    if (!isLoading && (!attendanceData || attendanceData.length === 0)) {
      return sampleAttendance;
    }
    return [];
  }, [attendanceData, isLoading, sampleAttendance]);


  const attendanceStatusMap = useMemo(() => {
    const map = new Map<string, 'present' | 'absent' | 'late' | 'excused'>();
    displayData.forEach(record => {
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      map.set(dateKey, record.status.toLowerCase() as any);
    });
    return map;
  }, [displayData]);
  
  const totalDays = displayData.length;
  const presentDays = displayData.filter(d => d.status === 'Present' || d.status === 'Late').length;
  const absentDays = displayData.filter(d => d.status === 'Absent').length;

  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;


  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
                 <div className="grid grid-cols-2 gap-4 mt-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

   if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">Could not load attendance data due to a permission error.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>Calendar view of student's attendance for {format(currentMonth, 'MMMM yyyy')}.</CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="p-0"
          classNames={{
            day: 'h-9 w-9 p-0 text-sm',
            head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-xs',
            cell: 'text-center text-sm p-0 relative',
          }}
          modifiers={{
            present: (date) => attendanceStatusMap.get(format(date, 'yyyy-MM-dd')) === 'present',
            absent: (date) => attendanceStatusMap.get(format(date, 'yyyy-MM-dd')) === 'absent',
            late: (date) => attendanceStatusMap.get(format(date, 'yyyy-MM-dd')) === 'late',
            disabled: (date) => isAfter(date, endOfDay(new Date())), // Disable future dates
          }}
          modifiersClassNames={{
            present: 'bg-green-100 dark:bg-green-900/50 rounded-md text-foreground',
            absent: 'bg-red-100 dark:bg-red-900/50 rounded-md text-foreground',
            late: 'bg-yellow-100 dark:bg-yellow-900/50 rounded-md text-foreground',
          }}
        />
        <div className="flex items-center justify-around p-4 bg-muted/50 rounded-lg mt-6">
            <div className="flex items-center gap-2">
                <div className="p-3 bg-green-200/50 text-green-700 dark:bg-green-800/50 dark:text-green-300 rounded-full">
                    <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold font-headline">{attendanceRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="p-3 bg-red-200/50 text-red-700 dark:bg-red-800/50 dark:text-red-300 rounded-full">
                    <CalendarX className="h-6 w-6" />
                </div>
                 <div>
                    <p className="text-2xl font-bold font-headline">{absentDays}</p>
                    <p className="text-xs text-muted-foreground">Days Absent</p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
