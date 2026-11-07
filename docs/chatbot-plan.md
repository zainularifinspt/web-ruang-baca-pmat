# Rencana flipbook, pencarian isi, dan chatbot Ruang Baca PMat

Status: rencana acuan yang disetujui, revisi 2, 7 November 2026. Implementasi awal dan konfigurasi produksi telah ditambahkan; hasil uji dan batas aktivasi dicatat di [reader-setup.md](reader-setup.md). Bagian temuan/perbandingan di bawah merekam kondisi saat perencanaan.

## 1. Tujuan dan keputusan yang sudah jelas

Pengunjung dapat membaca e-book dengan efek membalik halaman, mencari kata/frasa di seluruh bagian dokumen yang diizinkan, menanyakan isinya, dan membuka halaman bukti jawaban langsung dalam pembaca. Chatbot juga dapat merekomendasikan buku atau skripsi dari katalog Ruang Baca.

- Akses untuk semua pengunjung dengan batas pemakaian; tidak wajib login.
- Jawaban chatbot maksimal dua paragraf. Kartu sumber dan tombol navigasi terpisah dari narasi.
- Sumber jawaban hanya katalog dan isi dokumen Ruang Baca yang sudah diterbitkan dan boleh dibaca pengunjung.
- Tanpa pencarian internet, unggahan PDF bebas oleh pengunjung, atau URL bebas sebagai sumber AI.
- Prioritas visual baru adalah flipbook e-book. Pembaca skripsi tetap dapat menerima tautan halaman chatbot; penerapan efek flip pada skripsi tidak otomatis masuk cakupan awal.
- Bahasa visual mengikuti halaman depan: marun, panel glassmorphism, tipografi Plus Jakarta Sans, dan kedalaman yang mendukung pengalaman membaca.
- Data lama dan integrasi katalog tetap dipertahankan. Tidak mengaktifkan kembali fitur peminjaman, verifikasi, atau WhatsApp.

## 2. Temuan dari kode saat ini

- Stack: Next.js, Supabase, PDF.js. Belum ada indeks isi per halaman atau layanan chatbot.
- E-book berasal dari Apps Script/Google Drive dan memakai iframe Drive untuk membaca. Identitasnya memakai Drive file ID bila tersedia; fallback berdasarkan urutan baris perlu diganti sebelum bookmark dan indeks permanen dibuat.
- Skripsi dapat memakai Drive, Supabase Storage, atau Cloudflare Worker/R2. Sumber yang diproses harus sama dengan versi yang benar-benar dibaca pengunjung.
- Pembaca skripsi sudah memakai PDF.js, tetapi menonaktifkan worker dan mendeteksi Bab IV dengan membaca teks halaman secara berurutan sebelum menampilkan dokumen. Pola ini tidak langsung disalin ke flipbook baru karena berpotensi memperlambat pembukaan.
- Bab IV disembunyikan pada pembaca skripsi. Aturan yang sama perlu diterapkan pada aset halaman, indeks, pencarian, dan chatbot di server; sekadar menyembunyikan halaman di browser tidak cukup.
- Belum ada kontrak tautan yang membuka pembaca otomatis pada halaman tertentu.
- Buku fisik tanpa PDF tetap hanya dapat dicari berdasarkan metadata; isi dan nomor halaman tidak boleh ditebak.

Temuan ini dari kode, belum dari pengukuran PDF, konfigurasi CDN/R2, atau kapasitas database produksi.

## 3. Pengalaman membaca yang direncanakan

### Tampilan dan kontrol

- Desktop: dua halaman seperti buku terbuka, lipatan tengah, bayangan halaman lembut, dan animasi membalik yang singkat.
- Ponsel: satu halaman dengan geser atau tombol; ukuran teks buku lebih penting daripada mempertahankan tampilan dua halaman.
- Area buku memakai latar netral supaya rumus dan teks jelas. Glassmorphism berada pada toolbar/panel pendamping, bukan menutupi isi halaman.
- Kontrol: halaman sebelumnya/berikutnya, input nomor halaman, zoom, layar penuh, daftar isi jika tersedia, thumbnail, cari isi, dan “Tanya buku ini”. Tidak mengarang daftar isi jika dokumen tidak menyediakan struktur yang dapat dipercaya.
- Mode baca biasa/vertikal tersedia sebagai alternatif, khususnya saat zoom, menggunakan keyboard/pembaca layar, atau memilih pengurangan animasi.
- Keyboard, fokus, label tombol, kontras, dan area sentuh memadai. Efek flip tidak menghalangi seleksi teks atau interaksi panel.
- Thumbnail dimuat saat panel dibuka dan hanya untuk bagian daftar yang terlihat.

