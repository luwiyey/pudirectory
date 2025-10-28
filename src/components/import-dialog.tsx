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
import { Import, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importStudentsAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const jsonExample = `[
  {
    "name": "Juan Dela Cruz",
    "email": "juan.cruz@panpacificu.edu.ph",
    "department": "Information Technology"
  },
  {
    "name": "Maria Clara",
    "email": "maria.clara@panpacificu.edu.ph",
    "department": "Arts and Sciences",
    "academicHistory": "Dean's Lister, 2023"
  }
]`;

export default function ImportDialog() {
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
    const result = await importStudentsAction(jsonData);
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
        <Button variant="outline">
          <Import className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Students from JSON</DialogTitle>
          <DialogDescription>
            Paste your student data in JSON format below. Any missing optional fields will be left blank.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="json-data">Student JSON Data</Label>
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
                Each student object in the array must have a `name` (string) and a unique `email` (string).
              </AlertDescription>
            </Alert>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
