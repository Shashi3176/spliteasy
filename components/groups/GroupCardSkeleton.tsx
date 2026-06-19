import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function GroupCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  );
}