### Panel pencarian dan chatbot

Panel samping di desktop; panel geser dengan tab Cari/Tanya di ponsel. Saat panel dibuka, buku menyesuaikan ruang tanpa terjepit terlalu kecil. Pada zoom tinggi, prioritas beralih ke pembacaan satu halaman dengan gerakan geser/pan yang jelas.

Pencarian menampilkan cuplikan, label halaman, jumlah hasil yang diketahui, dan pemuatan hasil berikutnya. Klik hasil membuka halaman yang sesuai dan menyorot lokasi teks jika koordinat tersedia. Pencarian biasa tidak memerlukan layanan AI dan tetap dapat digunakan ketika kuota chatbot habis.

“Tanya buku ini” mengunci konteks awal ke dokumen yang dibaca. “Tanya halaman ini” membatasi ke halaman aktif, atau pasangan halaman yang ditampilkan dengan label yang jelas. Perluasan ke seluruh buku/lintas koleksi hanya dilakukan melalui pilihan yang terlihat oleh pengguna.

Saat chatbot menemukan rujukan, tombol “Buka halaman …” menggunakan pengendali navigasi flipbook yang sama dengan hasil pencarian. Lompat ke halaman jauh tidak menjalankan animasi melewati semua halaman sebelumnya. Jika jawaban masih disusun lalu pengguna mengganti buku, respons tetap diberi label sumber buku asal dan tidak berpindah konteks diam-diam.

## 4. Pilihan arsitektur pembaca

| Pendekatan | Kelebihan | Konsekuensi |
| --- | --- | --- |
| Render PDF.js di browser sesuai kebutuhan | Tidak wajib menyimpan gambar seluruh halaman; kualitas zoom mengikuti PDF | Waktu buka dipengaruhi struktur PDF, perangkat, akses file, dan dukungan Range; pengolahan PDF memakai CPU/memori pengunjung |
| Gambar halaman disiapkan di server, teks disimpan terpisah | Halaman dapat dikirim lewat CDN; proses berat dipindah dari sesi membaca; pencarian tidak menunggu PDF selesai diunduh | Ada pekerjaan pemrosesan awal, kebutuhan storage tambahan, dan pengelolaan versi aset |

**Rekomendasi untuk kebutuhan ini:** halaman flipbook menggunakan gambar teroptimasi yang dibuat di latar, dilengkapi teks/koordinat per halaman. PDF asli tetap menjadi sumber kanonis. Versi gambar resolusi lebih tinggi dimuat hanya saat zoom. PDF.js dapat dipakai untuk ekstraksi/renderer cadangan yang sesuai, setelah diuji pada lingkungan pemrosesan; bukan kewajiban mem-parsing PDF penuh di browser pada pembukaan normal.

Kandidat efek membalik: StPageFlip karena mendukung halaman HTML/gambar, orientasi portrait/landscape, dan navigasi ke halaman tertentu. Pilihan library belum dikunci: prototipe harus membuktikan adaptasi React/Next.js, navigasi langsung, perubahan ukuran, overlay teks, dan pembatasan memori. Jangan memakai pemuat gambar seluruh buku secara eager. Jika mesin efek memerlukan seluruh bitmap dimuat, ganti/adaptasi mesin sebelum implementasi dilanjutkan.

## 5. Pembagian database dan penyimpanan berkas

Gunakan Supabase/Postgres untuk struktur data, pencarian, status, dan izin; gunakan object storage untuk PDF/gambar/berkas koordinat besar. Karena proyek sudah mengenal R2, R2 dengan domain aset dan cache CDN merupakan kandidat utama bagi aset baca publik. Konfigurasi produksi yang ada harus diperiksa dahulu; dukungan cache pada Worker tidak diasumsikan sudah aktif.

PDF/gambar tidak disimpan sebagai base64 atau kolom besar di tabel database. Tabel katalog `books`/`theses` tetap menjadi sumber metadata; fondasi pembaca merujuk koleksi tersebut, termasuk pemetaan koleksi eksternal.

| Struktur usulan | Isi dan fungsi |
| --- | --- |
| `reader_documents` | ID stabil, referensi koleksi/sumber eksternal, versi aktif, status publik, status siap-baca/cari/AI |
| `reader_document_versions` | Hash/versi sumber, object key PDF, jumlah halaman, versi aturan akses dan extractor, waktu pemrosesan |
| `reader_pages` | Versi dokumen, nomor halaman PDF, label tercetak, urutan tampil yang diizinkan, ukuran halaman, teks dan kualitas ekstraksi, referensi aset gambar/teks |
| `reader_chunks` | Potongan teks untuk chatbot, referensi versi dan halaman/rentang halaman, embedding, serta penunjuk ke teks sumber |
| `reader_jobs` | Antrean pemrosesan, tahap, percobaan ulang, kemajuan, kegagalan dan batas waktu |
| `chat_usage` | Penghitungan kuota anonim, token/biaya, masa berlaku; bukan tempat menyimpan isi percakapan permanen secara bawaan |

