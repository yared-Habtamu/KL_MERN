import React from "react";
import { PageLayout } from "./layout/PageLayout";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  suggestedAction?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  suggestedAction = "Continue using the app to explore available features, or let us know what you'd like to see here!",
}) => {
  return (
    <PageLayout>
      <div className="page-container flex items-center justify-center min-h-96">
        <Card className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-16 h-16 bg-kiya-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction size={32} className="text-kiya-teal" />
            </div>
            <h2 className="text-xl font-semibold text-kiya-text mb-2">
              {title}
            </h2>
            <p className="text-kiya-text-secondary mb-4">{description}</p>
            <p className="text-sm text-kiya-text-secondary">
              {suggestedAction}
            </p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
