# Тайный Санта, этап 3: расписание и анонимный чат — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** жеребьёвка сама проходит в назначенное `draw_at`, а если готовых участников меньше трёх — снимает время и предупреждает организатора; Санта и подопечный анонимно переписываются на странице комнаты и ответом на сообщение бота. Заодно — четыре доработки этапа 2: в проде без SMTP/бота уведомления не «уходят» в лог, служебные таблицы чистятся, смена почты не снимает готовность, ошибки Telegram 403 и «chat not found» не повторяются.

**Architecture:** бэк — горутина-планировщик (тик 1 мин) берёт созревшие комнаты (`FOR UPDATE SKIP LOCKED`, перепроверка `open` и `draw_at <= now`) и тянет пары тем же кодом, что ручная жеребьёвка; при нехватке готовых ставит `draw_failed_at`, обнуляет `draw_at` и кладёт организатору `draw_failed`. Чат — таблица `santa_messages` по паре из `santa_assignments`; сообщение и уведомление `chat_message` пишутся одной транзакцией под блокировкой комнаты, перезапуск жеребьёвки стирает переписку. Обработчик очереди сохраняет `tg_message_id` отправленного в Telegram, и ответ (`reply_to_message`) в вебхуке находит по нему исходное сообщение и пару. Фронт — поле «Жеребьёвка по расписанию» и плашка у организатора, карточка «Анонимный чат» в открытом конверте.

**Tech Stack:** Go 1.25, fiber v2, gorm + Postgres 17, testify, testcontainers; Next.js 16, TanStack Query 5, react-hook-form + zod, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-05-secret-santa-design.md`, раздел «Этап 3. Расписание и анонимный чат» и решения в начале. Этапы 1 и 2 (ветка `feature/santa`) уже влиты.

**Репозитории:** фронт — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-front` (далее FRONT), бэк — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back` (далее BACK; модуль Go — `main`). Ветка `feature/santa-stage3` от `feature/santa` уже создана в обоих. Коммиты — от имени пользователя, **без трейлера `Co-Authored-By`**.

## Global Constraints

- Пакетный менеджер фронта — `pnpm`.
- Дизайн-система фронта: только токены по роли (`text-body`, `rounded-control`, `h-control`, `shadow-float`, `duration-base`); никаких стоковых размеров текста/скруглений/теней и `[…]`. Цвета в TSX — только классами ролей. Проверка: `node tests/token-audit.cjs app/santa components shared` → `всего 0`.
- Тексты интерфейса, писем и бота — по-русски, на «вы».
- Схема БД — gorm `AutoMigrate`; перенос данных — идемпотентная функция `Backfill…` в `internal/repo/persistent/backfill.go`, вызов из `app.go`.
- Жеребьёвка по времени: тик 1 мин, `status='open' AND draw_at <= now()`, `FOR UPDATE SKIP LOCKED`; готовых меньше 3 — `draw_at` обнуляется, у организатора плашка «жеребьёвка не прошла: мало готовых участников»; организатор-участник с подтверждённым каналом получает `draw_failed`.
- Чат: `GET /r/:slug/me/chat?with=receiver|santa`, `POST /r/:slug/me/chat`; тело ≤ 1000 символов; не больше 30 сообщений в час от участника; имя Санты не уходит подопечному ни в API, ни в уведомлениях; новое сообщение → `chat_message` в канал получателя; в Telegram ответ на сообщение бота уходит в тот же чат (по `tg_message_id` уведомления); на почте ответ — только ссылкой на карточку.
- Outbox этапа 2 не меняется: тик 5 с, повтор через 1, 5, 30 мин, после 4 попыток `failed`.
- В проде без SMTP (без токена бота) обработчик очереди получает `nil`, а не лог-заглушку: уведомление уходит в повтор и потом в `failed`.
- Telegram 403 и 400 «chat not found» — постоянные ошибки: сразу `failed`, без повторов.
- Очистка — раз в час в цикле обработчика: истёкшие `santa_tg_links` и `santa_email_codes`, `sent`/`failed` уведомления старше 30 дней.
- Почта: подтверждённый адрес — `email`; новый адрес до кода — `pending_email`; готовность и письма держатся на подтверждённом.
- Ошибки API: 404 — нет комнаты/участника; 409 — статус (`жеребьёвки ещё не было`, `вы не попали в эту жеребьёвку`) или адрес занят; 422 — валидация; 429 — повтор раньше срока и лимит чата.

## Review Focus

1. **Тайна Санты в чате.** Подопечный не должен увидеть имя или id своего Санты — ни в ответе `GET …/chat?with=santa`, ни в письме/сообщении бота о новом сообщении. Тесты: `TestGetChat_SantaThreadHidesGiver`, `TestNotifier_ChatFromSantaHidesName` (задача 8).
2. **Ответ в Telegram после перезапуска жеребьёвки** не попадает новой паре: бот отвечает «чат закрыт». Тесты: `TestSantaRepo_RedrawClearsMessages` (задача 7), `TestTelegramReply_AfterRedrawIsClosed` (задача 8).
3. **Два экземпляра бэка и одна комната с `draw_at`** — пары тянутся один раз, `drawn` у каждого одно. Тест: `TestSantaRepo_DrawScheduledOnce` (задача 5).
4. **Смена почты.** Пока новый адрес не подтверждён, участник остаётся готовым и письма идут на старый; если тот же адрес успел подтвердить сосед по комнате — 409, а не 500. Тесты: `TestSantaRepo_PendingEmailKeepsReady`, `TestSantaRepo_VerifyEmailTakenMeanwhile` (задача 3), `TestVerifyEmail_AddressTakenMeanwhile` (задача 3).
5. **Плашка неудачной жеребьёвки.** Организатор правит название — плашка остаётся; назначает новое время или тянет вручную — исчезает. Тесты: `TestUpdateRoom_NewDrawAtClearsFailure`, `TestUpdateRoom_SameDrawAtKeepsFailure` (задача 6), `TestSantaRepo_DrawClearsDrawFailed` (задача 5).

---

## Карта файлов

**BACK**
- Modify `pkg/telegram/telegram.go`, `telegram_test.go` — `APIError`, `ErrPermanent`, `SendMessage` возвращает `message_id`.
- Modify `internal/entity/santa.go` — `PendingEmail`, `DrawFailedAt`, `TgMessageID`, виды `draw_failed` и `chat_message`, `SantaMessage`.
- Modify `internal/repo/persistent/santa_models.go`, `santa_postgres.go`, `santa_notify_postgres.go`, `backfill.go`; create `santa_chat_postgres.go`.
- Modify `internal/repo/contracts.go`, `mock/repo/mock_santa_repo.go`.
- Modify `internal/repo/persistent/santa_integration_test.go`, `santa_notify_integration_test.go`; create `santa_schedule_integration_test.go`, `santa_chat_integration_test.go`.
- Modify `internal/usecase/contracts.go`.
- Modify `internal/usecase/santa/notifier.go`, `channels.go`, `participant.go`, `santa.go`, `messages.go` и их тесты; create `scheduler.go`, `scheduler_test.go`, `chat.go`, `chat_test.go`.
- Modify `internal/controller/restapi/v1/santa.go`, `santa_test.go`.
- Modify `internal/app/app.go`; create `internal/app/app_test.go`.

**FRONT**
- Modify `shared/types.ts`, `shared/santa.ts`, `tests/santa.test.cjs`, `api/santa/index.ts`.
- Modify `app/santa/r/[slug]/components/notify-card.tsx`, `envelope.tsx`, `invite-header.tsx`, `app/santa/r/[slug]/page.tsx`; create `app/santa/r/[slug]/components/chat-card.tsx`.
- Modify `app/santa/components/room-form.tsx`, `room-chips.tsx`, `app/santa/rooms/[id]/page.tsx`.

---

## Бэкенд

### Task 1: Telegram — постоянные ошибки и id отправленного сообщения

Доработка этапа 2 №4 и подготовка к ответам в чате: `SendMessage` отдаёт `message_id`.

**Files:**
- Modify: `BACK/pkg/telegram/telegram.go`
- Modify: `BACK/pkg/telegram/telegram_test.go`
- Modify: `BACK/internal/usecase/contracts.go` (интерфейс `TelegramSender`)
- Modify: `BACK/internal/usecase/santa/channels.go` (`tgReply`)
- Modify: `BACK/internal/usecase/santa/channels_test.go` (`fakeTG`)
- Modify: `BACK/internal/usecase/santa/notifier.go` (`deliver`)
- Modify: `BACK/internal/usecase/santa/notifier_test.go`

**Interfaces:**
- Produces: `telegram.ErrPermanent error`; `type telegram.APIError struct{ Code int; Description string }` (`Error()`, `Unwrap()` → `ErrPermanent` для 403 и 400 «chat not found»); `(*telegram.Client).SendMessage(ctx, chatID int64, text string, buttons []Button) (int64, error)`; `(*telegram.Log).SendMessage(...) (int64, error)`; `usecase.TelegramSender.SendMessage(...) (int64, error)`; в тестах пакета `santa` — `fakeTG.msgID int64`.

- [ ] **Step 1: Падающие тесты клиента**

В `pkg/telegram/telegram_test.go`:

1. Добавить `"errors"` в импорт.
2. В `TestSendMessage` сервер отвечает `{"ok":true,"result":{"message_id":321}}`, а вызов и проверка:

```go
	c := NewWithBase("TOKEN", srv.URL, srv.Client())
	id, err := c.SendMessage(context.Background(), 42, "<b>Привет</b>", []Button{{Text: "Открыть", URL: "https://santa.prosto-namekni.ru/r/abcdefgh"}})
	require.NoError(t, err)
	assert.EqualValues(t, 321, id)
```

3. В `TestSendMessageNoButtons`:

```go
	_, err := NewWithBase("T", srv.URL, srv.Client()).SendMessage(context.Background(), 1, "x", nil)
	require.NoError(t, err)
```

4. В `TestSendMessageAPIError` — `_, err := …SendMessage(…)` и после `assert.Contains(…)` добавить `assert.ErrorIs(t, err, ErrPermanent)`.
5. В `TestSendMessageErrorDoesNotLeakToken` — `_, err := c.SendMessage(…)`.
6. Новый тест в конец файла:

```go
func TestSendMessagePermanentErrors(t *testing.T) {
	cases := []struct {
		status    int
		body      string
		permanent bool
	}{
		{http.StatusForbidden, `{"ok":false,"error_code":403,"description":"Forbidden: bot was blocked by the user"}`, true},
		{http.StatusForbidden, `{"ok":false,"error_code":403,"description":"Forbidden: user is deactivated"}`, true},
		{http.StatusBadRequest, `{"ok":false,"error_code":400,"description":"Bad Request: chat not found"}`, true},
		{http.StatusBadRequest, `{"ok":false,"error_code":400,"description":"Bad Request: message is too long"}`, false},
		{http.StatusTooManyRequests, `{"ok":false,"error_code":429,"description":"Too Many Requests: retry after 5"}`, false},
		{http.StatusInternalServerError, `{"ok":false,"error_code":500,"description":"Internal Server Error"}`, false},
	}
	for _, tc := range cases {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(tc.status)
			_, _ = w.Write([]byte(tc.body))
		}))
		_, err := NewWithBase("T", srv.URL, srv.Client()).SendMessage(context.Background(), 1, "x", nil)
		srv.Close()
		require.Error(t, err, tc.body)
		assert.Equal(t, tc.permanent, errors.Is(err, ErrPermanent), tc.body)
		var apiErr *APIError
		require.ErrorAs(t, err, &apiErr, tc.body)
		assert.Equal(t, tc.status, apiErr.Code)
	}
}
```

- [ ] **Step 2: Падающие тесты обработчика**

В `internal/usecase/santa/notifier_test.go` добавить `"main/pkg/telegram"` в импорт и в конец файла:

```go
func TestNotifier_TelegramBlockedIsPermanent(t *testing.T) {
	e := newNotifierEnv(t)
	e.tg.err = &telegram.APIError{Code: 403, Description: "Forbidden: bot was blocked by the user"}
	note := entity.NewSantaNotification(e.ward.ID, entity.SantaNotifyWelcome, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("MarkNotificationFailed", mock.Anything, note.ID, 1, (*time.Time)(nil), mock.Anything).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	e.sr.AssertCalled(t, "MarkNotificationFailed", mock.Anything, note.ID, 1, (*time.Time)(nil), mock.Anything)
}

func TestNotifier_TelegramTransientRetries(t *testing.T) {
	e := newNotifierEnv(t)
	e.tg.err = &telegram.APIError{Code: 429, Description: "Too Many Requests: retry after 5"}
	note := entity.NewSantaNotification(e.ward.ID, entity.SantaNotifyWelcome, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	retry := chNow.Add(time.Minute)
	e.sr.On("MarkNotificationFailed", mock.Anything, note.ID, 1, &retry, mock.Anything).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	e.sr.AssertCalled(t, "MarkNotificationFailed", mock.Anything, note.ID, 1, &retry, mock.Anything)
}
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `go test ./pkg/telegram/ ./internal/usecase/santa/`
Expected: FAIL — `ErrPermanent`/`APIError` не объявлены, `SendMessage` возвращает одно значение.

- [ ] **Step 4: Клиент Telegram**

В `pkg/telegram/telegram.go` добавить `"strings"` в импорт. После `type Button` вставить:

```go
// ErrPermanent — повтор не поможет: бот заблокирован или пользователь удалён
// (403), чата нет (400 «chat not found»). Проверка — errors.Is(err, ErrPermanent).
var ErrPermanent = errors.New("telegram: постоянная ошибка")

// APIError — отказ Bot API (ok=false в ответе).
type APIError struct {
	Code        int
	Description string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("telegram: %s (status %d)", e.Description, e.Code)
}

// Unwrap даёт ErrPermanent для ошибок, которые повтор не исправит. Прочие 400
// (длина текста, разметка) остаются временными: текст собирается заново при
// каждой попытке и может стать другим.
func (e *APIError) Unwrap() error {
	switch {
	case e.Code == http.StatusForbidden,
		e.Code == http.StatusBadRequest && strings.Contains(strings.ToLower(e.Description), "chat not found"):
		return ErrPermanent
	}
	return nil
}
```

`SendMessage` заменить целиком:

```go
// SendMessage шлёт текст с parse_mode=HTML и возвращает message_id
// отправленного сообщения: по нему бот узнаёт ответ (reply_to_message).
// Пользовательский текст — только через Escape.
func (c *Client) SendMessage(ctx context.Context, chatID int64, text string, buttons []Button) (int64, error) {
	body := map[string]any{
		"chat_id":                  chatID,
		"text":                     text,
		"parse_mode":               "HTML",
		"disable_web_page_preview": true,
	}
	var rows [][]Button
	for _, b := range buttons {
		if b.URL != "" && b.Text != "" {
			rows = append(rows, []Button{b})
		}
	}
	if len(rows) > 0 {
		body["reply_markup"] = map[string]any{"inline_keyboard": rows}
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return 0, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/bot"+c.token+"/sendMessage", bytes.NewReader(payload))
	if err != nil {
		return 0, errors.New("telegram: не удалось собрать запрос")
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		var ue *url.Error
		if errors.As(err, &ue) {
			err = ue.Err // url.Error содержит URL с токеном бота
		}
		return 0, fmt.Errorf("telegram sendMessage: %w", err)
	}
	defer resp.Body.Close()
	var out struct {
		OK          bool   `json:"ok"`
		ErrorCode   int    `json:"error_code"`
		Description string `json:"description"`
		Result      struct {
			MessageID int64 `json:"message_id"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return 0, fmt.Errorf("telegram: status %d: %w", resp.StatusCode, err)
	}
	if !out.OK {
		code := out.ErrorCode
		if code == 0 {
			code = resp.StatusCode
		}
		return 0, &APIError{Code: code, Description: out.Description}
	}
	return out.Result.MessageID, nil
}
```

`Log.SendMessage`:

```go
func (*Log) SendMessage(_ context.Context, chatID int64, text string, buttons []Button) (int64, error) {
	log.Printf("telegram(log): chat=%d buttons=%v\n%s", chatID, buttons, text)
	return 0, nil
}
```

- [ ] **Step 5: Интерфейс и вызовы**

`internal/usecase/contracts.go` — интерфейс заменить:

```go
// TelegramSender отправляет сообщение в чат и возвращает его message_id;
// реализации — pkg/telegram. Ошибки, которые повтор не исправит, —
// errors.Is(err, telegram.ErrPermanent).
type TelegramSender interface {
	SendMessage(ctx context.Context, chatID int64, text string, buttons []telegram.Button) (int64, error)
}
```

`internal/usecase/santa/channels.go`, в `tgReply`: `if _, err := uc.tg.SendMessage(ctx, chatID, text, nil); err != nil {`.

`internal/usecase/santa/notifier.go`, в `deliver` ветку Telegram заменить:

```go
	case entity.SantaChannelTelegram:
		if n.tg == nil {
			return fmt.Errorf("%w: бот не настроен", errPermanent)
		}
		_, err := n.tg.SendMessage(ctx, *p.TgChatID, msg.Telegram, []telegram.Button{{Text: msg.ButtonText, URL: msg.URL}})
		if errors.Is(err, telegram.ErrPermanent) {
			// Бот заблокирован или чата нет — повтор через минуту ничего не изменит.
			return fmt.Errorf("%w: %v", errPermanent, err)
		}
		return err
```

`internal/usecase/santa/channels_test.go` — `fakeTG` заменить:

```go
type fakeTG struct {
	chatID int64
	text   string
	calls  int
	err    error
	// msgID — что SendMessage вернёт как message_id.
	msgID int64
}

func (f *fakeTG) SendMessage(_ context.Context, chatID int64, text string, _ []telegram.Button) (int64, error) {
	f.calls++
	f.chatID, f.text = chatID, text
	return f.msgID, f.err
}
```

- [ ] **Step 6: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS, включая `TestSendMessagePermanentErrors`, `TestNotifier_TelegramBlockedIsPermanent`, `TestNotifier_TelegramTransientRetries`.

- [ ] **Step 7: Commit**

```bash
git add pkg/telegram internal/usecase/contracts.go internal/usecase/santa/channels.go internal/usecase/santa/channels_test.go internal/usecase/santa/notifier.go internal/usecase/santa/notifier_test.go
git commit -m "fix(backend): Санта — ошибки Telegram 403 и «чат не найден» без повторов"
```

---

### Task 2: Обработчик очереди в проде — без лог-заглушек

Доработка этапа 2 №1: в проде без SMTP обработчик получал `mailer.NewLog()` и отмечал письма отправленными. То же с ботом без токена.

**Files:**
- Modify: `BACK/internal/app/app.go`
- Create: `BACK/internal/app/app_test.go`
- Modify: `BACK/internal/usecase/santa/notifier.go` (`deliver`)
- Modify: `BACK/internal/usecase/santa/notifier_test.go`

**Interfaces:**
- Consumes: `mailer.NewLog() *mailer.Log`, `telegram.NewLog() *telegram.Log` (задача 1).
- Produces: `app.notifierChannels(production, smtpSet, botSet bool, mail usecase.Mailer, bot usecase.TelegramSender) (usecase.Mailer, usecase.TelegramSender)`; `Notifier` с `nil`-каналом отвечает временной ошибкой (повтор → `failed`).

- [ ] **Step 1: Падающие тесты**

Создать `internal/app/app_test.go`:

```go
package app

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"main/pkg/mailer"
	"main/pkg/telegram"
)

