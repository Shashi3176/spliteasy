import {
  ArrowRight,
  CircleDollarSign,
  PlusCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const steps = [
  {
    number: 1,
    title: 'Create a group',
    description: 'Start a shared space for your trip, roommate setup, or any group expense situation.',
    icon: Users,
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    number: 2,
    title: 'Add expenses as they happen',
    description: 'Log every purchase, bill, or shared cost the moment it comes up.',
    icon: PlusCircle,
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    number: 3,
    title: 'See who owes what, instantly',
    description: 'SplitEasy calculates each person’s balance so everyone knows exactly where they stand.',
    icon: CircleDollarSign,
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    number: 4,
    title: 'Settle up in the fewest possible payments',
    description: 'Use smart settlement suggestions to clear balances with minimal back-and-forth.',
    icon: TrendingUp,
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How SplitEasy works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From group setup to final settlement, SplitEasy keeps your shared
            expenses organized and effortless.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <Card
                  key={step.number}
                  className="relative transition-all duration-200 hover:shadow-lg hover:border-primary/50"
                >
                  <CardHeader>
                    <div className="relative flex items-center gap-4 mb-4">
                      <div
                        className={`size-12 rounded-full flex items-center justify-center ${step.badge}`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {step.number}
                      </div>
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardContent>

                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 -right-4 text-muted-foreground">
                      <ArrowRight className="size-5" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
