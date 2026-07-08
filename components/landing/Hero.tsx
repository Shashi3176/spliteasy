import Link from 'next/link';
import { ArrowRight, CheckCircle2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Users className="size-4" />
              Built for groups, trips, and shared expenses
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Split expenses without the awkward math.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Track group spending in one place and let SplitEasy calculate the
              fewest transactions needed to settle up—so everyone pays exactly
              what they owe, with minimal back-and-forth.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link href="#how-it-works">
                  See How It Works
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Automatic settlements
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Minimal transactions
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Group expense tracking
              </span>
            </div>
          </div>

          <div className="relative lg:justify-self-end">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-75" />
            <div className="relative bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Group Balance
                  </p>
                  <h2 className="text-2xl font-semibold">Weekend Trip</h2>
                </div>
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="size-6 text-primary" />
                </div>
              </div>

              <div className="space-y-4">
                <BalanceRow
                  name="Maya"
                  amount="+$42.00"
                  color="bg-emerald-500"
                  textColor="text-emerald-600 dark:text-emerald-400"
                />
                <BalanceRow
                  name="Jordan"
                  amount="-$18.50"
                  color="bg-amber-500"
                  textColor="text-amber-600 dark:text-amber-400"
                />
                <BalanceRow
                  name="Alex"
                  amount="-23.50"
                  color="bg-rose-500"
                  textColor="text-rose-600 dark:text-rose-400"
                />
              </div>

              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Settlements needed
                  </span>
                  <span className="text-2xl font-bold">2</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Fewest transfers to settle everyone up
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BalanceRow({
  name,
  amount,
  color,
  textColor,
}: {
  name: string;
  amount: string;
  color: string;
  textColor: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
      <div className="flex items-center gap-3">
        <div className={`size-3 rounded-full ${color}`} />
        <span className="font-medium">{name}</span>
      </div>
      <span className={`font-semibold ${textColor}`}>{amount}</span>
    </div>
  );
}
