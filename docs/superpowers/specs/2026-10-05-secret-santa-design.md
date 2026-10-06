# Тайный Санта: santa.prosto-namekni.ru

Дата: 5 октября 2026. Макет — канвас «Тайный Санта — дизайн»
(https://claude.ai/artifact/5uWUWHZFqXiFpoe7Ji3pWc).

## Зачем

Сезонный продукт рядом с вишлистами. Организатор собирает людей в комнату,
каждый пишет пожелания, сервис тайно распределяет, кто кому дарит, и
сообщает каждому его подопечного в Telegram или на почту. Санта ведёт в
вишлисты (участник прикладывает свой вишлист, Санта бронирует из него),
вишлисты ведут в Санту (карточка в кабинете).

Успех: организатор за пару минут создаёт комнату и рассылает ссылку;
участник вступает без регистрации; после жеребьёвки каждый надёжно получает
своего подопечного.

## Решения

- **Один фронт и один бэк.** Санта — поддомен `santa.prosto-namekni.ru`
  того же Next.js и пакет `santa` того же Go-бэка. Пользователи, вишлисты и
  авторизация общие: кука `token` уже ставится на `prosto-namekni.ru` и видна
  поддомену.
- **Организатор — зарегистрированный пользователь.** Комнаты живут в его
  кабинете.
- **Участнику аккаунт не нужен.** Его доступ — секретный токен в личной
  ссылке и куке. Вошедший пользователь привязывается к участнику по `user_id`.
- **Канал уведомлений обязателен** (с этапа 2): подтверждённая почта или
  подключённый Telegram-бот. Без него участник не попадает в жеребьёвку.
- **Жеребьёвка — один круг.** Случайная перестановка участников,
  i-й дарит (i+1)-му, последний — первому. Никто не вытянет себя, нет
  замкнутых пар внутри круга. Запуск вручную или по `draw_at`.
- **Пары тайные для всех,** включая организатора.
- **После жеребьёвки состав не меняется.** Удалить участника нельзя; есть
  только «перезапустить жеребьёвку» с повторной рассылкой.
- **Почта — Yandex Cloud Postbox через SMTP** за интерфейсом `Mailer`;
  провайдер меняется настройками.
- **Бот — вебхук в бэке,** не long-polling.

## Этапы

| # | Этап | Результат |
|---|---|---|
| 1 | Ядро комнат + поддомен | комнаты, вступление, ручная жеребьёвка, «конверт» по личной ссылке |
| 2 | Уведомления | почта с кодом, Telegram-бот, письма и сообщения о результате, напоминания |
| 3 | Расписание + анонимный чат | жеребьёвка по `draw_at`, чат Санта ↔ подопечный |
| 4 | Воронка и полировка | лендинг и SEO, карточка в кабинете, QR, «Подарок готов», бронь из вишлиста |

Каждый этап — отдельный план реализации и отдельный релиз.

---

## Этап 1. Ядро комнат + поддомен

### Данные (бэк, gorm `AutoMigrate`)

```
santa_rooms
  id            uuid PK
  owner_id      uuid → users, NOT NULL
  slug          text UNIQUE NOT NULL      -- 8 символов [a-zA-Z0-9], для ссылки
  title         text NOT NULL             -- 1..80 символов
  budget        int NULL                  -- рубли; NULL = без лимита
  exchange_date date NULL
  draw_at       timestamptz NULL          -- поле с этапа 1, используется с этапа 3
  message       text NOT NULL DEFAULT ''  -- до 500 символов
  status        text NOT NULL             -- 'open' | 'drawn'
  drawn_at      timestamptz NULL
  created_at, updated_at

santa_participants
  id            uuid PK
  room_id       uuid → santa_rooms ON DELETE CASCADE
  user_id       uuid NULL → users
  name          text NOT NULL             -- 1..40
  wishes        text NOT NULL DEFAULT ''  -- до 1000
  wishlist_url  text NULL                 -- ссылка на вишлист, любой URL http(s)
  token_hash    text NOT NULL             -- sha256 секретного токена
  gift_ready    bool NOT NULL DEFAULT false  -- используется на этапе 4
  created_at, updated_at
  UNIQUE(room_id, user_id)

santa_assignments
  room_id       uuid → santa_rooms ON DELETE CASCADE
  giver_id      uuid → santa_participants
  receiver_id   uuid → santa_participants
  PK(room_id, giver_id), UNIQUE(room_id, receiver_id)
```

Секретный токен — 32 случайных байта в base64url. В БД только хэш.
Поля каналов (`channel`, `email`, `tg_chat_id` …) добавляет этап 2.

### API `/api/v1/santa`

Авторизация организатора — существующая кука `token`. Авторизация
участника — заголовок `X-Santa-Token` (фронт хранит токен в
`localStorage` под ключом `santa:<slug>`), либо кука `token`, если участник
привязан к пользователю. Не кука: `localhost` и `santa.localhost` — разные
сайты, и в разработке кука участника не доходила бы до API.

| Метод | Доступ | Действие |
|---|---|---|
| `POST /rooms` | пользователь | создать; `{title, budget, exchangeDate, drawAt, message, organizerJoins, organizerName?}`; при `organizerJoins` создаёт участника с `user_id` владельца |
| `GET /rooms` | пользователь | комнаты, где он владелец или участник |
| `GET /rooms/:id` | владелец | комната + участники (имя, статус пожеланий, без пар) |
| `PATCH /rooms/:id` | владелец | правка, только в `open` |
| `DELETE /rooms/:id` | владелец | удалить комнату |
| `DELETE /rooms/:id/participants/:pid` | владелец | убрать участника, только в `open` |
| `POST /rooms/:id/draw` | владелец | жеребьёвка; в `drawn` — 409 |
| `POST /rooms/:id/redraw` | владелец | удалить пары и тянуть заново, только в `drawn` |
| `GET /r/:slug` | все | карточка приглашения: название, организатор, бюджет, даты, сообщение, число участников, статус |
| `POST /r/:slug/join` | все | `{name, wishes, wishlistUrl}` → `{token, me}`; в `drawn` — 409 |
| `GET /r/:slug/me` | участник | свои данные; в `drawn` — ещё `receiver: {name, wishes, wishlistUrl}` |
| `PATCH /r/:slug/me` | участник | правка имени (только `open`), пожеланий и вишлиста (всегда) |
| `DELETE /r/:slug/me` | участник | выйти, только в `open` |

Ошибки: 404 — нет комнаты или токен неверен (одинаково, без подсказок);
409 — действие невозможно в текущем статусе; 422 — валидация, в том числе
«нужно минимум 3 участника» на жеребьёвке.

### Жеребьёвка

`usecase/santa.Draw(roomID)` в одной транзакции:
1. `SELECT … FOR UPDATE` комнаты; статус должен быть `open`.
2. Участники комнаты (на этапе 2 — только с подтверждённым каналом);
   меньше 3 — 422.
3. Перемешать (`crypto/rand`, Фишер–Йетс), записать круг в
   `santa_assignments`.
4. `status = 'drawn'`, `drawn_at = now()`.

Чистая функция `buildCycle(ids []uuid.UUID, rnd) []pair` отдельно от
транзакции — её и тестируем.

### Фронт

- `middleware.ts`: хост `santa.*` → rewrite на `/santa/*`. На основном
  домене `/santa/*` → 308 на поддомен. Защита `/santa/rooms/*` — как у
  `/wishlist/*`, редирект на вход основного домена с возвратом.
- `app/santa/layout.tsx` — своя шапка «просто намекни / тайный санта»,
  схема `santa`.
- Схема `santa` в `app/globals.css`: тёмный фон «Космоса», акцент —
  клюквенный, градиент главной кнопки клюква → ягода, золотой для звезды
  и бюджетов. Только через переменные и токены дизайн-системы; «снег» —
  утилита `bg-snow` в `tailwind.config.ts`.
- Страницы:
  - `app/santa/page.tsx` — лендинг (на этапе 1 — упрощённый: герой + 4 шага);
  - `app/santa/rooms/page.tsx` — мои комнаты;
  - `app/santa/rooms/new/page.tsx` — создание (макет «Организатор · создание комнаты»);
  - `app/santa/rooms/[id]/page.tsx` — комната (макет «комната до жеребьёвки»);
  - `app/santa/r/[slug]/page.tsx` — вступление, после него — своя карточка;
    после жеребьёвки — «конверт» (макеты «вступление» и «кому я дарю»).
- `api/santa/` — хуки TanStack Query, по образцу `api/wishlist/`.
- Типы `SantaRoom`, `SantaParticipant`, `SantaMe` — в `shared/types.ts`.
- Формы — react-hook-form + zod; JSON, не multipart.
- Личная ссылка участника `…/r/<slug>?t=<token>`: страница кладёт токен в
  `localStorage` и убирает его из адресной строки.
  Ссылку показываем после вступления с кнопкой «скопировать» — по ней
  участник вернётся с другого устройства.

### Инфраструктура

- DNS `santa.prosto-namekni.ru` → тот же фронт; правило Traefik для хоста.
- `CORS_ORIGIN` бэка — добавить поддомен (fiber принимает список через
  запятую).
- `next-sitemap` — отдельная карта для поддомена.

---

## Этап 2. Уведомления

### Данные

К `santa_participants`:
```
channel           text NULL      -- 'email' | 'telegram'
email             text NULL      -- нижний регистр
email_verified_at timestamptz NULL
tg_chat_id        bigint NULL
UNIQUE(room_id, email)
```
Участник «готов», если `channel='email' AND email_verified_at IS NOT NULL`
или `channel='telegram' AND tg_chat_id IS NOT NULL`.

```
santa_email_codes
  participant_id  PK → santa_participants ON DELETE CASCADE
  code_hash, expires_at (15 мин), attempts (≤5), sent_at
santa_tg_links
  token PK (одноразовый, 24 ч), participant_id, expires_at
santa_notifications                -- outbox
  id, participant_id, kind, payload jsonb,
  status 'pending'|'sent'|'failed', attempts, next_try_at, last_error, created_at
```

### Почта

- `POST /r/:slug/me/email {email}` → код из 6 цифр, повтор не чаще раза в
  60 с. `POST /r/:slug/me/email/verify {code}` → `email_verified_at`.
- `pkg/mailer`: интерфейс `Send(ctx, to, subject, html, text)`; реализация
  SMTP (Postbox). Шаблоны — `html/template`, по макету «Уведомление ·
  письмо», с текстовой версией.
- Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
  `MAIL_FROM`. Для домена отправителя — SPF, DKIM, DMARC.

### Telegram

- `POST /r/:slug/me/telegram` → `https://t.me/<BOT_USERNAME>?start=<token>`.
- `POST /api/v1/telegram/webhook` с проверкой заголовка
  `X-Telegram-Bot-Api-Secret-Token`. На `/start <token>` — записать
  `tg_chat_id`, ответить приветствием с названием комнаты.
- `pkg/telegram`: `SendMessage(chatID, text, buttons)` поверх Bot API,
  `parse_mode=HTML`, экранирование пользовательского текста.
- Env: `BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `SANTA_PUBLIC_URL`.
  Вебхук регистрируется командой `make tg-webhook`.

### Рассылка

Outbox: использование пишет `santa_notifications` в той же транзакции,
что и событие; воркер (горутина, тик 5 с) отправляет, повторяет с
задержкой 1, 5, 30 мин, после 4 попыток — `failed`. События:

| kind | Когда | Кому |
|---|---|---|
| `welcome` | канал подтверждён | участнику |
| `drawn` | жеребьёвка / перезапуск | каждому: подопечный, пожелания, бюджет, дата, ссылка на карточку |
| `reminder_fill` | организатор нажал «Напомнить» | тем, у кого пусто в пожеланиях или нет канала (у кого нет канала — не дойдёт; организатор видит их в списке) |
| `wishes_updated` | подопечный поменял пожелания после жеребьёвки | его Санте |

«Напомнить» — не чаще раза в 12 ч на комнату.

---

## Этап 3. Расписание и анонимный чат

### Жеребьёвка по времени

Воркер с тиком 1 мин: комнаты `status='open' AND draw_at <= now()`,
`FOR UPDATE SKIP LOCKED`, вызывает `Draw`. Готовых меньше 3 — `draw_at`
обнуляется, в комнате организатора — плашка «жеребьёвка не прошла: мало
готовых участников». Если организатор сам участник с подтверждённым
каналом, ему уходит уведомление `draw_failed` (у аккаунтов нет почты,
поэтому другого канала нет).

### Чат

```
santa_messages
  id, room_id, giver_id, receiver_id,   -- пара из santa_assignments
  from_giver bool, body text (≤1000), created_at, read_at
```
- `GET /r/:slug/me/chat?with=receiver|santa`, `POST /r/:slug/me/chat`.
- Имя Санты не уходит подопечному ни в API, ни в уведомлениях.
- Новое сообщение → уведомление `chat_message` в канал получателя.
  В Telegram ответ на сообщение бота (`reply_to_message`) уходит в тот же
  чат; для этого храним `tg_message_id` у уведомления. На почте ответ —
  только ссылкой на карточку.
- Лимит: 30 сообщений в час от участника.

---

## Этап 4. Воронка и полировка

- Полный лендинг по макету, SEO-метаданные и JSON-LD, ссылки с блога.
- Карточка «Устройте Тайного Санту» в `/wishlist` (макет «Переход из
  вишлиста»), показывается с 1 ноября по 31 декабря.
- Вступление вошедшего пользователя: имя из профиля, выбор вишлиста из
  своих вместо ввода ссылки.
- QR-код ссылки комнаты (генерация на фронте).
- «Подарок готов» у участника, счётчик готовых у организатора.
- В «конверте» вишлист подопечного с сервиса открывается гостевой
  страницей, бронирование — существующим механизмом.

---

## Тестирование

- **Бэк:** таблица тестов на `buildCycle` (3…50 участников, тысячи
  прогонов: перестановка, один круг, нет себя); тесты использования на
  моках из `mock/` (статусы, права, 404 на чужой токен, тайность пар в
  ответах организатору); интеграционные тесты репозитория по образцу
  `integration_test.go`; outbox — повторы и `failed`.
- **Фронт:** `pnpm lint`, `node tests/token-audit.cjs app/santa`; ручная
  проверка флоу на поддомене в тестовом стеке Dokploy.

## Вне объёма

Исключения пар, несколько жеребьёвок в комнате, оплата, мобильные
пуш-уведомления, импорт участников списком.
