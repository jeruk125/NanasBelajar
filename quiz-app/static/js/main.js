/* ============================================
   MAIN.JS - Logika halaman input-soal & navigasi
   ============================================
   File ini menangani:
   1. Halaman input-soal: parse teks, kirim ke Flask
   2. Contoh data soal untuk testing
   3. Fungsi-fungsi utilitas (escapeHtml, dll.)

   Perubahan dari versi localStorage:
   - simpanSoalFinal() sekarang mengirim data ke Flask via fetch(),
     bukan menyimpan ke localStorage.
   - Halaman preview-soal tidak lagi dibuat oleh JavaScript,
     melainkan dirender oleh Flask/Jinja2.
   ============================================ */


/* ============================================
   CONTOH DATA SOAL (untuk testing)
   ============================================ */

var TEKS_CONTOH_SOAL =
'SOAL 1\n' +
'Apa ibu kota negara Indonesia?\n' +
'A. Bandung\n' +
'B. Surabaya\n' +
'C. Jakarta\n' +
'D. Medan\n' +
'JAWABAN: C\n' +
'\n' +
'SOAL 2\n' +
'Planet tempat kita tinggal bernama?\n' +
'A. Mars\n' +
'B. Venus\n' +
'C. Jupiter\n' +
'D. Bumi\n' +
'JAWABAN: D\n' +
'\n' +
'SOAL 3\n' +
'Berapakah hasil dari 8 x 7?\n' +
'A. 54\n' +
'B. 56\n' +
'C. 48\n' +
'D. 63\n' +
'JAWABAN: B\n' +
'\n' +
'SOAL 4\n' +
'Siapa penemu lampu pijar?\n' +
'A. Alexander Graham Bell\n' +
'B. Albert Einstein\n' +
'C. Thomas Alva Edison\n' +
'D. Isaac Newton\n' +
'JAWABAN: C\n' +
'\n' +
'SOAL 5\n' +
'Bahasa pemrograman yang digunakan pada halaman web disebut?\n' +
'A. Python\n' +
'B. Java\n' +
'C. JavaScript\n' +
'D. C++\n' +
'JAWABAN: C';

function muatContohSoal() {
    var elTextarea = document.getElementById('textarea-soal');
    if (elTextarea) {
        elTextarea.value = TEKS_CONTOH_SOAL;
        elTextarea.focus();
    }
}


/* ============================================
   LOGIKA HALAMAN INPUT-SOAL
   ============================================ */

function inisialisasiInputSoal() {
    var tombolParse = document.getElementById('tombol-parse');
    var tombolContoh = document.getElementById('tombol-contoh');

    if (tombolParse) {
        tombolParse.addEventListener('click', function() {
            jalankanParseSoal();
        });
    }

    if (tombolContoh) {
        tombolContoh.addEventListener('click', function() {
            muatContohSoal();
        });
    }
}


/**
 * Membaca teks textarea, menjalankan parser JavaScript,
 * lalu mengirim hasil parsing ke Flask via fetch() POST.
 *
 * Alur baru (Flask):
 * 1. Baca teks dari textarea.
 * 2. Jalankan parseQuestions() - fungsi dari parser.js.
 * 3. Jika ada error parsing, tampilkan di halaman. STOP.
 * 4. Kirim array soal ke Flask POST /preview-soal sebagai JSON.
 * 5. Jika Flask merespons sukses, redirect ke /preview-soal (GET).
 * 6. Jika Flask merespons error, tampilkan pesan error.
 *
 * Mengapa fetch() dan bukan form submit biasa?
 * Karena data soal adalah array JavaScript yang kompleks.
 * Form HTML biasa hanya bisa mengirim data teks datar (flat).
 * fetch() dengan Content-Type: application/json bisa mengirim
 * array/object JavaScript yang sudah di-JSON.stringify().
 */