Untuk teks panjang/koordinat per kata, simpan hanya data yang diperlukan pencarian di database; berkas koordinat lengkap dapat ditempatkan di storage dan diambil hanya bagi halaman aktif. Hindari menyalin seluruh teks dokumen ke beberapa tabel tanpa kebutuhan. `reader_chunks` memakai ukuran potongan yang dievaluasi untuk pertanyaan dokumen, bukan satu embedding per gambar atau per kata.

### Indeks dan konsistensi

- Unique key halaman `(document_version_id, pdf_page_number)` dan indeks daftar halaman per versi.
- Unique key sumber eksternal yang stabil; Drive ID bila tersedia. Jangan memakai nomor baris spreadsheet sebagai identitas permanen.
- Pencarian kata/frasa: full-text index GIN, dibatasi dokumen/versi aktif. Mulai dengan normalisasi dan konfigurasi yang diuji untuk Bahasa Indonesia; jangan mengasumsikan kamus Indonesia sudah tersedia. Uji trigram terpisah bila pencarian salah ketik memang dibutuhkan.
- Pencarian makna chatbot: pgvector, dengan indeks vektor setelah volume data dan hasil uji membutuhkannya. Ukuran embedding dan indeks mengikuti model yang dipilih.
- RLS/izin pencarian hanya mengembalikan dokumen, halaman, dan potongan yang diizinkan. Endpoint yang memakai akses layanan server tetap wajib menerapkan pemeriksaan yang setara; service key tidak menjadi alasan melewati pembatasan.
- Ambil manifest ringkas pada awal sesi; jangan mengirim seluruh teks, embedding, thumbnail, atau koordinat semua halaman.
- Buku, halaman, hasil pencarian, dan jawaban memakai revisi yang sama. Versi baru diaktifkan secara atomik ketika aset dasarnya siap; hasil versi lama tidak dicampur ke buku versi baru.
- Perubahan dokumen atau izin menghapus hasil lama dari akses aktif. Pengetatan izin harus langsung memblokir versi/aset lama, bukan menunggu antrean selesai. Pembersihan objek lama dilakukan setelah kebijakan retensi/cache ditetapkan.

## 6. Penyimpanan dan distribusi aset

Susunan object key dapat mengikuti `documents/{document_id}/{revision}/pages/{pdf_page}/{variant}`. Nama final ditetapkan saat implementasi. Siapkan cover, thumbnail kecil, gambar baca, dan resolusi zoom hanya jika diperlukan. Ukuran/format WebP, AVIF, atau format lain diuji pada teks kecil, rumus, grafik, dan foto; kompresi tidak boleh mengorbankan keterbacaan.

- Browser mengambil aset publik yang diizinkan langsung dari CDN, tanpa melewatkan setiap gambar melalui fungsi aplikasi Next.js.
- Cache key mencakup revisi dan ukuran aset. Konten dapat dicache lama hanya jika cocok dengan kebijakan publik/retensi; perubahan izin membutuhkan blok akses dan invalidasi cache yang benar.
- Manifest/status mempunyai cache lebih singkat dan dapat diinvalidasi ketika versi aktif berubah.
- Isi yang dibatasi tidak berada di bucket/domain publik tanpa kontrol. Jangan membuat aset publik Bab IV lalu hanya menghilangkannya dari daftar halaman.
- Jalur PDF asli/cadangan tetap mengikuti izin dokumen. Fallback PDF mentah tidak boleh mengungkap bagian yang sengaja dibatasi.
- Saat file asli perlu diambil, uji Range/206, Content-Range, CORS, dan cache secara nyata. Tidak cukup hanya memasang header Accept-Ranges pada respons.
- Google Drive dapat tetap menjadi sumber pengelolaan. Pemrosesan membuat aset baca saat sinkronisasi, dengan akses sumber yang sah; membuka flipbook tidak bergantung pada permintaan Drive baru untuk setiap halaman.
- Jika menggunakan akses publik R2, utamakan domain produksi dengan aturan cache yang diuji; URL r2.dev bukan fondasi distribusi produksi.

## 7. Proses persiapan dokumen

Jalankan pekerjaan ekstraksi/render/OCR di antrean worker yang sesuai untuk PDF besar, bukan pada permintaan membuka buku atau permintaan chatbot. Pilihan layanan worker belum ditetapkan; uji dukungan runtime renderer, kebutuhan memori, waktu proses, dan biaya. Jangan mengasumsikan Cloudflare Worker yang melayani berkas sekarang cocok menjalankan semua pekerjaan rendering/OCR berat.

