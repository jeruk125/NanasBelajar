/* ============================================
   QUIZ.JS - Logika halaman quiz.html (versi Flask)
   ============================================
   Di versi Flask, tanggung jawab file ini berkurang
   secara signifikan dibandingkan versi localStorage.

   SEBELUM (versi localStorage):
   - Memuat soal dari localStorage
   - Menampilkan soal ke HTML via innerHTML
   - Membaca radio button
   - Menghitung nilai
   - Menyimpan hasil ke localStorage
   - Mengarahkan ke halaman hasil

   SEKARANG (versi Flask):
   - Soal sudah di-render oleh Jinja2 di server (tidak perlu dimuat lagi)
   - Radio button sudah ada di HTML dari server
   - Nilai dihitung oleh Python di Flask (lebih aman)
   - Hasil disimpan ke SQLite oleh Flask
   - Submit dilakukan via HTML form POST biasa

   Yang masih dikerjakan JavaScript di sini:
   1. Validasi "semua soal sudah dijawab" SEBELUM form dikirim
      (sebagai kenyamanan pengguna, bukan satu-satunya penjagaan)
   2. Menampilkan pesan error ke halaman

   Catatan: Flask tetap memproses semua jawaban meskipun
   validasi JavaScript dilewati (misalnya jika JS dimatikan).
   ============================================ */


/**
 * Membersihkan teks dari karakter HTML berbahaya.
 * Digunakan saat memasukkan teks ke innerHTML.
 *
 * @param {string} teks
 * @returns {string}
 */
function tampilkanTeksSoal(teks) {
    if (!teks) return '';
    return String(teks)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


/**
 * Menampilkan pesan error di halaman quiz.
 * Dipanggil ketika ada soal yang belum dijawab.
 *
 * @param {string} pesan - teks pesan error
 */
function tampilkanPesanErrorQuiz(pesan) {
    var elPesan = document.getElementById('pesan-error-quiz');
    if (!elPesan) return;

    elPesan.textContent = pesan;
    elPesan.style.display = 'block';
    elPesan.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
