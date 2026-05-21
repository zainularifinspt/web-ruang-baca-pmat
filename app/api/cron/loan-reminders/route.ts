import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  sendLoanDueTodayReminder,
  sendLoanReminderH1,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type CronLoanRow = {
  id: string;
  item_type: "book" | "thesis";
  due_date: string;
  reminder_h1_sent_at: string | null;
  reminder_due_sent_at: string | null;
  borrower?: {
    name: string | null;
    phone: string | null;
  } | null;
  borrowers?: {
    name: string | null;
    phone: string | null;
  } | null;
  books?: {
    title: string | null;
  } | null;
  theses?: {
    title: string | null;
  } | null;
};

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!cronSecret) {
    console.error("[loan-reminders] CRON_SECRET kosong.");
    return NextResponse.json({ error: "CRON_SECRET belum dikonfigurasi." }, { status: 500 });
  }

  if (authorization !== `Bearer ${cronSecret}` && authorization !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const today = makassarDateString(0);
  const tomorrow = makassarDateString(1);
  const summary = {
    h1Sent: 0,
    dueTodaySent: 0,
    markedOverdue: 0,
    failed: 0,
  };

  const { data, error } = await supabaseAdmin
    .from("loans")
    .select("*, borrowers(name,phone), books(title), theses(title)")
    .eq("status", "active");

  if (error) {
    console.error("[loan-reminders] Failed to load active loans", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const loans = (data ?? []) as CronLoanRow[];

  for (const loan of loans) {
    const borrower = loan.borrowers ?? loan.borrower;
    const itemTitle = loan.item_type === "thesis" ? loan.theses?.title : loan.books?.title;

    if (loan.due_date === tomorrow && !loan.reminder_h1_sent_at) {
      const result = await sendLoanReminderH1({
        phone: borrower?.phone ?? "",
        borrowerName: borrower?.name ?? "Peminjam",
        itemTitle: itemTitle ?? "Koleksi",
        dueDate: loan.due_date,
      });

      if (result.ok) {
        await supabaseAdmin
          .from("loans")
          .update({ reminder_h1_sent_at: new Date().toISOString() })
          .eq("id", loan.id);
        summary.h1Sent += 1;
      } else {
        summary.failed += 1;
        console.error("[loan-reminders] H-1 reminder failed", {
          loanId: loan.id,
          message: result.message,
        });
      }
    }

    if (loan.due_date === today && !loan.reminder_due_sent_at) {
      const result = await sendLoanDueTodayReminder({
        phone: borrower?.phone ?? "",
        borrowerName: borrower?.name ?? "Peminjam",
        itemTitle: itemTitle ?? "Koleksi",
        dueDate: loan.due_date,
      });

      if (result.ok) {
        await supabaseAdmin
          .from("loans")
          .update({ reminder_due_sent_at: new Date().toISOString() })
          .eq("id", loan.id);
        summary.dueTodaySent += 1;
      } else {
        summary.failed += 1;
        console.error("[loan-reminders] Due today reminder failed", {
          loanId: loan.id,
          message: result.message,
        });
      }
    }
  }

  const { data: overdueRows, error: overdueError } = await supabaseAdmin
    .from("loans")
    .update({ status: "overdue" })
    .eq("status", "active")
    .lt("due_date", today)
    .select("id");

  if (overdueError) {
    summary.failed += 1;
    console.error("[loan-reminders] Failed to mark overdue loans", {
      error: overdueError.message,
    });
  } else {
    summary.markedOverdue = overdueRows?.length ?? 0;
  }

  return NextResponse.json({
    ok: true,
    today,
    tomorrow,
    ...summary,
  });
}

function makassarDateString(offsetDays: number) {
  const date = new Date();
  date.setUTCHours(date.getUTCHours() + 8);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}
