/* ============================================
   RESULT.JS - Logika halaman hasil & daftar nilai (versi Flask)
   ============================================
   Di versi Flask, halaman hasil.html dan daftar-nilai.html
   dirender sepenuhnya oleh Jinja2 di server.

   SEBELUM (versi localStorage):
   - Membaca quizResults dari localStorage
   - Membaca quizIndeksHasilTerakhir dari localStorage
   - Membangun HTML tabel daftar nilai via innerHTML
   - Membangun HTML review jawaban via innerHTML

   SEKARANG (versi Flask):
   - Data hasil diambil dari SQLite oleh Flask
   - HTML dirender oleh Jinja2 (lihat templates/hasil.html
     dan templates/daftar-nilai.html)
   - JavaScript tidak perlu menyentuh data hasil sama sekali

   File ini dipertahankan karena:
   1. Memberikan penjelasan tentang perubahan arsitektur
   2. Menyediakan fungsi escapeHtml() sebagai utilitas umum
      jika sewaktu-waktu dibutuhkan halaman lain

   localStorage yang dulu digunakan di file ini:
   - quizResults          → sekarang di tabel quiz_results (SQLite)
   - quizIndeksHasilTerakhir → sekarang pakai result_id di URL (/hasil/17)
   ============================================ */


/**
 * Escape karakter HTML untuk mencegah XSS.
 * Fungsi utilitas umum - tetap dipertahankan.
 *
 * @param {string} teks
 * @returns {string}
 */
function escapeHtml(teks) {
    if (!teks) return '';
    return String(teks)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