func TestNotifierChannels(t *testing.T) {
	logMail, logBot := mailer.NewLog(), telegram.NewLog()

	m, b := notifierChannels(true, false, false, logMail, logBot)
	assert.Nil(t, m, "прод без SMTP — письма не «уходят» в лог")
	assert.Nil(t, b, "прод без токена — сообщения не «уходят» в лог")

	m, b = notifierChannels(true, true, true, logMail, logBot)
	assert.NotNil(t, m)
	assert.NotNil(t, b)

	m, b = notifierChannels(false, false, false, logMail, logBot)
	assert.NotNil(t, m, "в разработке лог — норма")
	assert.NotNil(t, b)
}
```

В конец `internal/usecase/santa/notifier_test.go`:

```go
func TestNotifier_NoMailerRetries(t *testing.T) {
	e := newNotifierEnv(t)
	e.n.mailer = nil
	note := entity.NewSantaNotification(e.giver.ID, entity.SantaNotifyWelcome, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	retry := chNow.Add(time.Minute)
	e.sr.On("MarkNotificationFailed", mock.Anything, note.ID, 1, &retry, mock.Anything).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	e.sr.AssertCalled(t, "MarkNotificationFailed", mock.Anything, note.ID, 1, &retry, mock.Anything)
}

func TestNotifier_NoBotRetries(t *testing.T) {
	e := newNotifierEnv(t)
	e.n.tg = nil
	note := entity.NewSantaNotification(e.ward.ID, entity.SantaNotifyWelcome, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	retry := chNow.Add(time.Minute)
	e.sr.On("MarkNotificationFailed", mock.Anything, note.ID, 1, &retry, mock.Anything).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	e.sr.AssertCalled(t, "MarkNotificationFailed", mock.Anything, note.ID, 1, &retry, mock.Anything)
}
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `go test ./internal/app/ ./internal/usecase/santa/ -run 'NotifierChannels|NoMailer|NoBot' -v`
Expected: FAIL — нет `notifierChannels`; у обработчика без канала `retryAt == nil` (сейчас это `errPermanent`).

- [ ] **Step 3: Обработчик — нет канала значит повтор**

В `internal/usecase/santa/notifier.go`, в `deliver`, проверки `nil` заменить:

```go
	case entity.SantaChannelEmail:
		if n.mailer == nil {
			// Не errPermanent: SMTP могут настроить и перезапустить сервис,
			// пока идут повторы, — тогда письмо всё-таки уйдёт.
			return errors.New("почта не настроена (SMTP_HOST)")
		}
		return n.mailer.Send(ctx, p.Email, msg.Subject, msg.HTML, msg.Text)
	case entity.SantaChannelTelegram:
		if n.tg == nil {
			return errors.New("бот не настроен (SANTA_BOT_TOKEN/BOT_TOKEN)")
		}
```

(дальше ветки Telegram — как после задачи 1).

- [ ] **Step 4: Каналы обработчика в app.go**

В `internal/app/app.go` в конец файла:

```go
// notifierChannels — каналы для обработчика очереди. В продакшене без SMTP или
// токена бота канала нет (nil), а не лог-заглушка: заглушка молча отмечала бы
// уведомления отправленными, а так они уходят в повтор и потом в failed.
func notifierChannels(production, smtpSet, botSet bool, mail usecase.Mailer, bot usecase.TelegramSender) (usecase.Mailer, usecase.TelegramSender) {
	if production && !smtpSet {
		mail = nil
	}
	if production && !botSet {
		bot = nil
	}
	return mail, bot
}
```

В `Run` предупреждение о прод-окружении без SMTP заменить на:

```go
	} else if production {
		log.Println("WARNING: SMTP_HOST не задан — коды на почту Санты не отправляются (ответ 503), письма уведомлений уходят в повтор и failed")
```

а запуск обработчика — на:

```go
	notifyMail, notifyBot := notifierChannels(production, cfg.Notify.SMTPHost != "", cfg.Notify.TelegramBotToken != "", mail, bot)
	notifyCtx, stopNotify := context.WithCancel(context.Background())
	defer stopNotify()
	notifierDone := make(chan struct{})
	go func() {
		defer close(notifierDone)
		santaUC.NewNotifier(santaRepo, notifyMail, notifyBot, cfg.Notify.SantaPublicURL).Run(notifyCtx, 5*time.Second)
	}()
```

- [ ] **Step 5: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/app internal/usecase/santa/notifier.go internal/usecase/santa/notifier_test.go
git commit -m "fix(backend): Санта — в проде без SMTP и бота уведомления уходят в повтор, а не в лог"
```

---

### Task 3: Новый адрес почты ждёт кода в `pending_email`

Доработка этапа 2 №3: `SetEmail` сразу затирал подтверждённый адрес и снимал готовность.

**Files:**
- Modify: `BACK/internal/entity/santa.go`
- Modify: `BACK/internal/repo/persistent/santa_models.go`
- Modify: `BACK/internal/repo/persistent/santa_notify_postgres.go` (`SetEmail`, `VerifyEmail`)
- Modify: `BACK/internal/repo/persistent/backfill.go`
- Modify: `BACK/internal/repo/contracts.go` (комментарии `SetEmail`, `VerifyEmail`)
- Modify: `BACK/internal/repo/persistent/santa_notify_integration_test.go`
- Modify: `BACK/internal/usecase/contracts.go` (`SantaNotifyView`, комментарий `RequestEmailCode`)
- Modify: `BACK/internal/usecase/santa/participant.go` (`notifyView`)
- Modify: `BACK/internal/usecase/santa/channels.go` (`VerifyEmail`)
- Modify: `BACK/internal/usecase/santa/channels_test.go`
- Modify: `BACK/internal/app/app.go` (вызов backfill)

**Interfaces:**
- Produces: `entity.SantaParticipant.PendingEmail string`; колонка `santa_participants.pending_email`; `persistent.BackfillSantaPendingEmail(db *gorm.DB) error`; `usecase.SantaNotifyView.PendingEmail string` (`json:"pendingEmail"`); семантика: `SetEmail` пишет только `pending_email` и код (адрес подтверждён у другого участника комнаты — `ErrDuplicate`), `VerifyEmail` переносит `pending_email` → `email` (тот же адрес успел подтвердить сосед — `ErrDuplicate`, нет ждущего адреса — `ErrNotFound`).

- [ ] **Step 1: Сущность и модель**

`internal/entity/santa.go`, в `SantaParticipant` после `Email string` (и его комментарий поменять):

```go
	// Email — подтверждённый адрес в нижнем регистре; пусто — адреса нет.
	Email string
	// PendingEmail — новый адрес, ждущий кода. Пока он не подтверждён, письма
	// идут на Email, а готовность не меняется.
	PendingEmail    string
	EmailVerifiedAt *time.Time
```

`internal/repo/persistent/santa_models.go`, в `SantaParticipantModel` после `Email *string …`:

```go
	// Адрес, ждущий кода. Уникальности нет: занять адрес можно только подтвердив.
	PendingEmail *string
```

В `toSantaParticipantModel` после блока `email`:

```go
	var pending *string
	if p.PendingEmail != "" {
		e := p.PendingEmail
		pending = &e
	}
```

и в литерал — `PendingEmail: pending,`. В `toSantaParticipantEntity`:

```go
	pending := ""
	if m.PendingEmail != nil {
		pending = *m.PendingEmail
	}
```

и в литерал — `PendingEmail: pending,`.

- [ ] **Step 2: Падающие интеграционные тесты**

В `internal/repo/persistent/santa_notify_integration_test.go`:

1. В `TestSantaRepo_EmailVerification` проверку после первого `SetEmail`

```go
	assert.Equal(t, "anna@example.com", p.Email)
```

заменить на

```go
	assert.Empty(t, p.Email, "до кода адрес не подтверждён")
	assert.Equal(t, "anna@example.com", p.PendingEmail)
```

а в конце теста после `assert.Equal(t, entity.SantaChannelEmail, p.Channel)` добавить:

```go
	assert.Equal(t, "anna@example.com", p.Email)
	assert.Empty(t, p.PendingEmail)
```

2. `TestSantaRepo_SetEmailResetsVerificationAndCode` заменить целиком:

```go
func TestSantaRepo_PendingEmailKeepsReady(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	id := seedUnready(t, r, room.ID, 1)[0]
	now := time.Now().UTC().Truncate(time.Second)

	require.NoError(t, r.SetEmail(ctx, id, "a@example.com", emailCode(id, now)))
	require.NoError(t, r.VerifyEmail(ctx, id, "hash-"+id.String(), now, entity.NewSantaNotification(id, entity.SantaNotifyWelcome, now)))
	taken, err := r.IncEmailCodeAttempts(ctx, id, 5) // кода уже нет — тихо ничего
	require.NoError(t, err)
	assert.False(t, taken)

	later := now.Add(2 * time.Minute)
	require.NoError(t, r.SetEmail(ctx, id, "b@example.com", emailCode(id, later)))
	p, err := r.GetParticipant(ctx, id)
	require.NoError(t, err)
	assert.Equal(t, "a@example.com", p.Email, "старый адрес в силе до кода")
	assert.Equal(t, "b@example.com", p.PendingEmail)
	assert.NotNil(t, p.EmailVerifiedAt)
	assert.True(t, p.Ready(), "смена адреса не снимает готовность")

	code, err := r.GetEmailCode(ctx, id)
	require.NoError(t, err)
	assert.WithinDuration(t, later, code.SentAt, time.Second)
	assert.Equal(t, 0, code.Attempts, "новый код — счётчик попыток с нуля")

	require.NoError(t, r.VerifyEmail(ctx, id, "hash-"+id.String(), later, entity.NewSantaNotification(id, entity.SantaNotifyWelcome, later)))
	p, err = r.GetParticipant(ctx, id)
	require.NoError(t, err)
	assert.Equal(t, "b@example.com", p.Email)
	assert.Empty(t, p.PendingEmail)
	assert.True(t, p.Ready())
}
```

3. `TestSantaRepo_EmailUniqueWithinRoom` заменить целиком и добавить два теста:

```go
func TestSantaRepo_EmailUniqueWithinRoom(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	now := time.Now().UTC()
	room := seedRoom(t, r, uuid.New())
	ids := seedUnready(t, r, room.ID, 2)
	require.NoError(t, r.SetEmail(ctx, ids[0], "same@example.com", emailCode(ids[0], now)))
	require.NoError(t, r.VerifyEmail(ctx, ids[0], "hash-"+ids[0].String(), now, entity.NewSantaNotification(ids[0], entity.SantaNotifyWelcome, now)))

	err := r.SetEmail(ctx, ids[1], "same@example.com", emailCode(ids[1], now))
	assert.ErrorIs(t, err, repo.ErrDuplicate, "подтверждённый адрес соседа занят")

	other := seedRoom(t, r, uuid.New())
	stranger := seedUnready(t, r, other.ID, 1)[0]
	assert.NoError(t, r.SetEmail(ctx, stranger, "same@example.com", emailCode(stranger, now)), "в другой комнате адрес свободен")
}

func TestSantaRepo_VerifyEmailTakenMeanwhile(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC()
	room := seedRoom(t, r, uuid.New())
	ids := seedUnready(t, r, room.ID, 2)
	// Оба ждут код на один адрес — неподтверждённый адрес никого не блокирует.
	require.NoError(t, r.SetEmail(ctx, ids[0], "same@example.com", emailCode(ids[0], now)))
	require.NoError(t, r.SetEmail(ctx, ids[1], "same@example.com", emailCode(ids[1], now)))

	require.NoError(t, r.VerifyEmail(ctx, ids[0], "hash-"+ids[0].String(), now, entity.NewSantaNotification(ids[0], entity.SantaNotifyWelcome, now)))
	err := r.VerifyEmail(ctx, ids[1], "hash-"+ids[1].String(), now, entity.NewSantaNotification(ids[1], entity.SantaNotifyWelcome, now))
	assert.ErrorIs(t, err, repo.ErrDuplicate)

	p, err := r.GetParticipant(ctx, ids[1])
	require.NoError(t, err)
	assert.False(t, p.Ready())
	assert.Equal(t, "same@example.com", p.PendingEmail, "откат: ничего не поменялось")
	assert.EqualValues(t, 0, countNotes(t, db, ids[1], entity.SantaNotifyWelcome))
}

func TestBackfillSantaPendingEmail(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	ids := seedUnready(t, r, room.ID, 2)
	now := time.Now().UTC()
	// Как писал этап 2: новый адрес сразу в email, подтверждение сброшено.
	require.NoError(t, db.Model(&persistent.SantaParticipantModel{}).Where("id = ?", ids[0]).
		Update("email", "old@example.com").Error)
	require.NoError(t, db.Model(&persistent.SantaParticipantModel{}).Where("id = ?", ids[1]).
		Updates(map[string]any{"email": "ok@example.com", "email_verified_at": now, "channel": "email"}).Error)

	require.NoError(t, persistent.BackfillSantaPendingEmail(db))
	require.NoError(t, persistent.BackfillSantaPendingEmail(db), "повторный запуск безопасен")

	p, err := r.GetParticipant(ctx, ids[0])
	require.NoError(t, err)
	assert.Empty(t, p.Email)
	assert.Equal(t, "old@example.com", p.PendingEmail)
	q, err := r.GetParticipant(ctx, ids[1])
	require.NoError(t, err)
	assert.Equal(t, "ok@example.com", q.Email)
	assert.Empty(t, q.PendingEmail)
	assert.True(t, q.Ready())
}
```

- [ ] **Step 3: Падающие тесты use case**

В `internal/usecase/santa/channels_test.go`:

1. В `TestVerifyEmail_Success` строку `p.Email = "a@example.com"` заменить на `p.PendingEmail = "a@example.com"`, а в конец теста добавить:

```go
	assert.Equal(t, "a@example.com", me.Notify.Email)
	assert.Empty(t, me.Notify.PendingEmail)
	assert.False(t, me.Notify.EmailPending)
```

2. В конец файла:

```go
func TestVerifyEmail_AddressTakenMeanwhile(t *testing.T) {
	uc, sr, _, _, _, p := channelUC(t)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(validCode(p, "123456", 0), nil)
	sr.On("IncEmailCodeAttempts", mock.Anything, p.ID, emailCodeAttempts).Return(true, nil)
	sr.On("VerifyEmail", mock.Anything, p.ID, hashEmailCode(p.ID, "123456"), chNow, mock.Anything).Return(repo.ErrDuplicate)
	_, err := uc.VerifyEmail(context.Background(), "abcdefgh", tokAuth, "123456")
	assert.ErrorIs(t, err, usecase.ErrSantaEmailTaken)
}

func TestNotifyView_PendingEmailKeepsReady(t *testing.T) {
	at := chNow
	v := notifyView(entity.SantaParticipant{
		Channel: entity.SantaChannelEmail, Email: "old@example.com", EmailVerifiedAt: &at, PendingEmail: "new@example.com",
	})
	assert.True(t, v.Ready)
	assert.True(t, v.EmailVerified)
	assert.True(t, v.EmailPending)
	assert.Equal(t, "old@example.com", v.Email)
	assert.Equal(t, "new@example.com", v.PendingEmail)
}
```

- [ ] **Step 4: Убедиться, что тесты падают**

Run: `go vet -tags integration ./internal/repo/persistent/ && go test ./internal/usecase/santa/ -run 'VerifyEmail|NotifyView' -v`
Expected: FAIL — нет `BackfillSantaPendingEmail`, `SantaNotifyView.PendingEmail`; `TestVerifyEmail_AddressTakenMeanwhile` получает «внутреннюю» ошибку.

- [ ] **Step 5: Репозиторий**

`internal/repo/persistent/santa_notify_postgres.go` — `SetEmail` и `VerifyEmail` заменить целиком:

```go
func (r *santaRepo) SetEmail(ctx context.Context, participantID uuid.UUID, email string, code entity.SantaEmailCode) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var p SantaParticipantModel
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&p, "id = ?", participantID).Error; err != nil {
			return santaErr("santaRepo.SetEmail", err)
		}
		// В email лежат только подтверждённые адреса. Чужой неподтверждённый
		// адрес не мешает: достанется тому, кто первым введёт код.
		var taken int64
		if err := tx.Model(&SantaParticipantModel{}).
			Where("room_id = ? AND id <> ? AND email = ?", p.RoomID, p.ID, email).
			Count(&taken).Error; err != nil {
			return santaErr("santaRepo.SetEmail check", err)
		}
		if taken > 0 {
			return fmt.Errorf("santaRepo.SetEmail: %w", repo.ErrDuplicate)
		}
		// Подтверждённый адрес и готовность не трогаем, пока новый не подтверждён.
		if err := tx.Model(&SantaParticipantModel{}).Where("id = ?", participantID).Updates(map[string]any{
			"pending_email": email,
			"updated_at":    time.Now(),
		}).Error; err != nil {
			return santaErr("santaRepo.SetEmail", err)
		}
		m := SantaEmailCodeModel{
			ParticipantID: participantID, CodeHash: code.CodeHash, ExpiresAt: code.ExpiresAt,
			Attempts: 0, SentAt: code.SentAt,
		}
		if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&m).Error; err != nil {
			return santaErr("santaRepo.SetEmail code", err)
		}
		return nil
	})
}
```

```go
func (r *santaRepo) VerifyEmail(ctx context.Context, participantID uuid.UUID, codeHash string, at time.Time, welcome entity.SantaNotification) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		del := tx.Delete(&SantaEmailCodeModel{}, "participant_id = ? AND code_hash = ?", participantID, codeHash)
		if del.Error != nil {
			return santaErr("santaRepo.VerifyEmail code", del.Error)
		}
		if del.RowsAffected == 0 {
			return fmt.Errorf("santaRepo.VerifyEmail: %w", repo.ErrNotFound)
		}
		// SET читает старые значения строки: email получает прежний pending_email.
		res := tx.Model(&SantaParticipantModel{}).
			Where("id = ? AND pending_email IS NOT NULL", participantID).
			Updates(map[string]any{
				"email":             gorm.Expr("pending_email"),
				"pending_email":     nil,
				"email_verified_at": at,
				"channel":           string(entity.SantaChannelEmail),
				"updated_at":        at,
			})
		if res.Error != nil {
			// Тот же адрес успел подтвердить другой участник комнаты.
			if isUniqueViolation(res.Error, "idx_santa_participant_email") {
				return fmt.Errorf("santaRepo.VerifyEmail: %w", repo.ErrDuplicate)
			}
			return santaErr("santaRepo.VerifyEmail", res.Error)
		}
		if res.RowsAffected == 0 {
			return fmt.Errorf("santaRepo.VerifyEmail: %w", repo.ErrNotFound)
		}
		return insertNotifications(tx, welcome)
	})
}
```

`internal/repo/contracts.go` — комментарии к методам:

```go
	// SetEmail запоминает новый адрес в pending_email и кладёт код — одной
	// транзакцией; подтверждённый адрес и готовность не меняются. Адрес
	// подтверждён у другого участника комнаты — ErrDuplicate; участника нет —
	// ErrNotFound.
	SetEmail(ctx context.Context, participantID uuid.UUID, email string, code entity.SantaEmailCode) error
```

```go
	// VerifyEmail: pending_email становится подтверждённым email, канал —
	// почта, код стёрт, приветствие в очереди — одной транзакцией. Код
	// стирается по codeHash: если за это время код заменён или стёрт —
	// ErrNotFound, ничего не меняется. Тот же адрес успел подтвердить другой
	// участник комнаты — ErrDuplicate.
	VerifyEmail(ctx context.Context, participantID uuid.UUID, codeHash string, at time.Time, welcome entity.SantaNotification) error
```

- [ ] **Step 6: Перенос старых данных**

В конец `internal/repo/persistent/backfill.go`:

```go
// BackfillSantaPendingEmail переносит неподтверждённые адреса участников
// Тайного Санты в pending_email.
//
// До этапа 3 новый адрес сразу писался в email со сбросом подтверждения;
// теперь в email только подтверждённый, а ждущий кода — в pending_email. Без
// переноса введённый код не подтвердил бы такой адрес.
//
// Идемпотентно: после переноса неподтверждённых email не остаётся.
func BackfillSantaPendingEmail(db *gorm.DB) error {
	const query = `
		UPDATE santa_participants
		SET pending_email = email, email = NULL
		WHERE email IS NOT NULL AND email_verified_at IS NULL
	`
	if err := db.Exec(query).Error; err != nil {
		return fmt.Errorf("backfill santa pending_email: %w", err)
	}
	return nil
}
```

В `internal/app/app.go` после `BackfillPollChoices`:

```go
	if err := persistent.BackfillSantaPendingEmail(db); err != nil {
		log.Fatalf("backfill santa pending_email: %v", err)
	}
```

- [ ] **Step 7: Use case и ответ API**

`internal/usecase/contracts.go`, `SantaNotifyView` — поля почты заменить:

```go
	// Email — подтверждённый адрес; на него идут письма.
	Email         string `json:"email"`
	EmailVerified bool   `json:"emailVerified"`
	// PendingEmail — новый адрес, ждущий кода; пусто — нет.
	PendingEmail string `json:"pendingEmail"`
	// EmailPending — код отправлен на PendingEmail, но ещё не введён.
	EmailPending bool `json:"emailPending"`
```

Комментарий `RequestEmailCode` в интерфейсе: первую строку заменить на `// RequestEmailCode запоминает новый адрес до подтверждения (подтверждённый остаётся в силе) и шлёт на него код; раньше чем через`.

`internal/usecase/santa/participant.go` — `notifyView`:

```go
func notifyView(p entity.SantaParticipant) usecase.SantaNotifyView {
	return usecase.SantaNotifyView{
		Channel:       p.Channel,
		Email:         p.Email,
		EmailVerified: p.Email != "" && p.EmailVerifiedAt != nil,
		PendingEmail:  p.PendingEmail,
		EmailPending:  p.PendingEmail != "",
		Telegram:      p.TgChatID != nil,
		Ready:         p.Ready(),
	}
}
```

`internal/usecase/santa/channels.go`, в `VerifyEmail` обработку ошибки репозитория и хвост заменить:

```go
	if err := uc.santa.VerifyEmail(ctx, p.ID, rec.CodeHash, now, welcome); err != nil {
		switch {
		case errors.Is(err, repo.ErrNotFound):
			// Код успели заменить или стереть — проверенный код уже не действует.
			return usecase.SantaMe{}, invalid("код устарел — запросите новый")
		case errors.Is(err, repo.ErrDuplicate):
			return usecase.SantaMe{}, usecase.ErrSantaEmailTaken
		}
		return usecase.SantaMe{}, err
	}
	p.Email = p.PendingEmail
	p.PendingEmail = ""
	p.EmailVerifiedAt = &now
	p.Channel = entity.SantaChannelEmail
	return uc.me(ctx, room, p)
```

- [ ] **Step 8: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./internal/repo/persistent/ -run 'TestSantaRepo|TestBackfillSanta' -count=1`
Expected: PASS (Docker запущен).

- [ ] **Step 9: Commit**

```bash
git add internal/entity/santa.go internal/repo internal/usecase internal/app/app.go
git commit -m "fix(backend): Санта — новый адрес почты ждёт кода и не снимает готовность"
```

---

### Task 4: Периодическая очистка служебных таблиц

Доработка этапа 2 №2: `santa_tg_links`, `santa_email_codes` и `santa_notifications` росли без очистки.

**Files:**
- Modify: `BACK/internal/repo/contracts.go`
- Modify: `BACK/internal/repo/persistent/santa_notify_postgres.go`
- Modify: `BACK/mock/repo/mock_santa_repo.go`
- Modify: `BACK/internal/repo/persistent/santa_notify_integration_test.go`
- Modify: `BACK/internal/usecase/santa/notifier.go`
- Modify: `BACK/internal/usecase/santa/notifier_test.go`

**Interfaces:**
- Produces: `SantaRepo.PurgeStale(ctx, now time.Time, keepNotes time.Duration) (int64, error)`; константы `purgeEvery = time.Hour`, `notifyRetention = 30 * 24 * time.Hour`; `(*Notifier).purgeIfDue(ctx) bool`.

- [ ] **Step 1: Контракт и мок**

`internal/repo/contracts.go`, в `SantaRepo` после `MarkNotificationFailed`:

```go
	// PurgeStale стирает истёкшие ссылки Telegram и коды почты и отработанные
	// (sent/failed) уведомления, созданные раньше now-keepNotes. Возвращает,
	// сколько строк стёрто.
	PurgeStale(ctx context.Context, now time.Time, keepNotes time.Duration) (int64, error)
```

`mock/repo/mock_santa_repo.go`, в конец:

```go
func (m *MockSantaRepo) PurgeStale(ctx context.Context, now time.Time, keepNotes time.Duration) (int64, error) {
	args := m.Called(ctx, now, keepNotes)
	return args.Get(0).(int64), args.Error(1)
}
```

- [ ] **Step 2: Падающие тесты**

В конец `internal/repo/persistent/santa_notify_integration_test.go`:

```go
func TestSantaRepo_PurgeStale(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	ids := seedUnready(t, r, room.ID, 2)
	now := time.Now().UTC().Truncate(time.Second)

	require.NoError(t, r.CreateTgLink(ctx, entity.SantaTgLink{TokenHash: "old", ParticipantID: ids[0], ExpiresAt: now.Add(-time.Hour)}))
	require.NoError(t, r.CreateTgLink(ctx, entity.SantaTgLink{TokenHash: "fresh", ParticipantID: ids[0], ExpiresAt: now.Add(time.Hour)}))
	expired := emailCode(ids[0], now.Add(-time.Hour)) // истёк 45 минут назад
	require.NoError(t, r.SetEmail(ctx, ids[0], "a@example.com", expired))
	require.NoError(t, r.SetEmail(ctx, ids[1], "b@example.com", emailCode(ids[1], now)))

	month := 30 * 24 * time.Hour
	note := func(status string, age time.Duration) persistent.SantaNotificationModel {
		return persistent.SantaNotificationModel{
			ID: uuid.New(), ParticipantID: ids[0], Kind: string(entity.SantaNotifyWelcome), Payload: "{}",
			Status: status, NextTryAt: now, CreatedAt: now.Add(-age),
		}
	}
	oldSent, oldFailed, oldPending, freshSent := note("sent", month+time.Hour), note("failed", month+time.Hour), note("pending", month+time.Hour), note("sent", 24*time.Hour)
	require.NoError(t, db.Create(&[]persistent.SantaNotificationModel{oldSent, oldFailed, oldPending, freshSent}).Error)

	deleted, err := r.PurgeStale(ctx, now, month)
	require.NoError(t, err)
	assert.EqualValues(t, 4, deleted, "ссылка, код и два отработанных уведомления")

	var links []persistent.SantaTgLinkModel
	require.NoError(t, db.Find(&links).Error)
	require.Len(t, links, 1)
	assert.Equal(t, "fresh", links[0].TokenHash)
	_, err = r.GetEmailCode(ctx, ids[0])
	assert.ErrorIs(t, err, repo.ErrNotFound, "истёкший код стёрт")
	_, err = r.GetEmailCode(ctx, ids[1])
	assert.NoError(t, err, "живой код остался")
	var left []uuid.UUID
	require.NoError(t, db.Model(&persistent.SantaNotificationModel{}).Order("id").Pluck("id", &left).Error)
	assert.ElementsMatch(t, []uuid.UUID{oldPending.ID, freshSent.ID}, left, "pending не трогаем, свежие храним")
}
```

В конец `internal/usecase/santa/notifier_test.go`:

```go
func TestNotifier_PurgeHourly(t *testing.T) {
	e := newNotifierEnv(t)
	at := chNow
	e.n.now = func() time.Time { return at }
	e.sr.On("PurgeStale", mock.Anything, mock.Anything, notifyRetention).Return(int64(3), nil)

	assert.True(t, e.n.purgeIfDue(context.Background()), "первый тик чистит сразу")
	at = chNow.Add(59 * time.Minute)
	assert.False(t, e.n.purgeIfDue(context.Background()))
	at = chNow.Add(time.Hour)
	assert.True(t, e.n.purgeIfDue(context.Background()))
	e.sr.AssertNumberOfCalls(t, "PurgeStale", 2)
	e.sr.AssertCalled(t, "PurgeStale", mock.Anything, chNow, notifyRetention)
}

