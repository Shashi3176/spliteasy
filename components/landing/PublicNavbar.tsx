"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 py-3 md:px-6">
      <div className="flex items-center">
        <Link href="/" className="text-lg font-bold">
          SplitEasy
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <a
          href="#features"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Features
        </a>
        <a
          href="#how-it-works"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          How It Works
        </a>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px]">
              <div className="flex flex-col gap-4 mt-4">
                <a
                  href="#features"
                  className="text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  How It Works
                </a>
                <div className="flex flex-col gap-2 pt-2">
                  <SheetClose asChild>
                    <Button variant="ghost" asChild>
                       <Link href="/signin">Sign in</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
