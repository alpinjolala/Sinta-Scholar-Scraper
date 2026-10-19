# SINTA & Google Scholar Publication Scraper

Ekstensi Google Chrome (Manifest V3) yang dirancang khusus untuk akademisi, dosen, dan peneliti guna mengekstrak (scraping) data publikasi secara otomatis dari profil **SINTA (Science and Technology Index)** dan **Google Scholar**. Data yang diekstrak akan langsung diunduh dalam format **CSV** yang dioptimalkan untuk Microsoft Excel.

## ✨ Fitur Utama

* **Ekstraksi SINTA Otomatis (Multi-Sumber):** 
  Mampu mengenali dan mengekstrak metadata spesifik berdasarkan *tab* yang sedang dibuka pada profil SINTA:
  * **Scopus:** Mengekstrak Ranking (Q1-Q4), Nama Jurnal, Link SINTA, Penulis, dan Jumlah Sitasi.
  * **Garuda:** Mengekstrak Akreditasi (S1-S6), Nama Jurnal, Link Garuda, Penulis, Link Tautan DOI asli, dan Jumlah Sitasi.
  * **Google Scholar (di SINTA):** Menggunakan *text-line parsing* cerdas untuk memisahkan Penulis dan Nama Jurnal secara presisi, beserta Link Pencarian Artikel dan Jumlah Sitasi.
* **Ekstraksi Google Scholar (Profil Utama):**
  Mengunjungi setiap tautan artikel secara otomatis di latar belakang untuk mengambil metadata lengkap: Judul, Penulis, Tahun Terbit, Jurnal, Penerbit, dan Abstrak/Deskripsi lengkap.
* **Pemilihan Halaman Dinamis:** 
  Menyediakan antarmuka (UI) pop-up di tengah layar untuk memilih apakah ingin mengekstrak "Semua Halaman" atau "Rentang Halaman Tertentu" (misal: Halaman 1 sampai 3).
* **Anti-Duplikasi (Deduplication):** 
  Secara otomatis mendeteksi dan menghapus artikel dengan judul ganda di SINTA.
* **Format Export Excel-Ready (CSV UTF-8 BOM):** 
  Hasil unduhan format `.csv` dijamin rapi, kolom tidak berantakan meski ada tanda koma/kutip pada abstrak, dan mendukung karakter khusus.
* **Aman & Anti-Blokir:** 
  Menggunakan jeda waktu (delay) logis antar eksekusi untuk mencegah pemblokiran IP oleh sistem *anti-bot* Google.

---

## 📂 Struktur Direktori Ekstensi

Pastikan keempat file ini berada di dalam satu folder yang sama:
* `manifest.json` — Konfigurasi utama ekstensi dan perizinan.
* `popup.html` — Antarmuka pengguna dasar saat ikon ekstensi diklik.
* `popup.js` — Skrip perantara untuk memicu mesin utama.
* `content.js` — Mesin utama (Core Engine) yang berisi logika DOM Parser, Fetch API, dan konversi CSV.

---

## 🚀 Cara Instalasi di Google Chrome

Ekstensi ini berjalan secara lokal dan belum diunggah ke Chrome Web Store. Ikuti langkah berikut untuk memasangnya secara manual:

1. Unduh (Clone/Download ZIP) repositori ini dan ekstrak ke dalam sebuah folder di komputer Anda (misal: `Sinta-Scholar-Scraper`).
2. Buka browser **Google Chrome**.
3. Ketik `chrome://extensions/` pada bilah alamat (URL bar) lalu tekan **Enter**.
4. Aktifkan **Developer mode** (Mode Pengembang) melalui sakelar di pojok kanan atas layar.
5. Klik tombol **Load unpacked** (Muat yang belum dikemas) yang muncul di pojok kiri atas.
6. Pilih folder `Sinta-Scholar-Scraper` yang sudah Anda buat tadi.
7. Ekstensi berhasil dipasang! Klik ikon **Puzzle (Ekstensi)** di pojok kanan atas browser, lalu klik ikon **Pin** 📌 agar selalu terlihat.

---

## 💡 Cara Penggunaan

1. Buka halaman profil peneliti di target yang diinginkan:
   * **SINTA:** `https://sinta.kemdiktisaintek.go.id/authors/profile/xxxx` (Anda bebas memilih tab Scopus, Garuda, atau Google Scholar di halaman tersebut).
   * **Google Scholar:** `https://scholar.google.com/citations?user=xxxx`
2. Klik ikon ekstensi berwarna hijau di pojok kanan atas browser.
3. Klik tombol **Scrape Halaman Ini**.
4. Akan muncul kotak dialog di layar. Pilih mode yang diinginkan:
   * **Ambil Semua Halaman:** Memindai profil dari awal hingga data habis.
   * **Pilih Halaman Tertentu:** Masukkan rentang halaman (misal dari halaman 1 sampai 2).
5. Klik **Mulai Ekstrak**.
6. Biarkan tab browser tetap terbuka. Anda akan melihat indikator loading di pojok kanan atas yang menunjukkan proses penarikan data.
7. Setelah selesai, file `Data_Publikasi_SINTA_xxx.csv` atau `Data_Publikasi_SCHOLAR_xxx.csv` akan otomatis terunduh.

---

## ⚠️ Catatan Penting & Batasan

1. **Jeda Waktu (Delay):** Untuk ekstraksi Google Scholar, ekstensi ini memaksa jeda sekitar 3 detik per artikel. Ini **disengaja** agar IP Anda tidak diblokir sementara oleh sistem reCAPTCHA Google. Mohon bersabar saat memproses profil dengan ratusan publikasi.
2. **Ketergantungan Struktur HTML:** Skrip ini membaca struktur kelas HTML SINTA dan Scholar (seperti `.ar-item`, `.gsc_a_tr`). Jika pihak SINTA atau Google mengubah desain antarmuka situs mereka, ekstensi ini mungkin memerlukan pembaruan kode pada file `content.js`.
3. **Kualitas Data:** Data yang dihasilkan berbanding lurus dengan kelengkapan data yang diinput oleh peneliti di profil SINTA atau Scholar masing-masing (misal: jika DOI tidak ditautkan di SINTA, maka hasil CSV akan berisi strip `-`).

---

## 🤝 Kontribusi

Proyek ini bersifat *Open Source*. Jika Anda menemukan *bug* struktur SINTA yang baru, atau memiliki ide peningkatan fitur (seperti sinkronisasi ke database atau integrasi WoS), silakan buat *Pull Request* atau laporkan pada *Issues*.

## 📄 Lisensi

Didistribusikan di bawah **MIT License**. Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode ini baik untuk keperluan pribadi maupun komersial.
