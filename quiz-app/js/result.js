/* ============================================
   RESULT.JS - Logika halaman hasil & daftar nilai
   ============================================
   File ini menangani dua halaman:
   1. hasil.html    - menampilkan hasil satu peserta
   2. daftar-nilai.html - menampilkan semua hasil
   ============================================ */


/* ============================================
   BAGIAN 1: HALAMAN HASIL (hasil.html)
   ============================================ */

/**
 * Fungsi ini dipanggil ketika halaman hasil.html selesai dimuat.
 * Membaca data hasil dari localStorage dan menampilkannya ke HTML.
 */
function inisialisasiHalamanHasil() {
    // Ambil indeks hasil terakhir dari localStorage
    var indeksStr = localStorage.getItem('quizIndeksHasilTerakhir');

    // Jika tidak ada indeks, berarti pengguna langsung buka hasil.html
    if (indeksStr === null) {
        tampilkanPesanTidakAdaHasil();
        return;
    }

    var indeks = parseInt(indeksStr, 10);

    // Ambil data hasil berdasarkan indeks
    var dataHasil = muatHasilByIndeks(indeks);

    if (dataHasil === null) {
        tampilkanPesanTidakAdaHasil();
        return;
    }

    // Tampilkan ringkasan nilai
    tampilkanRingkasanNilai(dataHasil);

    // Tampilkan detail review jawaban
    tampilkanReviewJawaban(dataHasil);
}


/**
 * Menampilkan pesan ketika data hasil tidak ditemukan.
 */
function tampilkanPesanTidakAdaHasil() {
    var elKontainer = document.getElementById('kontainer-hasil');
    if (elKontainer) {
        elKontainer.innerHTML =
            '<div class="pesan-kosong">' +
            '<p>Data hasil tidak ditemukan.</p>' +
            '<a href="index.html" class="tombol tombol-primer">Kembali ke Beranda</a>' +
            '</div>';
    }
}


/**
 * Menampilkan ringkasan nilai di bagian atas halaman hasil.
 * Mengisi kotak-kotak: Nama, Nilai, Benar, Salah, Total Soal.
 *
 * @param {Object} dataHasil - object hasil quiz
 */
function tampilkanRingkasanNilai(dataHasil) {
    // Isi nama peserta
    var elNama = document.getElementById('hasil-nama');
    if (elNama) elNama.textContent = dataHasil.name;

    // Isi nilai
    var elNilai = document.getElementById('hasil-nilai');
    if (elNilai) elNilai.textContent = dataHasil.score;

    // Isi jumlah benar
    var elBenar = document.getElementById('hasil-benar');
    if (elBenar) elBenar.textContent = dataHasil.correct;

    // Isi jumlah salah
    var elSalah = document.getElementById('hasil-salah');
    if (elSalah) elSalah.textContent = dataHasil.wrong;

    // Isi total soal
    var elTotal = document.getElementById('hasil-total');
    if (elTotal) elTotal.textContent = dataHasil.totalQuestions;

    // Isi tanggal
    var elTanggal = document.getElementById('hasil-tanggal');
    if (elTanggal) elTanggal.textContent = dataHasil.date;
}


/**
 * Menampilkan review jawaban soal per soal.
 *
 * Untuk setiap soal, tampilkan:
 * - Pertanyaan
 * - Jawaban yang dipilih peserta
 * - Jawaban yang benar
 * - Status: Benar atau Salah
 *
 * @param {Object} dataHasil - object hasil quiz
 */
function tampilkanReviewJawaban(dataHasil) {
    var elKontainer = document.getElementById('kontainer-review');

    if (!elKontainer) {
        return;
    }

    var htmlReview = '';

    // Loop melalui setiap detail jawaban
    for (var i = 0; i < dataHasil.answers.length; i++) {
        var detail = dataHasil.answers[i];
        var nomorSoal = i + 1;

        htmlReview += buatHtmlReviewSatuSoal(detail, nomorSoal);

        // Tambahkan garis pemisah antar soal (kecuali soal terakhir)
        if (i < dataHasil.answers.length - 1) {
            htmlReview += '<hr class="pemisah">';
        }
    }

    elKontainer.innerHTML = htmlReview;
}


/**
 * Membuat HTML review untuk satu soal.
 *
 * @param {Object} detail - object detail jawaban satu soal
 * @param {number} nomorSoal - nomor urut soal
 * @returns {string} HTML string
 */
