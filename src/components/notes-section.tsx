
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Brain, Loader2, Trash } from 'lucide-react';
import { Separator } from './ui/separator';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Note } from '@/lib/definitions';
import { collection, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

const NoteFormSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty.'),
});

const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

export default function NotesSection({ studentId }: { studentId: string }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return query(collection(firestore, `students/${studentId}/notes`), orderBy('createdAt', 'desc'));
  }, [firestore, studentId]);

  const { data: notes, isLoading: areNotesLoading, error } = useCollection<Note>(notesQuery);

  const form = useForm<{ content: string }>({
    resolver: zodResolver(NoteFormSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: { content: string }) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to add a note.' });
      return;
    }
    setIsSubmitting(true);
    const notesCollection = collection(firestore, `students/${studentId}/notes`);
    
    const newNote = {
        studentId,
        authorEmail: user.email,
        content: data.content,
        createdAt: new Date().toISOString(),
    };
    
    addDoc(notesCollection, newNote)
    .then(() => {
        form.reset();
        toast({ title: 'Note added successfully.' });
    })
    .catch((err) => {
        const contextualError = new FirestorePermissionError({
          path: notesCollection.path,
          operation: 'create',
          requestResourceData: newNote,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'Failed to add note.', description: "You might not have the right permissions." });
    }).finally(() => {
        setIsSubmitting(false);
    });
  };

  const handleDelete = (noteId: string) => {
    if (!user || !firestore) return;
    const noteRef = doc(firestore, `students/${studentId}/notes/${noteId}`);
    deleteDoc(noteRef)
      .then(() => {
        toast({ title: 'Note deleted.' });
      })
      .catch((err) => {
        const contextualError = new FirestorePermissionError({ path: noteRef.path, operation: 'delete' });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'Failed to delete note.' });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Private Notes
        </CardTitle>
        <CardDescription>Internal notes for teachers and admins. Visible only to authorized users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isUserLoading ? <Skeleton className="h-24 w-full" /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <Textarea placeholder="Add a new note..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Note
                </Button>
            </form>
            </Form>
        )}
        
        <Separator />
        
        {areNotesLoading && (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )}

        {error && <p className="text-sm text-destructive">Could not load notes due to a permission error.</p>}

        {!areNotesLoading && notes && notes.length > 0 && (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-6">
              {notes.map(note => (
                <div key={note.id} className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback>{getInitials(note.authorEmail)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{note.authorEmail}</p>
                      <div className="flex items-center gap-2">
                         <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </p>
                        {user?.email === note.authorEmail && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(note.id)}>
                                <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                <span className="sr-only">Delete note</span>
                            </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
         {!areNotesLoading && (!notes || notes.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-8">No notes yet for this student.</p>
        )}
      </CardContent>
    </Card>
  );
}
