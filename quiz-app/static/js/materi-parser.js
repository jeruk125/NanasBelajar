/**
 * materi-parser.js
 * Parser untuk membaca teks input materi guru dan mengubahnya menjadi array objek materi.
 */

function parseMateri(teks) {
    var hasil = {
        materi: [],
        errors: []
    };

    var teksBersih = teks.trim();
    if (teksBersih === '') {
        hasil.errors.push('Teks materi masih kosong. Silakan masukkan materi terlebih dahulu.');
        return hasil;
    }

    var semuaBaris = teksBersih.split('\n');
    var blokkBlokMateri = kelompokkanMenjadiBlokMateri(semuaBaris);

    if (blokkBlokMateri.length === 0) {
        hasil.errors.push('Tidak ada materi ditemukan. Pastikan setiap pertemuan dimulai dengan baris "PERTEMUAN 1", "PERTEMUAN 2", dst.');
        return hasil;
    }

    for (var i = 0; i < blokkBlokMateri.length; i++) {
        var blok = blokkBlokMateri[i];
        var hasilParse = parseSatuMateri(blok);

        if (hasilParse.error !== null) {
            hasil.errors.push(hasilParse.error);
        } else {
            hasil.materi.push(hasilParse.materi);
        }
    }

    return hasil;
}

function kelompokkanMenjadiBlokMateri(semuaBaris) {
    var semuaBlok = [];
    var blokSaatIni = null;

    for (var i = 0; i < semuaBaris.length; i++) {
        var baris = semuaBaris[i].trimEnd();
        var barisUpper = baris.trim().toUpperCase();

        if (barisUpper.match(/^PERTEMUAN\s+\d+/)) {
            if (blokSaatIni !== null) {
                semuaBlok.push(blokSaatIni);
            }
            blokSaatIni = [baris];
        } else if (blokSaatIni !== null) {
            // Include empty lines as they might be part of multiline content
            blokSaatIni.push(baris);
        }
    }

    if (blokSaatIni !== null) {
        semuaBlok.push(blokSaatIni);
    }

    return semuaBlok;
}

function parseSatuMateri(blok) {
    var materi = {
        meeting_number: null,
        title: null,
        objective: null,
        content: null,
        example: null
    };

    var sectionAktif = null;
    var kontenSection = [];
    var nomorPertemuanRaw = "";

    for (var i = 0; i < blok.length; i++) {
        var baris = blok[i];
        var barisTrim = baris.trim();
        var barisUpper = barisTrim.toUpperCase();

        if (barisUpper.match(/^PERTEMUAN\s+\d+/)) {
            var match = barisUpper.match(/^PERTEMUAN\s+(\d+)/);
            if (match) {
                materi.meeting_number = parseInt(match[1], 10);
                nomorPertemuanRaw = barisTrim;
            }
            sectionAktif = null;
        } else if (barisUpper.startsWith('JUDUL:')) {
            simpanSection(materi, sectionAktif, kontenSection);
            materi.title = barisTrim.substring(6).trim();
            sectionAktif = null;
            kontenSection = [];
        } else if (barisUpper === 'TUJUAN:') {
            simpanSection(materi, sectionAktif, kontenSection);
            sectionAktif = 'TUJUAN';
            kontenSection = [];
        } else if (barisUpper === 'MATERI:') {
            simpanSection(materi, sectionAktif, kontenSection);
            sectionAktif = 'MATERI';
            kontenSection = [];
        } else if (barisUpper === 'CONTOH:') {
            simpanSection(materi, sectionAktif, kontenSection);
            sectionAktif = 'CONTOH';
            kontenSection = [];
        } else {
            if (sectionAktif !== null) {
                kontenSection.push(baris);
            }
        }
    }
    simpanSection(materi, sectionAktif, kontenSection);

    // Identifikasi nama pertemuan untuk error
    var namaPertemuanUntukError = materi.meeting_number ? 'Pertemuan ' + materi.meeting_number : (nomorPertemuanRaw || 'Pertemuan Tidak Diketahui');

    if (!materi.meeting_number) {
        return { materi: null, error: namaPertemuanUntukError + ' tidak valid: nomor pertemuan tidak dapat dibaca.' };
    }
    if (!materi.title) {
        return { materi: null, error: namaPertemuanUntukError + ' tidak valid: JUDUL tidak ditemukan.' };
    }
    if (!materi.objective || materi.objective.trim() === '') {
        return { materi: null, error: namaPertemuanUntukError + ' tidak valid: bagian TUJUAN tidak ditemukan.' };
    }
    if (!materi.content || materi.content.trim() === '') {
        return { materi: null, error: namaPertemuanUntukError + ' tidak valid: bagian MATERI tidak ditemukan.' };
    }

    return { materi: materi, error: null };
}

function simpanSection(materi, sectionAktif, kontenSection) {
    if (sectionAktif === null || kontenSection.length === 0) return;

    // Gabungkan konten dengan newline, lalu trim awal/akhir agar rapi, tapi simpan newline di tengah
    var teks = kontenSection.join('\n').trim();
    if (teks === '') return;

    if (sectionAktif === 'TUJUAN') {
        materi.objective = teks;
    } else if (sectionAktif === 'MATERI') {
        materi.content = teks;
    } else if (sectionAktif === 'CONTOH') {
        materi.example = teks;
    }
}