function jalankanParseSoal() {
    var elTextarea = document.getElementById('textarea-soal');
    var elPesanError = document.getElementById('pesan-error-parse');

    if (!elTextarea) return;

    // Sembunyikan pesan error lama
    if (elPesanError) {
        elPesanError.style.display = 'none';
        elPesanError.innerHTML = '';
    }

    var teksInput = elTextarea.value;

    // Jalankan parser JavaScript (tetap di browser)
    var hasilParse = parseQuestions(teksInput);

    // Jika parser menemukan error format soal
    if (hasilParse.errors.length > 0) {
        tampilkanErrorParse(hasilParse.errors, elPesanError);
        return;
    }

    if (hasilParse.soal.length === 0) {
        tampilkanErrorParse(
            ['Tidak ada soal yang berhasil diproses. Periksa kembali format soal.'],
            elPesanError
        );
        return;
    }

    // Nonaktifkan tombol sementara agar tidak ditekan dua kali
    var tombolParse = document.getElementById('tombol-parse');
    if (tombolParse) {
        tombolParse.disabled = true;
        tombolParse.textContent = 'Mengirim...';
    }

    /*
     * Kirim data soal ke Flask menggunakan fetch().
     *
     * fetch(url, options) adalah cara modern untuk mengirim request HTTP
     * dari JavaScript tanpa me-reload halaman.
     *
     * Penjelasan setiap bagian:
     *
     * method: 'POST'
     *   - Kita mengirim data, bukan hanya meminta data.
     *
     * headers: { 'Content-Type': 'application/json' }
     *   - Memberitahu Flask bahwa body kita adalah JSON.
     *   - Flask akan menggunakan request.get_json() untuk membacanya.
     *
     * body: JSON.stringify({ soal: hasilParse.soal })
     *   - JSON.stringify mengubah object JavaScript menjadi string JSON.
     *   - Flask menerima string ini dan mengubahnya kembali ke dict Python.
     */
    fetch('/preview-soal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ soal: hasilParse.soal })
    })
    .then(function(response) {
        /*
         * .then() dipanggil setelah server merespons.
         * response.json() membaca body respons sebagai JSON.
         * Hasilnya adalah Promise lagi, jadi kita .then() lagi.
         */
        return response.json().then(function(data) {
            return { status: response.status, data: data };
        });
    })
    .then(function(hasil) {
        if (hasil.status === 200 && hasil.data.sukses) {
            // Sukses: redirect ke halaman preview yang dirender Flask
            window.location.href = '/preview-soal';
        } else {
            // Error dari Flask: tampilkan pesan
            var pesanError = hasil.data.error || 'Terjadi kesalahan tidak diketahui.';
            tampilkanErrorParse([pesanError], elPesanError);

            // Aktifkan kembali tombol
            if (tombolParse) {
                tombolParse.disabled = false;
                tombolParse.textContent = '🔍 Parse Soal';
            }
        }
    })
    .catch(function(error) {
        /*
         * .catch() dipanggil jika terjadi error jaringan
         * (server tidak bisa dihubungi, dll.)
         */
        tampilkanErrorParse(
            ['Gagal terhubung ke server. Pastikan Flask sudah berjalan.'],
            elPesanError
        );

        if (tombolParse) {
            tombolParse.disabled = false;
            tombolParse.textContent = '🔍 Parse Soal';
        }
    });
}


/**
 * Menampilkan daftar error parsing di halaman.
 *
 * @param {Array} daftarError - array string pesan error
 * @param {HTMLElement} elPesan - elemen HTML untuk menampilkan pesan
 */
function tampilkanErrorParse(daftarError, elPesan) {
    if (!elPesan) return;

    var htmlError = '<strong>Terdapat kesalahan:</strong>' +
                    '<ul style="margin-top:0.5rem;padding-left:1.5rem;">';

    for (var i = 0; i < daftarError.length; i++) {
        htmlError += '<li>' + escapeHtmlMain(daftarError[i]) + '</li>';
    }

    htmlError += '</ul>';

    elPesan.innerHTML = htmlError;
    elPesan.style.display = 'block';
    elPesan.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


/* ============================================
   FUNGSI UTILITAS
   ============================================ */

/**
 * Escape karakter HTML untuk mencegah XSS.
 * Digunakan saat memasukkan teks ke innerHTML.
 *
 * @param {string} teks
 * @returns {string}
 */
function escapeHtmlMain(teks) {
    if (!teks) return '';
    return String(teks)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
