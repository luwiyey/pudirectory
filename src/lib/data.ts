
'use server';
import type { Student } from './definitions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  limit,
  collectionGroup,
  where,
  runTransaction,
} from 'firebase/firestore';
import { getSdks } from '@/firebase/server';
import initialData from '@/data/students.json'; // Seed data
import { StudentSchema } from './definitions';
import { logger } from './logger';

// This file contains all server-side data access functions for interacting with Firestore.
// Note: Client-side fetching is handled in components.

let firestore: ReturnType<typeof getSdks>['firestore'];

/**
 * Singleton function to get the Firestore instance.
 * Ensures that Firestore is initialized only once on the server.
 */
async function getFirestoreInstance() {
  if (!firestore) {
    firestore = getSdks().firestore;
    logger.info('Firestore instance initialized on the server.');
  }
  return firestore;
}

const STUDENTS_COLLECTION = 'students';

/**
 * Seeds the Firestore database with initial student data from `students.json`.
 * This is a server-only function.
 */
export async function seedDatabase() {
    logger.info('Attempting to seed database...');
    const db = await getFirestoreInstance();
    const studentsCollection = collection(db, STUDENTS_COLLECTION);

    const snapshot = await getDocs(query(studentsCollection, limit(1)));
    if (!snapshot.empty) {
        logger.warn("Database already contains data. Seeding skipped.");
        return { success: true, message: "Database already contains data. Seeding skipped." };
    }

    const batch = writeBatch(db);
    initialData.forEach((student) => {
        const docRef = doc(db, STUDENTS_COLLECTION, student.id);
        const validated = StudentSchema.safeParse(student);
        if (validated.success) {
           batch.set(docRef, validated.data);
        } else {
            logger.warn(`Skipping invalid student data during seed`, { studentData: student, errors: validated.error.flatten() });
        }
    });

    try {
        await batch.commit();
        logger.info("Database seeded successfully.", { studentCount: initialData.length });
        return { success: true, message: "Database seeded successfully." };
    } catch (error: any) {
        logger.error("Error seeding database.", { error: error.message });
        return { success: false, message: `Error seeding database: ${error}` };
    }
}


/**
 * Fetches all student records for the data export feature. No filtering is applied.
 * If the live database is empty, it returns the sample data from students.json.
 */
export async function getAllStudentsForExport(): Promise<Student[]> {
    const db = await getFirestoreInstance();
    const studentsCollection = collection(db, STUDENTS_COLLECTION);
    const snapshot = await getDocs(query(studentsCollection));
    
    if (snapshot.empty) {
        logger.info('Firestore is empty. Exporting sample data from students.json.');
        return initialData as Student[];
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

/**
 * Adds multiple student records to the database using a batched write.
 * This is a server action for admin imports.
 */
export async function addMultipleStudents(studentsData: Omit<Student, 'id'>[]): Promise<{success: boolean, message: string}> {
    const db = await getFirestoreInstance();
    const batch = writeBatch(db);
    const studentsCollection = collection(db, STUDENTS_COLLECTION);
    
    // Check for email uniqueness before writing.
    const emails = studentsData.map(s => s.email);
    const existingEmailsQuery = query(collectionGroup(db, STUDENTS_COLLECTION), where('email', 'in', emails));
    const existingSnapshot = await getDocs(existingEmailsQuery);
    const existingEmails = new Set(existingSnapshot.docs.map(d => d.data().email));

    const newStudents = studentsData.filter(s => !existingEmails.has(s.email));

    const duplicateCount = studentsData.length - newStudents.length;

    if (duplicateCount > 0) {
        logger.warn(`${duplicateCount} duplicate email(s) found during import. They will be skipped.`);
    }

    if (newStudents.length === 0) {
      return { success: false, message: `Import failed. ${duplicateCount > 0 ? `All ${duplicateCount} provided emails already exist.` : 'No new students to import.'}` };
    }

    for (const student of newStudents) {
        const validated = StudentSchema.omit({id: true}).safeParse(student);
        if (validated.success) {
            const docRef = doc(studentsCollection);
            batch.set(docRef, validated.data);
        } else {
            logger.warn('Skipping invalid student data during import:', { errors: validated.error.flatten() });
        }
    }

    try {
        await batch.commit();
        const successMessage = `${newStudents.length} students imported successfully. ${duplicateCount} duplicate(s) were skipped.`;
        return { success: true, message: successMessage };
    } catch (error: any) {
        logger.error("Error committing student import batch.", { error: error.message });
        return { success: false, message: `An error occurred during import: ${error.message}` };
    }
}


/**
 * Updates grades for multiple students in a specific course using a transaction.
 */
export async function updateStudentGrades(courseName: string, gradeData: { studentEmail: string, grade: number }[]): Promise<{ success: boolean; message: string }> {
    const db = await getFirestoreInstance();
    const emails = gradeData.map(item => item.studentEmail);

    if (emails.length === 0) {
        return { success: false, message: "No grade data provided." };
    }
    
    const studentsQuery = query(collection(db, STUDENTS_COLLECTION), where('email', 'in', emails));

    try {
        const studentDocs = await getDocs(studentsQuery);
        const studentMap = new Map(studentDocs.docs.map(doc => [doc.data().email, { id: doc.id, ref: doc.ref, data: doc.data() as Student }]));

        let updatedCount = 0;
        let notFoundCount = 0;

        await runTransaction(db, async (transaction) => {
            for (const item of gradeData) {
                const studentInfo = studentMap.get(item.studentEmail);

                if (studentInfo) {
                    const studentData = studentInfo.data;
                    const grades = studentData.grades || [];
                    const gradeIndex = grades.findIndex(g => g.courseName === courseName);

                    if (gradeIndex !== -1) {
                        grades[gradeIndex].grade = item.grade;
                    } else {
                        grades.push({ courseName: courseName, grade: item.grade });
                    }

                    transaction.update(studentInfo.ref, { grades });
                    updatedCount++;
                } else {
                    notFoundCount++;
                }
            }
        });
        
        let message = `${updatedCount} students' grades updated for ${courseName}.`;
        if (notFoundCount > 0) {
            message += ` ${notFoundCount} students from the import list were not found in the database.`;
        }
        
        logger.info(message);
        return { success: true, message };

    } catch (error: any) {
        logger.error('Failed to update student grades transactionally.', { error: error.message, courseName });
        return { success: false, message: `An error occurred while updating grades: ${error.message}` };
    }
}
    
