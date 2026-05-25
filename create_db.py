import sqlite3
import os

# Создаём базу данных в папке проекта
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Таблица студентов
cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        group_name TEXT,
        birth_date TEXT,
        phone TEXT,
        medical_notes TEXT DEFAULT '',
        allergies TEXT DEFAULT '',
        blood_type TEXT DEFAULT ''
    )
''')

# Таблица вакцин
cursor.execute('''
    CREATE TABLE IF NOT EXISTS vaccines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        period_years INTEGER DEFAULT 0,
        period_months INTEGER DEFAULT 0,
        mandatory BOOLEAN DEFAULT 1
    )
''')

# Таблица прививок
cursor.execute('''
    CREATE TABLE IF NOT EXISTS vaccination_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        vaccine_id INTEGER,
        date_given TEXT,
        notes TEXT,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (vaccine_id) REFERENCES vaccines (id)
    )
''')

# Таблица пользователей
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        position TEXT DEFAULT 'Медсестра',
        role TEXT DEFAULT 'nurse',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        avatar TEXT DEFAULT '👤'
    )
''')

# Таблица настроек
cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        college_name TEXT DEFAULT 'Колледж',
        reminder_days INTEGER DEFAULT 30,
        theme TEXT DEFAULT 'medical',
        auto_backup BOOLEAN DEFAULT 0,
        language TEXT DEFAULT 'ru',
        notifications_enabled BOOLEAN DEFAULT 1
    )
''')

# Добавляем тестовые данные
cursor.execute("SELECT COUNT(*) FROM users")
if cursor.fetchone()[0] == 0:
    cursor.execute("INSERT INTO users (username, password, full_name, position, role, phone, email, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                   ('admin', 'admin123', 'Иванова Мария Петровна', 'Администратор', 'admin', '+7 (999) 123-45-67', 'admin@college.ru', '👑'))
    cursor.execute("INSERT INTO users (username, password, full_name, position, role, phone, email, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                   ('nurse', 'nurse123', 'Петрова Анна Сергеевна', 'Медицинская сестра', 'nurse', '+7 (999) 765-43-21', 'nurse@college.ru', '👩‍⚕️'))

cursor.execute("SELECT COUNT(*) FROM vaccines")
if cursor.fetchone()[0] == 0:
    cursor.execute("INSERT INTO vaccines (name, description, period_years, period_months, mandatory) VALUES (?, ?, ?, ?, ?)",
                   ('АДС-М (дифтерия, столбняк)', 'Ревакцинация взрослых каждые 10 лет', 10, 0, 1))
    cursor.execute("INSERT INTO vaccines (name, description, period_years, period_months, mandatory) VALUES (?, ?, ?, ?, ?)",
                   ('Гепатит B', 'Вакцинация взрослых до 55 лет', 0, 0, 1))
    cursor.execute("INSERT INTO vaccines (name, description, period_years, period_months, mandatory) VALUES (?, ?, ?, ?, ?)",
                   ('Грипп', 'Ежегодная вакцинация', 1, 0, 0))
    cursor.execute("INSERT INTO vaccines (name, description, period_years, period_months, mandatory) VALUES (?, ?, ?, ?, ?)",
                   ('Корь', 'Вакцинация взрослых до 35 лет', 0, 0, 1))

cursor.execute("SELECT COUNT(*) FROM settings")
if cursor.fetchone()[0] == 0:
    cursor.execute("INSERT INTO settings (college_name, reminder_days, theme) VALUES (?, ?, ?)",
                   ('Сургутский политехнический колледж', 30, 'medical'))

conn.commit()
conn.close()

print(f"✅ База данных создана: {db_path}")
print("Теперь запустите основную программу.")
input("Нажмите Enter для выхода...")