1. Sinkronkan koleksi nyata; keluarkan data fallback/demo dari indeks.
2. Tetapkan identitas dan revisi sumber; hindari pekerjaan ulang bila sumber dan konfigurasi tidak berubah.
3. Validasi jumlah/ukuran halaman dan ekstrak label halaman/struktur dokumen jika tersedia.
4. Terapkan kebijakan bab/halaman yang boleh ditampilkan. Jika deteksi pembatasan skripsi meragukan, tahan publikasi isi; metadata yang diizinkan tetap dapat dicari.
5. Buat gambar halaman dan thumbnail di latar. Ekstrak teks serta koordinatnya dari versi PDF yang sama.
6. Lakukan OCR hanya pada halaman yang membutuhkan; tandai mutu rendah. Rumus/tabel yang tidak dapat dibaca tidak boleh dijelaskan seolah sudah dipahami.
7. Susun indeks teks, potongan chatbot, dan embedding bagi bagian yang diizinkan saja. Pembuatan ringkasan tetap membawa rujukan.
8. Periksa kelengkapan dan aktifkan kemampuan yang sudah siap. Untuk versi awal, flipbook dinyatakan siap setelah aset baca semua halaman yang diizinkan selesai; pengunjung tidak memicu konversi seluruh buku saat membuka.

Status dipisah: `reader_ready`, `search_ready`, `ai_ready`. Flipbook yang sudah siap tetap bisa dibaca ketika indeks AI belum selesai atau layanan AI sedang gagal. Status admin dapat berupa antre, memproses, siap, siap sebagian, perlu OCR, dan gagal. Ini status pemrosesan teknis dokumen, bukan mengaktifkan ulang fitur verifikasi koleksi lama.

Selama buku baru diproses, tampilkan progres yang jujur dan opsi pembaca cadangan hanya bila aksesnya sesuai. Sistem tidak menampilkan tombol cari/tanya yang seolah siap padahal sumbernya belum tersedia.

## 8. Strategi kecepatan flipbook

1. Muat kode flipbook ketika pengguna membuka pembaca; modul chatbot baru dimuat ketika panel Tanya dibuka. Halaman katalog tidak membawa seluruh mesin pembaca dan AI.
2. Prioritaskan manifest ringkas dan halaman tujuan. Untuk tautan halaman 52, muat halaman/spread 52 terlebih dahulu, bukan cover lalu halaman 1 sampai 51.
3. Muat gambar untuk halaman yang tampak; prefetch sedikit halaman ke arah pengguna membaca. Batas awal prototipe: 2–4 halaman terdekat pada ponsel, 4–6 desktop, kemudian sesuaikan dari profil memori dan ukuran gambar.
4. Lepaskan gambar/kanvas terdecode yang jauh dari jendela baca. Placeholder ringan boleh mewakili urutan halaman, tetapi tidak boleh memuat ratusan bitmap. Uji mesin flip benar-benar mematuhi hal ini.
5. Resolusi mengikuti viewport. Muat gambar HD hanya saat zoom dan untuk halaman aktif; batalkan permintaan/render yang tidak lagi diperlukan saat pengguna melompat cepat.
6. Thumbnail dan teks/koordinat halaman dimuat bertahap saat diperlukan. Pencarian seluruh buku berjalan di server menggunakan indeks, sehingga browser tidak mengunduh semua teks agar bisa mencari.
7. Cache hasil pencarian per revisi dan query yang dinormalisasi, dengan izin sebagai bagian key bila berlaku. Riwayat baca anonim disimpan lokal; tidak perlu menulis database pada setiap gerakan membalik halaman.
8. Debounce pencarian, misalnya 250–350 ms, dan batalkan query lama. Hasil dipaginasi dan permintaan lama tidak menimpa query baru.
9. Optimalkan efek hanya pada buku dan halaman aktif. Hindari blur mahal pada seluruh kanvas/halaman, bayangan berat berlapis pada ratusan elemen, atau menjalankan render/OCR bersamaan dengan animasi membaca.
10. Jalur baca tidak menunggu chatbot, embedding, pengenalan Bab IV berulang, atau pemindaian teks seluruh PDF di browser.

## 9. Satu kontrak navigasi untuk pembaca, pencarian, dan chatbot

Gunakan penunjuk sumber kanonis `(document_id, revision, pdf_page_number)`. Label tercetak dan urutan halaman flipbook adalah atribut berbeda. Sampul tambahan, halaman kosong untuk spread, atau halaman yang dibatasi tidak boleh mengubah makna nomor halaman sumber.