func TestNotifier_PurgeErrorWaitsNextHour(t *testing.T) {
	e := newNotifierEnv(t)
	at := chNow
	e.n.now = func() time.Time { return at }
	e.sr.On("PurgeStale", mock.Anything, mock.Anything, notifyRetention).Return(int64(0), errors.New("db down"))

	assert.True(t, e.n.purgeIfDue(context.Background()))
	at = chNow.Add(time.Minute)
	assert.False(t, e.n.purgeIfDue(context.Background()), "сбой не превращается в запрос каждые 5 с")
}
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `go vet -tags integration ./internal/repo/persistent/ && go test ./internal/usecase/santa/ -run Purge -v`
Expected: FAIL — `r.PurgeStale undefined`, нет `purgeIfDue`, `notifyRetention`.

- [ ] **Step 4: Репозиторий**

В конец `internal/repo/persistent/santa_notify_postgres.go`:

```go
func (r *santaRepo) PurgeStale(ctx context.Context, now time.Time, keepNotes time.Duration) (int64, error) {
	db := r.db.WithContext(ctx)
	done := []string{string(entity.SantaNotificationSent), string(entity.SantaNotificationFailed)}
	steps := []struct {
		op    string
		model any
		where string
		args  []any
	}{
		// Ссылка и код с истёкшим сроком уже ничего не подтверждают.
		{"links", &SantaTgLinkModel{}, "expires_at <= ?", []any{now}},
		{"codes", &SantaEmailCodeModel{}, "expires_at <= ?", []any{now}},
		// pending не трогаем: они ещё в работе, сколько бы ни ждали.
		{"notifications", &SantaNotificationModel{}, "status IN ? AND created_at < ?", []any{done, now.Add(-keepNotes)}},
	}
	var total int64
	for _, s := range steps {
		res := db.Where(s.where, s.args...).Delete(s.model)
		if res.Error != nil {
			return total, santaErr("santaRepo.PurgeStale "+s.op, res.Error)
		}
		total += res.RowsAffected
	}
	return total, nil
}
```

- [ ] **Step 5: Обработчик**

В `internal/usecase/santa/notifier.go` после блока `const (…)`:

```go
const (
	// purgeEvery — как часто обработчик чистит устаревшее.
	purgeEvery = time.Hour
	// notifyRetention — сколько хранить отправленные и failed уведомления: по
	// tg_message_id отправленных бот узнаёт ответы в чате, по failed
	// разбираем сбои.
	notifyRetention = 30 * 24 * time.Hour
)
```

В структуру `Notifier` после `now func() time.Time`:

```go
	// lastPurge — когда последний раз запускалась чистка; нулевое — ещё не было.
	lastPurge time.Time
```

`Run` заменить:

```go
// Run крутит RunOnce каждые tick до отмены ctx; раз в purgeEvery чистит
// устаревшие строки.
func (n *Notifier) Run(ctx context.Context, tick time.Duration) {
	t := time.NewTicker(tick)
	defer t.Stop()
	for {
		if _, err := n.RunOnce(ctx); err != nil && ctx.Err() == nil {
			log.Printf("santa notifier: %v", err)
		}
		n.purgeIfDue(ctx)
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		}
	}
}

// purgeIfDue раз в purgeEvery стирает истёкшие ссылки, коды и старые
// уведомления, чтобы таблицы не росли без конца. Сбой ждёт следующего часа,
// а не повторяется каждый тик. true — чистка запускалась.
func (n *Notifier) purgeIfDue(ctx context.Context) bool {
	now := n.now()
	if !n.lastPurge.IsZero() && now.Sub(n.lastPurge) < purgeEvery {
		return false
	}
	n.lastPurge = now
	deleted, err := n.santa.PurgeStale(ctx, now, notifyRetention)
	switch {
	case err != nil:
		if ctx.Err() == nil {
			log.Printf("santa notifier: purge: %v", err)
		}
	case deleted > 0:
		log.Printf("santa notifier: purge: стёрто %d строк", deleted)
	}
	return true
}
```

- [ ] **Step 6: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./internal/repo/persistent/ -run TestSantaRepo_PurgeStale -count=1`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add internal/repo mock/repo internal/usecase/santa/notifier.go internal/usecase/santa/notifier_test.go
git commit -m "fix(backend): Санта — обработчик раз в час чистит истёкшие ссылки, коды и старые уведомления"
```

---

### Task 5: Жеребьёвка по расписанию — данные и репозиторий

**Files:**
- Modify: `BACK/internal/entity/santa.go`
- Modify: `BACK/internal/repo/persistent/santa_models.go`
- Modify: `BACK/internal/repo/persistent/santa_postgres.go` (`UpdateRoom`, `Draw`, новые методы)
- Modify: `BACK/internal/repo/contracts.go`
- Modify: `BACK/mock/repo/mock_santa_repo.go`
- Create: `BACK/internal/repo/persistent/santa_schedule_integration_test.go`

**Interfaces:**
- Produces: `entity.SantaRoom.DrawFailedAt *time.Time` (`json:"drawFailedAt"`); `entity.SantaNotifyDrawFailed = "draw_failed"`; `repo.ScheduledDrawOutcome` (`ScheduledDrawSkipped`, `ScheduledDrawDone`, `ScheduledDrawTooFew`); `SantaRepo.DueDrawRooms(ctx, now time.Time, limit int) ([]uuid.UUID, error)`; `SantaRepo.DrawScheduled(ctx, roomID uuid.UUID, now time.Time, minReady int, build func(ids []uuid.UUID) ([]entity.SantaAssignment, error), note func(giverID uuid.UUID) entity.SantaNotification, failNote func(organizerID uuid.UUID) entity.SantaNotification) (repo.ScheduledDrawOutcome, error)`; `UpdateRoom` пишет `draw_failed_at` из сущности; `Draw` и `DrawScheduled` сбрасывают `draw_failed_at`. Внутренние хелперы пакета `persistent`: `readyIDs(tx *gorm.DB, roomID uuid.UUID) ([]uuid.UUID, error)`, `drawLocked(tx *gorm.DB, roomID uuid.UUID, ids []uuid.UUID, build …, note …, now time.Time) error`.

- [ ] **Step 1: Сущности**

`internal/entity/santa.go`, в `SantaRoom` после `DrawnAt`:

```go
	// DrawFailedAt — жеребьёвка по DrawAt не прошла: готовых меньше трёх.
	// Сбрасывается новым временем жеребьёвки и самой жеребьёвкой.
	DrawFailedAt *time.Time `json:"drawFailedAt"`
```

Комментарий `DrawAt` заменить на `// DrawAt — когда планировщик проведёт жеребьёвку сам; nil — только вручную.`

В константы видов уведомлений после `SantaNotifyWishesUpdated`:

```go
	// SantaNotifyDrawFailed — организатору: жеребьёвка по расписанию не прошла.
	SantaNotifyDrawFailed SantaNotificationKind = "draw_failed"
```

- [ ] **Step 2: Модель**

`internal/repo/persistent/santa_models.go`, `SantaRoomModel`: поля `DrawAt` и `Status` заменить, после `DrawnAt` добавить `DrawFailedAt`:

```go
	// Индекс (status, draw_at) — для планировщика: открытые с наступившим временем.
	DrawAt         *time.Time `gorm:"index:idx_santa_room_draw_due,priority:2"`
	Message        string     `gorm:"not null;default:''"`
	Status         string     `gorm:"not null;default:open;index:idx_santa_room_draw_due,priority:1"`
	DrawnAt        *time.Time
	DrawFailedAt   *time.Time
```

В `toSantaRoomModel` и `toSantaRoomEntity` добавить `DrawFailedAt: r.DrawFailedAt` / `DrawFailedAt: m.DrawFailedAt`.

- [ ] **Step 3: Контракт и мок**

`internal/repo/contracts.go`, рядом с ошибками:

```go
// ScheduledDrawOutcome — чем кончилась попытка жеребьёвки по расписанию.
type ScheduledDrawOutcome string

const (
	// ScheduledDrawSkipped — комната уже не ждёт: разыграна, время сняли или
	// перенесли, её держит другой экземпляр.
	ScheduledDrawSkipped ScheduledDrawOutcome = "skipped"
	ScheduledDrawDone    ScheduledDrawOutcome = "drawn"
	// ScheduledDrawTooFew — готовых меньше minReady: draw_at снят,
	// draw_failed_at поставлен.
	ScheduledDrawTooFew ScheduledDrawOutcome = "too_few"
)
```

В `SantaRepo` комментарий `UpdateRoom` (если его нет — добавить) и комментарий `Draw` дополнить:

```go
	// UpdateRoom пишет название, бюджет, даты, сообщение и draw_failed_at;
	// только в open, иначе ErrStatusMismatch.
	UpdateRoom(ctx context.Context, room entity.SantaRoom) error
```

В конец абзаца комментария `Draw`: `// Сбрасывает draw_failed_at.`

После `Draw` добавить:

```go
	// DueDrawRooms — id открытых комнат с draw_at <= now, ранние первыми.
	DueDrawRooms(ctx context.Context, now time.Time, limit int) ([]uuid.UUID, error)
	// DrawScheduled — жеребьёвка по расписанию одной транзакцией. Комната
	// берётся FOR UPDATE SKIP LOCKED и только если всё ещё open с
	// draw_at <= now, иначе ScheduledDrawSkipped. Готовых меньше minReady —
	// draw_at = NULL, draw_failed_at = now и failNote организатору, если он
	// готовый участник комнаты (ScheduledDrawTooFew). Иначе — как Draw
	// (ScheduledDrawDone).
	DrawScheduled(ctx context.Context, roomID uuid.UUID, now time.Time, minReady int, build func(ids []uuid.UUID) ([]entity.SantaAssignment, error), note func(giverID uuid.UUID) entity.SantaNotification, failNote func(organizerID uuid.UUID) entity.SantaNotification) (ScheduledDrawOutcome, error)
```

`mock/repo/mock_santa_repo.go` — добавить `"main/internal/repo"` в импорт и в конец:

```go
func (m *MockSantaRepo) DueDrawRooms(ctx context.Context, now time.Time, limit int) ([]uuid.UUID, error) {
	args := m.Called(ctx, now, limit)
	ids, _ := args.Get(0).([]uuid.UUID)
	return ids, args.Error(1)
}

func (m *MockSantaRepo) DrawScheduled(ctx context.Context, roomID uuid.UUID, now time.Time, minReady int, build func([]uuid.UUID) ([]entity.SantaAssignment, error), note func(uuid.UUID) entity.SantaNotification, failNote func(uuid.UUID) entity.SantaNotification) (repo.ScheduledDrawOutcome, error) {
	args := m.Called(ctx, roomID, now, minReady, build, note, failNote)
	return args.Get(0).(repo.ScheduledDrawOutcome), args.Error(1)
}
```

- [ ] **Step 4: Падающие интеграционные тесты**

Создать `internal/repo/persistent/santa_schedule_integration_test.go`:

```go
//go:build integration

package persistent_test

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/repo/persistent"
)

func setDrawAt(t *testing.T, db *gorm.DB, roomID uuid.UUID, at time.Time) {
	t.Helper()
	require.NoError(t, db.Model(&persistent.SantaRoomModel{}).Where("id = ?", roomID).Update("draw_at", at).Error)
}

// seedOwner — организатор-участник комнаты; ready — с подтверждённым Telegram.
func seedOwner(t *testing.T, r repo.SantaRepo, room entity.SantaRoom, ready bool) uuid.UUID {
	t.Helper()
	owner := room.OwnerID
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, UserID: &owner, Name: "Организатор", TokenHash: uuid.NewString()}
	if ready {
		chatSeq++
		chat := chatSeq
		p.Channel, p.TgChatID = entity.SantaChannelTelegram, &chat
	}
	require.NoError(t, r.CreateParticipant(context.Background(), p))
	return p.ID
}

func failNote(now time.Time) func(uuid.UUID) entity.SantaNotification {
	return func(id uuid.UUID) entity.SantaNotification {
		return entity.NewSantaNotification(id, entity.SantaNotifyDrawFailed, now)
	}
}

func drawScheduled(r repo.SantaRepo, roomID uuid.UUID, now time.Time) (repo.ScheduledDrawOutcome, error) {
	return r.DrawScheduled(context.Background(), roomID, now, 3, circle(roomID), drawnNote(now), failNote(now))
}

func TestSantaRepo_DueDrawRooms(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)

	due := seedRoom(t, r, uuid.New())
	setDrawAt(t, db, due.ID, now.Add(-time.Minute))
	future := seedRoom(t, r, uuid.New())
	setDrawAt(t, db, future.ID, now.Add(time.Hour))
	drawn := seedRoom(t, r, uuid.New())
	seedParticipants(t, r, drawn.ID, 3)
	require.NoError(t, r.Draw(ctx, drawn.ID, entity.SantaRoomOpen, circle(drawn.ID), drawnNote(now)))
	setDrawAt(t, db, drawn.ID, now.Add(-time.Minute))
	seedRoom(t, r, uuid.New()) // без времени

	ids, err := r.DueDrawRooms(ctx, now, 10)
	require.NoError(t, err)
	assert.Equal(t, []uuid.UUID{due.ID}, ids)
}

func TestSantaRepo_DrawScheduledDraws(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	setDrawAt(t, db, room.ID, now.Add(-time.Minute))

	outcome, err := drawScheduled(r, room.ID, now)
	require.NoError(t, err)
	assert.Equal(t, repo.ScheduledDrawDone, outcome)
	got, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Equal(t, entity.SantaRoomDrawn, got.Status)
	assert.Nil(t, got.DrawFailedAt)
	for _, id := range ids {
		assert.EqualValues(t, 1, countNotes(t, db, id, entity.SantaNotifyDrawn))
	}
}

func TestSantaRepo_DrawScheduledOnce(t *testing.T) {
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	setDrawAt(t, db, room.ID, now.Add(-time.Minute))

	// Два экземпляра бэка в один тик.
	var wg sync.WaitGroup
	outcomes := make([]repo.ScheduledDrawOutcome, 2)
	for i := range outcomes {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			o, err := drawScheduled(r, room.ID, now)
			assert.NoError(t, err)
			outcomes[i] = o
		}(i)
	}
	wg.Wait()
	assert.ElementsMatch(t, []repo.ScheduledDrawOutcome{repo.ScheduledDrawDone, repo.ScheduledDrawSkipped}, outcomes)

	again, err := drawScheduled(r, room.ID, now.Add(time.Minute))
	require.NoError(t, err)
	assert.Equal(t, repo.ScheduledDrawSkipped, again, "разыгранную комнату не трогаем")
	for _, id := range ids {
		assert.EqualValues(t, 1, countNotes(t, db, id, entity.SantaNotifyDrawn), "одно «кому дарить»")
	}
}

func TestSantaRepo_DrawScheduledTooFew(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)
	room := seedRoom(t, r, uuid.New())
	owner := seedOwner(t, r, room, true)
	seedParticipants(t, r, room.ID, 1)
	seedUnready(t, r, room.ID, 2)
	setDrawAt(t, db, room.ID, now.Add(-time.Minute))

	outcome, err := drawScheduled(r, room.ID, now)
	require.NoError(t, err)
	assert.Equal(t, repo.ScheduledDrawTooFew, outcome)
	got, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Equal(t, entity.SantaRoomOpen, got.Status)
	assert.Nil(t, got.DrawAt, "время снято — планировщик не повторяет каждую минуту")
	require.NotNil(t, got.DrawFailedAt)
	assert.WithinDuration(t, now, *got.DrawFailedAt, time.Second)
	assert.EqualValues(t, 1, countNotes(t, db, owner, entity.SantaNotifyDrawFailed))
	_, err = r.GetAssignment(ctx, room.ID, owner)
	assert.ErrorIs(t, err, repo.ErrNotFound)

	again, err := drawScheduled(r, room.ID, now.Add(time.Minute))
	require.NoError(t, err)
	assert.Equal(t, repo.ScheduledDrawSkipped, again)
	assert.EqualValues(t, 1, countNotes(t, db, owner, entity.SantaNotifyDrawFailed), "предупреждение одно")
}

func TestSantaRepo_DrawScheduledTooFewOwnerUnready(t *testing.T) {
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)
	room := seedRoom(t, r, uuid.New())
	owner := seedOwner(t, r, room, false)
	seedParticipants(t, r, room.ID, 2)
	setDrawAt(t, db, room.ID, now.Add(-time.Minute))

	outcome, err := drawScheduled(r, room.ID, now)
	require.NoError(t, err)
	assert.Equal(t, repo.ScheduledDrawTooFew, outcome)
	assert.EqualValues(t, 0, countNotes(t, db, owner, entity.SantaNotifyDrawFailed), "без канала слать некуда — только плашка")
}

func TestSantaRepo_DrawScheduledNotDueYet(t *testing.T) {
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)
	room := seedRoom(t, r, uuid.New())
	seedParticipants(t, r, room.ID, 3)
	setDrawAt(t, db, room.ID, now.Add(time.Hour)) // организатор перенёс время

	outcome, err := drawScheduled(r, room.ID, now)
	require.NoError(t, err)
	assert.Equal(t, repo.ScheduledDrawSkipped, outcome)
}

func TestSantaRepo_DrawClearsDrawFailed(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)
	room := seedRoom(t, r, uuid.New())
	seedParticipants(t, r, room.ID, 3)
	require.NoError(t, db.Model(&persistent.SantaRoomModel{}).Where("id = ?", room.ID).Update("draw_failed_at", now).Error)

	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID), drawnNote(now)))
	got, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Nil(t, got.DrawFailedAt)
}

func TestSantaRepo_UpdateRoomWritesDrawFailed(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	now := time.Now().UTC().Truncate(time.Second)
	room := seedRoom(t, r, uuid.New())
	require.NoError(t, db.Model(&persistent.SantaRoomModel{}).Where("id = ?", room.ID).Update("draw_failed_at", now).Error)

	got, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	got.Title = "Новое"
	require.NoError(t, r.UpdateRoom(ctx, got))
	kept, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	assert.NotNil(t, kept.DrawFailedAt, "правка названия плашку не снимает")

	kept.DrawFailedAt = nil
	require.NoError(t, r.UpdateRoom(ctx, kept))
	cleared, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Nil(t, cleared.DrawFailedAt)
}
```

- [ ] **Step 5: Убедиться, что тесты падают**

Run: `go vet -tags integration ./internal/repo/persistent/`
Expected: FAIL — `r.DueDrawRooms undefined`, `r.DrawScheduled undefined`.

- [ ] **Step 6: Репозиторий**

`internal/repo/persistent/santa_postgres.go`:

1. В `UpdateRoom` в карту `Updates` добавить `"draw_failed_at": room.DrawFailedAt,`.
2. `Draw` заменить целиком и добавить хелперы и новые методы:

```go
func (r *santaRepo) Draw(ctx context.Context, roomID uuid.UUID, expected entity.SantaRoomStatus, build func([]uuid.UUID) ([]entity.SantaAssignment, error), note func(giverID uuid.UUID) entity.SantaNotification) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// FOR UPDATE: два одновременных нажатия «Жеребьёвка» выстраиваются в
		// очередь, и второе видит уже drawn.
		var room SantaRoomModel
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&room, "id = ?", roomID).Error; err != nil {
			return santaErr("santaRepo.Draw lock", err)
		}
		if room.Status != string(expected) {
			return repo.ErrStatusMismatch
		}
		ids, err := readyIDs(tx, roomID)
		if err != nil {
			return err
		}
		return drawLocked(tx, roomID, ids, build, note, time.Now())
	})
}

// readyIDs — готовые участники комнаты (канал подтверждён) в порядке вступления.
func readyIDs(tx *gorm.DB, roomID uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	if err := tx.Model(&SantaParticipantModel{}).
		Where("room_id = ?", roomID).
		Where(santaReadySQL).
		Order("created_at, id").
		Pluck("id", &ids).Error; err != nil {
		return nil, santaErr("santaRepo.readyIDs", err)
	}
	return ids, nil
}

// drawLocked — жеребьёвка под уже взятой блокировкой комнаты: стирает
// прошлые пары и несданные «кому дарить», пишет новый круг, кладёт
// уведомления и ставит drawn. Ошибка build откатывает транзакцию.
func drawLocked(tx *gorm.DB, roomID uuid.UUID, ids []uuid.UUID, build func([]uuid.UUID) ([]entity.SantaAssignment, error), note func(giverID uuid.UUID) entity.SantaNotification, now time.Time) error {
	if err := tx.Where("room_id = ?", roomID).Delete(&SantaAssignmentModel{}).Error; err != nil {
		return santaErr("santaRepo.Draw clear", err)
	}
	// Несданные «кому дарить» от прошлой жеребьёвки больше не правда.
	members := tx.Model(&SantaParticipantModel{}).Select("id").Where("room_id = ?", roomID)
	if err := tx.Where("status = ? AND kind = ? AND participant_id IN (?)",
		string(entity.SantaNotificationPending), string(entity.SantaNotifyDrawn), members).
		Delete(&SantaNotificationModel{}).Error; err != nil {
		return santaErr("santaRepo.Draw clear notes", err)
	}
	pairs, err := build(ids)
	if err != nil {
		return err
	}
	models := make([]SantaAssignmentModel, len(pairs))
	notes := make([]entity.SantaNotification, len(pairs))
	for i, p := range pairs {
		models[i] = SantaAssignmentModel{RoomID: p.RoomID, GiverID: p.GiverID, ReceiverID: p.ReceiverID}
		notes[i] = note(p.GiverID)
	}
	if len(models) > 0 {
		if err := tx.Create(&models).Error; err != nil {
			return santaErr("santaRepo.Draw insert", err)
		}
	}
	if err := insertNotifications(tx, notes...); err != nil {
		return err
	}
	if err := tx.Model(&SantaRoomModel{}).Where("id = ?", roomID).Updates(map[string]any{
		"status":         string(entity.SantaRoomDrawn),
		"drawn_at":       now,
		"draw_failed_at": nil,
		"updated_at":     now,
	}).Error; err != nil {
		return santaErr("santaRepo.Draw status", err)
	}
	return nil
}

func (r *santaRepo) DueDrawRooms(ctx context.Context, now time.Time, limit int) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	if err := r.db.WithContext(ctx).Model(&SantaRoomModel{}).
		Where("status = ? AND draw_at IS NOT NULL AND draw_at <= ?", string(entity.SantaRoomOpen), now).
		Order("draw_at, id").
		Limit(limit).
		Pluck("id", &ids).Error; err != nil {
		return nil, santaErr("santaRepo.DueDrawRooms", err)
	}
	return ids, nil
}

func (r *santaRepo) DrawScheduled(ctx context.Context, roomID uuid.UUID, now time.Time, minReady int, build func([]uuid.UUID) ([]entity.SantaAssignment, error), note func(giverID uuid.UUID) entity.SantaNotification, failNote func(organizerID uuid.UUID) entity.SantaNotification) (repo.ScheduledDrawOutcome, error) {
	outcome := repo.ScheduledDrawSkipped
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// SKIP LOCKED: комнату держит ручная жеребьёвка или второй экземпляр —
		// пропускаем; к следующему тику она уже не open. Условие повторяем под
		// блокировкой: время могли снять или перенести.
		var rooms []SantaRoomModel
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("id = ? AND status = ? AND draw_at IS NOT NULL AND draw_at <= ?", roomID, string(entity.SantaRoomOpen), now).
			Limit(1).
			Find(&rooms).Error; err != nil {
			return santaErr("santaRepo.DrawScheduled lock", err)
		}
		if len(rooms) == 0 {
			return nil
		}
		ids, err := readyIDs(tx, roomID)
		if err != nil {
			return err
		}
		if len(ids) < minReady {
			// Время снимаем, иначе планировщик пытался бы каждую минуту.
			if err := tx.Model(&SantaRoomModel{}).Where("id = ?", roomID).Updates(map[string]any{
				"draw_at":        nil,
				"draw_failed_at": now,
				"updated_at":     now,
			}).Error; err != nil {
				return santaErr("santaRepo.DrawScheduled fail", err)
			}
			outcome = repo.ScheduledDrawTooFew
			// У аккаунтов нет почты: написать организатору можно, только если
			// он сам участник с подтверждённым каналом.
			var owner []SantaParticipantModel
			if err := tx.Where("room_id = ? AND user_id = ?", roomID, rooms[0].OwnerID).
				Where(santaReadySQL).
				Limit(1).
				Find(&owner).Error; err != nil {
				return santaErr("santaRepo.DrawScheduled owner", err)
			}
			if len(owner) == 0 {
				return nil
			}
			return insertNotifications(tx, failNote(owner[0].ID))
		}
		if err := drawLocked(tx, roomID, ids, build, note, now); err != nil {
			return err
		}
		outcome = repo.ScheduledDrawDone
		return nil
	})
	if err != nil {
		return repo.ScheduledDrawSkipped, err
	}
	return outcome, nil
}
```

