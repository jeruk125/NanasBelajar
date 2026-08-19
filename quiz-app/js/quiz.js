/* ============================================
   QUIZ.JS - Logika halaman quiz.html
   ============================================
   File ini menangani semua yang terjadi di halaman quiz:
   1. Memuat soal dari localStorage
   2. Menampilkan soal ke halaman HTML
   3. Membaca jawaban yang dipilih peserta (radio button)
   4. Memvalidasi bahwa semua soal sudah dijawab
   5. Menghitung nilai
   6. Menyimpan hasil ke localStorage
   7. Mengarahkan ke halaman hasil
   ============================================ */


/**
 * Fungsi ini dipanggil ketika halaman quiz.html selesai dimuat.
 * Ini adalah titik masuk (entry point) untuk halaman quiz.
 */
function inisialisasiQuiz() {
    // Ambil nama peserta dari localStorage
    var namaPeserta = muatNamaPeserta();

    // Jika nama peserta kosong, berarti pengguna langsung buka quiz.html
    // tanpa melalui mulai-quiz.html. Arahkan kembali.
    if (namaPeserta === '') {
        alert('Silakan masukkan nama Anda terlebih dahulu.');
        window.location.href = 'mulai-quiz.html';
        return;
    }

    // Tampilkan nama peserta di halaman
    var elNama = document.getElementById('nama-peserta');
    if (elNama) {
        elNama.textContent = namaPeserta;
    }

    // Ambil daftar soal dari localStorage
    var daftarSoal = muatSoal();

    // Jika tidak ada soal, tampilkan pesan dan hentikan
    if (daftarSoal.length === 0) {
        tampilkanPesanTidakAdaSoal();
        return;
    }

    // Tampilkan semua soal ke halaman
    tampilkanSemuaSoal(daftarSoal);

    // Pasang event listener pada tombol "Selesai Quiz"
    var tombolSelesai = document.getElementById('tombol-selesai');
    if (tombolSelesai) {
        tombolSelesai.addEventListener('click', function() {
            selesaikanQuiz(daftarSoal, namaPeserta);
        });
    }
}


/**
 * Menampilkan pesan ketika tidak ada soal tersimpan.
 * Menyembunyikan form quiz dan tombol selesai.
 */
function tampilkanPesanTidakAdaSoal() {
    var elKontainerSoal = document.getElementById('kontainer-soal');
    var tombolSelesai = document.getElementById('tombol-selesai');

    if (elKontainerSoal) {
        elKontainerSoal.innerHTML =
            '<div class="pesan-kosong">' +
            '<p>Belum ada soal. Silakan masukkan soal terlebih dahulu.</p>' +
            '<a href="input-soal.html" class="tombol tombol-primer">Input Soal</a>' +
            '</div>';
    }

    if (tombolSelesai) {
        tombolSelesai.style.display = 'none';
    }
}


/**
 * Menampilkan semua soal ke dalam kontainer HTML.
 *
 * Cara kerja:
 * - Loop melalui setiap soal dalam array.
 * - Untuk setiap soal, buat HTML kartu soal dengan radio button.
 * - Masukkan HTML tersebut ke dalam elemen kontainer.
 *
 * @param {Array} daftarSoal - array object soal
 */
function tampilkanSemuaSoal(daftarSoal) {
    var elKontainer = document.getElementById('kontainer-soal');

    if (!elKontainer) {
        return;
    }

    // Kumpulkan HTML untuk semua soal
    var htmlSemuaSoal = '';

    for (var i = 0; i < daftarSoal.length; i++) {
        var soal = daftarSoal[i];
        var nomorSoal = i + 1;

        // Buat HTML untuk satu kartu soal
        htmlSemuaSoal += buatHtmlKartuSoal(soal, nomorSoal, i);
    }

    // Masukkan semua HTML sekaligus ke kontainer
    elKontainer.innerHTML = htmlSemuaSoal;
}


/**
 * Membuat HTML untuk satu kartu soal dengan radio button.
 *
 * Setiap radio button diberi name unik berdasarkan indeks soal,
 * misalnya name="soal-0", name="soal-1", dst.
 * Ini memastikan peserta hanya bisa memilih satu jawaban per soal.
 *
 * @param {Object} soal - object satu soal
 * @param {number} nomorSoal - nomor urut untuk ditampilkan (mulai 1)
 * @param {number} indeks - indeks dalam array (mulai 0), dipakai untuk name radio
 * @returns {string} string HTML kartu soal
 */
