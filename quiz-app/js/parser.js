/* ============================================
   PARSER.JS - Fungsi memecah teks soal
   ============================================
   File ini berisi satu fungsi utama: parseQuestions(teks)

   Fungsi ini membaca teks mentah yang diketik guru,
   lalu memecahnya menjadi array object soal yang terstruktur.

   Format teks yang diterima:
   -------------------------
   SOAL 1
   Apa ibu kota Indonesia?
   A. Bandung
   B. Jakarta
   C. Surabaya
   D. Medan
   JAWABAN: B

   SOAL 2
   Planet tempat kita tinggal adalah?
   A. Mars
   B. Venus
   C. Bumi
   D. Jupiter
   JAWABAN: C
   -------------------------

   Output yang dihasilkan:
   [
     {
       question: "Apa ibu kota Indonesia?",
       optionA: "Bandung",
       optionB: "Jakarta",
       optionC: "Surabaya",
       optionD: "Medan",
       correctAnswer: "B"
     },
     ...
   ]
   ============================================ */


/**
 * Fungsi utama: memecah teks soal menjadi array object soal.
 *
 * Cara kerja langkah per langkah:
 * 1. Bersihkan teks dari spasi/baris kosong di awal dan akhir.
 * 2. Pecah teks menjadi blok-blok soal berdasarkan baris "SOAL N".
 * 3. Untuk setiap blok, panggil fungsi parseSatuSoal().
 * 4. Kumpulkan hasilnya menjadi array.
 * 5. Jika ada error, catat dan kembalikan hasilnya bersama error.
 *
 * @param {string} teks - teks mentah soal dari textarea
 * @returns {Object} { soal: Array, errors: Array }
 *   - soal: array object soal yang berhasil di-parse
 *   - errors: array pesan error jika ada soal yang tidak valid
 */
function parseQuestions(teks) {
    // Objek hasil yang akan dikembalikan
    var hasil = {
        soal: [],
        errors: []
    };

    // Langkah 1: Bersihkan teks dari spasi berlebih
    var teksBersih = teks.trim();

    // Jika textarea kosong, langsung kembalikan error
    if (teksBersih === '') {
        hasil.errors.push('Teks soal masih kosong. Silakan masukkan soal terlebih dahulu.');
        return hasil;
    }

    // Langkah 2: Pecah teks menjadi array baris
    // split('\n') memotong teks di setiap baris baru
    var semuaBaris = teksBersih.split('\n');

    // Langkah 3: Kelompokkan baris-baris menjadi blok soal
    // Setiap blok dimulai dari baris yang mengandung "SOAL"
    var blokkBlokSoal = kelompokkanMenjadiBlok(semuaBaris);

    // Jika tidak ada blok soal ditemukan
    if (blokkBlokSoal.length === 0) {
        hasil.errors.push('Tidak ada soal ditemukan. Pastikan setiap soal dimulai dengan baris "SOAL 1", "SOAL 2", dst.');
        return hasil;
    }

    // Langkah 4: Parse setiap blok menjadi object soal
    for (var i = 0; i < blokkBlokSoal.length; i++) {
        var nomorSoal = i + 1;
        var blok = blokkBlokSoal[i];

        // Panggil fungsi helper untuk memparse satu blok soal
        var hasilParse = parseSatuSoal(blok, nomorSoal);

        if (hasilParse.error !== null) {
            // Ada error pada soal ini, catat pesannya
            hasil.errors.push(hasilParse.error);
        } else {
            // Soal valid, tambahkan ke array hasil
            hasil.soal.push(hasilParse.soal);
        }
    }

    return hasil;
}


/**
 * Mengelompokkan array baris menjadi blok-blok soal.
 *
 * Cara kerja:
 * - Kita baca baris satu per satu.
 * - Jika baris dimulai dengan "SOAL", kita mulai blok baru.
 * - Semua baris setelahnya dimasukkan ke blok yang sedang aktif.
 *
 * Contoh input (array baris):
 * ["SOAL 1", "Apa ibu kota?", "A. Bandung", ..., "SOAL 2", ...]
 *
 * Contoh output (array of array):
 * [
 *   ["SOAL 1", "Apa ibu kota?", "A. Bandung", ...],
 *   ["SOAL 2", ...]
 * ]
 *
 * @param {Array} semuaBaris - array string, satu elemen per baris
 * @returns {Array} array of array - setiap elemen adalah blok satu soal
 */