- [ ] **Step 7: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./internal/repo/persistent/ -run TestSantaRepo -count=1`
Expected: PASS, включая старые `TestSantaRepo_Draw*` и 8 новых.

- [ ] **Step 8: Commit**

```bash
git add internal/entity/santa.go internal/repo mock/repo
git commit -m "feat(backend): Санта — жеребьёвка по расписанию в репозитории"
```

---

### Task 6: Планировщик, уведомление `draw_failed` и сброс плашки

**Files:**
- Create: `BACK/internal/usecase/santa/scheduler.go`
- Create: `BACK/internal/usecase/santa/scheduler_test.go`
- Modify: `BACK/internal/usecase/santa/messages.go`, `messages_test.go`
- Modify: `BACK/internal/usecase/santa/notifier.go` (`compose`), `notifier_test.go`
- Modify: `BACK/internal/usecase/santa/santa.go` (`UpdateRoom`), `santa_test.go`
- Modify: `BACK/internal/app/app.go`

**Interfaces:**
- Consumes: `SantaRepo.DueDrawRooms`, `SantaRepo.DrawScheduled`, `repo.ScheduledDraw*`, `entity.SantaNotifyDrawFailed`, `SantaRoom.DrawFailedAt` (задача 5); `buildCycle`, `cryptoShuffle`, `minParticipants`, `shuffleFunc` (этап 1).
- Produces: `santa.NewScheduler(repo.SantaRepo) *Scheduler`, `(*Scheduler).Run(ctx, tick time.Duration)`, `(*Scheduler).RunOnce(ctx) (int, error)`, `scheduleBatch = 20`; `organizerLink(publicURL string, roomID uuid.UUID) string`; `drawFailedMessage(room entity.SantaRoom, link string) message`.

- [ ] **Step 1: Падающие тесты**

Создать `internal/usecase/santa/scheduler_test.go`:

```go
package santa

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/repo"
	mockrepo "main/mock/repo"
)

func newSchedulerEnv() (*Scheduler, *mockrepo.MockSantaRepo) {
	sr := new(mockrepo.MockSantaRepo)
	s := NewScheduler(sr)
	s.now = func() time.Time { return chNow }
	return s, sr
}

func TestScheduler_DrawsDueRooms(t *testing.T) {
	s, sr := newSchedulerEnv()
	a, b := uuid.New(), uuid.New()
	sr.On("DueDrawRooms", mock.Anything, chNow, scheduleBatch).Return([]uuid.UUID{a, b}, nil)
	sr.On("DrawScheduled", mock.Anything, a, chNow, minParticipants, mock.Anything, mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		build := args.Get(4).(func([]uuid.UUID) ([]entity.SantaAssignment, error))
		pairs, err := build([]uuid.UUID{uuid.New(), uuid.New(), uuid.New()})
		require.NoError(t, err)
		require.Len(t, pairs, 3)
		assert.Equal(t, a, pairs[0].RoomID, "пары своей комнаты, а не последней в цикле")
		drawn := args.Get(5).(func(uuid.UUID) entity.SantaNotification)(uuid.New())
		assert.Equal(t, entity.SantaNotifyDrawn, drawn.Kind)
		failed := args.Get(6).(func(uuid.UUID) entity.SantaNotification)(uuid.New())
		assert.Equal(t, entity.SantaNotifyDrawFailed, failed.Kind)
	}).Return(repo.ScheduledDrawDone, nil)
	sr.On("DrawScheduled", mock.Anything, b, chNow, minParticipants, mock.Anything, mock.Anything, mock.Anything).Return(repo.ScheduledDrawTooFew, nil)

	drawn, err := s.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 1, drawn)
	sr.AssertExpectations(t)
}

func TestScheduler_OneRoomErrorDoesNotStopOthers(t *testing.T) {
	s, sr := newSchedulerEnv()
	a, b := uuid.New(), uuid.New()
	sr.On("DueDrawRooms", mock.Anything, chNow, scheduleBatch).Return([]uuid.UUID{a, b}, nil)
	sr.On("DrawScheduled", mock.Anything, a, chNow, minParticipants, mock.Anything, mock.Anything, mock.Anything).Return(repo.ScheduledDrawSkipped, errors.New("deadlock"))
	sr.On("DrawScheduled", mock.Anything, b, chNow, minParticipants, mock.Anything, mock.Anything, mock.Anything).Return(repo.ScheduledDrawDone, nil)

	drawn, err := s.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 1, drawn)
}

func TestScheduler_DueError(t *testing.T) {
	s, sr := newSchedulerEnv()
	sr.On("DueDrawRooms", mock.Anything, chNow, scheduleBatch).Return(nil, errors.New("db down"))
	_, err := s.RunOnce(context.Background())
	assert.Error(t, err)
}
```

В конец `internal/usecase/santa/messages_test.go`:

```go
func TestDrawFailedMessage(t *testing.T) {
	room := entity.SantaRoom{ID: uuid.New(), Title: "<Офис>"}
	link := organizerLink("https://santa.prosto-namekni.ru/", room.ID)
	assert.Equal(t, "https://santa.prosto-namekni.ru/rooms/"+room.ID.String(), link)

	msg := drawFailedMessage(room, link)
	assert.Contains(t, msg.Subject, "не прошла")
	assert.Contains(t, msg.Text, link)
	assert.Contains(t, msg.Telegram, "&lt;Офис&gt;")
	assert.NotContains(t, msg.HTML, "<Офис>")
}
```

(добавить в импорт `messages_test.go` `"github.com/google/uuid"`, если его нет).

В конец `internal/usecase/santa/notifier_test.go`:

```go
func TestNotifier_DrawFailedLinksToOrganizerRoom(t *testing.T) {
	e := newNotifierEnv(t)
	note := entity.NewSantaNotification(e.giver.ID, entity.SantaNotifyDrawFailed, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("MarkNotificationSent", mock.Anything, note.ID).Return(nil)

	sent, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 1, sent)
	assert.Contains(t, e.ml.text, "https://santa.prosto-namekni.ru/rooms/"+e.room.ID.String())
}
```

В `internal/usecase/santa/santa_test.go` после `TestUpdateRoom_SavesFields`:

```go
func TestUpdateRoom_NewDrawAtClearsFailure(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	failed := time.Now().Add(-time.Hour)
	room.DrawFailedAt = &failed
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("UpdateRoom", mock.Anything, mock.MatchedBy(func(r entity.SantaRoom) bool {
		return r.DrawFailedAt == nil && r.DrawAt != nil
	})).Return(nil)

	at := time.Now().Add(24 * time.Hour)
	_, err := uc.UpdateRoom(ctx, owner, room.ID, usecase.SantaRoomInput{Title: "Офис", DrawAt: &at})

	require.NoError(t, err)
	sr.AssertExpectations(t)
}

func TestUpdateRoom_SameDrawAtKeepsFailure(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	failed := time.Now().Add(-time.Hour)
	room.DrawFailedAt = &failed
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("UpdateRoom", mock.Anything, mock.MatchedBy(func(r entity.SantaRoom) bool {
		return r.DrawFailedAt != nil && r.Title == "Новое"
	})).Return(nil)

	_, err := uc.UpdateRoom(ctx, owner, room.ID, usecase.SantaRoomInput{Title: "Новое"})

	require.NoError(t, err)
	sr.AssertExpectations(t)
}
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `go test ./internal/usecase/santa/ -run 'Scheduler|DrawFailed|UpdateRoom_' -v`
Expected: FAIL — нет `NewScheduler`, `organizerLink`, `drawFailedMessage`; `TestUpdateRoom_NewDrawAtClearsFailure` — мок не совпал.

- [ ] **Step 3: Планировщик**

Создать `internal/usecase/santa/scheduler.go`:

```go
package santa

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/repo"
)

// scheduleBatch — сколько созревших комнат разыгрывать за тик.
const scheduleBatch = 20

// Scheduler проводит жеребьёвки по draw_at. Несколько экземпляров бэка друг
// другу не мешают: репозиторий берёт комнату FOR UPDATE SKIP LOCKED и
// перепроверяет статус и время.
type Scheduler struct {
	santa   repo.SantaRepo
	shuffle shuffleFunc
	now     func() time.Time
}

func NewScheduler(santaRepo repo.SantaRepo) *Scheduler {
	return &Scheduler{santa: santaRepo, shuffle: cryptoShuffle, now: time.Now}
}

// Run крутит RunOnce каждые tick до отмены ctx.
func (s *Scheduler) Run(ctx context.Context, tick time.Duration) {
	t := time.NewTicker(tick)
	defer t.Stop()
	for {
		if _, err := s.RunOnce(ctx); err != nil && ctx.Err() == nil {
			log.Printf("santa scheduler: %v", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		}
	}
}

// RunOnce разыгрывает созревшие комнаты; сбой одной не мешает остальным.
// Возвращает, сколько комнат разыграно.
func (s *Scheduler) RunOnce(ctx context.Context) (int, error) {
	now := s.now()
	ids, err := s.santa.DueDrawRooms(ctx, now, scheduleBatch)
	if err != nil {
		return 0, err
	}
	drawn := 0
	for _, roomID := range ids {
		if ctx.Err() != nil {
			break
		}
		outcome, err := s.santa.DrawScheduled(ctx, roomID, now, minParticipants,
			func(ids []uuid.UUID) ([]entity.SantaAssignment, error) {
				return buildCycle(roomID, ids, s.shuffle)
			},
			func(giverID uuid.UUID) entity.SantaNotification {
				return entity.NewSantaNotification(giverID, entity.SantaNotifyDrawn, now)
			},
			func(organizerID uuid.UUID) entity.SantaNotification {
				return entity.NewSantaNotification(organizerID, entity.SantaNotifyDrawFailed, now)
			},
		)
		switch {
		case err != nil:
			log.Printf("santa scheduler: room %s: %v", roomID, err)
		case outcome == repo.ScheduledDrawDone:
			drawn++
		case outcome == repo.ScheduledDrawTooFew:
			log.Printf("santa scheduler: room %s: мало готовых участников, время жеребьёвки снято", roomID)
		}
	}
	return drawn, nil
}
```

- [ ] **Step 4: Текст и отправка `draw_failed`**

В `internal/usecase/santa/messages.go` добавить `"github.com/google/uuid"` в импорт, после `roomLink`:

```go
// organizerLink — комната в кабинете организатора на поддомене.
func organizerLink(publicURL string, roomID uuid.UUID) string {
	return strings.TrimRight(publicURL, "/") + "/rooms/" + roomID.String()
}
```

и после `wishesUpdatedMessage`:

```go
func drawFailedMessage(room entity.SantaRoom, link string) message {
	return compose(
		"Жеребьёвка не прошла — «"+room.Title+"»",
		emailView{
			Heading: "Жеребьёвка по расписанию не прошла",
			Lines: []string{
				"В комнате «" + room.Title + "» меньше трёх участников с подтверждённой почтой или Telegram.",
				"Попросите остальных подключить канал, а потом проведите жеребьёвку вручную или назначьте новое время.",
			},
			ButtonText: "Открыть комнату",
			URL:        link,
		},
		"⚠️ Жеребьёвка по расписанию в комнате <b>«"+telegram.Escape(room.Title)+"»</b> не прошла: меньше трёх участников с подтверждённой почтой или Telegram.\n\nПопросите остальных подключить канал, а потом проведите жеребьёвку вручную или назначьте новое время.",
	)
}
```

В `internal/usecase/santa/notifier.go`, в `compose` перед `case entity.SantaNotifyDrawn, entity.SantaNotifyWishesUpdated:`:

```go
	case entity.SantaNotifyDrawFailed:
		return drawFailedMessage(room, organizerLink(n.publicURL, room.ID)), nil
```

- [ ] **Step 5: Новое время снимает плашку**

`internal/usecase/santa/santa.go`, в `UpdateRoom` перед `room.Title = in.Title`:

```go
	if !sameTime(in.DrawAt, room.DrawAt) {
		// Новое время — новая попытка: плашка о прошлой неудаче больше не про неё.
		room.DrawFailedAt = nil
	}
```

- [ ] **Step 6: Запуск планировщика**

`internal/app/app.go`, после горутины обработчика очереди:

```go
	schedulerDone := make(chan struct{})
	go func() {
		defer close(schedulerDone)
		santaUC.NewScheduler(santaRepo).Run(notifyCtx, time.Minute)
	}()
```

и при остановке после `<-notifierDone`:

```go
	<-schedulerDone // жеребьёвка — одна транзакция; дождаться её коммита или отката
```

- [ ] **Step 7: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add internal/usecase/santa internal/app/app.go
git commit -m "feat(backend): Санта — планировщик жеребьёвки по draw_at и предупреждение организатору"
```

---

### Task 7: Чат — данные, репозиторий и `tg_message_id` в очереди

**Files:**
- Modify: `BACK/internal/entity/santa.go`
- Modify: `BACK/internal/repo/persistent/santa_models.go`
- Modify: `BACK/internal/repo/persistent/santa_postgres.go` (`drawLocked`)
- Modify: `BACK/internal/repo/persistent/santa_notify_postgres.go` (`MarkNotificationSent`)
- Create: `BACK/internal/repo/persistent/santa_chat_postgres.go`
- Modify: `BACK/internal/repo/contracts.go`
- Modify: `BACK/mock/repo/mock_santa_repo.go`
- Modify: `BACK/internal/repo/persistent/santa_integration_test.go` (`setupSantaDB`)
- Modify: `BACK/internal/repo/persistent/santa_notify_integration_test.go` (вызовы `MarkNotificationSent`)
- Create: `BACK/internal/repo/persistent/santa_chat_integration_test.go`
- Modify: `BACK/internal/usecase/santa/notifier.go` (`process`, `deliver`, `compose`), `notifier_test.go`
- Modify: `BACK/internal/app/app.go` (AutoMigrate)

**Interfaces:**
- Consumes: `drawLocked` (задача 5), `TelegramSender.SendMessage` → `(int64, error)` (задача 1).
- Produces: `entity.SantaNotifyChatMessage = "chat_message"`; `entity.SantaPayloadMessageID = "messageId"`; `entity.SantaNotification.TgMessageID *int64`; `entity.SantaMessage{ID, RoomID, GiverID, ReceiverID uuid.UUID; FromGiver bool; Body string; CreatedAt time.Time; ReadAt *time.Time}` с методами `AuthorID() uuid.UUID`, `RecipientID() uuid.UUID`; `persistent.SantaMessageModel`; методы `SantaRepo`: `CreateMessage(ctx, msg entity.SantaMessage, since time.Time, limit int, note entity.SantaNotification) error`, `GetMessage(ctx, id uuid.UUID) (entity.SantaMessage, error)`, `ListMessages(ctx, roomID, giverID, receiverID uuid.UUID, limit int) ([]entity.SantaMessage, error)`, `MarkMessagesRead(ctx, roomID, giverID, receiverID uuid.UUID, fromGiver bool, at time.Time) error`, `CountUnread(ctx, roomID, participantID uuid.UUID) (fromSanta, fromReceiver int, err error)`, `FindChatNotification(ctx, chatID, tgMessageID int64) (entity.SantaNotification, error)`; **изменение** `MarkNotificationSent(ctx, id uuid.UUID, tgMessageID *int64) error`; в `Notifier` — `deliver(ctx, note) (int64, error)`, `compose(ctx, note entity.SantaNotification, room, p) (message, error)`.

- [ ] **Step 1: Сущности**

`internal/entity/santa.go`:

В блок констант видов после `SantaNotifyDrawFailed`:

```go
	// SantaNotifyChatMessage — новое сообщение анонимного чата; id сообщения —
	// Payload[SantaPayloadMessageID].
	SantaNotifyChatMessage SantaNotificationKind = "chat_message"
```

Сразу после этого блока `const (…)`:

```go
// SantaPayloadMessageID — ключ id сообщения чата в Payload уведомления.
const SantaPayloadMessageID = "messageId"
```

В `SantaNotification` после `LastError string`:

```go
	// TgMessageID — message_id отправленного в Telegram: по нему бот узнаёт,
	// на какое сообщение чата ответили.
	TgMessageID *int64
```

В конец файла:

```go
// SantaMessage — сообщение анонимного чата пары «Санта → подопечный».
type SantaMessage struct {
	ID         uuid.UUID
	RoomID     uuid.UUID
	GiverID    uuid.UUID
	ReceiverID uuid.UUID
	// FromGiver — пишет Санта; иначе подопечный.
	FromGiver bool
	Body      string
	CreatedAt time.Time
	ReadAt    *time.Time
}

// AuthorID — кто написал.
func (m SantaMessage) AuthorID() uuid.UUID {
	if m.FromGiver {
		return m.GiverID
	}
	return m.ReceiverID
}

// RecipientID — кому написано.
func (m SantaMessage) RecipientID() uuid.UUID {
	if m.FromGiver {
		return m.ReceiverID
	}
	return m.GiverID
}
```

- [ ] **Step 2: Модели**

`internal/repo/persistent/santa_models.go`:

В `SantaRoomModel` к связям:

```go
	Messages     []SantaMessageModel     `gorm:"foreignKey:RoomID;constraint:OnDelete:CASCADE"`
```

В `SantaParticipantModel` к связям «ради внешних ключей»:

```go
	AsGiverMessages    []SantaMessageModel `gorm:"foreignKey:GiverID;constraint:OnDelete:CASCADE"`
	AsReceiverMessages []SantaMessageModel `gorm:"foreignKey:ReceiverID;constraint:OnDelete:CASCADE"`
```

В `SantaNotificationModel` после `LastError`:

```go
	TgMessageID *int64 `gorm:"index"`
```

В `toSantaNotificationModel` и `toSantaNotificationEntity` добавить `TgMessageID: n.TgMessageID` / `TgMessageID: m.TgMessageID`.

В конец файла:

```go
type SantaMessageModel struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	RoomID     uuid.UUID `gorm:"type:uuid;not null;index:idx_santa_message_pair,priority:1"`
	GiverID    uuid.UUID `gorm:"type:uuid;not null;index:idx_santa_message_pair,priority:2"`
	ReceiverID uuid.UUID `gorm:"type:uuid;not null;index:idx_santa_message_pair,priority:3"`
	FromGiver  bool      `gorm:"not null"`
	Body       string    `gorm:"type:text;not null"`
	// Ставит use case: от него же отсчитывается лимит сообщений в час.
	CreatedAt time.Time `gorm:"not null;index:idx_santa_message_pair,priority:4"`
	ReadAt    *time.Time
}

func (SantaMessageModel) TableName() string { return "santa_messages" }

func toSantaMessageModel(m entity.SantaMessage) SantaMessageModel {
	return SantaMessageModel{
		ID: m.ID, RoomID: m.RoomID, GiverID: m.GiverID, ReceiverID: m.ReceiverID,
		FromGiver: m.FromGiver, Body: m.Body, CreatedAt: m.CreatedAt, ReadAt: m.ReadAt,
	}
}

func toSantaMessageEntity(m SantaMessageModel) entity.SantaMessage {
	return entity.SantaMessage{
		ID: m.ID, RoomID: m.RoomID, GiverID: m.GiverID, ReceiverID: m.ReceiverID,
		FromGiver: m.FromGiver, Body: m.Body, CreatedAt: m.CreatedAt, ReadAt: m.ReadAt,
	}
}
```

Список `AutoMigrate`: в `internal/app/app.go` после `&persistent.SantaNotificationModel{}` добавить `&persistent.SantaMessageModel{},`; в `setupSantaDB` (`santa_integration_test.go`) — то же.

- [ ] **Step 3: Контракт и мок**

`internal/repo/contracts.go`, в `SantaRepo`:

`MarkNotificationSent` заменить:

```go
	// MarkNotificationSent/Failed меняют только pending-уведомление; уже
	// отмеченное или стёртое — ErrNotFound. tgMessageID — message_id в
	// Telegram (nil для почты).
	MarkNotificationSent(ctx context.Context, id uuid.UUID, tgMessageID *int64) error
```

В конец интерфейса:

```go
	// Анонимный чат пары «Санта → подопечный».
	// CreateMessage пишет сообщение и уведомление получателю одной транзакцией
	// под блокировкой комнаты (FOR SHARE): перезапуск жеребьёвки не проскочит
	// между проверкой пары и вставкой. Комната не drawn — ErrStatusMismatch;
	// такой пары нет — ErrNotFound; автор написал limit сообщений позже since —
	// ErrTooSoon.
	CreateMessage(ctx context.Context, msg entity.SantaMessage, since time.Time, limit int, note entity.SantaNotification) error
	GetMessage(ctx context.Context, id uuid.UUID) (entity.SantaMessage, error)
	// ListMessages — последние limit сообщений пары по возрастанию времени.
	ListMessages(ctx context.Context, roomID, giverID, receiverID uuid.UUID, limit int) ([]entity.SantaMessage, error)
	// MarkMessagesRead отмечает прочитанными непрочитанные сообщения пары,
	// написанные одной стороной: fromGiver — Сантой, иначе подопечным.
	MarkMessagesRead(ctx context.Context, roomID, giverID, receiverID uuid.UUID, fromGiver bool, at time.Time) error
	// CountUnread — непрочитанные участником: от его Санты и от его подопечного.
	CountUnread(ctx context.Context, roomID, participantID uuid.UUID) (fromSanta, fromReceiver int, err error)
	// FindChatNotification — уведомление chat_message, ушедшее в Telegram-чат
	// chatID сообщением tgMessageID; нет — ErrNotFound.
	FindChatNotification(ctx context.Context, chatID, tgMessageID int64) (entity.SantaNotification, error)