Usulan URL pengguna: `/baca/{document_id}?page=52`, dengan revisi atau ID sumber tersertifikasi yang dapat diresolusikan server. Bentuk ini belum diimplementasikan. Rute lama buku/skripsi dapat mengarahkan ke pengendali yang sama tanpa memutus tautan katalog.

Satu pengendali menyediakan aksi buka halaman, buka hasil pencarian, dan buka rujukan chatbot. Hasil pencarian/AI memakai ID sumber yang valid dari server, bukan URL/nomor halaman karangan model. Pembaca mengambil label tercetak bila tersedia; jika tidak, tampilkan “halaman PDF”. PDF 52 tidak diasumsikan sama dengan halaman tercetak 52.

Jika dokumen berganti versi, halaman menjadi terlarang, atau aset hilang, jangan diam-diam membuka halaman lain. Jelaskan kondisinya dan tawarkan kembali ke dokumen/hasil terbaru. Sorotan memakai koordinat hasil ekstraksi/OCR yang sesuai versi dan transformasi halaman; fallback minimal tetap dapat membuka halaman tanpa mengaku sudah menyorot kalimat tepat.

## 10. Pencarian biasa dan chatbot memakai fondasi yang sama

Pencarian dalam flipbook memakai `reader_pages` dan indeks kata/frasa, tanpa panggilan model. Chatbot memakai `reader_chunks` dan pencarian kata kunci + makna, kemudian menyusun jawaban bersumber. Keduanya memakai ID, revisi, akses, nomor halaman, dan teks dasar yang sama.

Alur chatbot:

Pertanyaan → kuota publik → tentukan konteks buku/halaman/semua koleksi → ambil bukti yang diizinkan → periksa kecukupan → susun jawaban → validasi format dan rujukan → tampilkan maksimal dua paragraf + kartu sumber.

- Konteks “buku ini” tidak mengambil isi buku lain secara diam-diam.
- Pertanyaan umum dapat merekomendasikan koleksi dari metadata nyata; isi buku memerlukan teks yang berhasil diproses.
- Ringkasan keseluruhan tidak dibuat hanya dari satu-dua hasil pencarian lalu diklaim mewakili seluruh buku. Gunakan ringkasan bagian yang bersumber dari semua bagian yang diizinkan, atau jelaskan bahwa cakupannya terbatas.
- Usulan batas tambahan: 120–160 kata dan maksimal tiga kartu rekomendasi. Angka final belum ditetapkan.
- Jika bukti kurang, tanyakan judul/topik lebih spesifik atau jelaskan informasi belum tersedia dalam koleksi.
- Data akun, nomor kontak, presensi, draft internal, Bab IV/halaman terlarang, dan sumber internet tidak masuk sumber publik.
- Instruksi dalam PDF/pesan pengunjung tidak dapat mengubah aturan atau izin sistem. Validasi rujukan, jumlah paragraf, dan status akses dilakukan di server, bukan mengandalkan prompt saja.
- Jika format gagal, perbaiki secara terbatas lalu gunakan pesan aman. Jangan memotong teks secara mentah hingga kalimat atau sumber rusak.
- Rencana pengguna: DeepSeek V4.1 Flash untuk model percakapan. API langsung yang diperiksa pada 7 November 2026 memakai nama `deepseek-flash` dengan versi DeepSeek-V4.1-Flash-1017. Kualitas Bahasa Indonesia dan ketepatan rujukan tetap diuji. Model embedding dipilih terpisah; kunci hanya berada di server.

RAG menurunkan risiko kesalahan, bukan jaminan model selalu benar. Pertanyaan tanpa bukti perlu ditolak; evaluasi menyertakan jawaban yang seharusnya tidak diberikan.

## 11. Kuota, kapasitas, dan biaya

Untuk akses publik, kombinasikan batas per sesi, per alamat jaringan secara proporsional, dan pagu global. Sesi anonim dapat berganti dan satu jaringan dapat dipakai banyak pengunjung; keduanya bukan identitas orang yang pasti. Penghitungan kuota harus atomik di server dan penyimpanan kuota memiliki masa berlaku.

Pisahkan batas pencarian biasa, pembacaan aset, dan chatbot. Kuota AI habis tidak mematikan flipbook/pencarian kata. Batas ukuran pertanyaan, panjang riwayat, jumlah sumber, serta batas waktu menjaga biaya dan latensi. Riwayat chat tidak disimpan permanen secara bawaan; simpan agregat pemakaian dan kegagalan secukupnya.

Perkiraan kapasitas dihitung dari sampel:

