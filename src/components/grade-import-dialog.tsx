
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { importGradesForClassAction } from '@/lib/actions';

const jsonExample = `[
  {
    "studentEmail": "lian.delacruz.it@panpacificu.edu.ph",
    "grade": 95
  },
  {
    "studentEmail": "miguel.santos.cs@panpacificu.edu.ph",
    "grade": 88
  }
]`;

export default function GradeImportDialog({ courseName }: { courseName: string }) {
  const [open, setOpen] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'JSON data cannot be empty.',
      });
      return;
    }

    setIsLoading(true);
    const result = await importGradesForClassAction(courseName, jsonData);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Import Successful',
        description: result.message,
      });
      setOpen(false);
      setJsonData('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: result.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Upload className="h-4 w-4" />
            <span className="sr-only">Import Grades</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Grades for {courseName}</DialogTitle>
          <DialogDescription>
            Paste student grade data in JSON format below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="json-data">Grade JSON Data</Label>
            <Textarea
              id="json-data"
              placeholder={jsonExample}
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>
           <Alert>
              <AlertTitle>Required Fields</AlertTitle>
              <AlertDescription>
                Each object must have a `studentEmail` (string) and a `grade` (number 0-100).
              </AlertDescription>
            </Alert>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import Grades
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