function buatHtmlReviewSatuSoal(detail, nomorSoal) {
    // Tentukan class CSS berdasarkan benar/salah
    var classKartu = detail.isCorrect ? 'status-benar' : 'status-salah';

    // Teks opsi yang dipilih peserta
    var teksJawabanPeserta = getTeksOpsi(detail, detail.selectedAnswer);

    // Teks opsi yang benar
    var teksJawabanBenar = getTeksOpsi(detail, detail.correctAnswer);

    // Badge status
    var badgeHtml = detail.isCorrect
        ? '<span class="badge badge-benar">Benar</span>'
        : '<span class="badge badge-salah">Salah</span>';

    var html = '';
    html += '<div class="kartu-review-soal ' + classKartu + '">';
    html += '  <div class="nomor-soal">Soal ' + nomorSoal + '</div>';
    html += '  <div class="teks-soal">' + escapeHtml(detail.question) + '</div>';

    html += '  <div class="baris-review">';
    html += '    <span class="judul-review">Jawaban kamu:</span>';
    html += '    <span class="isi-review">' + escapeHtml(teksJawabanPeserta) + '</span>';
    html += '  </div>';

    html += '  <div class="baris-review">';
    html += '    <span class="judul-review">Jawaban benar:</span>';
    html += '    <span class="isi-review">' + escapeHtml(teksJawabanBenar) + '</span>';
    html += '  </div>';

    html += '  <div class="baris-review" style="margin-top:0.75rem">';
    html += '    <span class="judul-review">Status:</span>';
    html += '    <span class="isi-review">' + badgeHtml + '</span>';
    html += '  </div>';

    html += '</div>';

    return html;
}


/* ============================================
   BAGIAN 2: HALAMAN DAFTAR NILAI (daftar-nilai.html)
   ============================================ */

/**
 * Fungsi ini dipanggil ketika halaman daftar-nilai.html selesai dimuat.
 * Membaca semua hasil dari localStorage dan menampilkannya dalam tabel.
 */
function inisialisasiDaftarNilai() {
    var semuaHasil = muatSemuaHasil();

    var elKontainer = document.getElementById('kontainer-daftar-nilai');

    if (!elKontainer) {
        return;
    }

    // Jika belum ada hasil sama sekali
    if (semuaHasil.length === 0) {
        elKontainer.innerHTML =
            '<div class="pesan-kosong">' +
            '<p>Belum ada peserta yang mengerjakan quiz.</p>' +
            '<a href="mulai-quiz.html" class="tombol tombol-primer">Mulai Quiz</a>' +
            '</div>';
        return;
    }

    // Ada hasil, buat tabel
    var htmlTabel = buatHtmlTabelDaftarNilai(semuaHasil);
    elKontainer.innerHTML = htmlTabel;
}


/**
 * Membuat HTML tabel daftar nilai.
 *
 * @param {Array} semuaHasil - array semua hasil quiz
 * @returns {string} HTML string tabel
 */
function buatHtmlTabelDaftarNilai(semuaHasil) {
    var html = '';
    html += '<div class="bungkus-tabel">';
    html += '<table>';
    html += '<thead>';
    html += '<tr>';
    html += '  <th>No</th>';
    html += '  <th>Nama</th>';
    html += '  <th>Nilai</th>';
    html += '  <th>Benar</th>';
    html += '  <th>Salah</th>';
    html += '  <th>Total</th>';
    html += '  <th>Tanggal</th>';
    html += '  <th>Aksi</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    // Tampilkan dari hasil terbaru ke terlama (urutan terbalik)
    for (var i = semuaHasil.length - 1; i >= 0; i--) {
        var hasil = semuaHasil[i];
        var nomor = semuaHasil.length - i; // nomor urut dari atas

        html += buatHtmlBarisTabel(hasil, i, nomor);
    }

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    return html;
}


/**
 * Membuat satu baris tabel untuk satu hasil quiz.
 *
 * @param {Object} hasil - object hasil quiz
 * @param {number} indeks - indeks dalam array semuaHasil
 * @param {number} nomor - nomor urut untuk ditampilkan
 * @returns {string} HTML string satu baris <tr>
 */
function buatHtmlBarisTabel(hasil, indeks, nomor) {
    // Tentukan warna badge nilai berdasarkan skor
    var classNilai = '';
    if (hasil.score >= 80) {
        classNilai = 'nilai-tinggi';      // hijau
    } else if (hasil.score >= 60) {
        classNilai = 'nilai-sedang';      // kuning
    } else {
        classNilai = 'nilai-rendah';      // merah
    }

    var html = '';
    html += '<tr>';
    html += '  <td>' + nomor + '</td>';
    html += '  <td>' + escapeHtml(hasil.name) + '</td>';
    html += '  <td><span class="nilai-badge ' + classNilai + '">' + hasil.score + '</span></td>';
    html += '  <td>' + hasil.correct + '</td>';
    html += '  <td>' + hasil.wrong + '</td>';
    html += '  <td>' + hasil.totalQuestions + '</td>';
    html += '  <td>' + hasil.date + '</td>';
    html += '  <td>';
    html += '    <button class="tombol tombol-primer tombol-kecil" onclick="lihatDetailHasil(' + indeks + ')">Detail</button>';
    html += '  </td>';
    html += '</tr>';

    return html;
}


/**
 * Dipanggil ketika tombol "Detail" diklik di tabel daftar nilai.
 * Menyimpan indeks hasil yang dipilih dan membuka halaman hasil.
 *
 * @param {number} indeks - indeks hasil dalam array semuaHasil
 */
function lihatDetailHasil(indeks) {
    // Simpan indeks ke localStorage agar halaman hasil.html bisa membacanya
    localStorage.setItem('quizIndeksHasilTerakhir', indeks);

    // Buka halaman hasil
    window.location.href = 'hasil.html';
}


/* ============================================
   FUNGSI UTILITAS
   ============================================ */

/**
 * Escape karakter HTML untuk mencegah XSS.
 * Mengubah karakter khusus menjadi HTML entity.
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
