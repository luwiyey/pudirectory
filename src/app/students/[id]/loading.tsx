import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <Skeleton className="h-6 w-1/2 mb-6" />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-80" />
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-full" />
            </CardHeader>
            <CardContent className="flex items-center justify-center h-40">
                <Skeleton className="h-12 w-36" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
