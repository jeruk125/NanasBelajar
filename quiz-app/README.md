# 🍍 NanasBelajar - Aplikasi Quiz

Aplikasi quiz sederhana berbasis web. Guru memasukkan soal dalam format teks, siswa mengerjakan quiz di browser, dan hasil langsung tersimpan tanpa memerlukan backend atau internet.

---

## Teknologi yang Digunakan

| Teknologi | Kegunaan |
|-----------|----------|
| HTML | Struktur halaman |
| CSS | Tampilan dan layout |
| JavaScript (Vanilla) | Logika aplikasi |
| localStorage | Penyimpanan data di browser |

Tidak ada framework, tidak ada library, tidak ada backend, tidak ada database.

---

## Struktur Folder

```
quiz-app/
│
├── index.html          ← Halaman utama / beranda
├── input-soal.html     ← Halaman guru memasukkan soal
├── preview-soal.html   ← Halaman preview sebelum soal disimpan
├── mulai-quiz.html     ← Halaman peserta memasukkan nama
├── quiz.html           ← Halaman mengerjakan quiz
├── hasil.html          ← Halaman hasil dan review jawaban
├── daftar-nilai.html   ← Halaman daftar semua nilai
│
├── css/
│   └── style.css       ← Semua gaya tampilan
│
└── js/
    ├── storage.js      ← Fungsi simpan/baca localStorage
    ├── parser.js       ← Fungsi memecah teks soal
    ├── quiz.js         ← Logika halaman quiz
    ├── result.js       ← Logika halaman hasil & daftar nilai
    └── main.js         ← Inisialisasi halaman & contoh data
```

---

## Cara Menjalankan Project

Karena ini adalah frontend murni (HTML + CSS + JS), **tidak perlu instalasi apapun**.

**Cara paling sederhana:**
1. Buka folder `quiz-app/` di File Explorer.
2. Klik dua kali pada file `index.html`.
3. File akan terbuka di browser default Anda.

**Cara yang direkomendasikan (menghindari masalah CORS):**
Gunakan ekstensi **Live Server** di VS Code / Kiro:
1. Klik kanan pada `index.html`.
2. Pilih "Open with Live Server".
3. Browser akan otomatis terbuka.

---

## Alur Penggunaan

```
Guru memasukkan soal di input-soal.html
          ↓
    Parse Soal (JavaScript memecah teks)
          ↓
    Preview di preview-soal.html
          ↓
    Simpan ke localStorage
          ↓
Peserta masukkan nama di mulai-quiz.html
          ↓
    Kerjakan quiz di quiz.html
          ↓
    Tekan "Selesai Quiz"
          ↓
    Nilai dihitung oleh JavaScript
          ↓
    Hasil ditampilkan di hasil.html
          ↓
    Data disimpan ke localStorage
          ↓
Semua nilai tersedia di daftar-nilai.html
```

---

## Cara Memasukkan Soal

Buka `input-soal.html`, lalu ketik atau tempel soal dalam format berikut:

```
SOAL 1
Apa ibu kota negara Indonesia?
A. Bandung
B. Surabaya
C. Jakarta
D. Medan
JAWABAN: C

SOAL 2
Planet tempat kita tinggal bernama?
A. Mars
B. Venus
C. Jupiter
D. Bumi
JAWABAN: D
```

**Aturan format:**
- Setiap soal diawali dengan baris `SOAL N` (N adalah nomor soal).
- Baris berikutnya adalah pertanyaan.
- Empat baris berikutnya adalah pilihan `A.` `B.` `C.` `D.`
- Baris terakhir adalah `JAWABAN:` diikuti huruf A, B, C, atau D.
- Pisahkan antar soal dengan **satu baris kosong**.

---

## Cara Kerja Parser

Parser ada di file `js/parser.js`, fungsi utamanya adalah `parseQuestions(teks)`.

**Langkah kerja parser:**

