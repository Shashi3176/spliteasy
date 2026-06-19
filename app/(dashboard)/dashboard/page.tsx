import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back, {session.user?.name}!</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Name:</span>
            <span className="ml-2">{session.user?.name}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Email:</span>
            <span className="ml-2">{session.user?.email}</span>
          </div>
        </CardContent>
      </Card>
      {/* Groups section will appear here */}
    </div>
  );
}