- Storage gambar = jumlah halaman × rata-rata ukuran semua varian yang dipertahankan.
- Database teks = jumlah halaman × rata-rata teks per halaman, ditambah indeks, metadata, dan ruang pengoperasian database.
- Vektor dasar float32 ≈ jumlah potongan × dimensi embedding × 4 byte, sebelum indeks dan overhead database.
- Transfer pembaca = aset halaman yang benar-benar dibuka dan diprefetch, dipengaruhi hit cache CDN; bukan otomatis ukuran seluruh koleksi setiap kunjungan.

Ilustrasi aritmetika, bukan pengukuran proyek: 20.000 halaman dengan satu varian rata-rata 400 KB membutuhkan sekitar 8 GB gambar; thumbnail dan varian zoom menambah kapasitas. Pemilihan jumlah resolusi harus berdasar sampel teks/rumus, bukan menyiapkan semua ukuran tanpa kebutuhan.

Biaya meliputi pemrosesan awal dan ulang, OCR, storage gambar/PDF, database dan indeks, permintaan/CDN, worker, serta AI percakapan. Jangan menganggap layanan gratis hanya karena salah satu komponen mempunyai kebijakan transfer murah. Biaya pasti belum dapat dihitung tanpa jumlah/ukuran dokumen, hasil kompresi, trafik, dan model.

## 12. Target performa untuk dibuktikan

Angka berikut adalah sasaran prototipe, bukan hasil ukur atau janji produksi. Uji dengan profil yang ditetapkan, misalnya ponsel kelas menengah, jaringan 10 Mbps dan RTT 100 ms, serta sampel dokumen nyata dari kecil sampai ratusan halaman.

| Aspek | Sasaran awal |
| --- | --- |
| Halaman tujuan pertama dapat dibaca, aset sudah diproses | p75 ≤ 2 detik dengan CDN hangat; ukur cold cache secara terpisah |
| Transfer awal pembaca | Usahakan ≤ 1 MB untuk manifest, kode esensial, dan halaman awal pada profil uji; sesuaikan bila teks/rumus memerlukan kualitas lebih tinggi |
| Animasi halaman yang sudah siap | Mendekati 60 fps pada perangkat desktop uji; pada ponsel, prioritaskan gerakan stabil dan mode ringan |
| Pencarian isi | p95 ≤ 800 ms setelah debounce, pada volume uji yang disepakati |
| Halaman jauh dari hasil cari/AI | Langsung memuat halaman tujuan; tidak memindai seluruh buku atau memutar semua halaman sebelumnya |
| Memori | Tetap dibatasi jendela halaman aktif; tidak naik sebanding seluruh halaman buku sepanjang sesi |
| Chatbot | Diukur terpisah dari pembukaan flipbook; model lambat tidak memperlambat jalur baca |

Gunakan pengujian cold/warm cache, ponsel berdaya rendah, PDF campuran orientasi, teks kecil, rumus, scan, serta perpindahan cepat ke halaman jauh. Ukur aset tertransfer, jumlah bitmap aktif, penggunaan memori yang dapat diamati, waktu halaman terbaca, dan ketepatan halaman/sorotan. Sesuaikan target dari hasil prototipe sebelum menjanjikan layanan.

## 13. Urutan implementasi yang diperbarui

1. **Audit sampel dan prototipe performa.** Periksa Drive/R2, ukuran halaman, OCR, identitas stabil, izin dan pemetaan halaman. Bandingkan PDF.js on-demand dan gambar CDN pada sampel yang sama; buktikan mesin flip tidak memuat semua bitmap.
2. **Fondasi dokumen/database dan pemrosesan.** Buat model versi/halaman/antrean, aset baca, teks per halaman, kebijakan akses, dan jalur distribusi CDN. Siapkan pembaca cadangan yang diizinkan selama proses berlangsung.
3. **Flipbook e-book dan pencarian isi.** Bangun UI desktop/ponsel, lazy loading, batas memori, zoom, thumbnail, navigasi halaman langsung, dan pencarian teks dengan sumber halaman yang sama.
4. **Integrasi chatbot.** Tambah embeddings/retrieval, konteks buku/halaman, jawaban dua paragraf, kartu sumber yang dapat membuka halaman, penolakan di luar koleksi, dan kuota publik. Hubungkan navigasi sumber skripsi ke kontrak yang sama tanpa memperluas akses bab.
5. **Uji penerimaan dan peluncuran terbatas.** Uji kecepatan, kualitas baca, aksesibilitas, kuota, biaya, pembaruan versi, penolakan chatbot, dan perlindungan isi terbatas. Perluas OCR/fitur lain setelah fondasi memenuhi kriteria.

Tidak mulai dari widget chatbot terpisah lalu membuat indeks kedua untuk flipbook. Fondasi dokumen dibuat dahulu agar pencarian, tampilan, dan jawaban mempunyai sumber yang konsisten.

