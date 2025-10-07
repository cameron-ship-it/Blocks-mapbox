import { Card } from "@/components/ui/card";

export default function BlocksOnboardingWizard() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Blocks NYC Apartment Search
          </h1>
          <p className="text-muted-foreground">
            Component placeholder ready for your implementation
          </p>
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground font-mono">
              {/* PASTE COMPONENT HERE */}
              Replace this placeholder component in:
              <br />
              <span className="text-foreground font-semibold">
                /components/BlocksOnboardingWizard.tsx
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            The app is configured with Mapbox GL JS, Tailwind CSS, and NYC geo data.
            <br />
            Check the README for setup instructions.
          </p>
        </div>
      </Card>
    </div>
  );
}