function buatHtmlKartuSoal(soal, nomorSoal, indeks) {
    // Nama grup radio button, unik per soal
    var namaGrupRadio = 'soal-' + indeks;

    var html = '';
    html += '<div class="kartu-soal-quiz" id="kartu-soal-' + indeks + '">';
    html += '  <div class="nomor-soal">Soal ' + nomorSoal + '</div>';
    html += '  <div class="teks-soal">' + tampilkanTeksSoal(soal.question) + '</div>';
    html += '  <div class="opsi-radio">';

    // Buat radio button untuk setiap opsi (A, B, C, D)
    html += buatHtmlOpsiRadio(namaGrupRadio, indeks, 'A', soal.optionA);
    html += buatHtmlOpsiRadio(namaGrupRadio, indeks, 'B', soal.optionB);
    html += buatHtmlOpsiRadio(namaGrupRadio, indeks, 'C', soal.optionC);
    html += buatHtmlOpsiRadio(namaGrupRadio, indeks, 'D', soal.optionD);

    html += '  </div>';
    html += '</div>';

    return html;
}


/**
 * Membuat HTML untuk satu pilihan radio button.
 *
 * @param {string} namaGrup - name attribute untuk radio button
 * @param {number} indeksSoal - indeks soal (untuk id unik)
 * @param {string} huruf - huruf opsi: A, B, C, atau D
 * @param {string} teksOpsi - teks pilihan
 * @returns {string} HTML satu label + radio button
 */
function buatHtmlOpsiRadio(namaGrup, indeksSoal, huruf, teksOpsi) {
    // ID unik untuk setiap radio button, contoh: "soal-0-A"
    var idRadio = 'soal-' + indeksSoal + '-' + huruf;

    var html = '';
    html += '<label class="label-opsi" for="' + idRadio + '">';
    html += '  <input type="radio" id="' + idRadio + '" name="' + namaGrup + '" value="' + huruf + '">';
    html += '  ' + huruf + '. ' + tampilkanTeksSoal(teksOpsi);
    html += '</label>';

    return html;
}


/**
 * Membersihkan teks soal dari karakter berbahaya (XSS prevention).
 * Mengganti karakter < dan > agar tidak diinterpretasi sebagai HTML.
 *
 * @param {string} teks
 * @returns {string}
 */