```

`mock/repo/mock_santa_repo.go` — `MarkNotificationSent` заменить и добавить в конец:

```go
func (m *MockSantaRepo) MarkNotificationSent(ctx context.Context, id uuid.UUID, tgMessageID *int64) error {
	return m.Called(ctx, id, tgMessageID).Error(0)
}
```

```go
func (m *MockSantaRepo) CreateMessage(ctx context.Context, msg entity.SantaMessage, since time.Time, limit int, note entity.SantaNotification) error {
	return m.Called(ctx, msg, since, limit, note).Error(0)
}

func (m *MockSantaRepo) GetMessage(ctx context.Context, id uuid.UUID) (entity.SantaMessage, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(entity.SantaMessage), args.Error(1)
}

func (m *MockSantaRepo) ListMessages(ctx context.Context, roomID, giverID, receiverID uuid.UUID, limit int) ([]entity.SantaMessage, error) {
	args := m.Called(ctx, roomID, giverID, receiverID, limit)
	msgs, _ := args.Get(0).([]entity.SantaMessage)
	return msgs, args.Error(1)
}

func (m *MockSantaRepo) MarkMessagesRead(ctx context.Context, roomID, giverID, receiverID uuid.UUID, fromGiver bool, at time.Time) error {
	return m.Called(ctx, roomID, giverID, receiverID, fromGiver, at).Error(0)
}

func (m *MockSantaRepo) CountUnread(ctx context.Context, roomID, participantID uuid.UUID) (int, int, error) {
	args := m.Called(ctx, roomID, participantID)
	return args.Int(0), args.Int(1), args.Error(2)
}

func (m *MockSantaRepo) FindChatNotification(ctx context.Context, chatID, tgMessageID int64) (entity.SantaNotification, error) {
	args := m.Called(ctx, chatID, tgMessageID)
	return args.Get(0).(entity.SantaNotification), args.Error(1)
}
```

- [ ] **Step 4: Падающие интеграционные тесты**

В `internal/repo/persistent/santa_notify_integration_test.go` пять вызовов `MarkNotificationSent` получают третий аргумент `nil`:

```go
	require.NoError(t, r.MarkNotificationSent(ctx, claimed[0].ID, nil))
	assert.ErrorIs(t, r.MarkNotificationSent(ctx, inFlight[0].ID, nil), repo.ErrNotFound)
	require.NoError(t, r.MarkNotificationSent(ctx, batch[0].ID, nil))
	assert.ErrorIs(t, r.MarkNotificationSent(ctx, batch[2].ID, nil), repo.ErrNotFound)
	assert.ErrorIs(t, r.MarkNotificationSent(ctx, uuid.New(), nil), repo.ErrNotFound)
```

Создать `internal/repo/persistent/santa_chat_integration_test.go`:

```go
//go:build integration

package persistent_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/repo/persistent"
)

// drawnRoom — разыгранная комната из трёх по кругу circle: ids[0]→ids[1]→ids[2]→ids[0].
func drawnRoom(t *testing.T, r repo.SantaRepo) (entity.SantaRoom, []uuid.UUID) {
	t.Helper()
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	require.NoError(t, r.Draw(context.Background(), room.ID, entity.SantaRoomOpen, circle(room.ID), drawnNote(time.Now())))
	return room, ids
}

func chatMsg(roomID, giver, receiver uuid.UUID, fromGiver bool, body string, at time.Time) entity.SantaMessage {
	return entity.SantaMessage{ID: uuid.New(), RoomID: roomID, GiverID: giver, ReceiverID: receiver, FromGiver: fromGiver, Body: body, CreatedAt: at}
}

func chatNote(m entity.SantaMessage) entity.SantaNotification {
	n := entity.NewSantaNotification(m.RecipientID(), entity.SantaNotifyChatMessage, m.CreatedAt)
	n.Payload[entity.SantaPayloadMessageID] = m.ID.String()
	return n
}

func post(t *testing.T, r repo.SantaRepo, m entity.SantaMessage) {
	t.Helper()
	require.NoError(t, r.CreateMessage(context.Background(), m, m.CreatedAt.Add(-time.Hour), 30, chatNote(m)))
}

func TestSantaRepo_CreateAndListMessages(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room, ids := drawnRoom(t, r)
	now := time.Now().UTC().Truncate(time.Second)

	first := chatMsg(room.ID, ids[0], ids[1], true, "Какой размер?", now)
	second := chatMsg(room.ID, ids[0], ids[1], false, "M", now.Add(time.Second))
	third := chatMsg(room.ID, ids[0], ids[1], true, "Понял", now.Add(2*time.Second))
	for _, m := range []entity.SantaMessage{first, second, third} {
		post(t, r, m)
	}

	all, err := r.ListMessages(ctx, room.ID, ids[0], ids[1], 10)
	require.NoError(t, err)
	require.Len(t, all, 3)
	assert.Equal(t, []string{"Какой размер?", "M", "Понял"}, []string{all[0].Body, all[1].Body, all[2].Body})
	last, err := r.ListMessages(ctx, room.ID, ids[0], ids[1], 2)
	require.NoError(t, err)
	assert.Equal(t, []uuid.UUID{second.ID, third.ID}, []uuid.UUID{last[0].ID, last[1].ID}, "последние два, по возрастанию")

	got, err := r.GetMessage(ctx, second.ID)
	require.NoError(t, err)
	assert.False(t, got.FromGiver)
	assert.EqualValues(t, 2, countNotes(t, db, ids[1], entity.SantaNotifyChatMessage), "подопечному — два от Санты")
	assert.EqualValues(t, 1, countNotes(t, db, ids[0], entity.SantaNotifyChatMessage))
}

func TestSantaRepo_CreateMessageNeedsPairAndDrawnRoom(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room, ids := drawnRoom(t, r)
	now := time.Now().UTC()

	wrong := chatMsg(room.ID, ids[0], ids[2], true, "Привет", now) // ids[0] дарит ids[1]
	assert.ErrorIs(t, r.CreateMessage(ctx, wrong, now.Add(-time.Hour), 30, chatNote(wrong)), repo.ErrNotFound)

	open := seedRoom(t, r, uuid.New())
	pids := seedParticipants(t, r, open.ID, 2)
	early := chatMsg(open.ID, pids[0], pids[1], true, "Привет", now)
	assert.ErrorIs(t, r.CreateMessage(ctx, early, now.Add(-time.Hour), 30, chatNote(early)), repo.ErrStatusMismatch)
}

func TestSantaRepo_CreateMessageLimit(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room, ids := drawnRoom(t, r)
	now := time.Now().UTC().Truncate(time.Second)

	// ids[1] пишет и как подопечный (своему Санте ids[0]), и как Санта (ids[2]) —
	// лимит общий.
	asWard := chatMsg(room.ID, ids[0], ids[1], false, "раз", now)
	asSanta := chatMsg(room.ID, ids[1], ids[2], true, "два", now.Add(time.Second))
	require.NoError(t, r.CreateMessage(ctx, asWard, now.Add(-time.Hour), 2, chatNote(asWard)))
	require.NoError(t, r.CreateMessage(ctx, asSanta, now.Add(-time.Hour), 2, chatNote(asSanta)))

	third := chatMsg(room.ID, ids[1], ids[2], true, "три", now.Add(2*time.Second))
	assert.ErrorIs(t, r.CreateMessage(ctx, third, now.Add(-time.Hour), 2, chatNote(third)), repo.ErrTooSoon)
	assert.NoError(t, r.CreateMessage(ctx, third, now.Add(time.Second), 2, chatNote(third)), "старые вышли из окна")

	other := chatMsg(room.ID, ids[0], ids[1], true, "чужой лимит не мой", now.Add(3*time.Second))
	assert.NoError(t, r.CreateMessage(ctx, other, now.Add(-time.Hour), 2, chatNote(other)))
}

func TestSantaRepo_UnreadAndMarkRead(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room, ids := drawnRoom(t, r)
	now := time.Now().UTC().Truncate(time.Second)
	post(t, r, chatMsg(room.ID, ids[0], ids[1], true, "1", now))
	post(t, r, chatMsg(room.ID, ids[0], ids[1], true, "2", now.Add(time.Second)))
	post(t, r, chatMsg(room.ID, ids[0], ids[1], false, "3", now.Add(2*time.Second)))

	fromSanta, fromReceiver, err := r.CountUnread(ctx, room.ID, ids[1])
	require.NoError(t, err)
	assert.Equal(t, 2, fromSanta, "ids[1] получил два от своего Санты ids[0]")
	assert.Equal(t, 0, fromReceiver)
	fromSanta, fromReceiver, err = r.CountUnread(ctx, room.ID, ids[0])
	require.NoError(t, err)
	assert.Equal(t, 0, fromSanta)
	assert.Equal(t, 1, fromReceiver, "ids[0] получил один от подопечного ids[1]")

	require.NoError(t, r.MarkMessagesRead(ctx, room.ID, ids[0], ids[1], true, now.Add(time.Minute)))
	fromSanta, _, err = r.CountUnread(ctx, room.ID, ids[1])
	require.NoError(t, err)
	assert.Equal(t, 0, fromSanta)
	_, fromReceiver, err = r.CountUnread(ctx, room.ID, ids[0])
	require.NoError(t, err)
	assert.Equal(t, 1, fromReceiver, "чужие входящие не тронуты")
}

func TestSantaRepo_RedrawClearsMessages(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room, ids := drawnRoom(t, r)
	now := time.Now().UTC().Truncate(time.Second)
	msg := chatMsg(room.ID, ids[0], ids[1], true, "Привет", now)
	post(t, r, msg)

	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomDrawn, circle(room.ID), drawnNote(now)))

	_, err := r.GetMessage(ctx, msg.ID)
	assert.ErrorIs(t, err, repo.ErrNotFound, "переписка старой пары стёрта")
	assert.EqualValues(t, 0, countNotes(t, db, ids[1], entity.SantaNotifyChatMessage), "несданное уведомление о ней тоже")
}

func TestSantaRepo_FindChatNotification(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room, ids := drawnRoom(t, r)
	now := time.Now().UTC().Truncate(time.Second)
	msg := chatMsg(room.ID, ids[0], ids[1], true, "Привет", now)
	post(t, r, msg)
	claimed, err := r.ClaimNotifications(ctx, now.Add(time.Second), 10, time.Minute)
	require.NoError(t, err)
	var note entity.SantaNotification
	for _, n := range claimed {
		if n.Kind == entity.SantaNotifyChatMessage {
			note = n
		}
	}
	require.Equal(t, ids[1], note.ParticipantID)
	tgID := int64(555)
	require.NoError(t, r.MarkNotificationSent(ctx, note.ID, &tgID))

	ward, err := r.GetParticipant(ctx, ids[1])
	require.NoError(t, err)
	found, err := r.FindChatNotification(ctx, *ward.TgChatID, 555)
	require.NoError(t, err)
	assert.Equal(t, note.ID, found.ID)
	assert.Equal(t, msg.ID.String(), found.Payload[entity.SantaPayloadMessageID])

	_, err = r.FindChatNotification(ctx, *ward.TgChatID+1, 555)
	assert.ErrorIs(t, err, repo.ErrNotFound, "message_id уникален только внутри чата")
	_, err = r.FindChatNotification(ctx, *ward.TgChatID, 556)
	assert.ErrorIs(t, err, repo.ErrNotFound)
}
```

- [ ] **Step 5: Падающие тесты обработчика**

В `internal/usecase/santa/notifier_test.go` у всех ожиданий `MarkNotificationSent` появляется третий аргумент:

Run: `sed -i 's/"MarkNotificationSent", mock.Anything, \([A-Za-z.]*ID\))/"MarkNotificationSent", mock.Anything, \1, mock.Anything)/g' internal/usecase/santa/notifier_test.go`

Проверить: `grep -n '"MarkNotificationSent"' internal/usecase/santa/notifier_test.go` — у каждой строки после `.ID` стоит `, mock.Anything)`.

В конец файла:

```go
func TestNotifier_StoresTelegramMessageID(t *testing.T) {
	e := newNotifierEnv(t)
	e.tg.msgID = 777
	note := entity.NewSantaNotification(e.ward.ID, entity.SantaNotifyWelcome, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("MarkNotificationSent", mock.Anything, note.ID, mock.MatchedBy(func(id *int64) bool { return id != nil && *id == 777 })).Return(nil)

	sent, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 1, sent)
	// AssertExpectations не годится: giver из newNotifierEnv здесь не запрашивается.
	e.sr.AssertNumberOfCalls(t, "MarkNotificationSent", 1)
}

func TestNotifier_EmailHasNoTelegramMessageID(t *testing.T) {
	e := newNotifierEnv(t)
	note := entity.NewSantaNotification(e.giver.ID, entity.SantaNotifyWelcome, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("MarkNotificationSent", mock.Anything, note.ID, (*int64)(nil)).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	e.sr.AssertCalled(t, "MarkNotificationSent", mock.Anything, note.ID, (*int64)(nil))
}
```

- [ ] **Step 6: Убедиться, что тесты падают**

Run: `go vet -tags integration ./internal/repo/persistent/ && go test ./internal/usecase/santa/ -run Notifier`
Expected: FAIL — нет `SantaMessageModel`, `CreateMessage` и т. д.; `MarkNotificationSent` вызывается с двумя аргументами.

- [ ] **Step 7: Репозиторий**

`internal/repo/persistent/santa_postgres.go`, в `drawLocked` очистку несданных `drawn` заменить на:

```go
	// Несданные «кому дарить» прошлой жеребьёвки больше не правда, а «новое
	// сообщение» — про переписку, которой сейчас не станет.
	members := tx.Model(&SantaParticipantModel{}).Select("id").Where("room_id = ?", roomID)
	if err := tx.Where("status = ? AND kind IN ? AND participant_id IN (?)",
		string(entity.SantaNotificationPending),
		[]string{string(entity.SantaNotifyDrawn), string(entity.SantaNotifyChatMessage)}, members).
		Delete(&SantaNotificationModel{}).Error; err != nil {
		return santaErr("santaRepo.Draw clear notes", err)
	}
	// Переписка привязана к паре: у новых пар старые сообщения всплыть не должны.
	if err := tx.Where("room_id = ?", roomID).Delete(&SantaMessageModel{}).Error; err != nil {
		return santaErr("santaRepo.Draw clear messages", err)
	}
```

`internal/repo/persistent/santa_notify_postgres.go` — `MarkNotificationSent`:

```go
func (r *santaRepo) MarkNotificationSent(ctx context.Context, id uuid.UUID, tgMessageID *int64) error {
	return r.markPending(ctx, "santaRepo.MarkNotificationSent", id, map[string]any{
		"status":        string(entity.SantaNotificationSent),
		"last_error":    "",
		"tg_message_id": tgMessageID,
	})
}
```

Создать `internal/repo/persistent/santa_chat_postgres.go`:

```go
package persistent

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"main/internal/entity"
	"main/internal/repo"
)

// authoredSQL — сообщения, написанные участником (оба ? — его id): как Сантой
// своему подопечному и как подопечным своему Санте.
const authoredSQL = "((giver_id = ? AND from_giver) OR (receiver_id = ? AND NOT from_giver))"

func (r *santaRepo) CreateMessage(ctx context.Context, msg entity.SantaMessage, since time.Time, limit int, note entity.SantaNotification) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// FOR SHARE против FOR UPDATE жеребьёвки: перезапуск ждёт вставку
		// (и сотрёт сообщение вместе с остальными) или вставка видит новые пары.
		var room SantaRoomModel
		if err := tx.Clauses(clause.Locking{Strength: "SHARE"}).First(&room, "id = ?", msg.RoomID).Error; err != nil {
			return santaErr("santaRepo.CreateMessage lock", err)
		}
		if room.Status != string(entity.SantaRoomDrawn) {
			return repo.ErrStatusMismatch
		}
		var pairs int64
		if err := tx.Model(&SantaAssignmentModel{}).
			Where("room_id = ? AND giver_id = ? AND receiver_id = ?", msg.RoomID, msg.GiverID, msg.ReceiverID).
			Count(&pairs).Error; err != nil {
			return santaErr("santaRepo.CreateMessage pair", err)
		}
		if pairs == 0 {
			return fmt.Errorf("santaRepo.CreateMessage: %w", repo.ErrNotFound)
		}
		// Два одновременных сообщения могут проскочить лимит на одно — не страшно.
		author := msg.AuthorID()
		var sent int64
		if err := tx.Model(&SantaMessageModel{}).
			Where("created_at > ?", since).
			Where(authoredSQL, author, author).
			Count(&sent).Error; err != nil {
			return santaErr("santaRepo.CreateMessage limit", err)
		}
		if sent >= int64(limit) {
			return repo.ErrTooSoon
		}
		m := toSantaMessageModel(msg)
		if err := tx.Create(&m).Error; err != nil {
			return santaErr("santaRepo.CreateMessage", err)
		}
		return insertNotifications(tx, note)
	})
}

func (r *santaRepo) GetMessage(ctx context.Context, id uuid.UUID) (entity.SantaMessage, error) {
	var m SantaMessageModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return entity.SantaMessage{}, santaErr("santaRepo.GetMessage", err)
	}
	return toSantaMessageEntity(m), nil
}

func (r *santaRepo) ListMessages(ctx context.Context, roomID, giverID, receiverID uuid.UUID, limit int) ([]entity.SantaMessage, error) {
	var models []SantaMessageModel
	// Последние limit: берём с конца и разворачиваем.
	if err := r.db.WithContext(ctx).
		Where("room_id = ? AND giver_id = ? AND receiver_id = ?", roomID, giverID, receiverID).
		Order("created_at DESC, id DESC").
		Limit(limit).
		Find(&models).Error; err != nil {
		return nil, santaErr("santaRepo.ListMessages", err)
	}
	out := make([]entity.SantaMessage, len(models))
	for i, m := range models {
		out[len(models)-1-i] = toSantaMessageEntity(m)
	}
	return out, nil
}

func (r *santaRepo) MarkMessagesRead(ctx context.Context, roomID, giverID, receiverID uuid.UUID, fromGiver bool, at time.Time) error {
	if err := r.db.WithContext(ctx).Model(&SantaMessageModel{}).
		Where("room_id = ? AND giver_id = ? AND receiver_id = ? AND from_giver = ? AND read_at IS NULL",
			roomID, giverID, receiverID, fromGiver).
		Update("read_at", at).Error; err != nil {
		return santaErr("santaRepo.MarkMessagesRead", err)
	}
	return nil
}

func (r *santaRepo) CountUnread(ctx context.Context, roomID, participantID uuid.UUID) (int, int, error) {
	var row struct {
		FromSanta    int
		FromReceiver int
	}
	if err := r.db.WithContext(ctx).Model(&SantaMessageModel{}).
		Select("COUNT(*) FILTER (WHERE receiver_id = ? AND from_giver) AS from_santa, "+
			"COUNT(*) FILTER (WHERE giver_id = ? AND NOT from_giver) AS from_receiver", participantID, participantID).
		Where("room_id = ? AND read_at IS NULL", roomID).
		Scan(&row).Error; err != nil {
		return 0, 0, santaErr("santaRepo.CountUnread", err)
	}
	return row.FromSanta, row.FromReceiver, nil
}

func (r *santaRepo) FindChatNotification(ctx context.Context, chatID, tgMessageID int64) (entity.SantaNotification, error) {
	var m SantaNotificationModel
	// message_id уникален только внутри чата — сверяем и чат получателя.
	if err := r.db.WithContext(ctx).
		Select("santa_notifications.*").
		Joins("JOIN santa_participants p ON p.id = santa_notifications.participant_id").
		Where("santa_notifications.kind = ? AND santa_notifications.tg_message_id = ? AND p.tg_chat_id = ?",
			string(entity.SantaNotifyChatMessage), tgMessageID, chatID).
		Order("santa_notifications.created_at DESC").
		Take(&m).Error; err != nil {
		return entity.SantaNotification{}, santaErr("santaRepo.FindChatNotification", err)
	}
	return toSantaNotificationEntity(m), nil
}
```

- [ ] **Step 8: Обработчик — `message_id` в отметку**

В `internal/usecase/santa/notifier.go` `process`, `deliver` и `compose` заменить целиком:

```go
// process отправляет одно уведомление и отмечает итог; true — отправлено.
func (n *Notifier) process(ctx context.Context, note entity.SantaNotification) bool {
	sendCtx, cancelSend := context.WithTimeout(ctx, notifySendTimeout)
	tgMessageID, err := n.deliver(sendCtx, note)
	cancelSend()

	// Отметку пишем и после отмены ctx при остановке: принятое сервером
	// письмо, оставшись pending, ушло бы повторно.
	markCtx, cancelMark := context.WithTimeout(context.WithoutCancel(ctx), notifyMarkTimeout)
	defer cancelMark()
	if err == nil {
		// message_id храним: по нему бот узнаёт ответ (reply) на сообщение чата.
		var tgID *int64
		if tgMessageID != 0 {
			tgID = &tgMessageID
		}
		n.logMark("sent", note, n.santa.MarkNotificationSent(markCtx, note.ID, tgID))
		return true
	}
	attempts := note.Attempts + 1
	var retryAt *time.Time
	if !errors.Is(err, errPermanent) && attempts < maxNotifyAttempts {
		at := n.now().Add(retryDelays[attempts-1])
		retryAt = &at
	}
	n.logMark("failed", note, n.santa.MarkNotificationFailed(markCtx, note.ID, attempts, retryAt, err.Error()))
	return false
}
```

```go
// deliver отправляет уведомление; для Telegram возвращает message_id.
func (n *Notifier) deliver(ctx context.Context, note entity.SantaNotification) (int64, error) {
	p, err := n.santa.GetParticipant(ctx, note.ParticipantID)
	if errors.Is(err, repo.ErrNotFound) {
		return 0, fmt.Errorf("%w: участника нет", errPermanent)
	}
	if err != nil {
		return 0, err
	}
	if !p.Ready() {
		return 0, fmt.Errorf("%w: канал не подтверждён", errPermanent)
	}
	room, err := n.santa.GetRoomByID(ctx, p.RoomID)
	if errors.Is(err, repo.ErrNotFound) {
		return 0, fmt.Errorf("%w: комнаты нет", errPermanent)
	}
	if err != nil {
		return 0, err
	}
	msg, err := n.compose(ctx, note, room, p)
	if err != nil {
		return 0, err
	}
	switch p.Channel {
	case entity.SantaChannelEmail:
		if n.mailer == nil {
			// Не errPermanent: SMTP могут настроить и перезапустить сервис,
			// пока идут повторы, — тогда письмо всё-таки уйдёт.
			return 0, errors.New("почта не настроена (SMTP_HOST)")
		}
		return 0, n.mailer.Send(ctx, p.Email, msg.Subject, msg.HTML, msg.Text)
	case entity.SantaChannelTelegram:
		if n.tg == nil {
			return 0, errors.New("бот не настроен (SANTA_BOT_TOKEN/BOT_TOKEN)")
		}
		id, err := n.tg.SendMessage(ctx, *p.TgChatID, msg.Telegram, []telegram.Button{{Text: msg.ButtonText, URL: msg.URL}})
		if errors.Is(err, telegram.ErrPermanent) {
			// Бот заблокирован или чата нет — повтор через минуту ничего не изменит.
			return 0, fmt.Errorf("%w: %v", errPermanent, err)
		}
		return id, err
	}
	return 0, fmt.Errorf("%w: нет канала", errPermanent)
}

