import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { boroughs, type Borough, type Neighborhood } from "@/lib/geo";
import { ChevronRight, ChevronLeft, DollarSign, MapPin, Building2, Map, X } from "lucide-react";
import BlocksMap from "./BlocksMap";

type WizardStep = "budget" | "borough" | "neighborhood" | "map" | "complete";

interface WizardState {
  budgetMin: number;
  budgetMax: number;
  selectedBoroughs: string[];
  selectedNeighborhoods: string[];
}

export default function BlocksOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("budget");
  const [wizardState, setWizardState] = useState<WizardState>({
    budgetMin: 1500,
    budgetMax: 4000,
    selectedBoroughs: [],
    selectedNeighborhoods: [],
  });

  // Get available neighborhoods based on selected boroughs
  const availableNeighborhoods = boroughs
    .filter((b) => wizardState.selectedBoroughs.includes(b.id))
    .flatMap((b) => b.neighborhoods);

  // Toggle borough selection
  const toggleBorough = (boroughId: string) => {
    setWizardState((prev) => {
      const isSelected = prev.selectedBoroughs.includes(boroughId);
      const newBoroughs = isSelected
        ? prev.selectedBoroughs.filter((id) => id !== boroughId)
        : [...prev.selectedBoroughs, boroughId];

      // Remove neighborhoods from deselected boroughs
      const newNeighborhoods = isSelected
        ? prev.selectedNeighborhoods.filter(
            (nId) => !boroughs.find((b) => b.id === boroughId)?.neighborhoods.some((n) => n.id === nId)
          )
        : prev.selectedNeighborhoods;

      return { ...prev, selectedBoroughs: newBoroughs, selectedNeighborhoods: newNeighborhoods };
    });
  };

  // Toggle neighborhood selection
  const toggleNeighborhood = (neighborhoodId: string) => {
    setWizardState((prev) => ({
      ...prev,
      selectedNeighborhoods: prev.selectedNeighborhoods.includes(neighborhoodId)
        ? prev.selectedNeighborhoods.filter((id) => id !== neighborhoodId)
        : [...prev.selectedNeighborhoods, neighborhoodId],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case "budget":
        return true;
      case "borough":
        return wizardState.selectedBoroughs.length > 0;
      case "neighborhood":
        return wizardState.selectedNeighborhoods.length > 0;
      case "map":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const steps: WizardStep[] = ["budget", "borough", "neighborhood", "map", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleRestart = () => {
    setCurrentStep("budget");
    setWizardState({
      budgetMin: 1500,
      budgetMax: 4000,
      selectedBoroughs: [],
      selectedNeighborhoods: [],
    });
  };

  const handleBack = () => {
    const steps: WizardStep[] = ["budget", "borough", "neighborhood", "map"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Get selected borough and neighborhood names for summary
  const selectedBoroughNames = boroughs
    .filter((b) => wizardState.selectedBoroughs.includes(b.id))
    .map((b) => b.name);

  const selectedNeighborhoodNames = boroughs
    .flatMap((b) => b.neighborhoods)
    .filter((n) => wizardState.selectedNeighborhoods.includes(n.id))
    .map((n) => n.name);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="wizard-container">
      <div className="w-full max-w-4xl">
        {/* Progress indicator - hide on complete */}
        {currentStep !== "complete" && (
          <div className="mb-8 flex justify-center gap-2" data-testid="progress-indicator">
            {["budget", "borough", "neighborhood", "map"].map((step, index) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  currentStep === step
                    ? "bg-primary"
                    : ["budget", "borough", "neighborhood", "map"].indexOf(currentStep) > index
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
                data-testid={`progress-step-${step}`}
              />
            ))}
          </div>
        )}

        <Card data-testid="card-wizard">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-step-title">
              {currentStep === "budget" && (
                <>
                  <DollarSign className="inline-block w-6 h-6 mr-2" data-testid="icon-budget" />
                  Set Your Budget
                </>
              )}
              {currentStep === "borough" && (
                <>
                  <Building2 className="inline-block w-6 h-6 mr-2" data-testid="icon-borough" />
                  Choose Your Boroughs
                </>
              )}
              {currentStep === "neighborhood" && (
                <>
                  <MapPin className="inline-block w-6 h-6 mr-2" data-testid="icon-neighborhood" />
                  Select Neighborhoods
                </>
              )}
              {currentStep === "map" && (
                <>
                  <Map className="inline-block w-6 h-6 mr-2" data-testid="icon-map" />
                  Pick Your Blocks
                </>
              )}
            </CardTitle>
            <CardDescription data-testid="text-step-description">
              {currentStep === "budget" && "What's your monthly rent budget?"}
              {currentStep === "borough" && "Which NYC boroughs interest you?"}
              {currentStep === "neighborhood" && "Select specific neighborhoods to explore"}
              {currentStep === "map" && "Click on blocks to add them to your search"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Budget Step */}
            {currentStep === "budget" && (
              <div className="space-y-6" data-testid="step-budget">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground" data-testid="text-budget-range">
                      Budget Range
                    </span>
                    <span className="text-lg font-semibold" data-testid="text-budget-value">
                      ${wizardState.budgetMin.toLocaleString()} - ${wizardState.budgetMax.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    min={500}
                    max={10000}
                    step={100}
                    value={[wizardState.budgetMin, wizardState.budgetMax]}
                    onValueChange={([min, max]) =>
                      setWizardState((prev) => ({ ...prev, budgetMin: min, budgetMax: max }))
                    }
                    data-testid="slider-budget"
                  />
                </div>
              </div>
            )}

            {/* Borough Step */}
            {currentStep === "borough" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="step-borough">
                {boroughs.map((borough) => (
                  <Card
                    key={borough.id}
                    className={`cursor-pointer transition-all hover-elevate ${
                      wizardState.selectedBoroughs.includes(borough.id)
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => toggleBorough(borough.id)}
                    data-testid={`card-borough-${borough.id}`}
                  >
                    <CardHeader className="space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg" data-testid={`text-borough-${borough.id}`}>
                          {borough.name}
                        </CardTitle>
                        {wizardState.selectedBoroughs.includes(borough.id) && (
                          <Badge variant="default" data-testid={`badge-selected-${borough.id}`}>
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardDescription data-testid={`text-neighborhoods-count-${borough.id}`}>
                        {borough.neighborhoods.length} neighborhoods
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Neighborhood Step */}
            {currentStep === "neighborhood" && (
              <div className="space-y-4" data-testid="step-neighborhood">
                {availableNeighborhoods.length === 0 ? (
                  <p className="text-center text-muted-foreground" data-testid="text-no-boroughs">
                    Please select at least one borough first
                  </p>
                ) : (
                  wizardState.selectedBoroughs.map((boroughId) => {
                    const borough = boroughs.find((b) => b.id === boroughId);
                    if (!borough) return null;

                    return (
                      <div key={borough.id} className="space-y-3" data-testid={`group-neighborhoods-${borough.id}`}>
                        <h3 className="font-semibold text-sm text-muted-foreground" data-testid={`text-borough-title-${borough.id}`}>
                          {borough.name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {borough.neighborhoods.map((neighborhood) => (
                            <div
                              key={neighborhood.id}
                              className="flex items-center space-x-2 p-3 rounded-md hover-elevate border"
                              data-testid={`item-neighborhood-${neighborhood.id}`}
                            >
                              <Checkbox
                                id={neighborhood.id}
                                checked={wizardState.selectedNeighborhoods.includes(neighborhood.id)}
                                onCheckedChange={() => toggleNeighborhood(neighborhood.id)}
                                data-testid={`checkbox-neighborhood-${neighborhood.id}`}
                              />
                              <label
                                htmlFor={neighborhood.id}
                                className="text-sm flex-1 cursor-pointer"
                                data-testid={`label-neighborhood-${neighborhood.id}`}
                              >
                                {neighborhood.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Map Step */}
            {currentStep === "map" && (
              <div className="space-y-4" data-testid="step-map">
                <BlocksMap height={520} />
              </div>
            )}

            {/* Complete Step */}
            {currentStep === "complete" && (
              <div className="space-y-6" data-testid="step-complete">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center" data-testid="icon-complete">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold" data-testid="text-complete-title">Search Preferences Saved!</h3>
                  <p className="text-muted-foreground" data-testid="text-complete-description">
                    Here's a summary of your NYC apartment search preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg" data-testid="summary-budget">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Budget Range</span>
                    </div>
                    <p className="text-lg font-semibold">
                      ${wizardState.budgetMin.toLocaleString()} - ${wizardState.budgetMax.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg" data-testid="summary-boroughs">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Boroughs</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedBoroughNames.map((name) => (
                        <Badge key={name} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg" data-testid="summary-neighborhoods">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Neighborhoods</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNeighborhoodNames.map((name) => (
                        <Badge key={name} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer with navigation */}
          {currentStep !== "complete" && (
            <div className="border-t p-6 flex justify-between" data-testid="wizard-footer">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === "budget"}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                data-testid="button-next"
              >
                {currentStep === "map" ? "Finish" : "Next"}
                {currentStep !== "map" && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="border-t p-6 flex justify-center" data-testid="wizard-restart">
              <Button onClick={handleRestart} data-testid="button-restart">
                Start New Search
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
