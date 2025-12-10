import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActivities, type Activity } from "@/hooks/useActivities";
import { ActivityFormDialog } from "./ActivityFormDialog";
import { useState } from "react";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Plus,
  Clock,
  Loader2,
} from "lucide-react";

interface ActivityTimelineProps {
  accountId: string;
}

const activityIcons: Record<Activity["activity_type"], React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

const activityColors: Record<Activity["activity_type"], string> = {
  call: "bg-blue-500",
  email: "bg-green-500",
  meeting: "bg-purple-500",
  note: "bg-yellow-500",
  task: "bg-orange-500",
};

const outcomeColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-800",
  negative: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export function ActivityTimeline({ accountId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = useActivities(accountId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Activity Timeline
          </CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            Log Activity
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !activities?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activities logged yet</p>
            <p className="text-sm">Click "Log Activity" to record your first interaction</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border" />
              
              <div className="space-y-4">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <ActivityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        accountId={accountId}
      />
    </Card>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex gap-3 relative">
      {/* Icon bubble */}
      <div
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-white shrink-0 ${activityColors[activity.activity_type]}`}
      >
        {activityIcons[activity.activity_type]}
      </div>

      {/* Content */}
      <div className="flex-1 bg-muted/50 rounded-lg p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          {activity.outcome && (
            <Badge
              variant="secondary"
              className={`shrink-0 ${outcomeColors[activity.outcome]}`}
            >
              {activity.outcome}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {activity.activity_type}
          </Badge>
          <span>{format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
      </div>
    </div>
  );
}