func (n *Notifier) compose(ctx context.Context, note entity.SantaNotification, room entity.SantaRoom, p entity.SantaParticipant) (message, error) {
	link := roomLink(n.publicURL, room.Slug)
	switch note.Kind {
	case entity.SantaNotifyWelcome:
		return welcomeMessage(room, link), nil
	case entity.SantaNotifyReminderFill:
		return reminderMessage(room, link), nil
	case entity.SantaNotifyDrawFailed:
		return drawFailedMessage(room, organizerLink(n.publicURL, room.ID)), nil
	case entity.SantaNotifyDrawn, entity.SantaNotifyWishesUpdated:
		a, err := n.santa.GetAssignment(ctx, room.ID, p.ID)
		if errors.Is(err, repo.ErrNotFound) {
			return message{}, fmt.Errorf("%w: пары нет", errPermanent)
		}
		if err != nil {
			return message{}, err
		}
		ward, err := n.santa.GetParticipant(ctx, a.ReceiverID)
		if errors.Is(err, repo.ErrNotFound) {
			return message{}, fmt.Errorf("%w: подопечного нет", errPermanent)
		}
		if err != nil {
			return message{}, err
		}
		if note.Kind == entity.SantaNotifyDrawn {
			return drawnMessage(room, ward, link), nil
		}
		return wishesUpdatedMessage(room, ward, link), nil
	}
	return message{}, fmt.Errorf("%w: неизвестный вид %q", errPermanent, note.Kind)
}
```

- [ ] **Step 9: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./internal/repo/persistent/ -run TestSantaRepo -count=1`
Expected: PASS, включая 6 новых `TestSantaRepo_*Message*`/`Unread`/`FindChatNotification`.

- [ ] **Step 10: Commit**

```bash
git add internal/entity/santa.go internal/repo mock/repo internal/usecase/santa/notifier.go internal/usecase/santa/notifier_test.go internal/app/app.go
git commit -m "feat(backend): Санта — сообщения анонимного чата и message_id Telegram в очереди"
```

---

### Task 8: Чат — use case, уведомления и ответ из Telegram

**Files:**
- Modify: `BACK/internal/usecase/contracts.go`
- Create: `BACK/internal/usecase/santa/chat.go`
- Create: `BACK/internal/usecase/santa/chat_test.go`
- Modify: `BACK/internal/usecase/santa/participant.go` (`me`), `participant_test.go`
- Modify: `BACK/internal/usecase/santa/messages.go`, `messages_test.go`
- Modify: `BACK/internal/usecase/santa/notifier.go` (`compose`), `notifier_test.go`
- Modify: `BACK/internal/controller/restapi/v1/santa_test.go` (методы `MockSantaUC`)

**Interfaces:**
- Consumes: всё из задачи 7; `participantBySlug`, `invalid`, `tgReply` (этап 2).
- Produces: `usecase.ErrSantaNotInDraw`, `usecase.ErrSantaChatLimit`; `usecase.SantaChatWith` (`SantaChatReceiver = "receiver"`, `SantaChatSanta = "santa"`); `usecase.SantaChatMessage{ID uuid.UUID; Mine bool; Body string; CreatedAt time.Time}`; `usecase.SantaChat{With SantaChatWith; Messages []SantaChatMessage}`; `usecase.SantaChatUnread{FromSanta, FromReceiver int}`; `usecase.SantaMe.Chat *SantaChatUnread`; методы `SantaUseCase`: `GetChat(ctx, slug string, auth SantaAuth, with SantaChatWith) (SantaChat, error)`, `SendChat(ctx, slug string, auth SantaAuth, with SantaChatWith, body string) (SantaChatMessage, error)`, `TelegramReply(ctx, chatID, replyToMessageID int64, text string) error`; константы `maxChatBody = 1000`, `chatPerHour = 30`, `chatHistory = 200`.

- [ ] **Step 1: Контракты use case**

`internal/usecase/contracts.go`, в блок ошибок Санты:

```go
	// ErrSantaNotInDraw — у участника нет пары: он не попал в жеребьёвку
	// или пару сменил перезапуск (409).
	ErrSantaNotInDraw = errors.New("вы не попали в эту жеребьёвку")
	// ErrSantaChatLimit — участник написал 30 сообщений за час (429).
	ErrSantaChatLimit = errors.New("не больше 30 сообщений в час — продолжите чуть позже")
```

После `SantaRemindResult`:

```go
// SantaChatWith — с кем переписка: со своим подопечным или со своим Сантой.
type SantaChatWith string

const (
	SantaChatReceiver SantaChatWith = "receiver"
	SantaChatSanta    SantaChatWith = "santa"
)

// SantaChatMessage — сообщение глазами участника: без имён и id сторон, чтобы
// подопечный не узнал Санту.
type SantaChatMessage struct {
	ID        uuid.UUID `json:"id"`
	Mine      bool      `json:"mine"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

type SantaChat struct {
	With     SantaChatWith      `json:"with"`
	Messages []SantaChatMessage `json:"messages"`
}

// SantaChatUnread — непрочитанные: от своего Санты и от своего подопечного.
type SantaChatUnread struct {
	FromSanta    int `json:"fromSanta"`
	FromReceiver int `json:"fromReceiver"`
}
```

В `SantaMe` после `Receiver`:

```go
	// Chat — непрочитанные в чате; nil, пока у участника нет пары.
	Chat *SantaChatUnread `json:"chat"`
```

В интерфейс `SantaUseCase` после `TelegramStart`:

```go
	// GetChat — переписка с подопечным (receiver) или со своим Сантой (santa),
	// последние 200 сообщений; входящие отмечаются прочитанными. До
	// жеребьёвки — ErrSantaNotDrawn, без пары — ErrSantaNotInDraw.
	GetChat(ctx context.Context, slug string, auth SantaAuth, with SantaChatWith) (SantaChat, error)
	// SendChat — сообщение (1..1000 символов) и уведомление получателю; больше
	// 30 в час — ErrSantaChatLimit.
	SendChat(ctx context.Context, slug string, auth SantaAuth, with SantaChatWith, body string) (SantaChatMessage, error)
	// TelegramReply — ответ в боте (reply) на уведомление о сообщении чата.
	// Итог участнику сообщает сам бот; ошибка — только сбой базы.
	TelegramReply(ctx context.Context, chatID, replyToMessageID int64, text string) error
```

В `internal/controller/restapi/v1/santa_test.go` после метода `TelegramStart` у `MockSantaUC`:

```go
func (m *MockSantaUC) GetChat(ctx context.Context, slug string, auth usecase.SantaAuth, with usecase.SantaChatWith) (usecase.SantaChat, error) {
	args := m.Called(ctx, slug, auth, with)
	return args.Get(0).(usecase.SantaChat), args.Error(1)
}
func (m *MockSantaUC) SendChat(ctx context.Context, slug string, auth usecase.SantaAuth, with usecase.SantaChatWith, body string) (usecase.SantaChatMessage, error) {
	args := m.Called(ctx, slug, auth, with, body)
	return args.Get(0).(usecase.SantaChatMessage), args.Error(1)
}
func (m *MockSantaUC) TelegramReply(ctx context.Context, chatID, replyToMessageID int64, text string) error {
	return m.Called(ctx, chatID, replyToMessageID, text).Error(0)
}
```

- [ ] **Step 2: Падающие тесты use case**

Создать `internal/usecase/santa/chat_test.go`:

```go
package santa

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
	mockrepo "main/mock/repo"
)

type chatEnv struct {
	uc        *santaUseCase
	sr        *mockrepo.MockSantaRepo
	tg        *fakeTG
	room      entity.SantaRoom
	p         entity.SantaParticipant
	toWard    entity.SantaAssignment // p дарит
	fromSanta entity.SantaAssignment // p получает
}

// newChatEnv — разыгранная комната «abcdefgh», участник p по токену «tok».
// Пары (GetAssignment/GetGiver) каждый тест задаёт сам.
func newChatEnv(t *testing.T) chatEnv {
	t.Helper()
	sr := new(mockrepo.MockSantaRepo)
	tg := &fakeTG{}
	uc := New(sr, new(mockrepo.MockUserRepo), WithTelegram(tg, "santa_namekni_bot")).(*santaUseCase)
	uc.now = func() time.Time { return chNow }
	room := entity.SantaRoom{ID: uuid.New(), Slug: "abcdefgh", Title: "Офис", Status: entity.SantaRoomDrawn}
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Аня", TokenHash: hashToken("tok")}
	sr.On("GetRoomBySlug", mock.Anything, "abcdefgh").Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, hashToken("tok")).Return(p, nil)
	return chatEnv{
		uc: uc, sr: sr, tg: tg, room: room, p: p,
		toWard:    entity.SantaAssignment{RoomID: room.ID, GiverID: p.ID, ReceiverID: uuid.New()},
		fromSanta: entity.SantaAssignment{RoomID: room.ID, GiverID: uuid.New(), ReceiverID: p.ID},
	}
}

func (e chatEnv) withPairs() chatEnv {
	e.sr.On("GetAssignment", mock.Anything, e.room.ID, e.p.ID).Return(e.toWard, nil)
	e.sr.On("GetGiver", mock.Anything, e.room.ID, e.p.ID).Return(e.fromSanta, nil)
	return e
}

func TestGetChat_ReceiverThread(t *testing.T) {
	e := newChatEnv(t).withPairs()
	ward := e.toWard.ReceiverID
	e.sr.On("ListMessages", mock.Anything, e.room.ID, e.p.ID, ward, chatHistory).Return([]entity.SantaMessage{
		{ID: uuid.New(), GiverID: e.p.ID, ReceiverID: ward, FromGiver: true, Body: "Какой размер?", CreatedAt: chNow},
		{ID: uuid.New(), GiverID: e.p.ID, ReceiverID: ward, FromGiver: false, Body: "M", CreatedAt: chNow},
	}, nil)
	e.sr.On("MarkMessagesRead", mock.Anything, e.room.ID, e.p.ID, ward, false, chNow).Return(nil)

	chat, err := e.uc.GetChat(context.Background(), "abcdefgh", tokAuth, usecase.SantaChatReceiver)
	require.NoError(t, err)
	assert.Equal(t, usecase.SantaChatReceiver, chat.With)
	require.Len(t, chat.Messages, 2)
	assert.True(t, chat.Messages[0].Mine)
	assert.False(t, chat.Messages[1].Mine)
	e.sr.AssertCalled(t, "MarkMessagesRead", mock.Anything, e.room.ID, e.p.ID, ward, false, chNow)
}

func TestGetChat_SantaThreadHidesGiver(t *testing.T) {
	e := newChatEnv(t).withPairs()
	santa := e.fromSanta.GiverID
	e.sr.On("ListMessages", mock.Anything, e.room.ID, santa, e.p.ID, chatHistory).Return([]entity.SantaMessage{
		{ID: uuid.New(), RoomID: e.room.ID, GiverID: santa, ReceiverID: e.p.ID, FromGiver: true, Body: "Привет от Санты", CreatedAt: chNow},
	}, nil)
	e.sr.On("MarkMessagesRead", mock.Anything, e.room.ID, santa, e.p.ID, true, chNow).Return(nil)

	chat, err := e.uc.GetChat(context.Background(), "abcdefgh", tokAuth, usecase.SantaChatSanta)
	require.NoError(t, err)
	require.Len(t, chat.Messages, 1)
	assert.False(t, chat.Messages[0].Mine)
	raw, err := json.Marshal(chat)
	require.NoError(t, err)
	assert.NotContains(t, string(raw), santa.String(), "id Санты не уходит подопечному")
}

func TestGetChat_BeforeDraw(t *testing.T) {
	uc, _, _, _, _, _ := channelUC(t) // комната open
	_, err := uc.GetChat(context.Background(), "abcdefgh", tokAuth, usecase.SantaChatSanta)
	assert.ErrorIs(t, err, usecase.ErrSantaNotDrawn)
}

func TestGetChat_NotInDraw(t *testing.T) {
	e := newChatEnv(t)
	e.sr.On("GetGiver", mock.Anything, e.room.ID, e.p.ID).Return(entity.SantaAssignment{}, repo.ErrNotFound)
	_, err := e.uc.GetChat(context.Background(), "abcdefgh", tokAuth, usecase.SantaChatSanta)
	assert.ErrorIs(t, err, usecase.ErrSantaNotInDraw)
}

func TestGetChat_BadWith(t *testing.T) {
	e := newChatEnv(t)
	_, err := e.uc.GetChat(context.Background(), "abcdefgh", tokAuth, "everyone")
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
}

func TestSendChat_ToReceiver(t *testing.T) {
	e := newChatEnv(t).withPairs()
	ward := e.toWard.ReceiverID
	var saved entity.SantaMessage
	var note entity.SantaNotification
	e.sr.On("CreateMessage", mock.Anything, mock.Anything, chNow.Add(-time.Hour), chatPerHour, mock.Anything).Run(func(a mock.Arguments) {
		saved = a.Get(1).(entity.SantaMessage)
		note = a.Get(4).(entity.SantaNotification)
	}).Return(nil)

	got, err := e.uc.SendChat(context.Background(), "abcdefgh", tokAuth, usecase.SantaChatReceiver, "  Какой размер?  ")
	require.NoError(t, err)
	assert.True(t, got.Mine)
	assert.Equal(t, "Какой размер?", got.Body)
	assert.Equal(t, e.p.ID, saved.GiverID)
	assert.Equal(t, ward, saved.ReceiverID)
	assert.True(t, saved.FromGiver)
	assert.Equal(t, chNow, saved.CreatedAt)
	assert.Equal(t, ward, note.ParticipantID)
	assert.Equal(t, entity.SantaNotifyChatMessage, note.Kind)
	assert.Equal(t, saved.ID.String(), note.Payload[entity.SantaPayloadMessageID])
}

