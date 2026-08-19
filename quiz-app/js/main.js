/* ============================================
   MAIN.JS - Inisialisasi & data contoh
   ============================================
   File ini berisi:
   1. Fungsi untuk memuat contoh soal (untuk testing)
   2. Fungsi highlight navigasi aktif
   3. Event listener untuk halaman input-soal & preview-soal
   ============================================ */


/* ============================================
   CONTOH DATA SOAL
   ============================================
   Ini adalah 5 soal contoh untuk mempermudah testing.
   Anda bisa menghapus fungsi ini setelah tidak diperlukan.
   ============================================ */

/**
 * Teks contoh soal dalam format yang diterima parser.
 * Anda bisa menyalin teks ini ke textarea di input-soal.html.
 */
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


/**
 * Mengisi textarea input soal dengan teks contoh.
 * Dipanggil ketika tombol "Muat Contoh Soal" diklik.
 */
function muatContohSoal() {
    var elTextarea = document.getElementById('textarea-soal');
    if (elTextarea) {
        elTextarea.value = TEKS_CONTOH_SOAL;
        // Fokus ke textarea agar pengguna tahu textarea sudah diisi
        elTextarea.focus();
    }
}


/* ============================================
   LOGIKA HALAMAN INPUT-SOAL.HTML
   ============================================ */

/**
 * Dipanggil ketika halaman input-soal.html selesai dimuat.
 * Memasang event listener pada tombol-tombol di halaman ini.
 */
function inisialisasiInputSoal() {
    var tombolParse = document.getElementById('tombol-parse');
    var tombolContoh = document.getElementById('tombol-contoh');

    // Tombol "Parse Soal"
    if (tombolParse) {
        tombolParse.addEventListener('click', function() {
            jalankanParseSoal();
        });
    }

    // Tombol "Muat Contoh Soal" (untuk testing)
    if (tombolContoh) {
        tombolContoh.addEventListener('click', function() {
            muatContohSoal();
        });
    }
}


/**
 * Membaca teks dari textarea, menjalankan parser,
 * lalu menyimpan hasil sementara dan berpindah ke preview-soal.html.
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

    // Jalankan parser
    var hasilParse = parseQuestions(teksInput);

    // Jika ada error, tampilkan dan hentikan
    if (hasilParse.errors.length > 0) {
        tampilkanErrorParse(hasilParse.errors, elPesanError);
        return;
    }

    // Jika tidak ada soal berhasil di-parse
    if (hasilParse.soal.length === 0) {
        tampilkanErrorParse(['Tidak ada soal yang berhasil diproses. Periksa kembali format soal.'], elPesanError);
        return;
    }

    // Simpan soal hasil parse ke localStorage dengan key sementara
    // Ini BUKAN simpan final - masih bisa diubah di preview
    var soalSebagaiString = JSON.stringify(hasilParse.soal);
    localStorage.setItem('quizSoalPreview', soalSebagaiString);

    // Pindah ke halaman preview
    window.location.href = 'preview-soal.html';
}


/**
 * Menampilkan daftar error parse di halaman input-soal.
 *
 * @param {Array} daftarError - array string pesan error
 * @param {HTMLElement} elPesan - elemen HTML untuk menampilkan pesan
 */
