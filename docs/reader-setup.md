# Flipbook dan asisten Ruang Baca

Implementasi awal, 7 November 2026, branch `codex/flipbook-chatbot`.

## Kondisi yang sudah diuji

- Pembaca `/baca/buku/{id}` dan `/baca/skripsi/{id}` memakai aset WebP yang disiapkan di latar. Pembukaan normal tidak mengunduh atau merender PDF penuh.
- Dua halaman pada desktop, satu pada ponsel; zoom memakai aset HD, mode halaman biasa tersedia, dan preferensi pengurangan gerak dihormati. Teks yang dapat dipilih tersedia melalui tombol baca teks.
- Pencarian isi, thumbnail bertahap, daftar isi PDF jika tersedia, dan tautan `?page={nomor PDF}&v={revisi}` menggunakan nomor halaman sumber yang sama. Label halaman cetak ditampilkan terpisah.
- Chatbot menyediakan pencarian metadata tanpa model, serta tanya isi melalui DeepSeek. Konteks bisa seluruh koleksi terindeks, satu dokumen, atau satu halaman. Jawaban diperiksa maksimal dua paragraf/160 kata; kutipan harus berasal dari bukti yang disediakan. Model tidak memiliki alat internet.
- Panel admin **Dokumen Digital** (`/dashboard/dokumen`) menyediakan antrean pemrosesan dan status dasar. Worker terpisah harus aktif agar antrean bergerak.
- Dua dokumen nyata diproses secara **lokal**, bukan seluruh koleksi: satu e-book 313 halaman dan satu skripsi 78 halaman yang diizinkan. Setelah OCR, seluruh 78 halaman skripsi uji mempunyai teks hasil ekstraksi/OCR; akurasi OCR tetap bergantung kualitas pindai.
- Pengujian otomatis mencakup halaman tersembunyi, OCR, validasi sumber/jawaban, host unduhan, kuota paralel, dan migrasi/RPC PostgreSQL lokal. UI pencarian membuka halaman PDF 133 dan menyorot kata; jendela gambar desktop maksimal 6, ponsel 4 pada uji navigasi tersebut.

**Belum aktif di produksi:** migrasi Supabase belum diterapkan, kunci DeepSeek belum tersedia, penyimpanan/domain aset produksi belum dipilih, dan koleksi selain dua sampel belum diindeks. Respons AI nyata dan kualitasnya belum diuji; pengujian adaptor memakai respons simulasi. Target p75 dua detik/p95 pencarian dalam rencana belum dibuktikan pada jaringan produksi.

## Menjalankan lokal

Gunakan Node.js 22.15+ (direkomendasikan 24+) yang mendukung `module.registerHooks`, Python 3.10+, dan dependensi proyek:

```sh
npm ci
python3 -m venv .reader-data/venv
.reader-data/venv/bin/pip install -r scripts/reader-requirements.txt
```

Atur `.env.local`; jangan commit berkas ini:

```dotenv
READER_STORAGE=local
READER_PYTHON=.reader-data/venv/bin/python
READER_CATALOG_URL=http://127.0.0.1:3000
READER_EMBEDDING_URL=http://127.0.0.1:8788/embed
READER_EMBEDDING_MODEL=Xenova/multilingual-e5-small
DEEPSEEK_API_KEY=isi-di-komputer-atau-hosting
DEEPSEEK_MODEL=deepseek-flash
```

Jalankan dalam proses terpisah:

```sh
npm run dev
npm run reader:embeddings
npm run reader:worker
```

Layanan embedding mengunduh model multilingual saat pertama dijalankan lalu menggunakan cache lokal. Layanan ini adalah proses Node terpisah; model tidak dikirim ke browser atau dimasukkan ke fungsi Next.js. Default hanya menerima koneksi loopback. Hosting di mesin lain wajib memakai kunci `READER_EMBEDDING_KEY`, jaringan privat/HTTPS, dan URL yang dapat dijangkau aplikasi maupun worker. Semua vektor harus berasal dari model yang sama, 384 dimensi; mengganti model memerlukan pengindeksan ulang seluruh dokumen.

Masukkan dokumen melalui admin atau jalankan pengindeksan langsung saat aplikasi katalog aktif:

```sh
npm run reader:index -- --kind book --id ID_KOLEKSI
npm run reader:index -- --kind thesis --id ID_KOLEKSI
npm run reader:index -- --kind book --all
npm run reader:index -- --kind thesis --all
npm run reader:doctor
```

