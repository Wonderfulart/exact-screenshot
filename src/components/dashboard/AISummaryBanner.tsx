import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Priority {
  label: string;
  type: "danger" | "warning" | "success";
}

interface AISummaryBannerProps {
  greeting: string;
  priorities: Priority[];
}

export function AISummaryBanner({ greeting, priorities }: AISummaryBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in rounded-lg bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{greeting}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what Hand AI thinks you should focus on today:
            </p>
            <ul className="mt-3 space-y-2">
              {priorities.map((priority, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      priority.type === "danger"
                        ? "bg-danger"
                        : priority.type === "warning"
                        ? "bg-warning"
                        : "bg-success"
                    }`}
                  />
                  <span className="text-foreground">{priority.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0 text-primary hover:text-primary"
          onClick={() => navigate("/accounts")}
        >
          View all contacts
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