function kelompokkanMenjadiBlok(semuaBaris) {
    var semuaBlok = [];
    var blokSaatIni = null; // blok yang sedang diisi

    for (var i = 0; i < semuaBaris.length; i++) {
        var baris = semuaBaris[i].trim();

        // Periksa apakah baris ini adalah penanda awal soal baru
        // Menggunakan toUpperCase() agar tidak case-sensitive
        if (baris.toUpperCase().startsWith('SOAL ')) {
            // Jika ada blok sebelumnya yang belum disimpan, simpan dulu
            if (blokSaatIni !== null) {
                semuaBlok.push(blokSaatIni);
            }
            // Mulai blok baru dengan baris "SOAL N" ini
            blokSaatIni = [baris];

        } else if (blokSaatIni !== null && baris !== '') {
            // Baris ini adalah bagian dari soal yang sedang aktif
            // Abaikan baris kosong
            blokSaatIni.push(baris);
        }
    }

    // Jangan lupa simpan blok terakhir
    if (blokSaatIni !== null) {
        semuaBlok.push(blokSaatIni);
    }

    return semuaBlok;
}


/**
 * Memparse satu blok baris menjadi satu object soal.
 *
 * Cara kerja:
 * Kita baca baris satu per satu dan identifikasi setiap bagian:
 * - Baris 0: "SOAL N" - kita skip
 * - Baris 1: pertanyaan
 * - Baris yang dimulai "A.": opsi A
 * - Baris yang dimulai "B.": opsi B
 * - Baris yang dimulai "C.": opsi C
 * - Baris yang dimulai "D.": opsi D
 * - Baris yang dimulai "JAWABAN:": jawaban benar
 *
 * @param {Array} blok - array baris untuk satu soal
 * @param {number} nomorSoal - nomor soal untuk pesan error
 * @returns {Object} { soal: Object|null, error: string|null }
 */
function parseSatuSoal(blok, nomorSoal) {
    // Siapkan object soal dengan nilai awal null
    var soal = {
        question: null,
        optionA: null,
        optionB: null,
        optionC: null,
        optionD: null,
        correctAnswer: null
    };

    // Baca setiap baris dalam blok ini
    for (var i = 0; i < blok.length; i++) {
        var baris = blok[i].trim();
        var barisUpper = baris.toUpperCase();

        if (barisUpper.startsWith('SOAL ')) {
            // Baris penanda soal, lewati saja
            continue;

        } else if (barisUpper.startsWith('A.') || barisUpper.startsWith('A) ') || baris.match(/^[Aa]\.\s/)) {
            // Baris opsi A - ambil teks setelah "A. "
            soal.optionA = ambilTeksSetelahKode(baris);

        } else if (barisUpper.startsWith('B.') || barisUpper.startsWith('B) ') || baris.match(/^[Bb]\.\s/)) {
            // Baris opsi B
            soal.optionB = ambilTeksSetelahKode(baris);

        } else if (barisUpper.startsWith('C.') || barisUpper.startsWith('C) ') || baris.match(/^[Cc]\.\s/)) {
            // Baris opsi C
            soal.optionC = ambilTeksSetelahKode(baris);

        } else if (barisUpper.startsWith('D.') || barisUpper.startsWith('D) ') || baris.match(/^[Dd]\.\s/)) {
            // Baris opsi D
            soal.optionD = ambilTeksSetelahKode(baris);

        } else if (barisUpper.startsWith('JAWABAN:') || barisUpper.startsWith('JAWABAN :')) {
            // Baris jawaban benar - ambil huruf setelah "JAWABAN: "
            soal.correctAnswer = ambilJawaban(baris);

        } else if (soal.question === null) {
            // Baris yang bukan opsi dan bukan jawaban, dan question belum diisi
            // Anggap ini adalah pertanyaan
            soal.question = baris;
        }
    }

    // Validasi: periksa kelengkapan setiap bagian soal
    var pesanError = validasiSoal(soal, nomorSoal);

    if (pesanError !== null) {
        return { soal: null, error: pesanError };
    }

    return { soal: soal, error: null };
}


/**
 * Mengambil teks opsi setelah kode huruf.
 *
 * Contoh:
 * "A. Bandung" => "Bandung"
 * "B. Jakarta Pusat" => "Jakarta Pusat"
 *
 * Cara kerja:
 * - Cari posisi titik pertama dalam baris.
 * - Ambil semua teks setelah titik dan spasi.
 *
 * @param {string} baris - baris opsi lengkap
 * @returns {string} teks opsi tanpa kode huruf
 */
