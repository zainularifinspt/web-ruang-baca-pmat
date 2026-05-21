import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { fetchCatalogData } from "@/lib/supabase";
import {
  VerificationQueue,
  type VerificationQueueItem,
} from "@/app/dashboard/verifikasi/verification-queue";
import type { DraftSubmissionType } from "@/lib/whatsapp-drafts";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const { books, theses, error } = await fetchCatalogData();
  const draftQueue = await fetchWhatsappDraftQueue();
  const catalogQueue: VerificationQueueItem[] = [...books, ...theses]
    .filter((item) => item.verificationStatus === "pending")
    .map((item) => ({
      kind: "catalog",
      id: `${item.type}-${item.id}`,
      title: item.title,
      typeLabel: item.type === "book" ? "Buku" : "Skripsi",
      source: item.inputSource,
      sender: item.inputBy,
      status: item.verificationStatus,
      createdAt: item.createdAt,
      item,
    }));
  const queue = [...catalogQueue, ...draftQueue]
    .sort(
      (first, second) =>
        Date.parse(second.createdAt) - Date.parse(first.createdAt),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verifikasi"
        title="Antrean Verifikasi Buku dan Skripsi"
        description="Koleksi baru tidak tampil di katalog publik sebelum admin menekan setujui."
      />

      {error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTitle>Data Supabase belum dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <SectionCard>
        <VerificationQueue items={queue} />
      </SectionCard>
    </div>
  );
}

type DraftSubmissionQueueRow = {
  id: string;
  sender_phone: string | null;
  sender_name: string | null;
  submitted_by: string | null;
  type: DraftSubmissionType | null;
  title: string | null;
  author: string | null;
  year: number | null;
  category: string | null;
  description: string | null;
  raw_message: string | null;
  parsing_error: boolean | null;
  unknown_sender: boolean | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type SenderProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

async function fetchWhatsappDraftQueue(): Promise<VerificationQueueItem[]> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const [
      { data: submissions, error: submissionsError },
      { data: profiles, error: profilesError },
      { data: petugasRows, error: petugasError },
    ] = await Promise.all([
      supabaseAdmin
        .from("draft_submissions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id,full_name,email"),
      supabaseAdmin.from("whatsapp_petugas").select("nama,phone_number,profile_id"),
    ]);

    if (submissionsError || profilesError || petugasError) {
      console.error("[verification-queue] Failed to load WhatsApp draft queue", {
        submissionsError: submissionsError?.message,
        profilesError: profilesError?.message,
        petugasError: petugasError?.message,
      });
      return [];
    }

    const profilesById = Object.fromEntries(
      ((profiles ?? []) as SenderProfile[]).map((profile) => [profile.id, profile]),
    );
    const petugasByPhone = Object.fromEntries(
      ((petugasRows ?? []) as Array<{ nama: string | null; phone_number: string | null; profile_id: string | null }>)
        .filter((row) => row.phone_number)
        .map((row) => [row.phone_number as string, { nama: row.nama, profile_id: row.profile_id }]),
    );

    return ((submissions ?? []) as DraftSubmissionQueueRow[]).map((submission) => {
      const sender = getSenderName(submission, profilesById, petugasByPhone);

      return {
        kind: "whatsapp-draft",
        id: submission.id,
        title: submission.title || "Judul belum terbaca",
        typeLabel: typeLabel(submission.type),
        source: "WhatsApp",
        sender: submission.sender_phone ? `${sender} (${submission.sender_phone})` : sender,
        status: submission.status,
        createdAt: submission.created_at,
        draftType: submission.type,
        author: submission.author,
        year: submission.year,
        category: submission.category,
        description: submission.description,
        rawMessage: submission.raw_message,
        parsingError: Boolean(submission.parsing_error),
        unknownSender: Boolean(submission.unknown_sender),
      };
    });
  } catch (error) {
    console.error("[verification-queue] Failed to load WhatsApp draft queue", {
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

function getSenderName(
  submission: DraftSubmissionQueueRow,
  profilesById: Record<string, SenderProfile>,
  petugasByPhone: Record<string, { nama: string | null; profile_id: string | null }>,
) {
  if (submission.submitted_by && profilesById[submission.submitted_by]) {
    return profilesById[submission.submitted_by].full_name ?? profilesById[submission.submitted_by].email ?? "Profil petugas";
  }

  const petugas = submission.sender_phone ? petugasByPhone[submission.sender_phone] : undefined;
  if (petugas?.profile_id && profilesById[petugas.profile_id]) {
    return profilesById[petugas.profile_id].full_name ?? petugas.nama ?? "Petugas WhatsApp";
  }

  return petugas?.nama ?? submission.sender_name ?? "Pengirim WhatsApp";
}

function typeLabel(type: DraftSubmissionType | null) {
  if (type === "book") return "Buku";
  if (type === "thesis") return "Skripsi";
  return "Perlu diperbaiki";
}