Pengindeksan langsung memproses satu dokumen secara berurutan. `--limit 3` membatasi sampel; `--force` memproses ulang dengan revisi baru meskipun sumber identik. Kegagalan satu dokumen dilaporkan dan dokumen berikutnya tetap dicoba. Data e-book fallback/contoh dan ID berdasarkan nomor urut tidak diindeks. Buku fisik tanpa PDF hanya tersedia pada pencarian metadata.

### OCR dan batas pemrosesan

Pasang Tesseract dari pengelola paket sistem dan sediakan model bahasa resmi `eng.traineddata` serta `ind.traineddata` dalam `.reader-data/tessdata` (atau `READER_TESSDATA_DIR`). `READER_OCR_LANGUAGES=eng+ind` memilih keduanya. Tanpa Tesseract/model, halaman tetap dapat dibaca sebagai gambar tetapi halaman pindai belum dapat dicari atau dijadikan bukti AI. OCR juga mencoba memperbaiki lapisan teks yang kata-katanya menyatu dan hanya memilih hasil dengan batas kata yang lebih baik. Teks yang masih rusak diberi penanda pada pencarian dan dikeluarkan dari bukti AI. OCR hanya berjalan saat pemrosesan latar.

Batas bawaan 150 MB/PDF (`READER_MAX_PDF_MB`, maksimum 250), 1.000 halaman, dan 10 menit per proses ekstraksi. PDF terkunci/ukuran halaman ekstrem ditolak. Batas host unduhan berupa daftar HTTPS yang diizinkan; tambahkan hostname penyimpanan resmi pada `READER_ALLOWED_PDF_HOSTS`, bukan URL dari pesan pengunjung.

## Mengaktifkan produksi

1. Terapkan `supabase/migrations/20261107_reader_chat.sql` pada proyek Supabase yang dipakai aplikasi. Migrasi menambah pgvector, tabel reader, RPC pencarian/kuota, serta trigger invalidasi katalog. Data katalog lama dipertahankan. Tabel reader dan RPC hanya dapat dipakai layanan server; tidak diberikan akses langsung kepada pengunjung.
2. Pilih `READER_STORAGE=supabase` untuk bucket privat `reader-assets`, atau `READER_STORAGE=r2` beserta `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_READER_BUCKET`. Metadata/teks/vektor tetap di Supabase pada kedua pilihan. Service role dan kunci R2 berada di server/worker.
3. Tambahkan `DEEPSEEK_API_KEY` dan `CHAT_SESSION_SECRET` acak minimal 32 karakter pada aplikasi. Contoh pembuatan secret lokal: `openssl rand -hex 32`. Jangan memakai secret contoh. Pastikan model dan tarif masih sesuai [dokumentasi DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/).
4. Jalankan layanan embedding dan worker pada mesin persisten yang mempunyai Python/OCR, CPU/memori, dan ruang kerja yang cukup. Fungsi Vercel hanya melayani permintaan; jangan menjalankan worker/model embedding di dalam fungsi serverless. URL katalog produksi harus dapat dijangkau worker.
5. Proses sampel dengan `--storage supabase`/`--storage r2`, uji akses, kutipan, OCR, pencarian, dan pembaruan versi. Setelah itu proses `--all` per jenis dan audit dokumen gagal. Aplikasi mengaktifkan revisi setelah aset serta data siap.
6. Jalankan `reader:doctor` menggunakan konfigurasi produksi, lalu uji akses admin dan AI nyata sebelum peluncuran publik.

Untuk cache/CDN, default aman memakai rute aset aplikasi dengan pemeriksaan dokumen/revisi/halaman. `READER_ASSET_BASE_URL` opsional mengalihkan gambar ke domain aset publik yang memetakan `{documentKey}/{revision}/{filename}`. Aktifkan hanya setelah kebijakan publik dan pencabutan cache disiapkan; URL langsung CDN tidak melewati pemeriksaan akses aplikasi. Bab IV tidak pernah dihasilkan pada pipeline skripsi. Jangan menyalin PDF skripsi utuh ke bucket publik sebagai fallback.

Pencarian SQL memakai GIN dengan konfigurasi `simple` dan pgvector 384 dimensi. Pencarian semantik awal masih memindai kandidat yang diizinkan; indeks HNSW dan optimasi kandidat perlu ditambahkan berdasarkan pengukuran ketika volumenya berkembang. Manifest hanya membawa metadata/URL halaman; teks dan koordinat diambil per halaman. Gambar/berkas PDF tidak disimpan sebagai base64 dalam tabel.