function ambilTeksSetelahKode(baris) {
    // Cari posisi titik pertama
    var posisiTitik = baris.indexOf('.');

    if (posisiTitik === -1) {
        // Tidak ada titik, coba cari tanda kurung
        var posisiKurung = baris.indexOf(')');
        if (posisiKurung !== -1) {
            return baris.substring(posisiKurung + 1).trim();
        }
        return baris.trim();
    }

    // Ambil semua teks setelah titik, lalu hapus spasi di depan
    var teksSetelahTitik = baris.substring(posisiTitik + 1).trim();
    return teksSetelahTitik;
}


/**
 * Mengambil huruf jawaban dari baris "JAWABAN: B".
 *
 * Contoh:
 * "JAWABAN: B" => "B"
 * "Jawaban: C" => "C"
 * "JAWABAN : A" => "A"
 *
 * @param {string} baris - baris jawaban lengkap
 * @returns {string} huruf jawaban dalam huruf kapital
 */
function ambilJawaban(baris) {
    // Cari posisi titik dua
    var posisiTitikDua = baris.indexOf(':');

    if (posisiTitikDua === -1) {
        return '';
    }

    // Ambil teks setelah titik dua, hapus spasi, jadikan huruf kapital
    var jawabanMentah = baris.substring(posisiTitikDua + 1).trim();
    var jawaban = jawabanMentah.toUpperCase();

    // Ambil hanya karakter pertama (huruf A, B, C, atau D)
    if (jawaban.length > 0) {
        return jawaban.charAt(0);
    }

    return '';
}


/**
 * Memvalidasi object soal apakah semua bagian sudah lengkap.
 *
 * @param {Object} soal - object soal yang akan divalidasi
 * @param {number} nomorSoal - nomor soal untuk pesan error
 * @returns {string|null} pesan error, atau null jika valid
 */
function validasiSoal(soal, nomorSoal) {
    // Periksa pertanyaan
    if (soal.question === null || soal.question.trim() === '') {
        return 'Soal ' + nomorSoal + ' tidak valid: pertanyaan tidak ditemukan.';
    }

    // Periksa setiap opsi
    if (soal.optionA === null || soal.optionA.trim() === '') {
        return 'Soal ' + nomorSoal + ' tidak valid: pilihan A tidak ditemukan.';
    }

    if (soal.optionB === null || soal.optionB.trim() === '') {
        return 'Soal ' + nomorSoal + ' tidak valid: pilihan B tidak ditemukan.';
    }

    if (soal.optionC === null || soal.optionC.trim() === '') {
        return 'Soal ' + nomorSoal + ' tidak valid: pilihan C tidak ditemukan.';
    }

    if (soal.optionD === null || soal.optionD.trim() === '') {
        return 'Soal ' + nomorSoal + ' tidak valid: pilihan D tidak ditemukan.';
    }

    // Periksa jawaban
    if (soal.correctAnswer === null || soal.correctAnswer.trim() === '') {
        return 'Soal ' + nomorSoal + ' tidak valid: baris "JAWABAN:" tidak ditemukan.';
    }

    // Periksa apakah jawaban adalah A, B, C, atau D
    var jawabanValid = ['A', 'B', 'C', 'D'];
    if (jawabanValid.indexOf(soal.correctAnswer) === -1) {
        return 'Soal ' + nomorSoal + ' tidak valid: jawaban "' + soal.correctAnswer + '" tidak valid. Jawaban harus A, B, C, atau D.';
    }

    // Semua valid
    return null;
}


/**
 * Mengambil teks opsi lengkap berdasarkan huruf jawaban.
 * Berguna untuk menampilkan "B. Jakarta" alih-alih hanya "B".
 *
 * Contoh:
 * getTeksOpsi(soal, "B") => "B. Jakarta"
 *
 * @param {Object} soal - object soal
 * @param {string} huruf - huruf opsi (A, B, C, atau D)
 * @returns {string} teks opsi lengkap dengan huruf
 */
function getTeksOpsi(soal, huruf) {
    var teksOpsi = '';

    if (huruf === 'A') teksOpsi = soal.optionA;
    else if (huruf === 'B') teksOpsi = soal.optionB;
    else if (huruf === 'C') teksOpsi = soal.optionC;
    else if (huruf === 'D') teksOpsi = soal.optionD;
    else return huruf; // jika huruf tidak dikenal, kembalikan huruf itu sendiri

    return huruf + '. ' + teksOpsi;
}
