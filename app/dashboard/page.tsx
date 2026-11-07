"use client";

import { DashboardOverview } from "@/components/dashboard-overview";
import { useRealtimeAttendances } from "@/hooks/use-realtime-attendances";
import { useRealtimeCatalogData } from "@/hooks/use-realtime-catalog-data";

export default function DashboardPage() {
  const {
    attendances,
    isLoading: attendanceLoading,
    error: attendanceError,
  } = useRealtimeAttendances(500);
  const {
    books,
    theses,
    collections,
    isLoading: catalogLoading,
    error: catalogError,
  } = useRealtimeCatalogData();
  return (
    <DashboardOverview
      {...{
        attendances,
        attendanceLoading,
        attendanceError,
        books,
        theses,
        collections,
        catalogLoading,
        catalogError,
      }}
    />
  );
}