func TestSendChat_Validation(t *testing.T) {
	e := newChatEnv(t).withPairs()
	for _, body := range []string{"", "   ", strings.Repeat("я", maxChatBody+1)} {
		_, err := e.uc.SendChat(context.Background(), "abcdefgh", tokAuth, usecase.SantaChatSanta, body)
		assert.ErrorIs(t, err, usecase.ErrSantaInvalid, "длина %d", len([]rune(body)))
	}
	e.sr.AssertNotCalled(t, "CreateMessage", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestSendChat_RepoErrors(t *testing.T) {
	for repoErr, want := range map[error]error{
		repo.ErrTooSoon:        usecase.ErrSantaChatLimit,
		repo.ErrNotFound:       usecase.ErrSantaNotInDraw,
		repo.ErrStatusMismatch: usecase.ErrSantaNotDrawn,
	} {
		e := newChatEnv(t).withPairs()
		e.sr.On("CreateMessage", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(repoErr)
		_, err := e.uc.SendChat(context.Background(), "abcdefgh", tokAuth, usecase.SantaChatSanta, "Спасибо!")
		assert.ErrorIs(t, err, want, repoErr.Error())
	}
}

// replyEnv — уведомление о сообщении Санты (santa → ward) ушло подопечному в
// чат 77 сообщением 500.
func replyEnv(t *testing.T) (chatEnv, entity.SantaMessage) {
	e := newChatEnv(t)
	santa, ward := uuid.New(), uuid.New()
	orig := entity.SantaMessage{ID: uuid.New(), RoomID: e.room.ID, GiverID: santa, ReceiverID: ward, FromGiver: true, Body: "Привет", CreatedAt: chNow}
	note := entity.NewSantaNotification(ward, entity.SantaNotifyChatMessage, chNow)
	note.Payload[entity.SantaPayloadMessageID] = orig.ID.String()
	e.sr.On("FindChatNotification", mock.Anything, int64(77), int64(500)).Return(note, nil)
	return e, orig
}

func TestTelegramReply_FromWardToSanta(t *testing.T) {
	e, orig := replyEnv(t)
	e.sr.On("GetMessage", mock.Anything, orig.ID).Return(orig, nil)
	e.sr.On("CreateMessage", mock.Anything, mock.MatchedBy(func(m entity.SantaMessage) bool {
		return !m.FromGiver && m.GiverID == orig.GiverID && m.ReceiverID == orig.ReceiverID && m.Body == "Спасибо!"
	}), chNow.Add(-time.Hour), chatPerHour, mock.MatchedBy(func(n entity.SantaNotification) bool {
		return n.ParticipantID == orig.GiverID && n.Kind == entity.SantaNotifyChatMessage
	})).Return(nil)

	require.NoError(t, e.uc.TelegramReply(context.Background(), 77, 500, "Спасибо!"))
	assert.Equal(t, botChatSentText(), e.tg.text)
	assert.EqualValues(t, 77, e.tg.chatID)
	e.sr.AssertNumberOfCalls(t, "CreateMessage", 1)
}

func TestTelegramReply_UnknownMessage(t *testing.T) {
	e := newChatEnv(t)
	e.sr.On("FindChatNotification", mock.Anything, int64(77), int64(9)).Return(entity.SantaNotification{}, repo.ErrNotFound)
	require.NoError(t, e.uc.TelegramReply(context.Background(), 77, 9, "Спасибо!"))
	assert.Equal(t, botChatUnknownText(), e.tg.text)
	e.sr.AssertNotCalled(t, "CreateMessage", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestTelegramReply_AfterRedrawIsClosed(t *testing.T) {
	e, orig := replyEnv(t)
	e.sr.On("GetMessage", mock.Anything, orig.ID).Return(entity.SantaMessage{}, repo.ErrNotFound) // перезапуск стёр переписку
	require.NoError(t, e.uc.TelegramReply(context.Background(), 77, 500, "Спасибо!"))
	assert.Equal(t, botChatClosedText(), e.tg.text)
	e.sr.AssertNotCalled(t, "CreateMessage", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestTelegramReply_Limit(t *testing.T) {
	e, orig := replyEnv(t)
	e.sr.On("GetMessage", mock.Anything, orig.ID).Return(orig, nil)
	e.sr.On("CreateMessage", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(repo.ErrTooSoon)
	require.NoError(t, e.uc.TelegramReply(context.Background(), 77, 500, "Спасибо!"))
	assert.Equal(t, botChatLimitText(), e.tg.text)
}
```

В `internal/usecase/santa/participant_test.go`, `TestGetMe_DrawnShowsReceiver`: после `sr.On("GetParticipant", mock.Anything, ward.ID)…` добавить

```go
	sr.On("CountUnread", mock.Anything, room.ID, me.ID).Return(2, 1, nil)
```

а в конец теста —

```go
	require.NotNil(t, got.Chat)
	assert.Equal(t, usecase.SantaChatUnread{FromSanta: 2, FromReceiver: 1}, *got.Chat)
```

В конец `internal/usecase/santa/messages_test.go`:

```go
func TestChatMessages(t *testing.T) {
	room := entity.SantaRoom{Title: "Офис"}
	fromSanta := chatFromSantaMessage(room, "<b>размер?</b>", "https://santa.prosto-namekni.ru/r/abcdefgh#chat")
	assert.Contains(t, fromSanta.Telegram, "&lt;b&gt;размер?&lt;/b&gt;")
	assert.Contains(t, fromSanta.Text, "#chat")
	assert.Contains(t, fromSanta.Text, "странице комнаты", "на почте ответ — только ссылкой")

	fromWard := chatFromWardMessage(room, "Боря", "M", "https://santa.prosto-namekni.ru/r/abcdefgh#chat")
	assert.Contains(t, fromWard.Subject, "Боря")
	assert.Contains(t, fromWard.Telegram, "<b>Боря</b>")
}
```

В конец `internal/usecase/santa/notifier_test.go`:

```go
func TestNotifier_ChatFromSantaHidesName(t *testing.T) {
	e := newNotifierEnv(t)
	e.tg.msgID = 900
	msg := entity.SantaMessage{ID: uuid.New(), RoomID: e.room.ID, GiverID: e.giver.ID, ReceiverID: e.ward.ID, FromGiver: true, Body: "Какой размер?", CreatedAt: chNow}
	note := entity.NewSantaNotification(e.ward.ID, entity.SantaNotifyChatMessage, chNow)
	note.Payload[entity.SantaPayloadMessageID] = msg.ID.String()
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("GetMessage", mock.Anything, msg.ID).Return(msg, nil)
	e.sr.On("MarkNotificationSent", mock.Anything, note.ID, mock.MatchedBy(func(id *int64) bool { return id != nil && *id == 900 })).Return(nil)

	sent, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 1, sent)
	assert.Contains(t, e.tg.text, "Какой размер?")
	assert.NotContains(t, e.tg.text, e.giver.Name, "имя Санты подопечному не уходит")
}

func TestNotifier_ChatFromWardByEmail(t *testing.T) {
	e := newNotifierEnv(t)
	msg := entity.SantaMessage{ID: uuid.New(), RoomID: e.room.ID, GiverID: e.giver.ID, ReceiverID: e.ward.ID, FromGiver: false, Body: "M", CreatedAt: chNow}
	note := entity.NewSantaNotification(e.giver.ID, entity.SantaNotifyChatMessage, chNow)
	note.Payload[entity.SantaPayloadMessageID] = msg.ID.String()
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("GetMessage", mock.Anything, msg.ID).Return(msg, nil)
	e.sr.On("MarkNotificationSent", mock.Anything, note.ID, (*int64)(nil)).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Contains(t, e.ml.subject, "Боря")
	assert.Contains(t, e.ml.text, "https://santa.prosto-namekni.ru/r/abcdefgh#chat")
}

func TestNotifier_ChatMessageGoneIsPermanent(t *testing.T) {
	e := newNotifierEnv(t)
	note := entity.NewSantaNotification(e.ward.ID, entity.SantaNotifyChatMessage, chNow)
	note.Payload[entity.SantaPayloadMessageID] = uuid.NewString()
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("GetMessage", mock.Anything, mock.Anything).Return(entity.SantaMessage{}, repo.ErrNotFound)
	e.sr.On("MarkNotificationFailed", mock.Anything, note.ID, 1, (*time.Time)(nil), mock.Anything).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	e.sr.AssertCalled(t, "MarkNotificationFailed", mock.Anything, note.ID, 1, (*time.Time)(nil), mock.Anything)
}
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `go test ./internal/usecase/santa/ -run 'Chat|TelegramReply|GetMe_Drawn' -v`
Expected: FAIL — нет `GetChat`, `chatFromSantaMessage`, `botChatSentText` и т. д.

- [ ] **Step 4: Тексты**

В конец `internal/usecase/santa/messages.go`:

```go
// chatFromSantaMessage — подопечному о сообщении Санты. Имени Санты здесь нет
// и быть не должно: оно тайна до обмена подарками.
func chatFromSantaMessage(room entity.SantaRoom, body, link string) message {
	return compose(
		"Тайный Санта написал вам — «"+room.Title+"»",
		emailView{
			Heading:    "Вам пишет ваш Тайный Санта",
			Lines:      []string{"Сообщение в комнате «" + room.Title + "». Кто он — останется тайной до обмена подарками."},
			Quote:      body,
			ButtonText: "Ответить",
			URL:        link,
			Footer:     "Ответить можно только на странице комнаты: ответ на это письмо Санта не получит.",
		},
		"💬 Вам пишет ваш <b>Тайный Санта</b> (комната «"+telegram.Escape(room.Title)+"»):\n\n<blockquote>"+telegram.Escape(body)+"</blockquote>\n\nЧтобы ответить, ответьте на это сообщение (Reply) — Санта получит ответ и не узнает ваш Telegram.",
	)
}

// chatFromWardMessage — Санте о сообщении подопечного.
func chatFromWardMessage(room entity.SantaRoom, wardName, body, link string) message {
	return compose(
		wardName+" написал(а) вам — «"+room.Title+"»",
		emailView{
			Heading:    "Вам пишет подопечный: " + wardName,
			Lines:      []string{"Сообщение в комнате «" + room.Title + "». Ваше имя подопечный не знает."},
			Quote:      body,
			ButtonText: "Ответить",
			URL:        link,
			Footer:     "Ответить можно только на странице комнаты: ответ на это письмо не дойдёт.",
		},
		"💬 Вам пишет подопечный <b>"+telegram.Escape(wardName)+"</b> (комната «"+telegram.Escape(room.Title)+"»):\n\n<blockquote>"+telegram.Escape(body)+"</blockquote>\n\nЧтобы ответить, ответьте на это сообщение (Reply) — подопечный не узнает, кто вы.",
	)
}

func botChatSentText() string { return "Отправлено ✓" }

func botChatUnknownText() string {
	return "Не понял, кому это. Чтобы написать в чат Тайного Санты, ответьте (Reply) на сообщение из чата или напишите на странице комнаты."
}

func botChatClosedText() string {
	return "Этот чат закрыт: организатор перезапустил жеребьёвку или удалил комнату."
}

func botChatLimitText() string { return "Не больше 30 сообщений в час — продолжите чуть позже." }

func botChatTooLongText() string { return "Сообщение длиннее 1000 символов — сократите и отправьте ещё раз." }
```

- [ ] **Step 5: Use case чата**

Создать `internal/usecase/santa/chat.go`:

```go
package santa

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

const (
	maxChatBody = 1000
	chatPerHour = 30
	// chatHistory — сколько последних сообщений отдаём странице.
	chatHistory = 200
)

// chatPair — пара, в которой участник переписывается, и его сторона в ней:
// asGiver — он Санта (пишет подопечному).
func (uc *santaUseCase) chatPair(ctx context.Context, room entity.SantaRoom, p entity.SantaParticipant, with usecase.SantaChatWith) (entity.SantaAssignment, bool, error) {
	var (
		a       entity.SantaAssignment
		err     error
		asGiver bool
	)
	switch with {
	case usecase.SantaChatReceiver:
		asGiver = true
	case usecase.SantaChatSanta:
	default:
		return entity.SantaAssignment{}, false, invalid("with — receiver или santa")
	}
	if room.Status != entity.SantaRoomDrawn {
		return entity.SantaAssignment{}, false, usecase.ErrSantaNotDrawn
	}
	if asGiver {
		a, err = uc.santa.GetAssignment(ctx, room.ID, p.ID)
	} else {
		a, err = uc.santa.GetGiver(ctx, room.ID, p.ID)
	}
	if errors.Is(err, repo.ErrNotFound) {
		return entity.SantaAssignment{}, false, usecase.ErrSantaNotInDraw
	}
	if err != nil {
		return entity.SantaAssignment{}, false, err
	}
	return a, asGiver, nil
}

// chatView — сообщение без id сторон: подопечный не должен узнать Санту.
func chatView(m entity.SantaMessage, asGiver bool) usecase.SantaChatMessage {
	return usecase.SantaChatMessage{ID: m.ID, Mine: m.FromGiver == asGiver, Body: m.Body, CreatedAt: m.CreatedAt}
}

func (uc *santaUseCase) GetChat(ctx context.Context, slug string, auth usecase.SantaAuth, with usecase.SantaChatWith) (usecase.SantaChat, error) {
	room, p, err := uc.participantBySlug(ctx, slug, auth)
	if err != nil {
		return usecase.SantaChat{}, err
	}
	pair, asGiver, err := uc.chatPair(ctx, room, p, with)
	if err != nil {
		return usecase.SantaChat{}, err
	}
	msgs, err := uc.santa.ListMessages(ctx, room.ID, pair.GiverID, pair.ReceiverID, chatHistory)
	if err != nil {
		return usecase.SantaChat{}, err
	}
	// Прочитаны входящие — написанные другой стороной.
	if err := uc.santa.MarkMessagesRead(ctx, room.ID, pair.GiverID, pair.ReceiverID, !asGiver, uc.now()); err != nil {
		return usecase.SantaChat{}, err
	}
	out := usecase.SantaChat{With: with, Messages: make([]usecase.SantaChatMessage, len(msgs))}
	for i, m := range msgs {
		out.Messages[i] = chatView(m, asGiver)
	}
	return out, nil
}

func (uc *santaUseCase) SendChat(ctx context.Context, slug string, auth usecase.SantaAuth, with usecase.SantaChatWith, body string) (usecase.SantaChatMessage, error) {
	room, p, err := uc.participantBySlug(ctx, slug, auth)
	if err != nil {
		return usecase.SantaChatMessage{}, err
	}
	pair, asGiver, err := uc.chatPair(ctx, room, p, with)
	if err != nil {
		return usecase.SantaChatMessage{}, err
	}
	msg, err := uc.postMessage(ctx, pair, asGiver, body)
	if err != nil {
		return usecase.SantaChatMessage{}, err
	}
	return chatView(msg, asGiver), nil
}

// postMessage — общий путь страницы и бота: проверка текста, лимит, запись
// сообщения и уведомления получателю.
func (uc *santaUseCase) postMessage(ctx context.Context, pair entity.SantaAssignment, fromGiver bool, body string) (entity.SantaMessage, error) {
	body = strings.TrimSpace(body)
	if n := utf8.RuneCountInString(body); n == 0 || n > maxChatBody {
		return entity.SantaMessage{}, invalid("сообщение — от 1 до 1000 символов")
	}
	now := uc.now()
	msg := entity.SantaMessage{
		ID: uuid.New(), RoomID: pair.RoomID, GiverID: pair.GiverID, ReceiverID: pair.ReceiverID,
		FromGiver: fromGiver, Body: body, CreatedAt: now,
	}
	note := entity.NewSantaNotification(msg.RecipientID(), entity.SantaNotifyChatMessage, now)
	note.Payload[entity.SantaPayloadMessageID] = msg.ID.String()
	err := uc.santa.CreateMessage(ctx, msg, now.Add(-time.Hour), chatPerHour, note)
	switch {
	case err == nil:
		return msg, nil
	case errors.Is(err, repo.ErrTooSoon):
		return entity.SantaMessage{}, usecase.ErrSantaChatLimit
	case errors.Is(err, repo.ErrNotFound):
		// Пару сменил перезапуск жеребьёвки.
		return entity.SantaMessage{}, usecase.ErrSantaNotInDraw
	case errors.Is(err, repo.ErrStatusMismatch):
		return entity.SantaMessage{}, usecase.ErrSantaNotDrawn
	}
	return entity.SantaMessage{}, err
}

func (uc *santaUseCase) TelegramReply(ctx context.Context, chatID, replyToMessageID int64, text string) error {
	note, err := uc.santa.FindChatNotification(ctx, chatID, replyToMessageID)
	if errors.Is(err, repo.ErrNotFound) {
		return uc.tgReply(ctx, chatID, botChatUnknownText())
	}
	if err != nil {
		return err
	}
	origID, err := uuid.Parse(note.Payload[entity.SantaPayloadMessageID])
	if err != nil {
		return uc.tgReply(ctx, chatID, botChatUnknownText())
	}
	orig, err := uc.santa.GetMessage(ctx, origID)
	if errors.Is(err, repo.ErrNotFound) || (err == nil && orig.RecipientID() != note.ParticipantID) {
		// Перезапуск жеребьёвки стёр переписку, комнату удалили.
		return uc.tgReply(ctx, chatID, botChatClosedText())
	}
	if err != nil {
		return err
	}
	// Отвечает получатель исходного сообщения — другая сторона той же пары.
	pair := entity.SantaAssignment{RoomID: orig.RoomID, GiverID: orig.GiverID, ReceiverID: orig.ReceiverID}
	_, err = uc.postMessage(ctx, pair, !orig.FromGiver, text)
	switch {
	case err == nil:
		return uc.tgReply(ctx, chatID, botChatSentText())
	case errors.Is(err, usecase.ErrSantaNotInDraw), errors.Is(err, usecase.ErrSantaNotDrawn):
		return uc.tgReply(ctx, chatID, botChatClosedText())
	case errors.Is(err, usecase.ErrSantaChatLimit):
		return uc.tgReply(ctx, chatID, botChatLimitText())
	case errors.Is(err, usecase.ErrSantaInvalid):
		// Пустой текст вебхук не передаёт — остаётся только «слишком длинно».
		return uc.tgReply(ctx, chatID, botChatTooLongText())
	}
	return err
}
```

- [ ] **Step 6: Непрочитанные в карточке участника**

`internal/usecase/santa/participant.go`, в `me` после строки `me.Receiver = &usecase.SantaReceiver{…}`:

```go
	fromSanta, fromReceiver, err := uc.santa.CountUnread(ctx, room.ID, p.ID)
	if err != nil {
		return usecase.SantaMe{}, fmt.Errorf("unread: %w", err)
	}
	me.Chat = &usecase.SantaChatUnread{FromSanta: fromSanta, FromReceiver: fromReceiver}
```

- [ ] **Step 7: Уведомление `chat_message`**

`internal/usecase/santa/notifier.go`: добавить `"github.com/google/uuid"` в импорт, в `compose` перед `case entity.SantaNotifyDrawn, entity.SantaNotifyWishesUpdated:`:

```go
	case entity.SantaNotifyChatMessage:
		id, err := uuid.Parse(note.Payload[entity.SantaPayloadMessageID])
		if err != nil {
			return message{}, fmt.Errorf("%w: нет id сообщения", errPermanent)
		}
		msg, err := n.santa.GetMessage(ctx, id)
		if errors.Is(err, repo.ErrNotFound) {
			return message{}, fmt.Errorf("%w: сообщения нет", errPermanent)
		}
		if err != nil {
			return message{}, err
		}
		chatLink := link + "#chat"
		if msg.FromGiver {
			// Подопечному — без имени Санты: тайна держится и в уведомлениях.
			return chatFromSantaMessage(room, msg.Body, chatLink), nil
		}
		ward, err := n.santa.GetParticipant(ctx, msg.ReceiverID)
		if errors.Is(err, repo.ErrNotFound) {
			return message{}, fmt.Errorf("%w: подопечного нет", errPermanent)
		}
		if err != nil {
			return message{}, err
		}
		return chatFromWardMessage(room, ward.Name, msg.Body, chatLink), nil
```

- [ ] **Step 8: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add internal/usecase internal/controller/restapi/v1/santa_test.go
git commit -m "feat(backend): Санта — анонимный чат пары, уведомления о сообщениях и ответ из Telegram"
```

---

### Task 9: HTTP-маршруты чата и ответы в вебхуке бота

**Files:**
- Modify: `BACK/internal/controller/restapi/v1/santa.go`
- Modify: `BACK/internal/controller/restapi/v1/santa_test.go`

**Interfaces:**
- Consumes: `SantaUseCase.GetChat`, `SendChat`, `TelegramReply`, `ErrSantaNotInDraw`, `ErrSantaChatLimit` (задача 8).
- Produces: `GET /api/v1/santa/r/:slug/me/chat?with=receiver|santa` → `{data: {with, messages: [{id, mine, body, createdAt}]}}`; `POST /api/v1/santa/r/:slug/me/chat` `{with, body}` → 201 `{data: {id, mine, body, createdAt}}`; 409 `вы не попали в эту жеребьёвку`; 429 лимит чата; вебхук: `message.reply_to_message` с текстом → `TelegramReply`.

- [ ] **Step 1: Падающие тесты**

В конец `internal/controller/restapi/v1/santa_test.go`:

```go
func TestSantaChat_Get(t *testing.T) {
	m := &MockSantaUC{}
	m.On("GetChat", mock.Anything, "AbCd2345", usecase.SantaAuth{Token: "tok"}, usecase.SantaChatSanta).
		Return(usecase.SantaChat{With: usecase.SantaChatSanta}, nil)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/santa/r/AbCd2345/me/chat?with=santa", nil)
	req.Header.Set(v1.SantaTokenHeader, "tok")

	status, body := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusOK, status)
	assert.JSONEq(t, `{"data":{"with":"santa","messages":[]}}`, body, "пустой чат — массив, не null")
}

func TestSantaChat_Send(t *testing.T) {
	m := &MockSantaUC{}
	m.On("SendChat", mock.Anything, "AbCd2345", usecase.SantaAuth{Token: "tok"}, usecase.SantaChatReceiver, "Какой размер?").
		Return(usecase.SantaChatMessage{Mine: true, Body: "Какой размер?"}, nil)
	req := jsonReq("/api/v1/santa/r/AbCd2345/me/chat", `{"with":"receiver","body":"Какой размер?"}`)
	req.Header.Set(v1.SantaTokenHeader, "tok")

	status, body := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusCreated, status)
	assert.Contains(t, body, `"mine":true`)
}

func TestSantaChat_Errors(t *testing.T) {
	for err, want := range map[error]int{
		usecase.ErrSantaChatLimit: http.StatusTooManyRequests,
		usecase.ErrSantaNotInDraw: http.StatusConflict,
		usecase.ErrSantaNotDrawn:  http.StatusConflict,
	} {
		m := &MockSantaUC{}
		m.On("SendChat", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
			Return(usecase.SantaChatMessage{}, err)
		status, body := doReq(t, newSantaApp(m), jsonReq("/api/v1/santa/r/AbCd2345/me/chat", `{"with":"santa","body":"x"}`))
		assert.Equal(t, want, status, err.Error())
		assert.Contains(t, body, err.Error())
	}
}

func TestTelegramWebhook_ReplyGoesToChat(t *testing.T) {
	m := &MockSantaUC{}
	m.On("TelegramReply", mock.Anything, int64(77), int64(500), "Спасибо!").Return(nil)
	req := jsonReq("/api/v1/telegram/webhook", `{"update_id":2,"message":{"message_id":501,"chat":{"id":77},"text":" Спасибо! ","reply_to_message":{"message_id":500}}}`)
	req.Header.Set("X-Telegram-Bot-Api-Secret-Token", "hook-secret")

	status, _ := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusOK, status)
	m.AssertExpectations(t)
}

func TestTelegramWebhook_ReplyWithoutTextIgnored(t *testing.T) {
	m := &MockSantaUC{}
	// Стикер или фото в ответ — текста нет.
	req := jsonReq("/api/v1/telegram/webhook", `{"message":{"chat":{"id":77},"reply_to_message":{"message_id":500}}}`)
	req.Header.Set("X-Telegram-Bot-Api-Secret-Token", "hook-secret")

	status, _ := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusOK, status)
	m.AssertNotCalled(t, "TelegramReply", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}
```

В `TestTelegramWebhook_IgnoresOtherUpdates` после существующей проверки добавить:

```go
	m.AssertNotCalled(t, "TelegramReply", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `go test ./internal/controller/restapi/v1/ -run 'SantaChat|TelegramWebhook' -v`
Expected: FAIL — маршрутов чата нет (404), ответ в вебхуке не разбирается.

- [ ] **Step 3: Маршруты, ошибки, вебхук**

`internal/controller/restapi/v1/santa.go`:

1. В `NewSantaRouter` после `api.Post("/r/:slug/me/telegram", …)`:

```go
	api.Get("/r/:slug/me/chat", optional, h.getChat)
	api.Post("/r/:slug/me/chat", optional, h.sendChat)
```

2. В `santaError` после `case errors.Is(err, usecase.ErrSantaNotDrawn):` блока:

```go
	case errors.Is(err, usecase.ErrSantaNotInDraw):
		return c.Status(fiber.StatusConflict).JSON(response.Error(usecase.ErrSantaNotInDraw.Error()))
	case errors.Is(err, usecase.ErrSantaChatLimit):
		return c.Status(fiber.StatusTooManyRequests).JSON(response.Error(usecase.ErrSantaChatLimit.Error()))
```

3. После `remind`:

```go
func (h *santaHandler) getChat(c *fiber.Ctx) error {
	chat, err := h.uc.GetChat(c.Context(), c.Params("slug"), santaAuth(c), usecase.SantaChatWith(c.Query("with")))
	if err != nil {
		return santaError(c, err)
	}
	if chat.Messages == nil {
		chat.Messages = []usecase.SantaChatMessage{}
	}
	return c.JSON(response.Data(chat))
}

func (h *santaHandler) sendChat(c *fiber.Ctx) error {
	var body struct {
		With string `json:"with"`
		Body string `json:"body"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	msg, err := h.uc.SendChat(c.Context(), c.Params("slug"), santaAuth(c), usecase.SantaChatWith(body.With), body.Body)
	if err != nil {
		return santaError(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(response.Data(msg))
}
```

4. `telegramUpdate` и `telegramWebhook` заменить:

```go
type telegramUpdate struct {
	Message *struct {
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text string `json:"text"`
		// ReplyToMessage — сообщение бота, на которое ответили (Reply).
		ReplyToMessage *struct {
			MessageID int64 `json:"message_id"`
		} `json:"reply_to_message"`
	} `json:"message"`
}

// telegramWebhook всегда отвечает 200 на свои апдейты — иначе Telegram будет
// повторять их; ошибки только в лог.
func (h *santaHandler) telegramWebhook(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if subtle.ConstantTimeCompare([]byte(c.Get(TelegramSecretHeader)), []byte(secret)) != 1 {
			return c.SendStatus(fiber.StatusUnauthorized)
		}
		var u telegramUpdate
		if err := json.Unmarshal(c.Body(), &u); err != nil || u.Message == nil {
			return c.SendStatus(fiber.StatusOK)
		}
		text := strings.TrimSpace(u.Message.Text)
		switch {
		case text == "/start" || strings.HasPrefix(text, "/start "):
			token := strings.TrimSpace(strings.TrimPrefix(text, "/start"))
			if err := h.uc.TelegramStart(c.Context(), u.Message.Chat.ID, token); err != nil {
				log.Printf("santa: telegram start: %v", err)
			}
		case u.Message.ReplyToMessage != nil && text != "":
			// Ответ на уведомление о сообщении чата — пишем в ту же пару.
			if err := h.uc.TelegramReply(c.Context(), u.Message.Chat.ID, u.Message.ReplyToMessage.MessageID, text); err != nil {
				log.Printf("santa: telegram reply: %v", err)
			}
		}
		return c.SendStatus(fiber.StatusOK)
	}
}
```

- [ ] **Step 4: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./... -count=1`
Expected: PASS (Docker запущен).

- [ ] **Step 5: Commit**

```bash
git add internal/controller/restapi/v1/santa.go internal/controller/restapi/v1/santa_test.go
git commit -m "feat(backend): Санта — API анонимного чата и ответы в боте"
```

---

## Фронтенд

### Task 10: Типы, хелперы, хуки и почта до подтверждения

**Files:**
- Modify: `FRONT/shared/types.ts`
- Modify: `FRONT/shared/santa.ts`
- Modify: `FRONT/tests/santa.test.cjs`
- Modify: `FRONT/api/santa/index.ts`
- Modify: `FRONT/app/santa/r/[slug]/components/notify-card.tsx`

**Interfaces:**
- Consumes: ответы бэка из задач 3, 5, 8, 9.
- Produces (типы): `SantaRoom.drawFailedAt: string | null`; `SantaRoomInput.drawAt: string | null`; `SantaNotifyView.pendingEmail: string`; `SantaMe.chat: SantaChatUnread | null`; `SantaChatWith = 'receiver' | 'santa'`; `SantaChatMessage = { id; mine; body; createdAt }`; `SantaChat = { with; messages }`; `SantaChatUnread = { fromSanta; fromReceiver }`.
- Produces (`shared/santa.ts`): `toLocalInput(iso: string | null): string`, `fromLocalInput(value: string): string | null`, `formatDrawAt(value: string | null): string | null`, `chatSchema`, `type ChatValues`, `chatTabLabel(withWho: SantaChatWith, unread: SantaChatUnread | null): string`, `withChatRead(me: SantaMe, withWho: SantaChatWith): SantaMe`; поле формы `RoomFormValues.drawAt: string`.
- Produces (`api/santa`): `useApiSantaChat(slug: string, withWho: SantaChatWith)`, `useApiSantaSendChat(slug: string)` (переменные мутации `{ with: SantaChatWith; body: string }`); `useApiSantaRoom` и `useApiSantaMe` переспрашивают раз в минуту, пока ждут жеребьёвку по расписанию (и `useApiSantaMe` — после жеребьёвки, ради счётчиков чата).

- [ ] **Step 1: Падающие тесты**

В `tests/santa.test.cjs`:

1. В деструктуризацию `load('shared/santa.ts')` добавить `toLocalInput, fromLocalInput, formatDrawAt, chatSchema, chatTabLabel, withChatRead`.
2. В тесте «форма комнаты → запрос» в ожидаемый объект `deepEqual` добавить `drawAt: null`.
3. В тесте «комната → форма правки» в объект комнаты добавить `drawFailedAt: null, lastRemindedAt: null`, а в проверки — `assert.equal(values.drawAt, '')`.
4. В конец файла:

```js
test('время жеребьёвки: поле формы ↔ ISO без сдвига пояса', () => {
  const iso = new Date(2026, 11, 20, 18, 30).toISOString()
  assert.equal(toLocalInput(iso), '2026-12-20T18:30')
  assert.equal(fromLocalInput('2026-12-20T18:30'), iso)
  assert.equal(toLocalInput(null), '')
  assert.equal(toLocalInput('мусор'), '')
  assert.equal(fromLocalInput(''), null)
  assert.equal(fromLocalInput('мусор'), null)
})

test('время жеребьёвки уходит в запрос и возвращается в форму', () => {
  const iso = new Date(2026, 11, 20, 18, 30).toISOString()
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', drawAt: '2026-12-20T18:30' }).drawAt, iso)
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', drawAt: '' }).drawAt, null)
  const values = roomToFormValues({
    id: '1', ownerId: '2', slug: 's', title: 'Офис', budget: null, exchangeDate: null, drawAt: iso,
    message: '', status: 'open', drawnAt: null, drawFailedAt: null, lastRemindedAt: null, createdAt: '', updatedAt: '',
  })
  assert.equal(values.drawAt, '2026-12-20T18:30')
})

test('подпись времени жеребьёвки', () => {
  assert.equal(formatDrawAt(null), null)
  assert.equal(formatDrawAt('мусор'), null)
  const label = formatDrawAt(new Date(2026, 11, 20, 18, 30).toISOString())
  assert.ok(label.includes('20 декабря'), label)
  assert.ok(label.includes('18:30'), label)
})

test('сообщение чата: от 1 до 1000 символов', () => {
  assert.equal(chatSchema.safeParse({ body: 'Какой размер?' }).success, true)
  assert.equal(chatSchema.safeParse({ body: '   ' }).success, false)
  assert.equal(chatSchema.safeParse({ body: 'я'.repeat(1000) }).success, true)
  assert.equal(chatSchema.safeParse({ body: 'я'.repeat(1001) }).success, false)
})

test('подпись вкладки чата со счётчиком', () => {
  assert.equal(chatTabLabel('receiver', null), 'Подопечному')
  assert.equal(chatTabLabel('santa', { fromSanta: 0, fromReceiver: 3 }), 'Моему Санте')
  assert.equal(chatTabLabel('santa', { fromSanta: 2, fromReceiver: 0 }), 'Моему Санте · 2 новых')
  assert.equal(chatTabLabel('receiver', { fromSanta: 0, fromReceiver: 1 }), 'Подопечному · 1 новое')
})

test('открытая вкладка чата обнуляет только свой счётчик', () => {
  const me = { name: 'Аня', chat: { fromSanta: 2, fromReceiver: 1 } }
  assert.deepEqual(withChatRead(me, 'santa').chat, { fromSanta: 0, fromReceiver: 1 })
  assert.deepEqual(withChatRead(me, 'receiver').chat, { fromSanta: 2, fromReceiver: 0 })
  assert.equal(withChatRead({ name: 'Аня', chat: null }, 'santa').chat, null)
  assert.equal(me.chat.fromSanta, 2, 'исходный объект не меняется')
})
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `node --test tests/santa.test.cjs`
Expected: FAIL — `toLocalInput is not a function` и т. п.

- [ ] **Step 3: Типы**

`shared/types.ts`:

В `SantaRoom` после `drawnAt`:

```ts
  /** Жеребьёвка по расписанию не прошла: готовых меньше трёх. Сбрасывается новым временем или жеребьёвкой. */
  drawFailedAt: string | null
```

В `SantaNotifyView` поля почты заменить:

```ts
  /** Подтверждённый адрес — на него идут письма. */
  email: string
  emailVerified: boolean
  /** Новый адрес, ждущий кода; пусто — нет. Пока он не подтверждён, письма идут на email. */
  pendingEmail: string
  /** Код отправлен на pendingEmail и ещё не введён. */
  emailPending: boolean
```

В `SantaMe` после `receiver`:

```ts
  /** Непрочитанные в чате; null, пока у участника нет пары. */
  chat: SantaChatUnread | null
```

После `SantaRemindResult`:

```ts
/** С кем переписка: со своим подопечным или со своим Сантой. */
export type SantaChatWith = 'receiver' | 'santa'

/** Сообщение глазами участника: без имён и id сторон. */
export type SantaChatMessage = { id: string; mine: boolean; body: string; createdAt: string }

export type SantaChat = { with: SantaChatWith; messages: SantaChatMessage[] }

/** Непрочитанные: от своего Санты и от своего подопечного. */
export type SantaChatUnread = { fromSanta: number; fromReceiver: number }
```

В `SantaRoomInput` после `exchangeDate`:

```ts
  /** Время жеребьёвки по расписанию (ISO) или null — только вручную. */
  drawAt: string | null
```

- [ ] **Step 4: Хелперы**

`shared/santa.ts`:

Импорт типов заменить на

```ts
import type { SantaChatUnread, SantaChatWith, SantaMe, SantaNotifyView, SantaRoom, SantaRoomInput } from './types'
```

В `roomSchema` после `exchangeDate: z.string(),` добавить `drawAt: z.string(),`. В `EMPTY_ROOM_FORM` — `drawAt: '',`. В `toRoomInput` после `exchangeDate` — `drawAt: fromLocalInput(v.drawAt),`. В `roomToFormValues` после `exchangeDate` — `drawAt: toLocalInput(room.drawAt),`.

После `roomToFormValues`:

```ts
const pad2 = (n: number) => String(n).padStart(2, '0')

/** ISO из бэка → значение input type="datetime-local" в поясе браузера: «2026-12-20T18:30». */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Значение datetime-local (время браузера) → ISO UTC для бэка; пусто или мусор — null. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** «20 декабря в 18:30» в поясе браузера; null — времени нет. */
export function formatDrawAt(value: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : formatTime(d)
}
```

В конец файла:

```ts
export const chatSchema = z.object({
  body: z.string().trim().min(1, 'Напишите сообщение').max(1000, 'До 1000 символов'),
})
export type ChatValues = z.infer<typeof chatSchema>

/** Подпись вкладки чата: «Моему Санте · 2 новых». */
export function chatTabLabel(withWho: SantaChatWith, unread: SantaChatUnread | null): string {
  const base = withWho === 'receiver' ? 'Подопечному' : 'Моему Санте'
  const n = unread ? (withWho === 'receiver' ? unread.fromReceiver : unread.fromSanta) : 0
  return n > 0 ? `${base} · ${n} ${pluralRu(n, ['новое', 'новых', 'новых'])}` : base
}

/** Карточка участника после открытия вкладки: её входящие бэк отметил прочитанными. */
export function withChatRead(me: SantaMe, withWho: SantaChatWith): SantaMe {
  if (!me.chat) return me
  return { ...me, chat: { ...me.chat, [withWho === 'receiver' ? 'fromReceiver' : 'fromSanta']: 0 } }
}
```

- [ ] **Step 5: Хуки**

`api/santa/index.ts`:

Импорты: в `@/shared/santa` добавить `withChatRead`; в типы — `SantaChat, SantaChatMessage, SantaChatWith`. После `const seg = encodeURIComponent`:

```ts
// Жеребьёвка по расписанию проходит на сервере — итог подтягиваем сами.
const ROOM_POLL_MS = 60_000
// Новые сообщения чата без перезагрузки страницы.
const CHAT_POLL_MS = 15_000
```

`useApiSantaRoom` — добавить опцию:

```ts
    refetchInterval: query => {
      const room = query.state.data?.data.room
      return room?.status === 'open' && room.drawAt ? ROOM_POLL_MS : false
    },
```

`useApiSantaMe` — добавить опцию:

```ts
    // Ждём жеребьёвку по расписанию; после неё — свежие счётчики чата.
    refetchInterval: query => {
      const me = query.state.data?.data
      return me && (me.room.status === 'drawn' || me.room.drawAt) ? ROOM_POLL_MS : false
    },
```

В конец файла:

```ts
export const useApiSantaChat = (slug: string, withWho: SantaChatWith) => {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['santa-chat', slug, withWho],
    enabled: isValidSantaSlug(slug),
    retry: false,
    refetchInterval: CHAT_POLL_MS,
    queryFn: async () => {
      const res = await api.get<Data<SantaChat>>(`santa/r/${seg(slug)}/me/chat`, {
        headers: santaHeaders(slug),
        params: { with: withWho },
      })
      // Бэк отметил входящие прочитанными — обнуляем счётчик вкладки без лишнего запроса.
      queryClient.setQueryData<Data<SantaMe> | null>(['santa-me', slug], old => (old ? { data: withChatRead(old.data, withWho) } : old))
      return res
    },
  })
}

export const useApiSantaSendChat = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaChatMessage>, AxiosError, { with: SantaChatWith; body: string }>({
    mutationFn: body => api.post(`santa/r/${seg(slug)}/me/chat`, body, { headers: santaHeaders(slug) }),
    onSuccess: (res, vars) => queryClient.setQueryData<Data<SantaChat>>(['santa-chat', slug, vars.with], old =>
      old ? { data: { ...old.data, messages: [...old.data.messages, res.data] } } : old),
  })
}
```

- [ ] **Step 6: Новый адрес почты ждёт кода — карточка**

`app/santa/r/[slug]/components/notify-card.tsx`:

1. В блоке `notify.ready && !editing` кнопку `Сменить` заменить на:

```tsx
          {notify.emailPending && (
            <p className="text-body-sm text-muted-foreground">
              Новый адрес {notify.pendingEmail} ждёт кода из письма — до подтверждения пишем по-старому.
            </p>
          )}
          <Button variant="ghost" onClick={() => setEditing(true)}>{notify.emailPending ? 'Ввести код' : 'Сменить'}</Button>
```

2. Абзац «Новый адрес почты нужно подтвердить заново…» (условие `notify.ready && notify.channel === 'email'`) заменить на:

```tsx
          {notify.ready && (
            <p className="text-body-sm text-muted-foreground">
              Пока новый канал не подтверждён, сообщения приходят {channelLabel(notify)}.
            </p>
          )}
```

3. В `EmailConnect`:

```tsx
  const [sentTo, setSentTo] = useState<string | null>(notify.emailPending ? notify.pendingEmail : null)
```

и `defaultValues: { email: notify.pendingEmail || notify.email },`.

- [ ] **Step 7: Проверки**

Run: `node --test tests/santa.test.cjs` — PASS.
Run: `pnpm exec tsc --noEmit` — 0 ошибок (`SantaRoomInput` собирает только `toRoomInput`, он уже отдаёт `drawAt`).
Run: `pnpm lint` — 0 ошибок; `node tests/token-audit.cjs app/santa components shared` — `всего 0`.

- [ ] **Step 8: Commit**

```bash
git add shared/types.ts shared/santa.ts tests/santa.test.cjs api/santa/index.ts "app/santa/r/[slug]/components/notify-card.tsx"
git commit -m "feat(front): Санта — типы и хуки расписания и чата, новый адрес почты ждёт кода"
```

---

### Task 11: Жеребьёвка по расписанию — форма, комната организатора, приглашение

**Files:**
- Modify: `FRONT/app/santa/components/room-form.tsx`
- Modify: `FRONT/app/santa/components/room-chips.tsx`
- Modify: `FRONT/app/santa/rooms/[id]/page.tsx`
- Modify: `FRONT/app/santa/r/[slug]/components/invite-header.tsx`

**Interfaces:**
- Consumes: `RoomFormValues.drawAt`, `formatDrawAt`, `SantaRoom.drawFailedAt` (задача 10).
- Produces: `RoomChips` принимает `drawAt?: string | null` (показывать только пока жеребьёвка впереди).

- [ ] **Step 1: Поле в форме**

`app/santa/components/room-form.tsx`, после закрывающего `</div>` сетки «бюджет + дата обмена»:

```tsx
        <FormField control={form.control} name="drawAt" render={({ field }) => (
          <FormItem>
            <FormLabel>Жеребьёвка по расписанию — необязательно</FormLabel>
            <FormControl><Input type="datetime-local" {...field} /></FormControl>
            <p className="text-caption text-muted-foreground">
              В это время пары вытянутся сами. Если готовых участников будет меньше трёх, жеребьёвка не пройдёт
              и в комнате появится предупреждение. Пусто — проведёте вручную.
            </p>
            <FormMessage />
          </FormItem>
        )} />
```

- [ ] **Step 2: Чип с временем**

`app/santa/components/room-chips.tsx` заменить целиком:

```tsx
import { formatBudget, formatDay, formatDrawAt, participantsLabel } from '@/shared/santa'

const CHIP = 'flex h-control-sm items-center rounded-tag px-3 text-label font-semibold'

export function RoomChips({ budget, exchangeDate, drawAt, participantsCount }: {
  budget: number | null
  exchangeDate: string | null
  /** Только пока жеребьёвка впереди. */
  drawAt?: string | null
  participantsCount?: number
}) {
  const day = formatDay(exchangeDate)
  const draw = formatDrawAt(drawAt ?? null)
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`${CHIP} bg-tone-pink/15 text-tone-pink`}>{formatBudget(budget)}</span>
      {day && <span className={`${CHIP} bg-tone-gold/15 text-tone-gold`}>обмен {day}</span>}
      {draw && <span className={`${CHIP} bg-secondary text-muted-foreground`}>жеребьёвка {draw}</span>}
      {participantsCount !== undefined && (
        <span className={`${CHIP} bg-secondary text-muted-foreground`}>{participantsLabel(participantsCount)}</span>
      )}
    </div>
  )
}
```

`app/santa/r/[slug]/components/invite-header.tsx` — вызов `RoomChips`:

```tsx
      <RoomChips
        budget={invite.budget}
        exchangeDate={invite.exchangeDate}
        drawAt={invite.status === 'open' ? invite.drawAt : null}
        participantsCount={invite.participantsCount}
      />
```

- [ ] **Step 3: Комната организатора**

`app/santa/rooms/[id]/page.tsx`:

1. Импорт из `@/shared/santa` — добавить `formatDrawAt`.
2. После `const onError = …`:

```tsx
  const drawAtLabel = open ? formatDrawAt(room.drawAt) : null
```

3. В шапке `<RoomChips budget={room.budget} exchangeDate={room.exchangeDate} />` → `<RoomChips budget={room.budget} exchangeDate={room.exchangeDate} drawAt={open ? room.drawAt : null} />`.
4. В секции «Жеребьёвка», ветка `open`, перед первым `<p className="text-body-sm text-muted-foreground">`:

```tsx
                {room.drawFailedAt && (
                  <p role="alert" className="rounded-control border border-destructive/40 bg-destructive/10 px-4 py-3 text-body-sm">
                    Жеребьёвка по расписанию не прошла: мало готовых участников. Попросите остальных подключить почту
                    или Telegram и проведите жеребьёвку вручную — или назначьте новое время в настройках.
                  </p>
                )}
                {drawAtLabel && (
                  <p className="text-body-sm">
                    Пройдёт автоматически {drawAtLabel}.
                    {!enough && ' Если к этому времени готовых будет меньше трёх, она не состоится.'}
                  </p>
                )}
```

- [ ] **Step 4: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `node tests/token-audit.cjs app/santa components shared`
Expected: чисто, аудит `всего 0`.

Ручная проверка (`pnpm dev` + бэк `make dev`): создать комнату со временем через 2 минуты и тремя готовыми участниками → чип «жеребьёвка …» в комнате и в приглашении → через ≤ 1 мин после времени страница сама показывает «Жеребьёвка прошла». Вторая комната с одним готовым → после времени плашка «не прошла», поле времени в настройках пустое; новое время в настройках — плашка исчезла.

- [ ] **Step 5: Commit**

```bash
git add app/santa/components "app/santa/rooms/[id]/page.tsx" "app/santa/r/[slug]/components/invite-header.tsx"
git commit -m "feat(front): Санта — жеребьёвка по расписанию в форме, комнате и приглашении"
```

---

### Task 12: Анонимный чат участника

**Files:**
- Create: `FRONT/app/santa/r/[slug]/components/chat-card.tsx`
- Modify: `FRONT/app/santa/r/[slug]/components/envelope.tsx`
- Modify: `FRONT/app/santa/r/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useApiSantaChat`, `useApiSantaSendChat`, `chatSchema`, `ChatValues`, `chatTabLabel`, `formatTime`, `SantaChatUnread`, `SantaChatWith` (задача 10); `Segmented` (`components/ui/segmented.tsx`).
- Produces: `ChatCard({ slug, receiverName, unread })`; `Envelope` принимает `children` — показывается только в открытом конверте (чат не раскрывает имя подопечного до вскрытия).

- [ ] **Step 1: Карточка чата**

Создать `app/santa/r/[slug]/components/chat-card.tsx`:

```tsx
'use client'

import { useApiSantaChat, useApiSantaSendChat } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Segmented } from '@/components/ui/segmented'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { type ChatValues, apiErrorMessage, chatSchema, chatTabLabel, formatTime } from '@/shared/santa'
import type { SantaChatUnread, SantaChatWith } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessagesSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