## Kuota dan biaya

Default per sesi anonim 4 pertanyaan/menit dan 20/hari; per jaringan 100/hari bila tersedia header proxy tepercaya; global 120/menit. Hari mengikuti Asia/Makassar. Cookie ditandatangani server, alamat jaringan hanya disimpan sebagai HMAC. Menghapus cookie dapat membuat sesi baru; pembatasan jaringan/global dan anggaran tetap diperlukan untuk akses publik. Di luar Vercel, jangan mengaktifkan `READER_TRUST_PROXY_HEADERS` kecuali proxy membersihkan header pengguna.

Default reservasi anggaran AI USD1/hari (`CHAT_DAILY_BUDGET_CENTS=100`). Reservasi memakai batas konservatif byte input + overhead, maksimal 700 token keluaran, dan tarif peak Flash USD0,30/1 juta input serta USD1,20/1 juta output. Ini pembatas operasional konservatif, **bukan** pencatatan tagihan aktual. Tidak ada retry otomatis ke model. Penghitungan request tetap berlaku untuk pencarian metadata/penolakan; hanya panggilan AI yang mencadangkan biaya. Katalog dan pencarian isi tetap dapat dipakai saat kuota AI habis.

Log server `reader_ai_usage` merekam model/jumlah token jawaban dari provider tanpa teks pertanyaan/bukti. Periksa usage dan tagihan provider untuk biaya nyata; perbarui perhitungan `reservedCost` bila model/tarif berubah. Embedding dan OCR lokal tidak menghabiskan token DeepSeek, tetapi memerlukan komputasi/storage. Riwayat percakapan hanya di memori browser, empat pesan terakhir dikirim untuk konteks, tidak disimpan permanen ke tabel.

## Akses dan perubahan dokumen

- Skripsi diproses hanya jika tepat satu batas heading Bab IV dan Bab V dapat dipastikan. Bagian Bab IV dikeluarkan sebelum gambar/teks/chunk dipublikasikan; jika ambigu, pemrosesan berhenti untuk peninjauan.
- Endpoint manifest, halaman, gambar, hasil cari, dan retrieval memeriksa dokumen publik serta revisi aktif. Tautan versi lama ditolak; nomor PDF tidak digeser oleh halaman yang disembunyikan.
- Update/delete katalog Supabase menonaktifkan reader lama melalui trigger. Jalankan antrean ulang setelah metadata/sumber berubah. Sumber Apps Script mengikuti cache metadata katalog yang ada (hingga lima menit); pencabutan darurat memerlukan menonaktifkan `reader_documents.is_public` dan membersihkan CDN bila digunakan.
- Berkas versi lama tidak dibersihkan otomatis; tentukan retensi, backup, serta pembersihan objek tak terpakai setelah peluncuran. Worker yang mati saat memproses meninggalkan status `processing`; periksa sebelum mengantre ulang. Saat ini belum ada dashboard biaya, retry terjadwal, atau heartbeat/recovery otomatis.
- Kualitas makna jawaban tetap harus diuji dengan pertanyaan acuan nyata. Pemeriksaan kutipan tidak membuktikan semua kalimat model benar; pertanyaan tanpa bukti dikembalikan sebagai penolakan, dan jawaban meragukan harus ditinjau melalui sumber.

## Verifikasi

```sh
npm run test:reader
npm run build
npm run lint
```

Tes database dilewati jika `READER_TEST_DATABASE_URL` kosong. Untuk menjalankannya gunakan PostgreSQL lokal dengan pgvector pada database kosong khusus pengujian yang namanya berakhiran `_test`, bukan database produksi. Pengguna pengujian harus dapat membuat schema/role/tabel. Tes menambahkan fixture sendiri, memeriksa migrasi dua kali, akses layanan, sumber yang diizinkan, invalidasi publikasi, serta kuota paralel.

Catatan pemeriksaan lint: lint pada modul reader dan pengujian baru lulus. `npm run lint` seluruh repositori masih menemukan lima error lama pada `realtime-visitor-chart.tsx`, `thesis-pdf-viewer.tsx`, dan `pdfjs-browser.ts`, serta peringatan pada kode/alat lokal yang tidak terkait perubahan ini.