function tampilkanErrorParse(daftarError, elPesan) {
    if (!elPesan) return;

    var htmlError = '<strong>Terdapat kesalahan:</strong><ul style="margin-top:0.5rem;padding-left:1.5rem;">';

    for (var i = 0; i < daftarError.length; i++) {
        htmlError += '<li>' + escapeHtmlMain(daftarError[i]) + '</li>';
    }

    htmlError += '</ul>';

    elPesan.innerHTML = htmlError;
    elPesan.style.display = 'block';

    // Scroll ke pesan error
    elPesan.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


/* ============================================
   LOGIKA HALAMAN PREVIEW-SOAL.HTML
   ============================================ */

/**
 * Dipanggil ketika halaman preview-soal.html selesai dimuat.
 * Membaca soal sementara dari localStorage dan menampilkannya.
 */
function inisialisasiPreviewSoal() {
    // Ambil soal sementara dari localStorage
    var soalStr = localStorage.getItem('quizSoalPreview');

    if (soalStr === null) {
        // Tidak ada data preview, kembalikan ke input soal
        window.location.href = 'input-soal.html';
        return;
    }

    var arraySoal = JSON.parse(soalStr);

    // Tampilkan jumlah soal
    var elJumlah = document.getElementById('jumlah-soal-preview');
    if (elJumlah) {
        elJumlah.textContent = arraySoal.length + ' soal berhasil dibaca.';
    }

    // Tampilkan semua soal dalam preview
    tampilkanPreviewSemuaSoal(arraySoal);

    // Pasang event listener tombol "Simpan Soal"
    var tombolSimpan = document.getElementById('tombol-simpan-soal');
    if (tombolSimpan) {
        tombolSimpan.addEventListener('click', function() {
            simpanSoalFinal(arraySoal);
        });
    }

    // Tombol "Edit Soal" - kembali ke input-soal.html
    var tombolEdit = document.getElementById('tombol-edit-soal');
    if (tombolEdit) {
        tombolEdit.addEventListener('click', function() {
            window.location.href = 'input-soal.html';
        });
    }
}


/**
 * Menampilkan semua soal dalam mode preview (read-only).
 *
 * @param {Array} arraySoal - array object soal
 */
function tampilkanPreviewSemuaSoal(arraySoal) {
    var elKontainer = document.getElementById('kontainer-preview');

    if (!elKontainer) return;

    var htmlPreview = '';

    for (var i = 0; i < arraySoal.length; i++) {
        var soal = arraySoal[i];
        var nomorSoal = i + 1;

        htmlPreview += buatHtmlPreviewSatuSoal(soal, nomorSoal);
    }

    elKontainer.innerHTML = htmlPreview;
}


/**
 * Membuat HTML preview untuk satu soal.
 *
 * @param {Object} soal - object soal
 * @param {number} nomorSoal - nomor urut
 * @returns {string} HTML string
 */
function buatHtmlPreviewSatuSoal(soal, nomorSoal) {
    var html = '';
    html += '<div class="kartu-soal-preview">';
    html += '  <div class="nomor-soal">Soal ' + nomorSoal + '</div>';
    html += '  <div class="teks-soal">' + escapeHtmlMain(soal.question) + '</div>';
    html += '  <ul class="daftar-opsi">';
    html += '    <li>A. ' + escapeHtmlMain(soal.optionA) + '</li>';
    html += '    <li>B. ' + escapeHtmlMain(soal.optionB) + '</li>';
    html += '    <li>C. ' + escapeHtmlMain(soal.optionC) + '</li>';
    html += '    <li>D. ' + escapeHtmlMain(soal.optionD) + '</li>';
    html += '  </ul>';

    // Tampilkan jawaban benar dengan teks opsinya
    var teksJawabanBenar = soal.correctAnswer + '. ' + getTeksOpsiDariSoal(soal, soal.correctAnswer);
    html += '  <div>';
    html += '    <span class="jawaban-benar-label">Jawaban benar: ' + escapeHtmlMain(teksJawabanBenar) + '</span>';
    html += '  </div>';

    html += '</div>';

    return html;
}


/**
 * Mendapatkan teks opsi dari object soal berdasarkan huruf.
 *
 * @param {Object} soal
 * @param {string} huruf - A, B, C, atau D
 * @returns {string}
 */
function getTeksOpsiDariSoal(soal, huruf) {
    if (huruf === 'A') return soal.optionA;
    if (huruf === 'B') return soal.optionB;
    if (huruf === 'C') return soal.optionC;
    if (huruf === 'D') return soal.optionD;
    return '';
}


/**
 * Menyimpan soal secara final ke localStorage.
 * Dipanggil ketika tombol "Simpan Soal" diklik di preview.
 *
 * @param {Array} arraySoal - array soal yang sudah divalidasi
 */
function simpanSoalFinal(arraySoal) {
    // Simpan ke key utama quizQuestions
    simpanSoal(arraySoal);

    // Hapus data preview sementara
    localStorage.removeItem('quizSoalPreview');

    // Tampilkan konfirmasi
    var elPesan = document.getElementById('pesan-simpan');
    if (elPesan) {
        elPesan.textContent = arraySoal.length + ' soal berhasil disimpan! Peserta sudah bisa mengerjakan quiz.';
        elPesan.style.display = 'block';
    }

    // Sembunyikan tombol simpan agar tidak disimpan dua kali
    var tombolSimpan = document.getElementById('tombol-simpan-soal');
    if (tombolSimpan) {
        tombolSimpan.disabled = true;
        tombolSimpan.textContent = 'Soal Sudah Disimpan';
    }
}


/* ============================================
   LOGIKA HALAMAN MULAI-QUIZ.HTML
   ============================================ */

/**
 * Dipanggil ketika halaman mulai-quiz.html selesai dimuat.
 */
function inisialisasiMulaiQuiz() {
    var tombolMulai = document.getElementById('tombol-mulai-quiz');
    var elInputNama = document.getElementById('input-nama');

    if (tombolMulai) {
        tombolMulai.addEventListener('click', function() {
            prosesNamaPeserta(elInputNama);
        });
    }

    // Izinkan tekan Enter untuk mulai quiz
    if (elInputNama) {
        elInputNama.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                prosesNamaPeserta(elInputNama);
            }
        });
    }

    // Periksa apakah ada soal tersimpan
    if (!adaSoal()) {
        var elPeringatan = document.getElementById('peringatan-soal');
        if (elPeringatan) {
            elPeringatan.style.display = 'block';
        }
    }
}