export function ChatCard({ slug, receiverName, unread }: { slug: string; receiverName: string; unread: SantaChatUnread | null }) {
  const [withWho, setWithWho] = useState<SantaChatWith>('receiver')
  const chat = useApiSantaChat(slug, withWho)
  const send = useApiSantaSendChat(slug)
  const form = useForm<ChatValues>({ resolver: zodResolver(chatSchema), defaultValues: { body: '' } })
  const listRef = useRef<HTMLOListElement>(null)
  const messages = chat.data?.data.messages ?? []

  // Новое сообщение или другая вкладка — к последнему.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, withWho])

  const submit = form.handleSubmit(v => send.mutate({ with: withWho, body: v.body.trim() }, {
    onSuccess: () => form.reset({ body: '' }),
    onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
  }))

  const options = [
    ['receiver', chatTabLabel('receiver', unread)],
    ['santa', chatTabLabel('santa', unread)],
  ] as const
  const other = withWho === 'receiver' ? receiverName : 'Санта'

  return (
    <section id="chat" className="space-y-5 rounded-card border border-border bg-card p-6" aria-labelledby="chat-title">
      <div className="flex items-center gap-2.5">
        <MessagesSquare className="size-5 text-tone-pink" aria-hidden />
        <h2 id="chat-title" className="text-title-sm">Анонимный чат</h2>
      </div>
      <Segmented value={withWho} options={options} onChange={setWithWho} label="С кем переписка" />
      <p className="text-body-sm text-muted-foreground">
        {withWho === 'receiver'
          ? `${receiverName} не узнает, кто вы. Спросите про размер, любимый цвет или что точно не дарить.`
          : 'Ваш Санта знает ваше имя, а вы его — нет. Подскажите, что порадует.'}
      </p>

      {chat.isError ? (
        <div className="space-y-3">
          <p className="text-body-sm text-muted-foreground">Не удалось загрузить переписку</p>
          <Button variant="secondary" onClick={() => chat.refetch()}>Повторить</Button>
        </div>
      ) : messages.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{chat.isPending ? 'Загружаем переписку…' : 'Сообщений пока нет.'}</p>
      ) : (
        <ol ref={listRef} className="max-h-96 space-y-3 overflow-y-auto" aria-label="Сообщения" aria-live="polite">
          {messages.map(m => (
            <li key={m.id} className={cn('flex flex-col gap-1', m.mine ? 'items-end' : 'items-start')}>
              <p
                className={cn(
                  'max-w-sm whitespace-pre-line break-words rounded-control px-3.5 py-2.5 text-body',
                  m.mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
                )}
              >
                {m.body}
              </p>
              <span className="text-caption text-muted-foreground">
                {m.mine ? 'вы' : other} · {formatTime(new Date(m.createdAt))}
              </span>
            </li>
          ))}
        </ol>
      )}

      <Form {...form}>
        <form className="space-y-3" onSubmit={submit}>
          <FormField control={form.control} name="body" render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Сообщение</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  maxLength={1000}
                  placeholder={withWho === 'receiver' ? `Сообщение для: ${receiverName}` : 'Сообщение своему Санте'}
                  {...field}
                  onKeyDown={e => {
                    // Ctrl/⌘+Enter — отправить; просто Enter — новая строка.
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      void submit()
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="festive" loading={send.isPending}>Отправить</Button>
            <p className="text-caption text-muted-foreground">В Telegram можно ответить прямо на сообщение бота.</p>
          </div>
        </form>
      </Form>
    </section>
  )
}
```

- [ ] **Step 2: Чат — только в открытом конверте**

`app/santa/r/[slug]/components/envelope.tsx`:

1. Импорт: `import { type ReactNode, useEffect, useState } from 'react'`.
2. Сигнатура:

```tsx
export function Envelope({ slug, room, receiver, ready, children }: {
  slug: string
  room: SantaInvite
  receiver: SantaReceiver | null
  ready: boolean
  /** Показывается только после вскрытия: там имя подопечного. */
  children?: ReactNode
}) {
```

3. Последний `return` (открытый конверт) заменить целиком — секция та же, после неё `children`:

```tsx
  return (
    <>
      <section className="space-y-6" aria-live="polite">
        <div>
          <p className="text-lead text-muted-foreground">Вы — Тайный Санта для</p>
          <h1 className="mt-2 text-display-sm">{receiver.name}</h1>
        </div>
        <RoomChips budget={room.budget} exchangeDate={room.exchangeDate} />
        {receiver.wishes ? (
          <div className="space-y-2 rounded-card border border-border bg-card p-5">
            <p className="text-eyebrow uppercase text-muted-foreground">Пожелания</p>
            <p className="whitespace-pre-line break-words text-body">{receiver.wishes}</p>
          </div>
        ) : (
          <p className="text-body text-muted-foreground">Пожеланий нет — придётся угадывать. Посмотрите, нет ли вишлиста.</p>
        )}
        {receiver.wishlistUrl && isHttpUrl(receiver.wishlistUrl) && (
          <Button asChild variant="secondary" size="lg">
            <a href={receiver.wishlistUrl} target="_blank" rel="noopener noreferrer nofollow">
              <ExternalLink aria-hidden />
              Открыть вишлист
            </a>
          </Button>
        )}
      </section>
      {children}
    </>
  )
```

`app/santa/r/[slug]/page.tsx`: импорт `import { ChatCard } from './components/chat-card'`; ветку разыгранной комнаты заменить:

```tsx
  if (mine && mine.room.status === 'drawn') {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <Envelope slug={slug} room={mine.room} receiver={mine.receiver} ready={mine.notify.ready}>
          {mine.receiver && <ChatCard slug={slug} receiverName={mine.receiver.name} unread={mine.chat} />}
        </Envelope>
        <NotifyCard slug={slug} notify={mine.notify} drawn inDraw={mine.receiver !== null} />
        <MyCard slug={slug} me={mine} />
      </div>
    )
  }
```

- [ ] **Step 3: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `node tests/token-audit.cjs app/santa components shared`
Expected: чисто, аудит `всего 0`.

Ручная проверка (`pnpm dev` + бэк `make dev`, бот — в лог): разыгранная комната из трёх в трёх браузерах (обычное окно, инкогнито, другой браузер). До вскрытия конверта чата нет. Аня пишет подопечному → у подопечного на вкладке «Моему Санте · 1 новое» (после обновления карточки, ≤ 1 мин); в чате подпись «Санта», имени Ани нигде нет (в том числе в ответе `GET …/chat?with=santa` во вкладке «Сеть»). Ответ подопечного приходит Ане на вкладку «Подопечному». 31-е сообщение за час — тост «не больше 30 сообщений в час». Перезапуск жеребьёвки организатором — переписка пустая.

- [ ] **Step 4: Commit**

```bash
git add "app/santa/r/[slug]/components/chat-card.tsx" "app/santa/r/[slug]/components/envelope.tsx" "app/santa/r/[slug]/page.tsx"
git commit -m "feat(front): Санта — анонимный чат Санты и подопечного в конверте"
```

---

### Task 13: Выкладка (делает пользователь)

**Files:** — (Dokploy, Telegram)

- [ ] **Step 1: Бэк.** Задеплоить ветку на тестовый стек Dokploy. Новых переменных окружения нет. При старте `AutoMigrate` добавит `santa_rooms.draw_failed_at`, `santa_participants.pending_email`, `santa_notifications.tg_message_id`, таблицу `santa_messages` и индексы; `BackfillSantaPendingEmail` перенесёт неподтверждённые адреса. В логе — нет `WARNING: SMTP_HOST не задан` (иначе письма уйдут в `failed`, проверить env).
- [ ] **Step 2: Вебхук бота** не перерегистрировать: ответы (reply) — те же апдейты `message`, `allowed_updates=["message"]` их уже пропускает.
- [ ] **Step 3: Дымовая проверка на тестовом стеке:**
  - комната с `draw_at` через 3 мин и тремя готовыми — жеребьёвка прошла сама, всем пришло «кому дарить»;
  - комната с `draw_at` и двумя готовыми, организатор участвует через Telegram — плашка «не прошла» и сообщение бота организатору;
  - чат: Санта пишет в Telegram-подопечному → бот присылает «Вам пишет ваш Тайный Санта» без имени; Reply на это сообщение → «Отправлено ✓», ответ виден Санте на странице; Reply на старое сообщение после перезапуска → «чат закрыт»;
  - почта: подтверждённый участник меняет адрес — в списке организатора остаётся «канал подтверждён», письма идут на старый адрес до ввода кода;
  - заблокировать бота у одного участника и отправить ему сообщение чата → в `santa_notifications` строка `failed` с `attempts = 1`.
- [ ] **Step 4: Финиш ветки** — `superpowers:finishing-a-development-branch` в обоих репозиториях; слияние `feature/santa-stage3` → `feature/santa`.
