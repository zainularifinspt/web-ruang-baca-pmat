# Supabase Storage Bucket: skripsi-pdf

Migration `20260522_thesis_pdf_storage.sql` membuat bucket `skripsi-pdf` secara otomatis.

Jika bucket perlu dibuat manual lewat Supabase Dashboard:

1. Buka Storage.
2. Buat bucket baru bernama `skripsi-pdf`.
3. Aktifkan public bucket agar halaman detail publik bisa menampilkan PDF.
4. Set file size limit ke `5 MB`.
5. Batasi MIME type ke `application/pdf`.

Kolom metadata PDF di tabel `public.theses`:

- `pdf_url`
- `pdf_filename`
- `pdf_size`
