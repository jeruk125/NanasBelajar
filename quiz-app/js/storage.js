/* ============================================
   STORAGE.JS - Fungsi penyimpanan localStorage
   ============================================
   File ini berisi semua fungsi yang berhubungan
   dengan menyimpan dan membaca data dari localStorage.

   Dua jenis data yang disimpan:
   1. quizQuestions - daftar soal quiz
   2. quizResults   - daftar hasil peserta

   Cara localStorage bekerja:
   - localStorage adalah tempat penyimpanan di browser.
   - Data tetap ada meskipun browser ditutup atau di-refresh.
   - Data HILANG jika pengguna menghapus data browser.
   - Data HANYA bisa berupa string (teks).
   - Karena itu kita pakai JSON.stringify() untuk mengubah
     object/array menjadi string sebelum disimpan.
   - Dan JSON.parse() untuk mengubah string kembali ke object/array
     saat dibaca.
   ============================================ */


/* ============================================
   KEY NAMES - nama kunci localStorage
   ============================================
   Simpan nama kunci di variabel agar mudah diubah
   dan tidak salah ketik di tempat lain.
   ============================================ */

var KEY_SOAL = 'quizQuestions';
var KEY_HASIL = 'quizResults';
var KEY_NAMA_PESERTA = 'quizNamaPeserta';


/* ============================================
   FUNGSI SOAL
   ============================================ */

/**
 * Menyimpan array soal ke localStorage.
 *
 * Cara kerja:
 * 1. Terima array soal sebagai parameter.
 * 2. Ubah array menjadi string JSON dengan JSON.stringify().
 * 3. Simpan string tersebut ke localStorage dengan key KEY_SOAL.
 *
 * Contoh:
 * simpanSoal([{ question: "...", optionA: "...", correctAnswer: "A" }])
 *
 * @param {Array} arraySoal - array berisi object soal
 */
function simpanSoal(arraySoal) {
    // JSON.stringify mengubah array menjadi teks, contoh:
    // [{"question":"Apa ibu kota Indonesia?",...}]
    var soalSebagaiString = JSON.stringify(arraySoal);

    // Simpan teks tersebut ke localStorage
    localStorage.setItem(KEY_SOAL, soalSebagaiString);
}

/**
 * Membaca soal dari localStorage.
 *
 * Cara kerja:
 * 1. Ambil string dari localStorage dengan key KEY_SOAL.
 * 2. Jika tidak ada data (null), kembalikan array kosong [].
 * 3. Jika ada data, ubah string JSON kembali menjadi array dengan JSON.parse().
 *
 * @returns {Array} array berisi object soal, atau [] jika belum ada soal
 */
function muatSoal() {
    // Ambil data dari localStorage
    // Hasilnya adalah string atau null jika belum pernah disimpan
    var soalSebagaiString = localStorage.getItem(KEY_SOAL);

    // Jika belum ada data, kembalikan array kosong
    // Ini mencegah error ketika localStorage masih kosong
    if (soalSebagaiString === null) {
        return [];
    }

    // JSON.parse mengubah string kembali menjadi array object
    var arraySoal = JSON.parse(soalSebagaiString);
    return arraySoal;
}

/**
 * Menghapus semua soal dari localStorage.
 * Digunakan ketika guru ingin memasukkan soal baru.
 */
function hapusSoal() {
    localStorage.removeItem(KEY_SOAL);
}

/**
 * Memeriksa apakah sudah ada soal tersimpan.
 *
 * @returns {boolean} true jika ada soal, false jika belum ada
 */
function adaSoal() {
    var arraySoal = muatSoal();
    return arraySoal.length > 0;
}


/* ============================================
   FUNGSI HASIL QUIZ
   ============================================ */

/**
 * Menyimpan satu hasil quiz ke localStorage.
 *
 * Cara kerja:
 * 1. Ambil semua hasil yang sudah ada dengan muatSemuaHasil().
 * 2. Tambahkan hasil baru ke dalam array tersebut.
 * 3. Simpan kembali seluruh array ke localStorage.
 *
 * Ini memastikan hasil baru ditambahkan, bukan menimpa hasil lama.
 *
 * @param {Object} hasilBaru - object berisi data hasil quiz satu peserta
 */
