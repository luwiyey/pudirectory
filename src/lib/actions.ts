
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { StudentSchema, StudentImportSchema, type Student } from '@/lib/definitions';
import { addMultipleStudents, getAllStudentsForExport, updateStudentGrades } from '@/lib/data';
import { logger } from './logger';
import { getSdks } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import initialData from '@/data/students.json';


// This file defines Server Actions, which are server-side functions that can be called directly
// from client components. They are used for handling form submissions and data mutations.

const STUDENTS_COLLECTION = 'students';

// Defines a standard shape for the state object returned by form actions.
export type State = {
  errors?: {
    [key: string]: string[] | undefined;
  };
  message?: string | null;
};


/**
 * Server Action to export all student data as a JSON object.
 * @returns {Promise<{ success: boolean; data?: any; error?: string }>} The student data or an error.
 */
export async function exportStudentsAction() {
    try {
        const students = await getAllStudentsForExport();
        logger.info('Student data exported.', { studentCount: students.length });
        return { success: true, data: students };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        logger.error('Failed to export student data.', { error: errorMessage });
        return { success: false, error: errorMessage };
    }
}

/**
 * Server Action to import multiple students from a JSON string.
 * @param {string} jsonData - A string containing a JSON array of student data.
 * @returns {Promise<{ success: boolean; message: string }>} A result object with a success message or an error.
 */
export async function importStudentsAction(jsonData: string): Promise<{ success: boolean; message: string }> {
  try {
    // Parse and validate the incoming JSON data against the import schema.
    const data = JSON.parse(jsonData);
    const validatedData = StudentImportSchema.safeParse(data);

    if (!validatedData.success) {
      // Create a more readable error message from Zod's error object.
      const errorDetails = validatedData.error.flatten().fieldErrors;
      const errorString = Object.entries(errorDetails)
        .map(([key, value]) => `${key}: ${value.join(', ')}`)
        .join('; ');
      logger.warn('Student import failed validation.', { errors: errorString });
      return { success: false, message: `Invalid JSON format or data. Details: ${errorString}` };
    }

    const result = await addMultipleStudents(validatedData.data);
    
    if (result.success) {
        logger.info('Students imported successfully.', { count: validatedData.data.length });
        // Revalidate all paths that show student data to reflect changes immediately
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/analytics');
        revalidatePath('/departments');
        revalidatePath('/my-classes');
    }
    
    return result;
  } catch (e) {
    if (e instanceof SyntaxError) {
      logger.error('Student import failed due to invalid JSON.', { error: e.message });
      return { success: false, message: 'Invalid JSON. Please check the syntax.' };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during import.';
    logger.error('An unknown error occurred during student import.', { error: errorMessage });
    return { success: false, message: errorMessage };
  }
}

const GradeImportSchema = z.array(z.object({
  studentEmail: z.string().email(),
  grade: z.coerce.number().min(0).max(100),
}));

export async function importGradesForClassAction(courseName: string, jsonData: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonData);
    const validatedData = GradeImportSchema.safeParse(data);

    if (!validatedData.success) {
       const errorString = JSON.stringify(validatedData.error.flatten().fieldErrors);
       return { success: false, message: `Invalid JSON data. Details: ${errorString}` };
    }

    const result = await updateStudentGrades(courseName, validatedData.data);

    if (result.success) {
        // Revalidate all paths where grade changes might be visible
        revalidatePath('/my-classes');
        revalidatePath('/students'); // For individual student pages
        revalidatePath('/analytics'); // GWA and scholar status might change
    }

    return result;

  } catch (e) {
     if (e instanceof SyntaxError) {
      return { success: false, message: 'Invalid JSON. Please check the syntax.' };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during grade import.';
    return { success: false, message: errorMessage };
  }
}
