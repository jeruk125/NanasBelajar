# ============================================================
# APP.PY - Aplikasi Flask NanasBelajar
# ============================================================
# File ini adalah inti dari backend aplikasi.
# Semua route (URL) didefinisikan di sini.
#
# Cara Flask bekerja:
#   - Browser mengirim request ke URL tertentu, misalnya GET /quiz
#   - Flask mencocokkan URL dengan fungsi yang diberi @app.route(...)
#   - Fungsi tersebut dijalankan, menghasilkan HTML yang dikirim ke browser
#
# Urutan route di file ini:
#   1. Setup & konfigurasi
#   2. GET  /                   - halaman utama
#   3. GET  /input-soal         - halaman input soal
#   4. POST /preview-soal       - terima data soal, simpan ke session
#   5. POST /simpan-soal        - simpan soal ke database
#   6. GET  /mulai-quiz         - halaman input nama peserta
#   7. GET  /quiz               - halaman mengerjakan quiz
#   8. POST /submit-quiz        - terima jawaban, hitung nilai, simpan
#   9. GET  /hasil/<result_id>  - halaman hasil satu peserta
#  10. GET  /daftar-nilai       - halaman semua hasil
#  11. POST /hapus-semua-hasil  - hapus semua hasil (dari daftar-nilai)
# ============================================================

import math
from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify
)
from database import get_db_connection, init_db

# ============================================================
# SETUP FLASK
# ============================================================

app = Flask(__name__)

# Secret key dibutuhkan Flask untuk mengenkripsi data session.
# Session menyimpan data sementara di sisi server (bukan browser).
# Ganti nilai ini dengan string acak yang panjang jika sudah production.
app.secret_key = 'nanasrahasia2026gantinanti'

# Inisialisasi database saat aplikasi pertama dijalankan.
# Fungsi ini membuat tabel jika belum ada (IF NOT EXISTS, jadi aman).
init_db()


# ============================================================
# ROUTE 1: GET / - Halaman Utama
# ============================================================

@app.route('/')
def index():
    """
    Menampilkan halaman utama.

    Cara kerja:
    - Flask menjalankan fungsi ini saat browser membuka http://localhost:5000/
    - render_template('index.html') membaca file templates/index.html
      dan mengirimkannya ke browser.
    """
    # Ambil jumlah soal dari database untuk ditampilkan di beranda
    conn = get_db_connection()
    jumlah_soal = conn.execute('SELECT COUNT(*) FROM questions').fetchone()[0]
    jumlah_peserta = conn.execute('SELECT COUNT(*) FROM quiz_results').fetchone()[0]
    conn.close()

    return render_template(
        'index.html',
        jumlah_soal=jumlah_soal,
        jumlah_peserta=jumlah_peserta
    )


# ============================================================
# ROUTE 2: GET /input-soal - Halaman Input Soal
# ============================================================

@app.route('/input-soal')
def input_soal():
    """
    Menampilkan halaman input soal.

    Di halaman ini guru mengetik teks soal.
    JavaScript (parser.js) memproses teks tersebut di browser,
    lalu mengirim data JSON ke route /preview-soal.
    """
    conn = get_db_connection()
    jumlah_soal_tersimpan = conn.execute('SELECT COUNT(*) FROM questions').fetchone()[0]
    conn.close()

    return render_template(
        'input-soal.html',
        jumlah_soal_tersimpan=jumlah_soal_tersimpan
    )


# ============================================================
# ROUTE 3: POST /preview-soal - Terima data dari parser JS
# ============================================================