function simpanHasil(hasilBaru) {
    // Ambil semua hasil yang sudah ada
    var semuaHasil = muatSemuaHasil();

    // Tambahkan hasil baru ke dalam array
    semuaHasil.push(hasilBaru);

    // Simpan seluruh array kembali ke localStorage
    var hasilSebagaiString = JSON.stringify(semuaHasil);
    localStorage.setItem(KEY_HASIL, hasilSebagaiString);
}

/**
 * Membaca semua hasil quiz dari localStorage.
 *
 * @returns {Array} array berisi semua hasil quiz, atau [] jika belum ada
 */
function muatSemuaHasil() {
    var hasilSebagaiString = localStorage.getItem(KEY_HASIL);

    // Jika belum ada data, kembalikan array kosong
    if (hasilSebagaiString === null) {
        return [];
    }

    var arrayHasil = JSON.parse(hasilSebagaiString);
    return arrayHasil;
}

/**
 * Membaca satu hasil quiz berdasarkan indeks (nomor urut).
 *
 * @param {number} indeks - nomor urut hasil (mulai dari 0)
 * @returns {Object|null} object hasil quiz, atau null jika tidak ditemukan
 */
function muatHasilByIndeks(indeks) {
    var semuaHasil = muatSemuaHasil();

    // Periksa apakah indeks valid
    if (indeks < 0 || indeks >= semuaHasil.length) {
        return null;
    }

    return semuaHasil[indeks];
}

/**
 * Menghapus semua hasil quiz dari localStorage.
 */
function hapusSemuaHasil() {
    localStorage.removeItem(KEY_HASIL);
}


/* ============================================
   FUNGSI NAMA PESERTA (sementara saat quiz)
   ============================================ */

/**
 * Menyimpan nama peserta sementara.
 * Digunakan untuk membawa nama dari halaman mulai-quiz ke halaman quiz.
 *
 * @param {string} nama - nama peserta
 */
function simpanNamaPeserta(nama) {
    localStorage.setItem(KEY_NAMA_PESERTA, nama);
}

/**
 * Membaca nama peserta yang tersimpan sementara.
 *
 * @returns {string} nama peserta, atau string kosong jika belum ada
 */
function muatNamaPeserta() {
    var nama = localStorage.getItem(KEY_NAMA_PESERTA);

    if (nama === null) {
        return '';
    }

    return nama;
}

/**
 * Menghapus nama peserta sementara.
 * Dipanggil setelah quiz selesai dan hasil sudah disimpan.
 */
function hapusNamaPeserta() {
    localStorage.removeItem(KEY_NAMA_PESERTA);
}


/* ============================================
   FUNGSI UTILITAS
   ============================================ */

/**
 * Menghapus SEMUA data aplikasi quiz dari localStorage.
 * Gunakan dengan hati-hati karena tidak bisa dibatalkan.
 */
function hapusSemuaData() {
    localStorage.removeItem(KEY_SOAL);
    localStorage.removeItem(KEY_HASIL);
    localStorage.removeItem(KEY_NAMA_PESERTA);
}

/**
 * Mengambil tanggal hari ini dalam format DD/MM/YYYY.
 * Digunakan untuk mengisi field tanggal pada hasil quiz.
 *
 * @returns {string} tanggal hari ini, contoh: "19/08/2026"
 */
function tanggalHariIni() {
    var sekarang = new Date();

    // Ambil hari, bulan, tahun
    var hari = sekarang.getDate();
    var bulan = sekarang.getMonth() + 1; // getMonth() mulai dari 0
    var tahun = sekarang.getFullYear();

    // Tambahkan angka 0 di depan jika kurang dari 10
    // Contoh: 5 menjadi "05"
    var hariStr = hari < 10 ? '0' + hari : '' + hari;
    var bulanStr = bulan < 10 ? '0' + bulan : '' + bulan;

    return hariStr + '/' + bulanStr + '/' + tahun;
}

/**
 * Mengambil tanggal dan waktu sekarang sebagai string ISO.
 * Digunakan sebagai ID unik untuk setiap hasil quiz.
 *
 * @returns {string} contoh: "2026-08-19T14:30:00.000Z"
 */
function waktuSekarang() {
    return new Date().toISOString();
}