## 14. Kriteria selesai versi awal

- E-book terbuka sebagai flipbook yang terbaca jelas di desktop dan ponsel, dengan mode baca alternatif yang dapat dipakai.
- Membuka buku atau melompat ke halaman tidak menunggu pengunduhan/pemrosesan seluruh PDF pada jalur baca normal.
- Memori dan permintaan aset dibatasi; thumbnail/HD tidak diambil seluruhnya pada awal sesi.
- Cari kata/frasa bekerja pada bagian yang siap dan diizinkan; hasil membuka halaman benar, dengan sorotan bila tersedia.
- Chatbot dapat mencari koleksi serta menanyakan isi buku/halaman aktif; narasi tidak melebihi dua paragraf.
- Kartu sumber mengarah ke dokumen, revisi, dan halaman yang mendukung jawaban. Sampul tambahan/halaman tersembunyi tidak menggeser referensi.
- Buku tanpa PDF, OCR buruk, dan dokumen yang belum siap tidak menghasilkan klaim isi lengkap.
- Bab IV/halaman tersembunyi tidak tersedia melalui aset publik, cache, teks, pencarian, ringkasan, chatbot, atau tautan.
- Pembaruan/penghapusan/pengetatan akses dokumen tidak meninggalkan sumber aktif usang.
- Pencarian dan pembaca tetap berfungsi saat layanan AI gagal atau kuota habis.
- Target kecepatan diukur dengan kondisi uji yang jelas; tidak menyebut target sebagai hasil sebelum pengujian.

Keputusan tersisa sebelum implementasi penuh: layanan pemrosesan latar, storage/domain/cache produksi, anggaran dan kuota, penyedia akses DeepSeek dan model embedding, batas ukuran/jumlah halaman, serta hasil pemilihan mesin flip dari prototipe. Semua merupakan pilihan teknis/operasional yang masih berupa usulan, bukan konfigurasi yang sudah diubah.

## Referensi teknis

