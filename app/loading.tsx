export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-rose-100 overflow-hidden" role="progressbar" aria-label="Memuat data...">
      <div className="h-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 animate-[pulse_1s_ease-in-out_infinite] w-full" />
    </div>
  );
}

