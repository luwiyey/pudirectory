'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportStudentsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export default function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsLoading(true);
    const result = await exportStudentsAction();
    setIsLoading(false);

    if (result.success && result.data) {
      try {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'students.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        toast({
            title: "Export Successful",
            description: "Your student data has been downloaded.",
        });
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "Could not create the download file.",
        });
      }
    } else {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: result.error || "An unknown error occurred while fetching data.",
        });
    }
  };

  return (
    <Button onClick={handleExport} disabled={isLoading} variant="outline">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export to JSON
    </Button>
  );
}
