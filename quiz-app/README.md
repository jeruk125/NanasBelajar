# 🍍 NanasBelajar - Aplikasi Quiz

Aplikasi quiz sederhana berbasis web. Guru memasukkan soal, siswa mengerjakan quiz dari komputer manapun di jaringan yang sama, dan hasil tersimpan permanen di database.

---

## Teknologi yang Digunakan

| Teknologi | Kegunaan |
|-----------|----------|
| Python + Flask | Server web, routing, logika backend |
| SQLite | Database penyimpanan soal dan hasil |
| Jinja2 | Template engine (render HTML dari Python) |
| HTML + CSS | Tampilan halaman |
| JavaScript Vanilla | Parser soal di browser, validasi form |

---

## Struktur Folder

```
quiz-app/
│
├── app.py          ← Aplikasi Flask utama, semua route di sini
├── database.py     ← Fungsi koneksi dan inisialisasi database
├── schema.sql      ← Definisi tabel SQLite
├── nanasdb.sqlite  ← File database (dibuat otomatis saat pertama jalan)
├── requirements.txt
│
├── templates/      ← File HTML yang dirender Flask (Jinja2)
│   ├── base.html
│   ├── index.html
│   ├── input-soal.html
│   ├── preview-soal.html
│   ├── mulai-quiz.html
│   ├── quiz.html
│   ├── hasil.html
│   └── daftar-nilai.html
│
└── static/         ← File CSS dan JS yang disajikan langsung ke browser
    ├── css/
    │   └── style.css
    └── js/
        ├── parser.js   ← Parser teks soal (pure JavaScript)
        ├── main.js     ← Logika halaman input-soal
        ├── quiz.js     ← Validasi form quiz
        └── result.js   ← Utilitas escapeHtml
```

---

## Cara Menjalankan (Pertama Kali)

### 1. Pastikan Python sudah terinstall

```
python --version
```

Harus muncul Python 3.8 atau lebih baru.

### 2. Buat virtual environment (opsional tapi direkomendasikan)

Virtual environment memisahkan paket project ini dari sistem Python global.

```
python -m venv venv
```

### 3. Aktifkan virtual environment

**Windows:**
```
venv\Scripts\activate
```

**Mac / Linux:**
```
source venv/bin/activate
```

Setelah aktif, prompt terminal akan menampilkan `(venv)` di depannya.

### 4. Install Flask

```
pip install -r requirements.txt
```

### 5. Jalankan aplikasi

```
python app.py
```

Output yang akan muncul:

```
Database berhasil diinisialisasi: .../nanasdb.sqlite
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.x.x:5000
```

### 6. Buka di browser

```
http://127.0.0.1:5000
```

---

## Cara Menjalankan (Setelah Pertama Kali)

Cukup dua langkah:

```
venv\Scripts\activate
python app.py
```

---

## Akses dari Komputer Lain di Jaringan Lokal (LAN)

Aplikasi sudah dikonfigurasi dengan `host='0.0.0.0'` sehingga dapat diakses dari komputer lain di jaringan yang sama.

**Langkah-langkah:**

1. Jalankan `python app.py` di komputer guru (server).
2. Cari IP komputer guru. Di Windows, buka Command Prompt dan ketik:
   ```
   ipconfig
   ```
   Cari bagian **IPv4 Address**, contoh: `192.168.1.5`

3. Dari komputer siswa, buka browser dan ketik:
   ```
   http://192.168.1.5:5000
   ```

4. Siswa bisa langsung membuka halaman Mulai Quiz dan mengerjakan quiz.

**Syarat:** Kedua komputer harus terhubung ke jaringan WiFi atau LAN yang sama.

---

## Alur Penggunaan

```
Guru buka /input-soal
    ↓
Ketik soal, tekan "Parse Soal"
    ↓
JavaScript (parser.js) memecah teks menjadi data soal
    ↓
Data soal dikirim ke Flask via fetch() POST /preview-soal
    ↓
Flask menyimpan soal sementara di session
    ↓
Halaman /preview-soal menampilkan soal (Jinja2)
    ↓
Guru klik "Simpan Soal" → POST /simpan-soal
    ↓
Flask INSERT soal ke tabel questions (SQLite)
    ↓
Siswa buka /mulai-quiz, isi nama
    ↓
Flask simpan nama ke session → redirect ke /quiz
    ↓
Flask SELECT soal dari SQLite → render quiz.html
    ↓
Siswa jawab semua soal, klik "Selesai Quiz"
    ↓
Browser submit form POST /submit-quiz
    ↓
Flask ambil jawaban benar dari database
Flask hitung nilai di Python
Flask INSERT ke quiz_results dan answers
    ↓
Redirect ke /hasil/<result_id>
    ↓
Flask SELECT hasil + JOIN answers+questions
Render hasil.html
    ↓
Guru buka /daftar-nilai
Flask SELECT semua hasil ORDER BY created_at DESC
```

---

## Format Soal

Guru mengetik soal di halaman Input Soal dengan format berikut:

```
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
```

**Aturan:**
- Setiap soal diawali baris `SOAL N`
- Baris berikutnya adalah pertanyaan
- Empat baris `A.` `B.` `C.` `D.` adalah pilihan jawaban
- `JAWABAN:` diisi huruf A, B, C, atau D
- Pisahkan antar soal dengan satu baris kosong

---

## Cara Kerja Parser Soal

Parser ada di `static/js/parser.js`. Fungsi utamanya adalah `parseQuestions(teks)`.

