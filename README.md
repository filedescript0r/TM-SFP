🇷🇺 README (Russian)

Название: Stake Fairness Panel

Тип: Tampermonkey UserScript

Назначение: Контроль и логирование Fairness-сидов на Stake.com

Описание

Stake Fairness Panel — это пользовательский скрипт для Tampermonkey, который добавляет на сайт stake.com плавающую панель управления Fairness.

Скрипт позволяет:

Видеть текущие Client Seed и Server Seed

Видеть количество ставок на текущей паре сидов

Автоматически считать общее количество ставок

Считать количество смен сидов

Сохранять историю перед каждой сменой сида

Экспортировать историю в TXT

Восстанавливать положение панели

Полностью сбрасывать статистику

Все данные хранятся локально в браузере (LocalStorage).

Что именно отслеживается

При каждой смене сида в историю сохраняется строка вида:

Stake | [дата и время] | Ставки: N | Client: XXXXX | Server: YYYYY


Также отдельно ведутся счётчики:

Общее число ставок за всё время

Общее число смен сидов

Панель

После загрузки сайта появляется плавающая панель:

Ставок (текущий сид) — сколько игр отыграно на текущей паре

Client Seed — текущий клиентский сид

Server Seed — текущий хэш серверного сида

Всего ставок — накопленный счётчик

Смен сида — сколько раз вы меняли сид

Кнопки:

Кнопка	Функция
Обновить	Считывает данные из Fairness-модала
Сменить	Логирует текущий сид → меняет сид → обновляет данные
Экспорт истории	Скачивает TXT-файл с логом
Сброс всех данных	Полностью очищает счётчики и историю

Экспорт

Экспорт формирует файл вида:

Stake | [дата] | Ставки: 153 | Client: ... | Server: ...
Stake | [дата] | Ставки: 87 | Client: ... | Server: ...

Текущие общие счетчики:
Всего ставок: 24531
Смен сида: 128
Выгружено: 31.12.2025 23:14:05

Где хранятся данные

Все данные сохраняются в браузере:

История сидов

Счётчики

Позиция панели

Удаление или переустановка браузера очистит эти данные.

Важно

Скрипт не вмешивается в игру,
он лишь читает Fairness-модал и нажимает стандартную кнопку «Изменить».

Он не изменяет RNG и не даёт преимуществ — это аналитический инструмент.


EN README (English)

Name: Stake Fairness Panel

Type: Tampermonkey UserScript

Purpose: Fairness seed tracking and logging for Stake.com

Description

Stake Fairness Panel is a Tampermonkey userscript that adds a floating Fairness control panel to stake.com.

It allows you to:

View current Client Seed and Server Seed

See how many bets were made on the current seed pair

Track total bets over time

Count how many times seeds were rotated

Log every seed before changing it

Export history to TXT

Remember panel position

Fully reset all stored data

All data is stored locally in the browser (LocalStorage).

What is recorded

Before every seed change, a record is stored in this format:

Stake | [date & time] | Bets: N | Client: XXXXX | Server: YYYYY


Global counters:

Total bets

Total seed rotations

Panel

The floating panel shows:

Bets (current seed) — number of bets on this seed pair

Client Seed

Server Seed

Total bets

Seed rotations

Buttons:

Button	Action
Refresh	Reads current values from Fairness modal
Change	Logs current seeds → rotates seed → updates values
Export history	Downloads a TXT log file
Reset all data	Clears counters and history

Export

The export file looks like:

Stake | [date] | Bets: 153 | Client: ... | Server: ...
Stake | [date] | Bets: 87 | Client: ... | Server: ...

Current totals:
Total bets: 24531
Seed rotations: 128
Exported: 31.12.2025 23:14:05

Where data is stored

All data is saved locally in your browser:

History

Counters

Panel position

Clearing browser storage or reinstalling will remove it.

Important

This script does not manipulate the game.
It only reads the Fairness modal and clicks the official “Change” button.

It does not affect RNG or provide an advantage — it is a tracking and auditing tool.
