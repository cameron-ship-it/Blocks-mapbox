import * as React from "react";
import { Link } from "wouter";
import { Moon, Sun, HelpCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ProgressStepper, type Step } from "@/components/ui/progress-stepper";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface AppShellProps {
  children: React.ReactNode;
  currentStep?: string;
  steps?: Step[];
  onStepClick?: (stepId: string) => void;
  showStepper?: boolean;
  className?: string;
}

/**
 * AppShell - Main layout wrapper for Blocks NYC
 * 
 * Features:
 * - Top navigation with wordmark, step indicator, and Help link
 * - Container with max-width 960px and responsive gutters
 * - Footer with links and dark mode toggle
 * - Framer Motion page transitions
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentStep,
  steps,
  onStepClick,
  showStepper = true,
  className,
}) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Wordmark */}
            <Link href="/">
              <a 
                className="text-xl font-display font-bold tracking-tight text-foreground hover-elevate px-2 py-1 rounded-md transition-colors"
                data-testid="link-home"
              >
                Blocks NYC
              </a>
            </Link>

            {/* Step Indicator (Center) - Hidden on mobile */}
            {showStepper && steps && currentStep && (
              <div className="hidden md:block flex-1 max-w-md mx-8">
                <ProgressStepper
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={onStepClick}
                />
              </div>
            )}

            {/* Help Link */}
            <Link href="/help">
              <a
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-help"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with Animation */}
      <main className={cn("flex-1 container mx-auto py-8", className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep || "default"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Footer Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/about">
                <a 
                  className="hover:text-foreground transition-colors"
                  data-testid="link-about"
                >
                  About
                </a>
              </Link>
              <Link href="/privacy">
                <a 
                  className="hover:text-foreground transition-colors"
                  data-testid="link-privacy"
                >
                  Privacy
                </a>
              </Link>
              <span className="text-xs">
                © {new Date().getFullYear()} Blocks NYC
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="gap-2"
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Light Mode</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};