**Langkah kerja:**

```
Teks mentah dari textarea
    ↓
split('\n') → array baris
    ↓
kelompokkanMenjadiBlok() → setiap blok dimulai dari baris "SOAL N"
    ↓
parseSatuSoal() → baca setiap baris, identifikasi:
    baris dimulai "A." → optionA
    baris dimulai "JAWABAN:" → correctAnswer
    baris lain → question
    ↓
validasiSoal() → periksa semua field ada
    ↓
Jika valid: kirim ke Flask via fetch() POST
Jika error: tampilkan pesan ke pengguna
```

Parser tetap berjalan di browser (JavaScript) agar Anda bisa belajar parsing di JavaScript. Hasilnya baru dikirim ke Flask untuk disimpan ke database.

---

## Cara Kerja Database

### Membuka koneksi

```python
# database.py
conn = sqlite3.connect('nanasdb.sqlite')
conn.row_factory = sqlite3.Row  # agar bisa akses kolom by name
```

### Menyimpan soal (parameterized query)

```python
# Aman dari SQL Injection karena pakai tanda tanya (?)
conn.execute(
    'INSERT INTO questions (question, option_a, correct_answer) VALUES (?, ?, ?)',
    (soal['question'], soal['optionA'], soal['correctAnswer'])
)
conn.commit()
```

### Membaca soal

```python
soal = conn.execute('SELECT * FROM questions ORDER BY id').fetchall()
# soal[0]['question'] → teks pertanyaan soal pertama
```

### JOIN dua tabel

```python
# Ambil jawaban peserta beserta teks soalnya sekaligus
conn.execute('''
    SELECT a.selected_answer, a.correct_answer, q.question
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.result_id = ?
''', (result_id,))
```

---

## Cara Kerja Session Flask

Session dipakai untuk membawa data sementara antar halaman tanpa menyimpan di database.

```python
# Simpan nama peserta saat mulai quiz
session['nama_peserta'] = 'Aditia'

# Baca nama di halaman quiz
nama = session.get('nama_peserta', '')

# Hapus setelah quiz selesai
session.pop('nama_peserta', None)
```

Session disimpan di cookie browser yang dienkripsi dengan `secret_key`. Pengguna tidak bisa membaca atau mengubah isinya.

---

## Cara Kerja Pengiriman Soal dari Browser ke Flask

Di `static/js/main.js`, fungsi `jalankanParseSoal()` mengirim data JSON ke Flask:

```javascript
// JavaScript mengirim array soal ke Flask
fetch('/preview-soal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soal: hasilParse.soal })
})
```

Flask menerimanya di `app.py`:

```python
@app.route('/preview-soal', methods=['POST'])
def preview_soal():
    data = request.get_json()      # baca JSON dari browser
    daftar_soal = data['soal']     # ambil array soal
    session['soal_preview'] = daftar_soal  # simpan ke session
    return jsonify({'sukses': True})
```

---

## Cara Kerja Perhitungan Nilai

Nilai **tidak dihitung di browser**, melainkan di Python oleh Flask:

```python
# app.py, fungsi submit_quiz()
jumlah_benar = 0

for soal in daftar_soal:             # soal dari DATABASE
    nama_field = f'jawaban_{soal["id"]}'
    jawaban_peserta = request.form.get(nama_field, '').upper()
    jawaban_benar   = soal['correct_answer']   # dari DATABASE

    if jawaban_peserta == jawaban_benar:
        jumlah_benar += 1

nilai = math.floor((jumlah_benar / len(daftar_soal)) * 100)
```

Kunci keamanannya: jawaban benar diambil dari database, bukan dari form browser.

---

## Cara Kerja Jinja2

Flask mengirim data Python ke template HTML dengan `render_template()`:

```python
# app.py
return render_template('quiz.html',
    nama_peserta=nama_peserta,
    daftar_soal=daftar_soal
)
```

Di template, data tersebut diakses dengan `{{ }}` dan `{% %}`:

```html
<!-- templates/quiz.html -->
<p>Peserta: <strong>{{ nama_peserta }}</strong></p>

{% for soal in daftar_soal %}
    <div>{{ soal.question }}</div>
    <input type="radio" name="jawaban_{{ soal.id }}" value="A">
    A. {{ soal.option_a }}
{% endfor %}
```

Jinja2 otomatis meng-escape karakter HTML, sehingga aman dari XSS.

---

## Cara Menghapus Data

### Hapus semua hasil quiz
Buka halaman **Daftar Nilai** → klik tombol **"Hapus Semua Hasil"**.

### Hapus database sepenuhnya
Hapus file `nanasdb.sqlite`. Database baru akan dibuat otomatis saat `python app.py` dijalankan kembali.

### Melalui browser DevTools (untuk developer)
Buka F12 → Console, lalu jalankan query SQLite tidak bisa dari browser.
Untuk manipulasi database langsung, gunakan tools seperti **DB Browser for SQLite** (gratis, bisa didownload di sqlitebrowser.org).

---

## Catatan Penting

> Aplikasi ini dirancang untuk jaringan lokal (LAN). Data tersimpan di file `nanasdb.sqlite` di komputer tempat Flask berjalan. Semua perangkat di jaringan yang sama mengakses database yang sama — berbeda dengan versi localStorage yang datanya terpisah per browser.

> Mode `debug=True` di `app.py` hanya untuk pengembangan. Jika sudah digunakan di lingkungan nyata, pertimbangkan untuk menggantinya dengan `debug=False`.
