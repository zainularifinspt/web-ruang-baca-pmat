"use client";

import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { InitialAvatar } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleLabels, users } from "@/lib/mock-data";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengguna"
        title="Manajemen Peran dan Pengguna"
        description="Lihat daftar pengguna dan pratinjau pengaturan peran untuk kebutuhan akses ruang baca."
      />
      <SectionCard>
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIM/NIP</TableHead>
              <TableHead>No. WhatsApp</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <InitialAvatar name={user.name} />
                    <span className="font-semibold text-slate-950">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.nimNip}</TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell><Badge variant="secondary">{roleLabels[user.role]}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.info("Simulasi ubah peran", {
                        description: "Perubahan peran akan disimpan pada implementasi lengkap.",
                      })
                    }
                  >
                    <Pencil />
                    Ubah peran
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
