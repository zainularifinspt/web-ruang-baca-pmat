import { Check, Minus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { permissionLabels, roleLabels, rolePermissions } from "@/lib/mock-data";
import type { Permission, Role } from "@/lib/types";

const permissions = Object.keys(permissionLabels) as Permission[];
const roles = Object.keys(roleLabels) as Role[];

export default function PermissionMatrixPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hak akses"
        title="Matriks Hak Akses"
        description="Ringkasan hak akses tiap peran untuk memudahkan peninjauan alur Admin Prodi, Dosen, Petugas, dan Mahasiswa."
      />
      <SectionCard>
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Fitur</TableHead>
              {roles.map((role) => (
                <TableHead key={role}>{roleLabels[role]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission}>
                <TableCell className="font-medium">{permissionLabels[permission]}</TableCell>
                {roles.map((role) => {
                  const allowed = rolePermissions[role].includes(permission);
                  return (
                    <TableCell key={role}>
                      {allowed ? (
                        <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="size-4" />
                        </span>
                      ) : (
                        <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Minus className="size-4" />
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