### Langkah 1 — Pecah teks menjadi baris
```javascript
var semuaBaris = teks.split('\n');
// Teks dipotong di setiap karakter baris baru
// Hasilnya: ["SOAL 1", "Apa ibu kota?", "A. Bandung", ...]
```

### Langkah 2 — Kelompokkan baris menjadi blok soal
Fungsi `kelompokkanMenjadiBlok()` membaca setiap baris satu per satu. Setiap kali menemukan baris yang dimulai dengan kata `SOAL`, fungsi ini mulai mengumpulkan baris-baris berikutnya menjadi satu "blok".

```javascript
// Hasil blok: array of array
[
  ["SOAL 1", "Apa ibu kota?", "A. Bandung", "B. Jakarta", ...],
  ["SOAL 2", "Planet kita?", "A. Mars", ...]
]
```

### Langkah 3 — Parse setiap blok
Fungsi `parseSatuSoal()` membaca baris satu per satu dalam satu blok dan mengidentifikasi bagiannya:
- Baris dimulai `A.` → optionA
- Baris dimulai `B.` → optionB
- Baris dimulai `JAWABAN:` → correctAnswer
- Baris lainnya → question (pertanyaan)

### Langkah 4 — Validasi
Setiap soal diperiksa kelengkapannya oleh fungsi `validasiSoal()`. Jika ada bagian yang hilang, pesan error yang jelas akan ditampilkan, misalnya: *"Soal 3 tidak valid: pilihan C tidak ditemukan."*

### Hasil akhir
```javascript
[
  {
    question: "Apa ibu kota negara Indonesia?",
    optionA: "Bandung",
    optionB: "Surabaya",
    optionC: "Jakarta",
    optionD: "Medan",
    correctAnswer: "C"
  },
  // ...soal berikutnya
]
```

---

## Cara Kerja localStorage

localStorage adalah tempat penyimpanan data yang ada di dalam browser. Berbeda dengan variabel JavaScript biasa, data di localStorage **tidak hilang** ketika halaman di-refresh atau browser ditutup.

**Batasan localStorage:**
- Hanya bisa menyimpan **string** (teks).
- Karena itu, object/array JavaScript harus diubah menjadi string JSON terlebih dahulu.

### Menyimpan data

```javascript
// Ubah array/object menjadi string JSON
var dataString = JSON.stringify(arraySoal);

// Simpan ke localStorage dengan nama kunci
localStorage.setItem('quizQuestions', dataString);
```

### Membaca data

```javascript
// Ambil string dari localStorage
var dataString = localStorage.getItem('quizQuestions');

// Jika belum ada data, getItem mengembalikan null
if (dataString === null) {
    return []; // kembalikan array kosong
}

// Ubah string JSON kembali menjadi array/object
var arraySoal = JSON.parse(dataString);
```

### Menghapus data

```javascript
// Hapus satu kunci
localStorage.removeItem('quizQuestions');

// Atau hapus semua data localStorage di domain ini
localStorage.clear();
```

### Kunci yang digunakan aplikasi ini

| Kunci | Isi | Dipakai di |
|-------|-----|------------|
| `quizQuestions` | Array soal yang sudah disimpan guru | input-soal, quiz |
| `quizResults` | Array semua hasil quiz peserta | hasil, daftar-nilai |
| `quizNamaPeserta` | Nama peserta sementara | mulai-quiz → quiz |
| `quizSoalPreview` | Soal sementara sebelum dikonfirmasi | input-soal → preview |
| `quizIndeksHasilTerakhir` | Indeks hasil yang sedang dilihat | quiz → hasil, daftar-nilai → hasil |

---

## Cara Kerja Quiz (Membaca Radio Button)

Di `quiz.html`, setiap soal ditampilkan dengan 4 radio button. Setiap grup radio button untuk satu soal memiliki `name` yang sama, misalnya `name="soal-0"` untuk soal pertama.

Karena semua radio button dalam satu grup memiliki `name` yang sama, browser otomatis memastikan hanya satu yang bisa dipilih.

