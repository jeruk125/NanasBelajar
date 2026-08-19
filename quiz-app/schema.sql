-- ============================================================
-- SCHEMA.SQL - Struktur tabel database NanasBelajar
-- ============================================================
-- File ini mendefinisikan semua tabel yang dibutuhkan aplikasi.
--
-- Cara menjalankan:
--   File ini dijalankan otomatis oleh fungsi init_db() di database.py.
--   Anda tidak perlu menjalankan file ini secara manual.
--
-- Tiga tabel yang dibuat:
--   1. questions    - menyimpan soal quiz
--   2. quiz_results - menyimpan hasil setiap peserta
--   3. answers      - menyimpan jawaban per soal per peserta
-- ============================================================


-- ============================================================
-- TABEL 1: questions
-- Menyimpan setiap soal quiz beserta pilihan dan jawaban benar.
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    -- PRIMARY KEY: SQLite otomatis memberi nomor unik (1, 2, 3, ...)
    -- AUTOINCREMENT: nomor tidak akan dipakai ulang meski baris dihapus

    question       TEXT    NOT NULL,
    -- Teks pertanyaan. NOT NULL = tidak boleh kosong.

    option_a       TEXT    NOT NULL,
    option_b       TEXT    NOT NULL,
    option_c       TEXT    NOT NULL,
    option_d       TEXT    NOT NULL,
    -- Empat pilihan jawaban.

    correct_answer TEXT    NOT NULL CHECK(correct_answer IN ('A', 'B', 'C', 'D')),
    -- Jawaban benar. CHECK memastikan hanya boleh diisi A, B, C, atau D.

    created_at     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    -- Waktu soal dibuat. SQLite menyimpan datetime sebagai teks.
    -- DEFAULT: jika tidak diisi, otomatis menggunakan waktu sekarang.
);


-- ============================================================
-- TABEL 2: quiz_results
-- Menyimpan ringkasan hasil quiz setiap peserta.
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,

    participant_name TEXT    NOT NULL,
    -- Nama peserta yang mengerjakan quiz.

    score            INTEGER NOT NULL,
    -- Nilai akhir (0-100).

    correct          INTEGER NOT NULL,
    -- Jumlah jawaban benar.

    wrong            INTEGER NOT NULL,
    -- Jumlah jawaban salah.

    total_questions  INTEGER NOT NULL,
    -- Total soal yang dikerjakan.

    created_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    -- Waktu quiz diselesaikan.
);


-- ============================================================
-- TABEL 3: answers
-- Menyimpan jawaban peserta untuk setiap soal.
-- Tabel ini dihubungkan ke quiz_results dan questions via foreign key.
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,

    result_id       INTEGER NOT NULL,
    -- Merujuk ke quiz_results.id. Jawaban ini milik hasil quiz siapa?

    question_id     INTEGER NOT NULL,
    -- Merujuk ke questions.id. Jawaban ini untuk soal nomor berapa?

    selected_answer TEXT    NOT NULL,
    -- Jawaban yang dipilih peserta: A, B, C, atau D.

    correct_answer  TEXT    NOT NULL,
    -- Jawaban benar untuk soal ini (disalin dari questions.correct_answer).
    -- Disimpan di sini agar mudah dibandingkan tanpa perlu JOIN ke questions.

    FOREIGN KEY (result_id)   REFERENCES quiz_results(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
    -- FOREIGN KEY: memastikan result_id dan question_id harus ada di tabel asalnya.
);
