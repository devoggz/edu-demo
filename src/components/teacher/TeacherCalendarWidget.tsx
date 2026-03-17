"use client";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: string;
  color: string | null;
  location: string | null;
  description: string | null;
}

export function TeacherCalendarWidget({ events }: { events: CalEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = monthStart.getDay();
  const paddedDays = Array(startPad).fill(null).concat(days);

  const dayEvents = events.filter((e) => isSameDay(new Date(e.startDate), selectedDay));

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.startDate), day));

  return (
    <div className="card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 text-lg">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-4 sm:mb-6">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const dayEvts = getEventsForDay(day);
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative flex flex-col items-center py-1.5 rounded-xl transition text-sm",
                selected ? "bg-blue-600 text-white" : today ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700",
                !isSameMonth(day, currentMonth) && "opacity-30"
              )}
            >
              <span>{format(day, "d")}</span>
              {dayEvts.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvts.slice(0, 3).map((e, idx) => (
                    <span
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selected ? "white" : (e.color ?? "#3b82f6") }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">
          {isToday(selectedDay) ? "Today" : format(selectedDay, "EEEE, MMM d")}
          <span className="ml-2 text-xs font-normal text-slate-400">{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</span>
        </h4>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No events scheduled</p>
          ) : (
            dayEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex gap-3 p-3 rounded-xl bg-slate-50 border-l-3 hover:bg-slate-100 transition"
                style={{ borderLeft: `3px solid ${evt.color ?? "#3b82f6"}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{evt.title}</p>
                  {evt.description && <p className="text-xs text-slate-500 truncate">{evt.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {format(new Date(evt.startDate), "HH:mm")} – {format(new Date(evt.endDate), "HH:mm")}
                    </span>
                    {evt.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" /> {evt.location}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full h-fit flex-shrink-0"
                  style={{ backgroundColor: `${evt.color}22`, color: evt.color ?? "#3b82f6" }}
                >
                  {evt.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