- [StPageFlip](https://nodlik.github.io/StPageFlip/) dan [API PageFlip](https://nodlik.github.io/StPageFlip/docs/classes/pageflip.html) — kemampuan flip dan navigasi; kandidat perlu dibuktikan pada prototipe.
- [Mozilla PDF.js FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions) — memori render halaman dan dukungan HTTP Range yang bergantung pada file/server.
- [Mozilla PDF.js API](https://mozilla.github.io/pdf.js/api/draft/api.js.html) — ekstraksi teks dan label halaman bila tersedia.
- [Cloudflare R2: public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/) — distribusi melalui domain sendiri, cache, dan batas penggunaan r2.dev.
- [Cloudflare R2: Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) — pengambilan objek dan dukungan range untuk jalur layanan berkas.
- [Supabase: Hybrid search](https://supabase.com/docs/guides/ai/hybrid-search) — pencarian kata kunci dan makna.
- [Supabase: RAG with permissions](https://supabase.com/docs/guides/ai/rag-with-permissions) — pembatasan dokumen/halaman yang menjadi sumber jawaban.
- [OWASP: LLM Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) — menjaga batas instruksi, data, dan izin aplikasi.


## 15. Rencana DeepSeek dan ilustrasi token

Pembaruan 7 November 2026: pengguna berencana memakai DeepSeek V4.1 Flash. Harga berikut khusus API langsung DeepSeek, bukan harga penyedia perantara, dan perlu diperiksa ulang sebelum implementasi/penetapan anggaran.

### Koleksi tidak dilatih ulang ke model

Teks PDF diekstrak per halaman, dibagi menjadi potongan berhalaman, lalu dibuatkan indeks kata kunci dan embedding. Data tersimpan dalam fondasi dokumen Ruang Baca. Saat pertanyaan masuk, aplikasi memilih bukti yang relevan dan mengirimkannya bersama instruksi dan konteks percakapan secukupnya ke DeepSeek. Model tidak menyimpan koleksi secara permanen sebagai pengetahuan khusus website hanya karena pernah menerima teksnya.

Ekstraksi teks dan pembuatan gambar flipbook tidak dengan sendirinya menghabiskan token DeepSeek. OCR bisa mempunyai biaya terpisah bergantung mesin yang digunakan. Embedding memakai model khusus yang dipilih terpisah; API embedding dikenai harga penyedianya, sedangkan model lokal tetap membutuhkan sumber daya komputasi. Tokenizer embedding dan DeepSeek dapat menghitung teks yang sama secara berbeda.

### Snapshot metadata katalog dan skenario khusus proyek

Respons katalog publik yang diperiksa pada 7 November 2026 memuat 43 e-book dan 193 skripsi, semuanya mempunyai tautan PDF pada metadata; endpoint tidak melaporkan error. Ini bukan audit keberhasilan unduh, halaman, teks, maupun OCR setiap file, dan bukan hitungan koleksi internal yang belum terbit.

Total pada respons: 236 dokumen. Jika secara ilustratif masing-masing mempunyai rata-rata 150 halaman yang boleh diindeks dan 800 token teks per halaman, volumenya 236 × 150 × 800 = 28.320.000 token teks. Dengan asumsi overlap 15% dan tokenizer yang sama, porsi teks yang diproses embedding sekitar 32.568.000 token. Tokenizer model embedding bisa berbeda sehingga angka token API sebenarnya harus dihitung ulang. Ini tidak otomatis menjadi tagihan token DeepSeek. Jika contoh teks 28,32 juta token dipakai untuk satu pass ringkasan DeepSeek, biaya input ilustratifnya USD4,25–8,50, belum keluaran dan overhead pemrosesan. Ringkasan generatif semua dokumen tetap opsional.

### Ilustrasi volume koleksi — bukan hitungan proyek

Asumsikan rata-rata 150 halaman teks yang diizinkan per dokumen dan 800 token per halaman. Kepadatan nyata dapat jauh berbeda untuk rumus, scan, gambar, dan Bahasa Indonesia; angka ini bukan hasil pengukuran tokenizer pada koleksi aktual.

| Jumlah dokumen | Jumlah halaman asumsi | Volume teks dasar | Ilustrasi input embedding, tambahan overlap 15% |
| --- | --- | --- | --- |
| 100 | 15.000 | 12 juta token | 13,8 juta token |
| 500 | 75.000 | 60 juta token | 69 juta token |
| 1.000 | 150.000 | 120 juta token | 138 juta token |

Volume tersebut tidak otomatis menjadi tagihan DeepSeek. Untuk biaya embedding, gunakan tokenizer dan tarif model embedding yang benar. Tidak semua buku harus dikirim seluruhnya ke DeepSeek. Jika kemudian dibuat ringkasan generatif seluruh koleksi, itu pekerjaan tambahan: contoh satu pass input 60 juta token berbiaya input USD9–18 dengan tarif di bawah, sebelum token keluaran, prompt berulang, dan tahap ringkasan bertingkat. Ringkasan semua dokumen bukan prasyarat untuk pencarian isi dan tanya bagian tertentu.

### Ilustrasi percakapan

Satu pertanyaan normal diasumsikan memakai satu panggilan non-thinking, 5.000 token input (instruksi, pertanyaan, potongan sumber, dan riwayat terbatas) serta 300 token output. Ini target anggaran contoh, bukan janji bahwa setiap pertanyaan selalu memakai jumlah tersebut. Kartu sumber dan JSON juga menghabiskan token apabila dihasilkan model. Validasi aplikasi tetap diperlukan untuk batas dua paragraf.

Tarif yang diperiksa: input cache miss USD0,15 per juta token off-peak / USD0,30 peak; output USD0,60 / USD1,20 per juta token. Perhitungan contoh tidak mengandalkan diskon cache.

| Pertanyaan | Input | Output | Biaya percakapan off-peak | Biaya percakapan peak |
| --- | --- | --- | --- | --- |
| 1.000 | 5 juta token | 300 ribu token | USD0,93 | USD1,86 |
| 10.000 | 50 juta token | 3 juta token | USD9,30 | USD18,60 |

Biaya di atas hanya panggilan jawaban DeepSeek pada asumsi tersebut: belum termasuk embedding pertanyaan, OCR, pengindeksan/ringkasan tambahan, retry, reranking bermodel, database, storage/CDN, worker, dan pajak/biaya penyedia perantara. Thinking default-nya aktif menurut dokumentasi; token reasoning termasuk batas output API, sehingga dua paragraf yang terlihat tidak membatasi seluruh komputasi keluaran. Usulan awal adalah non-thinking untuk pertanyaan koleksi/rujukan sederhana, lalu diuji kualitasnya; kebutuhan reasoning yang lebih rumit diberi anggaran tersendiri.

Kalkulasi sebenarnya harus mengambil sampel teks yang diizinkan dari dokumen nyata, menghitung dengan tokenizer yang sesuai, dan mengukur statistik usage API pada kumpulan pertanyaan acuan. Jumlah koleksi atau ukuran PDF dalam MB saja tidak cukup untuk menentukan tagihan token.

Referensi: [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/), [Token & Token Usage](https://api-docs.deepseek.com/quick_start/token_usage/), [Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/), dan [Responses API](https://api-docs.deepseek.com/api/create-response/).
