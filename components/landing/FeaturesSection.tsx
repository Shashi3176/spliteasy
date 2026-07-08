import {
  Activity,
  BarChart3,
  GitGraph,
  LockKeyhole,
  PieChart,
  Receipt,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const features = [
  {
    title: 'Group Expense Tracking',
    description:
      'Create groups for trips, roommates, or shared projects and track every expense in one organized place.',
    icon: Receipt,
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Flexible Splitting',
    description:
      'Split costs equally, by percentage, or with exact custom amounts—whatever fits the situation.',
    icon: PieChart,
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    title: 'Smart Settlements',
    description:
      'Let SplitEasy calculate the fewest possible transactions using an optimal debt simplification algorithm.',
    icon: LockKeyhole,
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Visual Debt Graph',
    description:
      'See who owes whom at a glance with a clear graph view that makes every balance easy to understand.',
    icon: GitGraph,
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Activity Feed',
    description:
      'Stay up to date with a live feed of every expense, settlement, and group update as it happens.',
    icon: Activity,
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  {
    title: 'Spending Analytics',
    description:
      'Get insights into group and personal spending patterns with clear charts and summaries.',
    icon: BarChart3,
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to split expenses
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From quick trip splits to complex shared living costs, SplitEasy
            gives your group the tools to track, simplify, and settle with
            confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="transition-all duration-200 hover:shadow-lg hover:border-primary/50"
              >
                <CardHeader>
                  <div
                    className={`size-12 rounded-full flex items-center justify-center mb-4 ${feature.badge}`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