@app.route('/preview-soal', methods=['POST'])
def preview_soal():
    """
    Menerima data soal yang sudah di-parse oleh JavaScript,
    menyimpannya sementara di session, lalu menampilkan preview.

    Alur:
    1. JavaScript di input-soal.html mengirim data JSON via fetch().
    2. Flask menerima JSON tersebut.
    3. Validasi dasar dilakukan di Python.
    4. Soal disimpan ke session['soal_preview'] sementara.
    5. Halaman preview ditampilkan dengan data soal tersebut.

    Mengapa session?
    - Session menyimpan data di server, bukan browser.
    - Data tersedia selama browser tidak ditutup (atau session timeout).
    - Lebih aman daripada localStorage karena data tidak bisa
      dimanipulasi pengguna.

    Mengapa bukan langsung simpan ke database?
    - Guru perlu melihat preview dulu sebelum konfirmasi.
    - Jika guru klik "Edit", data belum masuk ke database.
    """
    # Ambil data JSON yang dikirim JavaScript
    # request.get_json() membaca body request yang berformat JSON
    data = request.get_json()

    if not data or 'soal' not in data:
        return jsonify({'error': 'Data soal tidak ditemukan.'}), 400

    daftar_soal = data['soal']

    if len(daftar_soal) == 0:
        return jsonify({'error': 'Tidak ada soal yang dikirim.'}), 400

    # Validasi setiap soal di Python (jangan percaya data dari browser)
    soal_valid, pesan_error = validasi_daftar_soal(daftar_soal)
    if not soal_valid:
        return jsonify({'error': pesan_error}), 400

    # Simpan soal ke session sebagai data sementara
    # session adalah dictionary khusus Flask yang datanya disimpan
    # di sisi server (bukan localStorage browser)
    session['soal_preview'] = daftar_soal

    # Kembalikan respons sukses ke JavaScript
    # JavaScript akan redirect ke /preview-soal (GET) setelah ini
    return jsonify({'sukses': True, 'jumlah': len(daftar_soal)})


@app.route('/preview-soal', methods=['GET'])
def preview_soal_halaman():
    """
    Menampilkan halaman preview soal.
    Data soal diambil dari session yang diisi oleh POST /preview-soal.
    """
    daftar_soal = session.get('soal_preview', None)

    # Jika tidak ada data di session, redirect ke input soal
    if daftar_soal is None:
        return redirect(url_for('input_soal'))

    return render_template(
        'preview-soal.html',
        daftar_soal=daftar_soal,
        jumlah_soal=len(daftar_soal)
    )


# ============================================================
# ROUTE 4: POST /simpan-soal - Simpan soal ke database
# ============================================================

