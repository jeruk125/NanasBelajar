# ============================================================
# DATABASE.PY - Fungsi-fungsi untuk bekerja dengan SQLite
# ============================================================
# File ini berisi fungsi sederhana untuk:
#   1. Membuka koneksi ke database
#   2. Membuat semua tabel dari schema.sql (init_db)
#
# Cara sqlite3 bekerja:
#   - sqlite3 adalah modul Python bawaan, tidak perlu diinstall.
#   - Database disimpan sebagai satu file .db di disk.
#   - Setiap kali mau query, kita buka koneksi, lakukan query,
#     lalu tutup koneksi.
#   - conn.row_factory = sqlite3.Row membuat hasil query bisa
#     diakses seperti dictionary: row['nama_kolom'], bukan row[0].
# ============================================================

import sqlite3
import os

# Nama file database SQLite.
# File ini akan dibuat otomatis di folder yang sama dengan database.py.
NAMA_FILE_DB = 'nanasdb.sqlite'

# Path lengkap ke file database.
# os.path.dirname(__file__) = folder tempat database.py berada.
# os.path.join menggabungkan path dengan aman di semua OS.
PATH_DATABASE = os.path.join(os.path.dirname(__file__), NAMA_FILE_DB)

# Path ke file schema.sql
PATH_SCHEMA = os.path.join(os.path.dirname(__file__), 'schema.sql')


def get_db_connection():
    """
    Membuka dan mengembalikan koneksi ke database SQLite.

    Cara kerja:
    1. sqlite3.connect() membuka file database.
       Jika file belum ada, SQLite akan membuatnya secara otomatis.
    2. conn.row_factory = sqlite3.Row mengubah cara hasil query dikembalikan.
       Tanpa ini: row[0], row[1], row[2] (kurang jelas).
       Dengan ini: row['question'], row['score'] (lebih mudah dibaca).

    Cara pakai:
        conn = get_db_connection()
        hasil = conn.execute('SELECT * FROM questions').fetchall()
        conn.close()

    Returns:
        sqlite3.Connection: objek koneksi database
    """
    conn = sqlite3.connect(PATH_DATABASE)

    # Row factory: hasil query bisa diakses pakai nama kolom
    conn.row_factory = sqlite3.Row

    # Aktifkan foreign key enforcement di SQLite.
    # SQLite tidak mengaktifkan ini secara default!
    conn.execute('PRAGMA foreign_keys = ON')

    return conn


def init_db():
    """
    Membuat semua tabel database dari file schema.sql.

    Fungsi ini aman untuk dipanggil berkali-kali karena schema.sql
    menggunakan 'CREATE TABLE IF NOT EXISTS' - tabel tidak akan
    dibuat ulang jika sudah ada.

    Cara kerja:
    1. Buka file schema.sql dan baca isinya sebagai teks.
    2. Buka koneksi ke database.
    3. Jalankan semua perintah SQL dari schema.sql sekaligus (executescript).
    4. Tutup koneksi.

    Dipanggil dari:
        app.py saat aplikasi pertama kali dijalankan
    """
    # Buka dan baca isi schema.sql
    with open(PATH_SCHEMA, 'r', encoding='utf-8') as f:
        sql_schema = f.read()

    # Buka koneksi dan jalankan semua SQL
    conn = get_db_connection()
    conn.executescript(sql_schema)
    conn.commit()
    conn.close()

    print(f'Database berhasil diinisialisasi: {PATH_DATABASE}')
