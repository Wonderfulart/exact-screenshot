import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Lightbulb, Clock } from "lucide-react";
import { format, addHours, setHours, setMinutes, startOfDay, addDays, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

interface EmailSchedulerProps {
  scheduledAt: Date | null;
  onScheduleChange: (date: Date | null) => void;
}

const SMART_TIMES = [
  { label: "Morning (9 AM)", hour: 9, minute: 0, reason: "High open rates - start of workday" },
  { label: "Late Morning (10:30 AM)", hour: 10, minute: 30, reason: "Peak engagement after morning meetings" },
  { label: "After Lunch (2 PM)", hour: 14, minute: 0, reason: "Post-lunch productivity window" },
  { label: "End of Day (4:30 PM)", hour: 16, minute: 30, reason: "Good for next-day follow-ups" },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return [
    { value: `${hour}:00`, label: format(setMinutes(setHours(new Date(), hour), 0), "h:mm a") },
    { value: `${hour}:30`, label: format(setMinutes(setHours(new Date(), hour), 30), "h:mm a") },
  ];
}).flat();

export function EmailScheduler({ scheduledAt, onScheduleChange }: EmailSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(scheduledAt || undefined);
  const [selectedTime, setSelectedTime] = useState<string>(
    scheduledAt ? format(scheduledAt, "H:mm") : "9:00"
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const [hour, minute] = selectedTime.split(":").map(Number);
      const scheduled = setMinutes(setHours(date, hour), minute);
      onScheduleChange(scheduled);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hour, minute] = time.split(":").map(Number);
      const scheduled = setMinutes(setHours(selectedDate, hour), minute);
      onScheduleChange(scheduled);
    }
  };

  const handleSmartTime = (day: "today" | "tomorrow", hour: number, minute: number) => {
    const baseDate = day === "today" ? new Date() : addDays(new Date(), 1);
    const scheduled = setMinutes(setHours(startOfDay(baseDate), hour), minute);
    setSelectedDate(scheduled);
    setSelectedTime(`${hour}:${minute === 0 ? "0" : minute}`);
    onScheduleChange(scheduled);
  };

  const clearSchedule = () => {
    setSelectedDate(undefined);
    setSelectedTime("9:00");
    onScheduleChange(null);
  };

  const formatScheduledDate = () => {
    if (!scheduledAt) return null;
    if (isToday(scheduledAt)) {
      return `Today at ${format(scheduledAt, "h:mm a")}`;
    }
    if (isTomorrow(scheduledAt)) {
      return `Tomorrow at ${format(scheduledAt, "h:mm a")}`;
    }
    return format(scheduledAt, "MMM d 'at' h:mm a");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Schedule Send</span>
      </div>

      {/* Smart Timing Suggestions */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="h-3 w-3" />
          <span>Smart Timing Suggestions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SMART_TIMES.slice(0, 2).map((time) => (
            <Button
              key={time.label}
              variant="outline"
              size="sm"
              className="text-xs h-auto py-2 flex-col items-start"
              onClick={() => handleSmartTime("today", time.hour, time.minute)}
            >
              <span className="font-medium">Today {time.label.split(" ")[0]}</span>
              <span className="text-muted-foreground text-[10px]">{time.reason}</span>
            </Button>
          ))}
          {SMART_TIMES.slice(0, 2).map((time) => (
            <Button
              key={`tomorrow-${time.label}`}
              variant="outline"
              size="sm"
              className="text-xs h-auto py-2 flex-col items-start"
              onClick={() => handleSmartTime("tomorrow", time.hour, time.minute)}
            >
              <span className="font-medium">Tomorrow {time.label.split(" ")[0]}</span>
              <span className="text-muted-foreground text-[10px]">{time.reason}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Date/Time Picker */}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < startOfDay(new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedTime} onValueChange={handleTimeSelect}>
          <SelectTrigger className="w-[120px]">
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {TIME_SLOTS.map((slot) => (
              <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Schedule Display */}
      {scheduledAt && (
        <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-primary">
            Scheduled: {formatScheduledDate()}
          </span>
          <Button variant="ghost" size="sm" onClick={clearSchedule} className="h-auto py-1 px-2 text-xs">
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
