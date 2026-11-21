/** Disabled workflows retain their stored records and source for future use. */
export type InternalFeature = "loans" | "verification" | "whatsapp";

export const internalFeatures: Record<InternalFeature, boolean> = {
  loans: false,
  verification: false,
  whatsapp: false,
};

export const inactiveFeatureMessage = "Fitur ini sedang dinonaktifkan.";

const inactiveRoutes: Array<[string, InternalFeature]> = [
  ["/admin/peminjaman", "loans"],
  ["/admin/loans", "loans"],
  ["/dashboard/verifikasi", "verification"],
  ["/dashboard/whatsapp", "whatsapp"],
  ["/admin/submissions", "whatsapp"],
  ["/admin/whatsapp-petugas", "whatsapp"],
];

export function isInactiveInternalPath(pathname: string) {
  return inactiveRoutes.some(
    ([path, feature]) =>
      !internalFeatures[feature] &&
      (pathname === path || pathname.startsWith(`${path}/`)),
  );
}