Untuk membaca jawaban yang dipilih:

```javascript
// Ambil semua radio button dalam grup soal ke-0
var radioButtons = document.getElementsByName('soal-0');

var jawabanTerpilih = null;

// Loop setiap radio button
for (var j = 0; j < radioButtons.length; j++) {
    if (radioButtons[j].checked) {
        // Radio button ini yang dipilih
        jawabanTerpilih = radioButtons[j].value; // "A", "B", "C", atau "D"
        break;
    }
}
```

---

## Cara Kerja Perhitungan Nilai

Setelah peserta menekan "Selesai Quiz", fungsi `hitungHasil()` di `quiz.js` bekerja:

```javascript
// 1. Hitung jumlah jawaban benar
var jumlahBenar = 0;

for (var i = 0; i < daftarSoal.length; i++) {
    var jawabanPeserta = semuaJawaban[i];   // "A", "B", "C", atau "D"
    var jawabanBenar   = daftarSoal[i].correctAnswer;

    if (jawabanPeserta === jawabanBenar) {
        jumlahBenar++;
    }
}

// 2. Hitung jumlah salah
var jumlahSalah = daftarSoal.length - jumlahBenar;

// 3. Hitung nilai dengan rumus: (benar / total) × 100
var nilai = Math.round((jumlahBenar / daftarSoal.length) * 100);
```

**Contoh:** 10 soal, 8 benar → `(8 / 10) × 100 = 80`

---

## Cara Kerja Tampilan Hasil

Fungsi `inisialisasiHalamanHasil()` di `result.js` bekerja seperti ini:

```javascript
// 1. Baca indeks hasil dari localStorage
var indeks = localStorage.getItem('quizIndeksHasilTerakhir');

// 2. Ambil data hasil berdasarkan indeks
var dataHasil = muatHasilByIndeks(indeks);

// 3. Isi elemen HTML dengan data
document.getElementById('hasil-nama').textContent  = dataHasil.name;
document.getElementById('hasil-nilai').textContent = dataHasil.score;
document.getElementById('hasil-benar').textContent = dataHasil.correct;

// 4. Buat HTML review jawaban dan masukkan ke halaman
var htmlReview = buatHtmlReviewJawaban(dataHasil.answers);
document.getElementById('kontainer-review').innerHTML = htmlReview;
```

---

## Cara Menghapus Data localStorage

### Via browser (Chrome/Edge):
1. Tekan **F12** untuk membuka DevTools.
2. Buka tab **Application**.
3. Di panel kiri, pilih **Local Storage** → pilih domain Anda.
4. Klik kanan pada kunci yang ingin dihapus, lalu pilih **Delete**.
5. Atau klik tombol 🗑️ untuk menghapus semua.

### Via tombol di aplikasi:
- Di halaman **Daftar Nilai**: ada tombol **"Hapus Semua Hasil"** untuk menghapus semua hasil quiz.
- Untuk menghapus soal: masukkan soal baru dan simpan — soal lama akan tergantikan.

### Via Console browser:
```javascript
// Hapus semua data aplikasi ini
localStorage.removeItem('quizQuestions');
localStorage.removeItem('quizResults');
localStorage.removeItem('quizNamaPeserta');
localStorage.removeItem('quizSoalPreview');
localStorage.removeItem('quizIndeksHasilTerakhir');
```

---

## Catatan Penting

> Data **hanya tersimpan di browser yang digunakan**. Jika peserta membuka aplikasi di browser atau perangkat yang berbeda, mereka tidak akan melihat data yang sama. Ini adalah keterbatasan localStorage yang akan diatasi ketika backend ditambahkan pada tahap berikutnya.

---

## Rencana Pengembangan Selanjutnya

Tahap ini hanya mencakup **frontend**. Pada tahap berikutnya akan ditambahkan:

- Backend (server) untuk menyimpan data secara permanen
- Database
- Sistem login guru dan siswa
- Fitur lanjutan seperti batas waktu, soal acak, dan ekspor nilai
