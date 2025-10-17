import * as React from "react";
import { Link } from "wouter";
import { Moon, Sun } from "lucide-react";
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
 * AppShell - Minimal layout wrapper for Blocks NYC
 * 
 * Features:
 * - Clean top bar with wordmark and theme toggle
 * - Progress indicator (when applicable)
 * - Maximum breathing room with minimal chrome
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
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-background">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Wordmark */}
            <Link 
              href="/" 
              className="text-xl font-display font-bold tracking-tight text-foreground transition-opacity hover:opacity-70" 
              data-testid="link-home"
            >
              Blocks NYC
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

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="shrink-0"
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Animation */}
      <main className={cn("flex-1 container mx-auto py-12", className)}>
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

      {/* Minimal Footer */}
      <footer className="py-8 mt-auto">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors" data-testid="link-about">
              About
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
              Privacy
            </Link>
            <span>© {new Date().getFullYear()} Blocks NYC</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
