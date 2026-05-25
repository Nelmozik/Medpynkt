import os

# Создаём папку templates
if not os.path.exists('templates'):
    os.makedirs('templates')

# HTML-коды (сокращённые версии для теста)
html_files = {
    'index.html': '''<!DOCTYPE html>
<html>
<head><title>Медпункт</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body><div class="container mt-4"><h2>Система работает!</h2><a href="/student/add">Добавить студента</a></div></body>
</html>''',

    'add_student.html': '''<!DOCTYPE html>
<html>
<head><title>Добавить студента</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body><div class="container mt-4"><h2>Добавить студента</h2><form method="POST"><input name="full_name" placeholder="ФИО" required><input name="group_name" placeholder="Группа"><input type="date" name="birth_date" required><button type="submit">Добавить</button></form></div></body>
</html>''',

    'add_vaccine.html': '''<!DOCTYPE html>
<html>
<head><title>Добавить вакцину</title></head>
<body><h2>Добавить вакцину</h2><form method="POST"><input name="name" placeholder="Название" required><input name="period_years" placeholder="Лет"><button type="submit">Добавить</button></form></body>
</html>''',

    'add_vaccination.html': '''<!DOCTYPE html>
<html>
<head><title>Отметить прививку</title></head>
<body><h2>Отметить прививку</h2><form method="POST"><select name="vaccine_id"><option value="1">Тест</option></select><input type="date" name="date_given" required><button type="submit">Сохранить</button></form></body>
</html>''',

    'report.html': '''<!DOCTYPE html>
<html>
<head><title>Отчёт</title></head>
<body><h2>Отчёт на сегодня</h2><p>Здесь будут студенты для вызова</p></body>
</html>'''
}

for filename, content in html_files.items():
    with open(os.path.join('templates', filename), 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Создан: templates/{filename}')

print('\nГотово! Можете запускать основную программу.')