function tampilkanTeksSoal(teks) {
    if (!teks) return '';
    return teks
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


/**
 * Membaca jawaban yang dipilih peserta untuk semua soal.
 *
 * Cara kerja:
 * - Loop melalui setiap soal (berdasarkan jumlah soal).
 * - Untuk setiap soal, cari radio button yang dipilih (checked).
 * - Simpan hasilnya dalam array.
 *
 * @param {number} jumlahSoal - berapa banyak soal yang ada
 * @returns {Array} array jawaban, contoh: ["A", "C", null, "B"]
 *   null berarti soal tersebut belum dijawab
 */
function bacaSemuaJawaban(jumlahSoal) {
    var semuaJawaban = [];

    for (var i = 0; i < jumlahSoal; i++) {
        // Cari semua radio button untuk soal ke-i
        var namaGrup = 'soal-' + i;
        var radioButtons = document.getElementsByName(namaGrup);

        var jawabanTerpilih = null;

        // Loop melalui setiap radio button dalam grup ini
        for (var j = 0; j < radioButtons.length; j++) {
            if (radioButtons[j].checked) {
                // Radio button ini dipilih
                jawabanTerpilih = radioButtons[j].value;
                break; // Tidak perlu lanjut, sudah ketemu
            }
        }

        semuaJawaban.push(jawabanTerpilih);
    }

    return semuaJawaban;
}


/**
 * Memeriksa apakah semua soal sudah dijawab.
 *
 * @param {Array} semuaJawaban - array jawaban (bisa mengandung null)
 * @returns {Object} { valid: boolean, soalBelumDijawab: Array }
 *   soalBelumDijawab adalah array nomor soal yang belum dijawab
 */
function periksaSemuaSoalDijawab(semuaJawaban) {
    var soalBelumDijawab = [];

    for (var i = 0; i < semuaJawaban.length; i++) {
        if (semuaJawaban[i] === null) {
            // Tambahkan nomor soal (mulai dari 1, bukan 0)
            soalBelumDijawab.push(i + 1);
        }
    }

    return {
        valid: soalBelumDijawab.length === 0,
        soalBelumDijawab: soalBelumDijawab
    };
}


/**
 * Dipanggil ketika tombol "Selesai Quiz" diklik.
 *
 * Langkah-langkah:
 * 1. Baca semua jawaban yang dipilih.
 * 2. Validasi bahwa semua soal sudah dijawab.
 * 3. Hitung nilai.
 * 4. Simpan hasil ke localStorage.
 * 5. Arahkan ke halaman hasil.
 *
 * @param {Array} daftarSoal - array object soal
 * @param {string} namaPeserta - nama peserta
 */
function selesaikanQuiz(daftarSoal, namaPeserta) {
    var jumlahSoal = daftarSoal.length;

    // Langkah 1: Baca jawaban
    var semuaJawaban = bacaSemuaJawaban(jumlahSoal);

    // Langkah 2: Validasi
    var periksaJawaban = periksaSemuaSoalDijawab(semuaJawaban);

    if (!periksaJawaban.valid) {
        // Ada soal yang belum dijawab
        var daftarBelum = periksaJawaban.soalBelumDijawab.join(', ');
        tampilkanPesanErrorQuiz('Masih ada soal yang belum dijawab: Soal ' + daftarBelum + '. Silakan lengkapi terlebih dahulu.');

        // Scroll ke soal pertama yang belum dijawab
        var indeksPertama = periksaJawaban.soalBelumDijawab[0] - 1;
        var elKartu = document.getElementById('kartu-soal-' + indeksPertama);
        if (elKartu) {
            elKartu.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Langkah 3: Hitung nilai
    var dataHasil = hitungHasil(daftarSoal, semuaJawaban, namaPeserta);

    // Langkah 4: Simpan hasil
    simpanHasil(dataHasil);

    // Bersihkan nama peserta dari localStorage (sudah tidak diperlukan)
    hapusNamaPeserta();

    // Langkah 5: Arahkan ke halaman hasil
    // Simpan indeks hasil di localStorage agar halaman hasil bisa membacanya
    var semuaHasil = muatSemuaHasil();
    var indeksHasilBaru = semuaHasil.length - 1;
    localStorage.setItem('quizIndeksHasilTerakhir', indeksHasilBaru);

    window.location.href = 'hasil.html';
}


/**
 * Menampilkan pesan error di halaman quiz.
 *
 * @param {string} pesan - pesan error yang akan ditampilkan
 */
function tampilkanPesanErrorQuiz(pesan) {
    // Cari atau buat elemen pesan error
    var elPesan = document.getElementById('pesan-error-quiz');

    if (!elPesan) {
        return;
    }

    elPesan.textContent = pesan;
    elPesan.style.display = 'block';

    // Scroll ke pesan error
    elPesan.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


/**
 * Menghitung hasil quiz dan membuat object data hasil.
 *
 * Rumus nilai: (jumlah benar / jumlah soal) x 100
 *
 * @param {Array} daftarSoal - array soal
 * @param {Array} semuaJawaban - array jawaban peserta
 * @param {string} namaPeserta - nama peserta
 * @returns {Object} object data hasil quiz
 */
function hitungHasil(daftarSoal, semuaJawaban, namaPeserta) {
    var jumlahSoal = daftarSoal.length;
    var jumlahBenar = 0;
    var detailJawaban = [];

    // Loop untuk mencocokkan jawaban peserta dengan jawaban benar
    for (var i = 0; i < jumlahSoal; i++) {
        var soal = daftarSoal[i];
        var jawabanPeserta = semuaJawaban[i];
        var jawabanBenar = soal.correctAnswer;

        // Apakah jawaban ini benar?
        var adalahBenar = (jawabanPeserta === jawabanBenar);

        if (adalahBenar) {
            jumlahBenar++;
        }

        // Simpan detail setiap jawaban
        detailJawaban.push({
            questionIndex: i,
            question: soal.question,
            optionA: soal.optionA,
            optionB: soal.optionB,
            optionC: soal.optionC,
            optionD: soal.optionD,
            selectedAnswer: jawabanPeserta,
            correctAnswer: jawabanBenar,
            isCorrect: adalahBenar
        });
    }

    var jumlahSalah = jumlahSoal - jumlahBenar;

    // Hitung nilai dengan rumus: (benar / total) x 100
    // Math.round untuk membulatkan angka desimal
    var nilai = Math.round((jumlahBenar / jumlahSoal) * 100);

    // Buat object hasil lengkap
    var dataHasil = {
        name: namaPeserta,
        score: nilai,
        correct: jumlahBenar,
        wrong: jumlahSalah,
        totalQuestions: jumlahSoal,
        date: tanggalHariIni(),
        timestamp: waktuSekarang(),
        answers: detailJawaban
    };

    return dataHasil;
}