@app.route('/simpan-soal', methods=['POST'])
def simpan_soal():
    """
    Mengambil soal dari session dan menyimpannya ke tabel questions.

    Alur:
    1. Ambil soal dari session['soal_preview'].
    2. Hapus semua soal lama dari database (diganti yang baru).
    3. INSERT soal-soal baru satu per satu.
    4. Hapus session['soal_preview'] (sudah tidak diperlukan).
    5. Redirect ke halaman input soal dengan pesan sukses.

    Parameterized query:
    Kita menggunakan tanda tanya (?) sebagai placeholder, bukan
    menggabungkan string langsung. Ini mencegah SQL Injection.

    Contoh BERBAHAYA (jangan dilakukan):
        query = "INSERT INTO questions (question) VALUES ('" + soal['question'] + "')"
        # Jika question berisi ' DROP TABLE questions; --
        # maka query menjadi merusak!

    Contoh AMAN (yang kita gunakan):
        cursor.execute("INSERT INTO questions (question) VALUES (?)", (soal['question'],))
        # Tanda ? diisi oleh SQLite secara aman, karakter berbahaya
        # secara otomatis di-escape.
    """
    daftar_soal = session.get('soal_preview', None)

    if daftar_soal is None:
        flash('Tidak ada soal untuk disimpan. Silakan ulangi proses input soal.', 'error')
        return redirect(url_for('input_soal'))

    conn = get_db_connection()

    try:
        # Hapus data lama dalam urutan yang benar: child dulu, baru parent.
        #
        # Mengapa urutan ini penting?
        # Tabel answers punya foreign key ke questions (answers.question_id).
        # SQLite MELARANG menghapus baris di questions jika masih ada baris
        # di answers yang menunjuk ke sana - ini yang menyebabkan error
        # "FOREIGN KEY constraint failed" saat menyimpan soal untuk ke-2 kalinya.
        #
        # Solusi: hapus answers dulu (child), baru hapus questions (parent).
        # Kita juga hapus quiz_results karena jawaban peserta lama sudah
        # tidak relevan jika soal-soalnya diganti sepenuhnya.
        conn.execute('DELETE FROM answers')
        conn.execute('DELETE FROM quiz_results')
        conn.execute('DELETE FROM questions')

        # INSERT setiap soal dengan parameterized query
        for soal in daftar_soal:
            conn.execute(
                '''INSERT INTO questions
                   (question, option_a, option_b, option_c, option_d, correct_answer)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (
                    soal['question'],      # ? pertama
                    soal['optionA'],       # ? kedua
                    soal['optionB'],       # ? ketiga
                    soal['optionC'],       # ? keempat
                    soal['optionD'],       # ? kelima
                    soal['correctAnswer']  # ? keenam
                )
            )

        # Commit = konfirmasi semua perubahan ke database
        # Tanpa commit, perubahan tidak tersimpan permanen
        conn.commit()

    except Exception as e:
        # Jika ada error, batalkan semua perubahan (rollback)
        conn.rollback()
        conn.close()
        flash(f'Gagal menyimpan soal: {str(e)}', 'error')
        return redirect(url_for('preview_soal_halaman'))

    conn.close()

    # Hapus data preview dari session karena sudah disimpan ke DB
    session.pop('soal_preview', None)

    flash(f'{len(daftar_soal)} soal berhasil disimpan ke database!', 'sukses')
    return redirect(url_for('input_soal'))


# ============================================================
# ROUTE 5: GET /mulai-quiz - Halaman nama peserta
# ============================================================

@app.route('/mulai-quiz')
def mulai_quiz():
    """
    Menampilkan halaman untuk memasukkan nama peserta.
    Juga menampilkan peringatan jika belum ada soal di database.
    """
    conn = get_db_connection()
    jumlah_soal = conn.execute('SELECT COUNT(*) FROM questions').fetchone()[0]
    conn.close()

    ada_soal = jumlah_soal > 0

    return render_template(
        'mulai-quiz.html',
        ada_soal=ada_soal,
        jumlah_soal=jumlah_soal
    )


@app.route('/mulai-quiz', methods=['POST'])
def proses_nama_peserta():
    """
    Menerima nama peserta dari form, validasi, simpan ke session.

    Flask session dipakai untuk membawa nama peserta dari halaman
    mulai-quiz ke halaman quiz tanpa harus kirim via URL.
    """
    nama = request.form.get('nama_peserta', '').strip()

    # Validasi nama
    if not nama:
        flash('Nama peserta tidak boleh kosong.', 'error')
        return redirect(url_for('mulai_quiz'))

    if len(nama) < 2:
        flash('Nama peserta terlalu pendek. Minimal 2 karakter.', 'error')
        return redirect(url_for('mulai_quiz'))

    if len(nama) > 80:
        flash('Nama peserta terlalu panjang. Maksimal 80 karakter.', 'error')
        return redirect(url_for('mulai_quiz'))

    # Cek apakah ada soal
    conn = get_db_connection()
    jumlah_soal = conn.execute('SELECT COUNT(*) FROM questions').fetchone()[0]
    conn.close()

    if jumlah_soal == 0:
        flash('Belum ada soal tersimpan. Silakan minta guru untuk memasukkan soal.', 'error')
        return redirect(url_for('mulai_quiz'))

    # Simpan nama ke session Flask
    # session['nama_peserta'] tersedia di request berikutnya
    session['nama_peserta'] = nama

    return redirect(url_for('quiz'))


# ============================================================
# ROUTE 6: GET /quiz - Halaman mengerjakan quiz
# ============================================================

@app.route('/quiz')
def quiz():
    """
    Menampilkan halaman quiz dengan soal-soal dari database.

    Cara kerja:
    1. Periksa apakah nama peserta ada di session.
    2. Ambil semua soal dari database dengan SELECT *.
    3. Kirim soal ke template quiz.html via render_template.
    4. Jinja2 di template akan looping soal-soal tersebut.

    Penting: soal tidak lagi dari localStorage, melainkan langsung
    dari SQLite via Flask, sehingga semua peserta mendapat soal yang sama.
    """
    # Jika nama peserta tidak ada di session, redirect ke mulai-quiz
    if 'nama_peserta' not in session:
        flash('Silakan masukkan nama Anda terlebih dahulu.', 'error')
        return redirect(url_for('mulai_quiz'))

    nama_peserta = session['nama_peserta']

    # Ambil semua soal dari database
    # fetchall() mengembalikan list berisi semua baris hasil query
    conn = get_db_connection()
    daftar_soal = conn.execute('SELECT * FROM questions ORDER BY id').fetchall()
    conn.close()

    if len(daftar_soal) == 0:
        flash('Belum ada soal tersimpan.', 'error')
        return redirect(url_for('mulai_quiz'))

    # render_template mengirim variabel ke template HTML
    # Di template bisa diakses dengan {{ nama_peserta }}, {{ daftar_soal }}, dll.
    return render_template(
        'quiz.html',
        nama_peserta=nama_peserta,
        daftar_soal=daftar_soal,
        jumlah_soal=len(daftar_soal)
    )


# ============================================================
# ROUTE 7: POST /submit-quiz - Terima jawaban, hitung nilai
# ============================================================

@app.route('/submit-quiz', methods=['POST'])
def submit_quiz():
    """
    Menerima jawaban peserta, menghitung nilai di Python,
    menyimpan hasil ke database, lalu redirect ke halaman hasil.

    Alur lengkap:
    1. Ambil nama peserta dari session.
    2. Ambil semua soal dari database.
    3. Untuk setiap soal, ambil jawaban peserta dari form.
    4. Bandingkan dengan jawaban benar dari DATABASE (bukan dari browser).
    5. Hitung nilai: (benar / total) * 100.
    6. Simpan ke tabel quiz_results.
    7. Simpan setiap jawaban ke tabel answers.
    8. Redirect ke /hasil/<result_id>.

    Kenapa nilai dihitung di Python?
    JavaScript bisa dimanipulasi oleh pengguna di browser DevTools.
    Kita TIDAK pernah menerima nilai dari browser - selalu hitung ulang.

    Tentang form data:
    Browser mengirim data form sebagai key=value pairs.
    Kita memberi name="jawaban_<question_id>" pada setiap radio button.
    Contoh: name="jawaban_1" value="B" artinya soal ID 1 dijawab B.
    """
    # Ambil nama dari session
    nama_peserta = session.get('nama_peserta', '')
    if not nama_peserta:
        flash('Sesi Anda telah berakhir. Silakan mulai ulang.', 'error')
        return redirect(url_for('mulai_quiz'))

    # Ambil soal dari database (sumber kebenaran)
    conn = get_db_connection()
    daftar_soal = conn.execute('SELECT * FROM questions ORDER BY id').fetchall()

    if len(daftar_soal) == 0:
        conn.close()
        flash('Tidak ada soal.', 'error')
        return redirect(url_for('mulai_quiz'))

    # Hitung nilai
    jumlah_benar = 0
    jumlah_salah = 0
    detail_jawaban = []  # List untuk menyimpan detail setiap jawaban

    for soal in daftar_soal:
        # Ambil jawaban peserta dari form data
        # request.form adalah dictionary berisi semua input form
        # Nama field: "jawaban_<id_soal>"
        nama_field = f'jawaban_{soal["id"]}'
        jawaban_peserta = request.form.get(nama_field, '').upper().strip()

        jawaban_benar = soal['correct_answer']

        # Bandingkan jawaban
        if jawaban_peserta == jawaban_benar:
            jumlah_benar += 1
        else:
            jumlah_salah += 1

        detail_jawaban.append({
            'question_id': soal['id'],
            'selected_answer': jawaban_peserta if jawaban_peserta else '-',
            'correct_answer': jawaban_benar
        })

    total_soal = len(daftar_soal)

    # Hitung nilai: rumus (benar / total) * 100, dibulatkan
    nilai = math.floor((jumlah_benar / total_soal) * 100)

    try:
        # Simpan hasil ke tabel quiz_results
        # lastrowid memberi kita ID dari baris yang baru saja di-INSERT
        cursor = conn.execute(
            '''INSERT INTO quiz_results
               (participant_name, score, correct, wrong, total_questions)
               VALUES (?, ?, ?, ?, ?)''',
            (nama_peserta, nilai, jumlah_benar, jumlah_salah, total_soal)
        )
        result_id = cursor.lastrowid
        # result_id adalah ID unik hasil quiz ini di database.
        # Kita gunakan untuk URL halaman hasil: /hasil/<result_id>

        # Simpan setiap jawaban ke tabel answers
        for detail in detail_jawaban:
            conn.execute(
                '''INSERT INTO answers
                   (result_id, question_id, selected_answer, correct_answer)
                   VALUES (?, ?, ?, ?)''',
                (
                    result_id,
                    detail['question_id'],
                    detail['selected_answer'],
                    detail['correct_answer']
                )
            )

        conn.commit()

    except Exception as e:
        conn.rollback()
        conn.close()
        flash(f'Gagal menyimpan hasil: {str(e)}', 'error')
        return redirect(url_for('quiz'))

    conn.close()

    # Hapus nama peserta dari session setelah quiz selesai
    session.pop('nama_peserta', None)

    # Redirect ke halaman hasil dengan result_id yang baru
    return redirect(url_for('hasil', result_id=result_id))


# ============================================================
# ROUTE 8: GET /hasil/<result_id> - Halaman hasil satu peserta
# ============================================================

@app.route('/hasil/<int:result_id>')
def hasil(result_id):
    """
    Menampilkan hasil quiz satu peserta berdasarkan result_id.

    <int:result_id> artinya Flask mengambil angka dari URL,
    misalnya /hasil/17 maka result_id = 17.

    Query JOIN:
    Kita menggabungkan data dari tabel answers dan questions
    menggunakan JOIN agar bisa menampilkan teks soal lengkap
    bersama jawaban peserta.

    Contoh JOIN yang digunakan:
        SELECT a.*, q.question, q.option_a, q.option_b, q.option_c, q.option_d
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.result_id = ?

    Ini seperti menggabungkan dua tabel menjadi satu baris lengkap.
    """
    conn = get_db_connection()

    # Ambil data hasil quiz
    data_hasil = conn.execute(
        'SELECT * FROM quiz_results WHERE id = ?',
        (result_id,)
    ).fetchone()

    # Jika result_id tidak ditemukan di database
    if data_hasil is None:
        conn.close()
        return render_template('hasil.html', data_hasil=None, daftar_jawaban=[])

    # Ambil semua jawaban peserta ini dengan JOIN ke tabel questions
    # Sehingga kita juga mendapat teks soal dan semua pilihan jawaban
    daftar_jawaban = conn.execute(
        '''SELECT
               a.id,
               a.question_id,
               a.selected_answer,
               a.correct_answer,
               q.question,
               q.option_a,
               q.option_b,
               q.option_c,
               q.option_d
           FROM answers a
           JOIN questions q ON a.question_id = q.id
           WHERE a.result_id = ?
           ORDER BY a.id''',
        (result_id,)
    ).fetchall()

    conn.close()

    return render_template(
        'hasil.html',
        data_hasil=data_hasil,
        daftar_jawaban=daftar_jawaban
    )


# ============================================================
# ROUTE 9: GET /daftar-nilai - Semua hasil quiz
# ============================================================

@app.route('/daftar-nilai')
def daftar_nilai():
    """
    Menampilkan semua hasil quiz dari database.

    ORDER BY created_at DESC: hasil terbaru tampil di atas.
    """
    conn = get_db_connection()
    semua_hasil = conn.execute(
        'SELECT * FROM quiz_results ORDER BY created_at DESC'
    ).fetchall()
    conn.close()

    return render_template(
        'daftar-nilai.html',
        semua_hasil=semua_hasil
    )


# ============================================================
# ROUTE 10: POST /hapus-semua-hasil - Hapus semua hasil
# ============================================================

@app.route('/hapus-semua-hasil', methods=['POST'])
def hapus_semua_hasil():
    """
    Menghapus semua hasil quiz dan jawaban dari database.

    Menggunakan POST (bukan GET) karena ini adalah operasi
    yang mengubah data. GET seharusnya hanya untuk mengambil data.
    """
    conn = get_db_connection()
    conn.execute('DELETE FROM answers')
    conn.execute('DELETE FROM quiz_results')
    conn.commit()
    conn.close()

    flash('Semua data hasil quiz berhasil dihapus.', 'sukses')
    return redirect(url_for('daftar_nilai'))


# ============================================================
# FITUR MATERI
# ============================================================

@app.route('/materi')
def materi_list():
    """
    Menampilkan daftar semua pertemuan materi yang ada di database.
    """
    conn = get_db_connection()
    semua_materi = conn.execute(
        'SELECT * FROM meetings ORDER BY meeting_number ASC'
    ).fetchall()
    conn.close()

    return render_template('materi.html', semua_materi=semua_materi)


@app.route('/admin/materi/<int:meeting_id>/delete', methods=['POST'])
def delete_materi(meeting_id):
    """
    Menghapus materi dari database.
    """
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM meetings WHERE id = ?', (meeting_id,))
        conn.commit()
        flash('Materi berhasil dihapus.', 'sukses')
    except Exception as e:
        conn.rollback()
        flash(f'Gagal menghapus materi: {str(e)}', 'error')
    finally:
        conn.close()

    return redirect(url_for('materi_list'))

@app.route('/materi/<int:meeting_id>')
def materi_detail(meeting_id):
    """
    Menampilkan detail materi dari suatu pertemuan.
    """
    conn = get_db_connection()
    materi = conn.execute(
        'SELECT * FROM meetings WHERE id = ?',
        (meeting_id,)
    ).fetchone()
    conn.close()

    if materi is None:
        flash('Materi tidak ditemukan.', 'error')
        return redirect(url_for('materi_list'))

    return render_template('materi-detail.html', materi=materi)


@app.route('/admin/materi/<int:meeting_id>/preview', methods=['POST'])
def preview_edit_materi_api(meeting_id):
    """
    Menerima data edit materi dari parser JavaScript.
    Menyimpannya ke session dan mengembalikan status sukses.
    """
    data = request.get_json()

    if not data or 'materi' not in data:
        return jsonify({'error': 'Data materi tidak ditemukan.'}), 400

    daftar_materi = data['materi']

    if len(daftar_materi) != 1:
        return jsonify({'error': 'Anda hanya dapat mengedit satu materi sekaligus.'}), 400

    # Validasi di backend
    materi_valid, pesan_error = validasi_daftar_materi(daftar_materi)
    if not materi_valid:
        return jsonify({'error': pesan_error}), 400

    # Simpan sementara ke session
    session['edit_materi_preview'] = daftar_materi[0]

    return jsonify({'sukses': True})

@app.route('/admin/materi/<int:meeting_id>/preview', methods=['GET'])
def preview_edit_materi_halaman(meeting_id):
    """
    Menampilkan halaman preview perubahan materi dari session.
    """
    materi_preview = session.get('edit_materi_preview', None)

    if materi_preview is None:
        return redirect(url_for('edit_materi', meeting_id=meeting_id))

    return render_template(
        'preview-edit-materi.html',
        meeting_id=meeting_id,
        m=materi_preview
    )


@app.route('/admin/materi/<int:meeting_id>/save', methods=['POST'])
def simpan_edit_materi(meeting_id):
    """
    Menyimpan perubahan data materi dari session ke database (UPDATE).
    """
    materi = session.get('edit_materi_preview', None)

    if materi is None:
        flash('Tidak ada perubahan materi untuk disimpan.', 'error')
        return redirect(url_for('edit_materi', meeting_id=meeting_id))

    conn = get_db_connection()
    try:
        # Pastikan meeting_number yang baru tidak bentrok dengan materi LAIN
        cek = conn.execute(
            'SELECT id FROM meetings WHERE meeting_number = ? AND id != ?',
            (materi['meeting_number'], meeting_id)
        ).fetchone()

        if cek is not None:
            raise Exception(f"Pertemuan {materi['meeting_number']} sudah dipakai oleh materi lain. Harap gunakan nomor pertemuan yang berbeda.")

        # Update materi
        conn.execute(
            '''UPDATE meetings
               SET meeting_number = ?, title = ?, objective = ?, content = ?, example = ?
               WHERE id = ?''',
            (
                materi['meeting_number'],
                materi['title'],
                materi['objective'],
                materi['content'],
                materi.get('example', ''),
                meeting_id
            )
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        flash(str(e), 'error')
        return redirect(url_for('preview_edit_materi_halaman', meeting_id=meeting_id))

    conn.close()

    # Hapus dari session jika sukses
    session.pop('edit_materi_preview', None)

    flash('Materi pertemuan berhasil diperbarui!', 'sukses')
    return redirect(url_for('materi_detail', meeting_id=meeting_id))


@app.route('/admin/materi/<int:meeting_id>/edit')
def edit_materi(meeting_id):
    """
    Menampilkan halaman edit materi dengan teks yang dikonstruksi ulang dari database.
    """
    conn = get_db_connection()
    materi = conn.execute(
        'SELECT * FROM meetings WHERE id = ?',
        (meeting_id,)
    ).fetchone()
    conn.close()

    if materi is None:
        flash('Materi tidak ditemukan.', 'error')
        return redirect(url_for('materi_list'))

    # Rekonstruksi teks
    teks_materi = f"PERTEMUAN {materi['meeting_number']}\n"
    teks_materi += f"JUDUL: {materi['title']}\n\n"
    teks_materi += f"TUJUAN:\n{materi['objective']}\n\n"
    teks_materi += f"MATERI:\n{materi['content']}"

    if materi['example'] and str(materi['example']).strip() != "":
        teks_materi += f"\n\nCONTOH:\n{materi['example']}"

    return render_template('edit-materi.html', meeting_id=meeting_id, teks_materi=teks_materi)


@app.route('/admin/materi')
def input_materi():
    """
    Menampilkan halaman input materi.
    """
    return render_template('input-materi.html')


@app.route('/admin/materi/preview', methods=['POST'])
def preview_materi_api():
    """
    Menerima data materi dari parser JavaScript.
    Menyimpannya ke session dan mengembalikan status sukses.
    """
    data = request.get_json()

    if not data or 'materi' not in data:
        return jsonify({'error': 'Data materi tidak ditemukan.'}), 400

    daftar_materi = data['materi']

    if len(daftar_materi) == 0:
        return jsonify({'error': 'Tidak ada materi yang dikirim.'}), 400

    # Validasi di backend (di Python)
    materi_valid, pesan_error = validasi_daftar_materi(daftar_materi)
    if not materi_valid:
        return jsonify({'error': pesan_error}), 400

    # Simpan sementara ke session
    session['materi_preview'] = daftar_materi

    return jsonify({'sukses': True, 'jumlah': len(daftar_materi)})


@app.route('/admin/materi/preview', methods=['GET'])
def preview_materi_halaman():
    """
    Menampilkan halaman preview materi dari session.
    """
    daftar_materi = session.get('materi_preview', None)

    if daftar_materi is None:
        return redirect(url_for('input_materi'))

    return render_template(
        'preview-materi.html',
        daftar_materi=daftar_materi,
        jumlah_materi=len(daftar_materi)
    )


@app.route('/admin/materi/save', methods=['POST'])
def simpan_materi():
    """
    Menyimpan data materi dari session ke database (APPEND/Tambahkan).
    """
    daftar_materi = session.get('materi_preview', None)

    if daftar_materi is None:
        flash('Tidak ada materi untuk disimpan.', 'error')
        return redirect(url_for('input_materi'))

    conn = get_db_connection()
    try:
        # Cek apakah ada duplikat nomor pertemuan (di dalam session dan di database)
        for materi in daftar_materi:
            cek = conn.execute(
                'SELECT id FROM meetings WHERE meeting_number = ?',
                (materi['meeting_number'],)
            ).fetchone()

            if cek is not None:
                raise Exception(f"Pertemuan {materi['meeting_number']} sudah ada di database. Harap gunakan nomor pertemuan yang berbeda.")

        # Insert setiap materi
        for materi in daftar_materi:
            conn.execute(
                '''INSERT INTO meetings
                   (meeting_number, title, objective, content, example)
                   VALUES (?, ?, ?, ?, ?)''',
                (
                    materi['meeting_number'],
                    materi['title'],
                    materi['objective'],
                    materi['content'],
                    materi.get('example', '')
                )
            )

        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        flash(str(e), 'error')
        return redirect(url_for('preview_materi_halaman'))

    conn.close()

    # Hapus dari session jika sukses
    session.pop('materi_preview', None)

    flash(f'{len(daftar_materi)} pertemuan materi berhasil ditambahkan!', 'sukses')
    return redirect(url_for('materi_list'))


# ============================================================
# FUNGSI HELPER
# ============================================================

def validasi_daftar_materi(daftar_materi):
    """
    Memvalidasi data materi yang diterima.
    """
    for materi in daftar_materi:
        nmr = materi.get('meeting_number', 'Tidak Diketahui')

        if not materi.get('meeting_number'):
            return False, 'Terdapat pertemuan tanpa nomor pertemuan yang jelas.'
        if not materi.get('title', '').strip():
            return False, f'Pertemuan {nmr}: JUDUL tidak boleh kosong.'
        if not materi.get('objective', '').strip():
            return False, f'Pertemuan {nmr}: TUJUAN tidak boleh kosong.'
        if not materi.get('content', '').strip():
            return False, f'Pertemuan {nmr}: MATERI tidak boleh kosong.'

    return True, ''

def validasi_daftar_soal(daftar_soal):
    """
    Memvalidasi semua soal yang diterima dari browser.

    Walaupun JavaScript sudah memvalidasi di browser,
    kita tetap validasi di Python karena data dari browser
    tidak bisa dipercaya 100%.

    Args:
        daftar_soal (list): list of dict soal dari JSON

    Returns:
        tuple: (bool valid, str pesan_error)
               (True, '') jika semua valid
               (False, 'pesan error') jika ada yang tidak valid
    """
    jawaban_valid = ['A', 'B', 'C', 'D']

    for i, soal in enumerate(daftar_soal):
        nomor = i + 1

        # Periksa semua field wajib ada dan tidak kosong
        if not soal.get('question', '').strip():
            return False, f'Soal {nomor}: pertanyaan tidak boleh kosong.'

        if not soal.get('optionA', '').strip():
            return False, f'Soal {nomor}: pilihan A tidak boleh kosong.'

        if not soal.get('optionB', '').strip():
            return False, f'Soal {nomor}: pilihan B tidak boleh kosong.'

        if not soal.get('optionC', '').strip():
            return False, f'Soal {nomor}: pilihan C tidak boleh kosong.'

        if not soal.get('optionD', '').strip():
            return False, f'Soal {nomor}: pilihan D tidak boleh kosong.'

        # Periksa jawaban benar
        correct = soal.get('correctAnswer', '').upper().strip()
        if correct not in jawaban_valid:
            return False, f'Soal {nomor}: jawaban "{correct}" tidak valid. Harus A, B, C, atau D.'

    return True, ''


def get_teks_opsi(soal_row, huruf):
    """
    Mengambil teks opsi dari baris soal database berdasarkan huruf.
    Fungsi ini dikirim ke template Jinja2 sebagai filter/helper.

    Args:
        soal_row: baris dari tabel answers (hasil JOIN dengan questions)
        huruf: 'A', 'B', 'C', atau 'D'

    Returns:
        str: teks opsi, contoh "B. Jakarta"
    """
    peta = {
        'A': soal_row['option_a'],
        'B': soal_row['option_b'],
        'C': soal_row['option_c'],
        'D': soal_row['option_d'],
    }
    teks = peta.get(huruf, '')
    if teks:
        return f'{huruf}. {teks}'
    return huruf


# Daftarkan get_teks_opsi sebagai fungsi global di Jinja2
# sehingga bisa dipanggil dari template HTML
app.jinja_env.globals['get_teks_opsi'] = get_teks_opsi


# ============================================================
# JALANKAN APLIKASI
# ============================================================

if __name__ == '__main__':
    # host='0.0.0.0' : Flask menerima koneksi dari semua network interface,
    #                  bukan hanya localhost. Ini diperlukan agar komputer
    #                  lain di jaringan LAN bisa mengakses aplikasi.
    #
    # port=5000       : Port default Flask.
    #
    # debug=True      : Mode pengembangan - Flask otomatis restart
    #                  saat file diubah, dan menampilkan error detail.
    #                  JANGAN gunakan debug=True di production!
    app.run(host='0.0.0.0', port=5000, debug=True)