/**
 * Memproses nama peserta: validasi lalu arahkan ke halaman quiz.
 *
 * @param {HTMLElement} elInputNama - elemen input nama
 */
function prosesNamaPeserta(elInputNama) {
    var elPesan = document.getElementById('pesan-error-nama');

    // Sembunyikan pesan error lama
    if (elPesan) {
        elPesan.style.display = 'none';
    }

    if (!elInputNama) return;

    var nama = elInputNama.value.trim();

    // Validasi nama tidak boleh kosong
    if (nama === '') {
        if (elPesan) {
            elPesan.textContent = 'Nama peserta tidak boleh kosong.';
            elPesan.style.display = 'block';
        }
        elInputNama.focus();
        return;
    }

    // Validasi panjang nama
    if (nama.length < 2) {
        if (elPesan) {
            elPesan.textContent = 'Nama terlalu pendek. Masukkan minimal 2 karakter.';
            elPesan.style.display = 'block';
        }
        elInputNama.focus();
        return;
    }

    // Validasi ada soal
    if (!adaSoal()) {
        if (elPesan) {
            elPesan.textContent = 'Belum ada soal tersimpan. Silakan minta guru untuk memasukkan soal terlebih dahulu.';
            elPesan.style.display = 'block';
        }
        return;
    }

    // Simpan nama peserta sementara
    simpanNamaPeserta(nama);

    // Arahkan ke halaman quiz
    window.location.href = 'quiz.html';
}


/* ============================================
   NAVIGASI - highlight halaman aktif
   ============================================ */

/**
 * Menandai tautan navigasi yang sesuai dengan halaman saat ini.
 * Dipanggil di setiap halaman.
 */
function tandaiNavAktif() {
    // Ambil nama file halaman saat ini
    var pathLengkap = window.location.pathname;
    var namaFile = pathLengkap.split('/').pop();

    // Jika namaFile kosong (misalnya membuka folder), asumsikan index.html
    if (namaFile === '' || namaFile === null) {
        namaFile = 'index.html';
    }

    // Cari semua tautan di navigasi
    var semuaTautan = document.querySelectorAll('.nav-tautan a');

    semuaTautan.forEach(function(tautan) {
        // Ambil href dari tautan
        var href = tautan.getAttribute('href');

        if (href === namaFile) {
            tautan.classList.add('aktif');
        } else {
            tautan.classList.remove('aktif');
        }
    });
}


/* ============================================
   FUNGSI UTILITAS LOKAL
   ============================================ */

/**
 * Versi escapeHtml untuk main.js.
 * (Diduplikasi agar main.js tidak bergantung pada result.js di semua halaman)
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
