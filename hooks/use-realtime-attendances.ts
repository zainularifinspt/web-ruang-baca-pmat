"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { Attendance } from "@/lib/types";

type AttendanceApiRow = {
  id: string;
  visitor_name: string;
  nim_nip: string;
  visitor_status: string;
  study_program: string;
  purpose: string;
  attendance_status: string;
  visited_at: string;
};

export function useRealtimeAttendances(limit = 100) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadAttendances() {
      try {
        const response = await fetch(`/api/attendance?limit=${limit}`, { cache: "no-store" });
        const payload = (await response.json()) as { rows?: AttendanceApiRow[]; error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat data presensi");
        }

        if (!isActive) return;

        setAttendances((payload.rows ?? []).map(mapAttendanceRow));
        setError(null);
      } catch (caughtError) {
        if (!isActive) return;

        setAttendances([]);
        setError(caughtError instanceof Error ? caughtError.message : "Gagal memuat data presensi");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    const loadTimer = window.setTimeout(() => {
      void loadAttendances();
    }, 0);

    let supabase: ReturnType<typeof getSupabaseClient> | null = null;

    try {
      supabase = getSupabaseClient();
    } catch {
      return () => {
        isActive = false;
        window.clearTimeout(loadTimer);
      };
    }

    const channel = supabase
      .channel("attendance-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        void loadAttendances();
      })
      .subscribe();

    return () => {
      isActive = false;
      window.clearTimeout(loadTimer);
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [limit]);

  return { attendances, isLoading, error };
}

export function mapAttendanceRow(row: AttendanceApiRow): Attendance {
  return {
    id: row.id,
    guestName: row.visitor_name || "Tanpa nama",
    guestNim: row.nim_nip || "-",
    visitorStatus: normalizeVisitorStatus(row.visitor_status),
    studyProgram: row.study_program || "Pendidikan Matematika",
    purpose: row.purpose || "Lainnya",
    visitedAt: row.visited_at,
    status: row.attendance_status === "Perlu Cek" ? "Perlu Cek" : "Berhasil",
  };
}

export function countVisitsForToday(items: Attendance[]) {
  const today = dateKey(new Date());
  return items.filter((item) => dateKey(new Date(item.visitedAt)) === today).length;
}

export function countVisitsForLastDays(items: Attendance[], days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  return items.filter((item) => new Date(item.visitedAt) >= startDate).length;
}

export function countVisitsForCurrentMonth(items: Attendance[]) {
  const now = new Date();
  const currentMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
  }).format(now);

  return items.filter((item) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Makassar",
      year: "numeric",
      month: "2-digit",
    }).format(new Date(item.visitedAt)) === currentMonth,
  ).length;
}

function normalizeVisitorStatus(value: string): Attendance["visitorStatus"] {
  if (value === "Dosen" || value === "Umum") return value;
  return "Mahasiswa";
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
