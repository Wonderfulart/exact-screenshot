import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { AutomationState } from "@/hooks/useAutomations";

interface AutomationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  state: AutomationState;
  onRun: () => void;
  resultPreview?: string;
}

export function AutomationCard({
  title,
  description,
  icon,
  state,
  onRun,
  resultPreview,
}: AutomationCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <StatusBadge state={state} />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {resultPreview && state.lastResult && (
          <p className="text-sm text-muted-foreground mb-3">{resultPreview}</p>
        )}
        {state.lastError && (
          <p className="text-sm text-destructive mb-3">{state.lastError}</p>
        )}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            onClick={onRun}
            disabled={state.isRunning}
            className="gap-2"
          >
            {state.isRunning ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Running...
              </>
            ) : (
              "Run Now"
            )}
          </Button>
          {state.lastRanAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(state.lastRanAt), "h:mm a")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ state }: { state: AutomationState }) {
  if (state.isRunning) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    );
  }
  if (state.lastError) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }
  if (state.lastResult?.success) {
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      Ready
    </Badge>
  );
}
