# Тайный Санта, этап 2: уведомления — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** участник подтверждает канал — почту кодом или Telegram-бота; в жеребьёвку попадают только готовые; после жеребьёвки, напоминания организатора и правки пожеланий подопечного каждый получает сообщение в свой канал.

**Architecture:** бэк — поля канала у участника, таблицы кодов почты, одноразовых ссылок Telegram и outbox `santa_notifications`. События (жеребьёвка, подтверждение канала, напоминание, правка пожеланий) пишут уведомление в той же транзакции, что и само событие. Горутина-обработчик раз в 5 с забирает созревшие уведомления (`FOR UPDATE SKIP LOCKED` + аренда), собирает текст из текущего состояния базы и шлёт через `pkg/mailer` (SMTP Yandex Cloud Postbox) или `pkg/telegram` (Bot API); неудача — повтор через 1, 5, 30 мин, после 4 попыток `failed`. Бот — вебхук `/api/v1/telegram/webhook`. Фронт — блок «Куда прислать результат» у участника, готовность и «Напомнить» у организатора.

**Tech Stack:** Go 1.25, fiber v2, gorm + Postgres 17, `net/smtp`, `html/template`, testify, testcontainers; Next.js 16, TanStack Query 5, react-hook-form + zod, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-05-secret-santa-design.md`, раздел «Этап 2. Уведомления» и решения в начале. Этап 1 (ветка `feature/santa`) уже влит.

**Репозитории:** фронт — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-front` (далее FRONT), бэк — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back` (далее BACK; модуль Go — `main`). Перед началом — ветка `feature/santa-stage2` от `feature/santa` в обоих. Коммиты — от имени пользователя, **без трейлера `Co-Authored-By`**.

## Global Constraints

- Пакетный менеджер фронта — `pnpm`.
- Дизайн-система фронта: только токены по роли (`text-body`, `rounded-control`, `h-control`, `shadow-float`, `duration-base`); никаких стоковых размеров текста/скруглений/теней и `[…]`. Цвета в TSX — только классами ролей. Проверка: `node tests/token-audit.cjs app/santa components shared` → `всего 0`.
- Тексты интерфейса, писем и бота — по-русски, на «вы».
- Схема БД — gorm `AutoMigrate`, без SQL-миграций.
- Участник «готов», если `channel='email' AND email_verified_at IS NOT NULL` или `channel='telegram' AND tg_chat_id IS NOT NULL` (спека).
- Жеребьёвка тянет только готовых; готовых меньше 3 — 422 «нужно минимум 3 участника».
- Код почты: 6 цифр, живёт 15 мин, не больше 5 попыток, повтор отправки не чаще раза в 60 с. В базе — только хэш кода.
- Ссылка Telegram: одноразовый токен, 24 ч, в базе — только хэш. Вебхук проверяет заголовок `X-Telegram-Bot-Api-Secret-Token`.
- Outbox: уведомление пишется в той же транзакции, что и событие; обработчик — тик 5 с; повтор через 1, 5, 30 мин; после 4 попыток — `failed`.
- «Напомнить» — не чаще раза в 12 ч на комнату.
- Пользовательский текст в письмах экранирует `html/template`, в Telegram — `html.EscapeString` (`parse_mode=HTML`).
- Пары тайные: организатор не видит ни пар, ни текста пожеланий, ни адресов почты участников.
- Ошибки API: 404 — нет комнаты/участника; 409 — статус или адрес занят; 422 — валидация и неверный код; 429 — повтор раньше срока.
- Env бэка: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `SANTA_PUBLIC_URL`; токен бота — `SANTA_BOT_TOKEN`, по умолчанию существующий `BOT_TOKEN`.

## Review Focus

1. **Двойная жеребьёвка/перезапуск не шлёт старые пары.** Перезапуск, пока прошлые `drawn` ещё не ушли, — уходит только актуальный подопечный. Тест: `TestSantaRepo_RedrawDropsPendingDrawn` (задача 2); тексты собираются из текущей пары при отправке (задача 7).
2. **Неготовый участник после жеребьёвки** видит понятное «вы не попали в жеребьёвку», а не вечное «пары обновляются». Тест/код: задача 10, ветка `!receiver` в конверте.
3. **Подбор кода почты.** 6-я попытка с верным кодом всё равно отклоняется; новый код сбрасывает счётчик. Тесты: `TestVerifyEmail_LockedAfterFiveAttempts`, `TestRequestEmailCode_Cooldown` (задача 5).
4. **Чужой Telegram-апдейт.** Запрос на вебхук без верного секрета — 401 и ни одного вызова use case; `/start` с устаревшей или чужой ссылкой — ответ «ссылка устарела», а не 500. Тесты: `TestTelegramWebhook_RejectsWrongSecret` (задача 8), `TestTelegramStart_ExpiredLink` (задача 5).
5. **Два обработчика одновременно** (два экземпляра бэка) не шлют одно уведомление дважды. Тест: `TestSantaRepo_ClaimLeasesNotifications` (задача 2).

---

## Карта файлов

**BACK**
- Modify `internal/entity/santa.go` — канал участника, `Ready()`, код почты, ссылка Telegram, уведомление.
- Modify `internal/repo/persistent/santa_models.go` — колонки канала, `last_reminded_at`, модели `SantaEmailCodeModel`, `SantaTgLinkModel`, `SantaNotificationModel`.
- Modify `internal/repo/persistent/santa_postgres.go`, create `internal/repo/persistent/santa_notify_postgres.go`.
- Modify `internal/repo/contracts.go` — `ErrTooSoon`, методы `SantaRepo`.
- Modify `mock/repo/mock_santa_repo.go`.
- Modify `internal/repo/persistent/santa_integration_test.go`, create `santa_notify_integration_test.go`.
- Create `pkg/mailer/mailer.go`, `pkg/mailer/mailer_test.go`, `pkg/telegram/telegram.go`, `pkg/telegram/telegram_test.go`.
- Modify `internal/usecase/contracts.go` — `Mailer`, `TelegramSender`, ошибки, типы, методы.
- Create `internal/usecase/santa/messages.go`, `messages_test.go`, `channels.go`, `channels_test.go`, `remind.go`, `remind_test.go`, `notifier.go`, `notifier_test.go`.
- Modify `internal/usecase/santa/santa.go`, `participant.go`, `draw.go`, `secret.go` и их тесты.
- Modify `internal/controller/restapi/v1/santa.go`, `santa_test.go`, `internal/controller/restapi/router.go`.
- Modify `config/config.go`, `internal/app/app.go`, `.env.example`, `Makefile`.

**FRONT**
- Modify `shared/types.ts`, `shared/santa.ts`, `tests/santa.test.cjs`, `api/santa/index.ts`.
- Create `app/santa/r/[slug]/components/notify-card.tsx`; modify `app/santa/r/[slug]/page.tsx`, `components/envelope.tsx`.
- Modify `app/santa/rooms/[id]/page.tsx`.

---

## Бэкенд

### Task 1: Данные каналов и репозиторий подтверждений

**Files:**
- Modify: `BACK/internal/entity/santa.go`
- Modify: `BACK/internal/repo/persistent/santa_models.go`
- Modify: `BACK/internal/repo/persistent/santa_postgres.go`
- Create: `BACK/internal/repo/persistent/santa_notify_postgres.go`
- Modify: `BACK/internal/repo/contracts.go`
- Modify: `BACK/mock/repo/mock_santa_repo.go`
- Modify: `BACK/internal/repo/persistent/santa_integration_test.go`
- Create: `BACK/internal/repo/persistent/santa_notify_integration_test.go`
- Modify: `BACK/internal/app/app.go` (только список AutoMigrate)

**Interfaces:**
- Produces: `entity.SantaChannel` (`SantaChannelNone`, `SantaChannelEmail`, `SantaChannelTelegram`); поля `SantaParticipant.Channel`, `.Email`, `.EmailVerifiedAt`, `.TgChatID`; метод `(SantaParticipant) Ready() bool`; `SantaRoom.LastRemindedAt`; `entity.SantaEmailCode`, `entity.SantaTgLink`; `entity.SantaNotificationKind` (`SantaNotifyWelcome`, `SantaNotifyDrawn`, `SantaNotifyReminderFill`, `SantaNotifyWishesUpdated`), `entity.SantaNotificationStatus` (`…Pending`, `…Sent`, `…Failed`), `entity.SantaNotification`, `entity.NewSantaNotification(participantID uuid.UUID, kind SantaNotificationKind, now time.Time) SantaNotification`.
- Produces (repo): `SetEmail(ctx, participantID uuid.UUID, email string, code entity.SantaEmailCode) error` (адрес занят в комнате — `ErrDuplicate`), `GetEmailCode(ctx, participantID) (entity.SantaEmailCode, error)`, `IncEmailCodeAttempts(ctx, participantID) error`, `DeleteEmailCode(ctx, participantID) error`, `VerifyEmail(ctx, participantID uuid.UUID, at time.Time, welcome entity.SantaNotification) error`, `CreateTgLink(ctx, link entity.SantaTgLink) error`, `LinkTelegram(ctx, tokenHash string, chatID int64, now time.Time, welcome func(entity.SantaParticipant) entity.SantaNotification) (entity.SantaParticipant, error)`; модели `persistent.SantaEmailCodeModel`, `SantaTgLinkModel`, `SantaNotificationModel`; хелперы пакета `persistent`: `isUniqueViolation(err error, constraint string) bool`, `insertNotifications(tx *gorm.DB, notes ...entity.SantaNotification) error`, `toSantaNotificationModel`, `toSantaNotificationEntity`.

- [ ] **Step 1: Сущности**

В `internal/entity/santa.go` к `SantaRoom` после `DrawnAt` добавить поле:

```go
	// LastRemindedAt — когда организатор последний раз нажал «Напомнить».
	LastRemindedAt *time.Time `json:"lastRemindedAt"`
```

К `SantaParticipant` после `GiftReady bool` добавить:

```go
	// Channel — куда приходят уведомления; пусто — канал не выбран.
	Channel SantaChannel
	// Email в нижнем регистре; пусто — адреса нет.
	Email           string
	EmailVerifiedAt *time.Time
	TgChatID        *int64
```

И в конец файла:

```go
// SantaChannel — куда участнику приходят уведомления.
type SantaChannel string

const (
	SantaChannelNone     SantaChannel = ""
	SantaChannelEmail    SantaChannel = "email"
	SantaChannelTelegram SantaChannel = "telegram"
)

// Ready — канал подтверждён: только такие участники попадают в жеребьёвку.
// То же условие в SQL — santaReadySQL в репозитории; меняются вместе.
func (p SantaParticipant) Ready() bool {
	switch p.Channel {
	case SantaChannelEmail:
		return p.Email != "" && p.EmailVerifiedAt != nil
	case SantaChannelTelegram:
		return p.TgChatID != nil
	}
	return false
}

// SantaEmailCode — код подтверждения почты. Сам код не хранится, только хэш.
type SantaEmailCode struct {
	ParticipantID uuid.UUID
	CodeHash      string
	ExpiresAt     time.Time
	Attempts      int
	SentAt        time.Time
}

// SantaTgLink — одноразовая ссылка t.me/<бот>?start=<токен>; хранится хэш токена.
type SantaTgLink struct {
	TokenHash     string
	ParticipantID uuid.UUID
	ExpiresAt     time.Time
}

type SantaNotificationKind string

const (
	// SantaNotifyWelcome — канал подтверждён.
	SantaNotifyWelcome SantaNotificationKind = "welcome"
	// SantaNotifyDrawn — жеребьёвка или перезапуск: кому дарить.
	SantaNotifyDrawn SantaNotificationKind = "drawn"
	// SantaNotifyReminderFill — организатор просит заполнить пожелания.
	SantaNotifyReminderFill SantaNotificationKind = "reminder_fill"
	// SantaNotifyWishesUpdated — подопечный поменял пожелания после жеребьёвки.
	SantaNotifyWishesUpdated SantaNotificationKind = "wishes_updated"
)

type SantaNotificationStatus string

const (
	SantaNotificationPending SantaNotificationStatus = "pending"
	SantaNotificationSent    SantaNotificationStatus = "sent"
	SantaNotificationFailed  SantaNotificationStatus = "failed"
)

// SantaNotification — запись outbox. Текст собирается при отправке из
// текущего состояния базы, поэтому Payload пока пустой — место на будущее.
type SantaNotification struct {
	ID            uuid.UUID
	ParticipantID uuid.UUID
	Kind          SantaNotificationKind
	Payload       map[string]string
	Status        SantaNotificationStatus
	Attempts      int
	NextTryAt     time.Time
	LastError     string
	CreatedAt     time.Time
}

// NewSantaNotification — уведомление в очередь «отправить сейчас».
func NewSantaNotification(participantID uuid.UUID, kind SantaNotificationKind, now time.Time) SantaNotification {
	return SantaNotification{
		ID: uuid.New(), ParticipantID: participantID, Kind: kind, Payload: map[string]string{},
		Status: SantaNotificationPending, NextTryAt: now, CreatedAt: now,
	}
}
```

- [ ] **Step 2: Модели**

В `internal/repo/persistent/santa_models.go`:

`SantaRoomModel` — после `DrawnAt *time.Time` добавить `LastRemindedAt *time.Time`; в `toSantaRoomModel` и `toSantaRoomEntity` добавить `LastRemindedAt: r.LastRemindedAt` / `LastRemindedAt: m.LastRemindedAt`.

`SantaParticipantModel` заменить целиком:

```go
type SantaParticipantModel struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey"`
	// Входит в два уникальных индекса: (room_id, user_id) и (room_id, email).
	RoomID uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_santa_participant_user;uniqueIndex:idx_santa_participant_email"`
	// NULL у гостей: уникальность (room_id, user_id) их не задевает.
	UserID      *uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_santa_participant_user"`
	Name        string     `gorm:"not null"`
	Wishes      string     `gorm:"not null;default:''"`
	WishlistURL string     `gorm:"column:wishlist_url;not null;default:''"`
	TokenHash   string     `gorm:"not null;uniqueIndex"`
	GiftReady   bool       `gorm:"not null;default:false"`
	Channel     string     `gorm:"not null;default:''"`
	// NULL, пока адреса нет: уникальность (room_id, email) пустых не задевает.
	Email           *string `gorm:"uniqueIndex:idx_santa_participant_email"`
	EmailVerifiedAt *time.Time
	TgChatID        *int64
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`

	Given    []SantaAssignmentModel `gorm:"foreignKey:GiverID;constraint:OnDelete:CASCADE"`
	Received []SantaAssignmentModel `gorm:"foreignKey:ReceiverID;constraint:OnDelete:CASCADE"`
	// Ради внешних ключей с каскадом; в запросах не используются.
	EmailCode     *SantaEmailCodeModel     `gorm:"foreignKey:ParticipantID;constraint:OnDelete:CASCADE"`
	TgLinks       []SantaTgLinkModel       `gorm:"foreignKey:ParticipantID;constraint:OnDelete:CASCADE"`
	Notifications []SantaNotificationModel `gorm:"foreignKey:ParticipantID;constraint:OnDelete:CASCADE"`
}
```

Конвертеры участника заменить:

```go
func toSantaParticipantModel(p entity.SantaParticipant) SantaParticipantModel {
	var email *string
	if p.Email != "" {
		e := p.Email
		email = &e
	}
	return SantaParticipantModel{
		ID: p.ID, RoomID: p.RoomID, UserID: p.UserID, Name: p.Name, Wishes: p.Wishes,
		WishlistURL: p.WishlistURL, TokenHash: p.TokenHash, GiftReady: p.GiftReady,
		Channel: string(p.Channel), Email: email, EmailVerifiedAt: p.EmailVerifiedAt, TgChatID: p.TgChatID,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt,
	}
}

func toSantaParticipantEntity(m SantaParticipantModel) entity.SantaParticipant {
	email := ""
	if m.Email != nil {
		email = *m.Email
	}
	return entity.SantaParticipant{
		ID: m.ID, RoomID: m.RoomID, UserID: m.UserID, Name: m.Name, Wishes: m.Wishes,
		WishlistURL: m.WishlistURL, TokenHash: m.TokenHash, GiftReady: m.GiftReady,
		Channel: entity.SantaChannel(m.Channel), Email: email, EmailVerifiedAt: m.EmailVerifiedAt, TgChatID: m.TgChatID,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}
```

В конец файла:

```go
type SantaEmailCodeModel struct {
	ParticipantID uuid.UUID `gorm:"type:uuid;primaryKey"`
	CodeHash      string    `gorm:"not null"`
	ExpiresAt     time.Time `gorm:"not null"`
	Attempts      int       `gorm:"not null;default:0"`
	SentAt        time.Time `gorm:"not null"`
}

func (SantaEmailCodeModel) TableName() string { return "santa_email_codes" }

type SantaTgLinkModel struct {
	TokenHash     string    `gorm:"primaryKey"`
	ParticipantID uuid.UUID `gorm:"type:uuid;not null;index"`
	ExpiresAt     time.Time `gorm:"not null"`
}

func (SantaTgLinkModel) TableName() string { return "santa_tg_links" }

type SantaNotificationModel struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
	ParticipantID uuid.UUID `gorm:"type:uuid;not null;index"`
	Kind          string    `gorm:"not null"`
	// JSON-объект строкой: text, а не jsonb — payload пока не читается в SQL.
	Payload   string    `gorm:"type:text;not null;default:'{}'"`
	Status    string    `gorm:"not null;default:pending;index:idx_santa_notification_due,priority:1"`
	Attempts  int       `gorm:"not null;default:0"`
	NextTryAt time.Time `gorm:"not null;index:idx_santa_notification_due,priority:2"`
	LastError string    `gorm:"not null;default:''"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (SantaNotificationModel) TableName() string { return "santa_notifications" }

func toSantaNotificationModel(n entity.SantaNotification) SantaNotificationModel {
	payload := "{}"
	if len(n.Payload) > 0 {
		if b, err := json.Marshal(n.Payload); err == nil {
			payload = string(b)
		}
	}
	return SantaNotificationModel{
		ID: n.ID, ParticipantID: n.ParticipantID, Kind: string(n.Kind), Payload: payload,
		Status: string(n.Status), Attempts: n.Attempts, NextTryAt: n.NextTryAt,
		LastError: n.LastError, CreatedAt: n.CreatedAt,
	}
}

func toSantaNotificationEntity(m SantaNotificationModel) entity.SantaNotification {
	payload := map[string]string{}
	_ = json.Unmarshal([]byte(m.Payload), &payload)
	return entity.SantaNotification{
		ID: m.ID, ParticipantID: m.ParticipantID, Kind: entity.SantaNotificationKind(m.Kind), Payload: payload,
		Status: entity.SantaNotificationStatus(m.Status), Attempts: m.Attempts, NextTryAt: m.NextTryAt,
		LastError: m.LastError, CreatedAt: m.CreatedAt,
	}
}
```

Добавить в импорт `"encoding/json"`.

- [ ] **Step 3: Контракт репозитория**

В `internal/repo/contracts.go` рядом с `ErrStatusMismatch`:

```go
// ErrTooSoon — повтор раньше разрешённого (напоминание организатора).
var ErrTooSoon = errors.New("too soon")
```

В интерфейс `SantaRepo` перед `GetAssignment` добавить:

```go
	// Каналы уведомлений.
	// SetEmail ставит новый адрес (подтверждение сбрасывается) и кладёт код —
	// одной транзакцией. Адрес уже у другого участника комнаты — ErrDuplicate;
	// участника нет — ErrNotFound.
	SetEmail(ctx context.Context, participantID uuid.UUID, email string, code entity.SantaEmailCode) error
	GetEmailCode(ctx context.Context, participantID uuid.UUID) (entity.SantaEmailCode, error)
	IncEmailCodeAttempts(ctx context.Context, participantID uuid.UUID) error
	DeleteEmailCode(ctx context.Context, participantID uuid.UUID) error
	// VerifyEmail: адрес подтверждён, канал — почта, код стёрт, приветствие в
	// очереди — одной транзакцией.
	VerifyEmail(ctx context.Context, participantID uuid.UUID, at time.Time, welcome entity.SantaNotification) error
	CreateTgLink(ctx context.Context, link entity.SantaTgLink) error
	// LinkTelegram по одноразовой ссылке: чат записан, канал — Telegram,
	// ссылки участника стёрты, приветствие в очереди. Ссылки нет или она
	// истекла — ErrNotFound.
	LinkTelegram(ctx context.Context, tokenHash string, chatID int64, now time.Time, welcome func(entity.SantaParticipant) entity.SantaNotification) (entity.SantaParticipant, error)
```

Добавить `"time"` в импорт, если его нет.

- [ ] **Step 4: Падающий интеграционный тест**

В `internal/repo/persistent/santa_integration_test.go` заменить `setupSantaDB` и `seedParticipants`, добавить `seedUnready`:

```go
func setupSantaDB(t *testing.T) *gorm.DB {
	t.Helper()
	db := setupDB(t)
	require.NoError(t, db.AutoMigrate(
		&persistent.SantaRoomModel{},
		&persistent.SantaParticipantModel{},
		&persistent.SantaAssignmentModel{},
		&persistent.SantaEmailCodeModel{},
		&persistent.SantaTgLinkModel{},
		&persistent.SantaNotificationModel{},
	))
	return db
}

var chatSeq int64 = 1000

// seedParticipants — готовые участники (подтверждён Telegram): с этапа 2 в
// жеребьёвку попадают только такие.
func seedParticipants(t *testing.T, r repo.SantaRepo, roomID uuid.UUID, n int) []uuid.UUID {
	t.Helper()
	ids := make([]uuid.UUID, n)
	for i := range ids {
		chatSeq++
		chat := chatSeq
		p := entity.SantaParticipant{
			ID: uuid.New(), RoomID: roomID, Name: "Участник", TokenHash: uuid.NewString(),
			Channel: entity.SantaChannelTelegram, TgChatID: &chat,
		}
		require.NoError(t, r.CreateParticipant(context.Background(), p))
		ids[i] = p.ID
	}
	return ids
}

// seedUnready — участники без подтверждённого канала.
func seedUnready(t *testing.T, r repo.SantaRepo, roomID uuid.UUID, n int) []uuid.UUID {
	t.Helper()
	ids := make([]uuid.UUID, n)
	for i := range ids {
		p := entity.SantaParticipant{ID: uuid.New(), RoomID: roomID, Name: "Без канала", TokenHash: uuid.NewString()}
		require.NoError(t, r.CreateParticipant(context.Background(), p))
		ids[i] = p.ID
	}
	return ids
}
```

Создать `internal/repo/persistent/santa_notify_integration_test.go`:

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
	"gorm.io/gorm"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/repo/persistent"
)

func countNotes(t *testing.T, db *gorm.DB, participantID uuid.UUID, kind entity.SantaNotificationKind) int64 {
	t.Helper()
	var n int64
	require.NoError(t, db.Model(&persistent.SantaNotificationModel{}).
		Where("participant_id = ? AND kind = ?", participantID, string(kind)).Count(&n).Error)
	return n
}

func emailCode(id uuid.UUID, now time.Time) entity.SantaEmailCode {
	return entity.SantaEmailCode{ParticipantID: id, CodeHash: "hash-" + id.String(), ExpiresAt: now.Add(15 * time.Minute), SentAt: now}
}

func TestSantaRepo_EmailVerification(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	id := seedUnready(t, r, room.ID, 1)[0]
	now := time.Now().UTC().Truncate(time.Second)

	require.NoError(t, r.SetEmail(ctx, id, "anna@example.com", emailCode(id, now)))
	p, err := r.GetParticipant(ctx, id)
	require.NoError(t, err)
	assert.Equal(t, "anna@example.com", p.Email)
	assert.False(t, p.Ready(), "до подтверждения не готов")

	code, err := r.GetEmailCode(ctx, id)
	require.NoError(t, err)
	assert.Equal(t, "hash-"+id.String(), code.CodeHash)
	assert.Equal(t, 0, code.Attempts)

	require.NoError(t, r.IncEmailCodeAttempts(ctx, id))
	code, err = r.GetEmailCode(ctx, id)
	require.NoError(t, err)
	assert.Equal(t, 1, code.Attempts)

	welcome := entity.NewSantaNotification(id, entity.SantaNotifyWelcome, now)
	require.NoError(t, r.VerifyEmail(ctx, id, now, welcome))
	p, err = r.GetParticipant(ctx, id)
	require.NoError(t, err)
	assert.True(t, p.Ready())
	assert.Equal(t, entity.SantaChannelEmail, p.Channel)
	_, err = r.GetEmailCode(ctx, id)
	assert.ErrorIs(t, err, repo.ErrNotFound, "код стёрт")
	assert.EqualValues(t, 1, countNotes(t, db, id, entity.SantaNotifyWelcome))
}

func TestSantaRepo_SetEmailResetsVerificationAndCode(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	id := seedUnready(t, r, room.ID, 1)[0]
	now := time.Now().UTC().Truncate(time.Second)

	require.NoError(t, r.SetEmail(ctx, id, "a@example.com", emailCode(id, now)))
	require.NoError(t, r.VerifyEmail(ctx, id, now, entity.NewSantaNotification(id, entity.SantaNotifyWelcome, now)))
	require.NoError(t, r.IncEmailCodeAttempts(ctx, id)) // кода уже нет — тихо ничего

	later := now.Add(2 * time.Minute)
	require.NoError(t, r.SetEmail(ctx, id, "b@example.com", emailCode(id, later)))
	p, err := r.GetParticipant(ctx, id)
	require.NoError(t, err)
	assert.Equal(t, "b@example.com", p.Email)
	assert.Nil(t, p.EmailVerifiedAt, "новый адрес надо подтвердить заново")
	assert.False(t, p.Ready())

	code, err := r.GetEmailCode(ctx, id)
	require.NoError(t, err)
	assert.WithinDuration(t, later, code.SentAt, time.Second)
	assert.Equal(t, 0, code.Attempts, "новый код — счётчик попыток с нуля")
}

func TestSantaRepo_EmailUniqueWithinRoom(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	now := time.Now().UTC()
	room := seedRoom(t, r, uuid.New())
	ids := seedUnready(t, r, room.ID, 2)
	require.NoError(t, r.SetEmail(ctx, ids[0], "same@example.com", emailCode(ids[0], now)))

	err := r.SetEmail(ctx, ids[1], "same@example.com", emailCode(ids[1], now))
	assert.ErrorIs(t, err, repo.ErrDuplicate)

	other := seedRoom(t, r, uuid.New())
	stranger := seedUnready(t, r, other.ID, 1)[0]
	assert.NoError(t, r.SetEmail(ctx, stranger, "same@example.com", emailCode(stranger, now)), "в другой комнате адрес свободен")
}

func TestSantaRepo_SetEmailMissingParticipant(t *testing.T) {
	r := persistent.NewSantaRepo(setupSantaDB(t))
	id := uuid.New()
	err := r.SetEmail(context.Background(), id, "x@example.com", emailCode(id, time.Now()))
	assert.ErrorIs(t, err, repo.ErrNotFound)
}

func TestSantaRepo_LinkTelegram(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	id := seedUnready(t, r, room.ID, 1)[0]
	now := time.Now().UTC()
	require.NoError(t, r.CreateTgLink(ctx, entity.SantaTgLink{TokenHash: "tok", ParticipantID: id, ExpiresAt: now.Add(time.Hour)}))
	require.NoError(t, r.CreateTgLink(ctx, entity.SantaTgLink{TokenHash: "tok2", ParticipantID: id, ExpiresAt: now.Add(time.Hour)}))

	welcome := func(p entity.SantaParticipant) entity.SantaNotification {
		return entity.NewSantaNotification(p.ID, entity.SantaNotifyWelcome, now)
	}
	p, err := r.LinkTelegram(ctx, "tok", 777, now, welcome)
	require.NoError(t, err)
	assert.Equal(t, id, p.ID)
	require.NotNil(t, p.TgChatID)
	assert.EqualValues(t, 777, *p.TgChatID)
	assert.True(t, p.Ready())
	assert.EqualValues(t, 1, countNotes(t, db, id, entity.SantaNotifyWelcome))

	_, err = r.LinkTelegram(ctx, "tok", 777, now, welcome)
	assert.ErrorIs(t, err, repo.ErrNotFound, "ссылка одноразовая")
	_, err = r.LinkTelegram(ctx, "tok2", 777, now, welcome)
	assert.ErrorIs(t, err, repo.ErrNotFound, "остальные ссылки участника тоже стёрты")
}

func TestSantaRepo_LinkTelegramExpired(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	id := seedUnready(t, r, room.ID, 1)[0]
	now := time.Now().UTC()
	require.NoError(t, r.CreateTgLink(ctx, entity.SantaTgLink{TokenHash: "old", ParticipantID: id, ExpiresAt: now.Add(-time.Minute)}))

	_, err := r.LinkTelegram(ctx, "old", 1, now, func(p entity.SantaParticipant) entity.SantaNotification {
		return entity.NewSantaNotification(p.ID, entity.SantaNotifyWelcome, now)
	})
	assert.ErrorIs(t, err, repo.ErrNotFound)
	p, err := r.GetParticipant(ctx, id)
	require.NoError(t, err)
	assert.Nil(t, p.TgChatID)
}

func TestSantaRepo_DeleteParticipantCascadesChannelData(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	id := seedUnready(t, r, room.ID, 1)[0]
	now := time.Now().UTC()
	require.NoError(t, r.SetEmail(ctx, id, "c@example.com", emailCode(id, now)))
	require.NoError(t, r.CreateTgLink(ctx, entity.SantaTgLink{TokenHash: "t", ParticipantID: id, ExpiresAt: now.Add(time.Hour)}))
	require.NoError(t, r.VerifyEmail(ctx, id, now, entity.NewSantaNotification(id, entity.SantaNotifyWelcome, now)))

	require.NoError(t, r.DeleteParticipant(ctx, id))
	assert.EqualValues(t, 0, countNotes(t, db, id, entity.SantaNotifyWelcome))
	var links int64
	require.NoError(t, db.Model(&persistent.SantaTgLinkModel{}).Where("participant_id = ?", id).Count(&links).Error)
	assert.EqualValues(t, 0, links)
}
```

- [ ] **Step 5: Тест падает**

Run: `go vet -tags integration ./internal/repo/persistent/`
Expected: FAIL — `r.SetEmail undefined` и т. п.

- [ ] **Step 6: Реализация**

В `santa_postgres.go` добавить хелпер и перевести на него `CreateParticipant`:

```go
// isUniqueViolation — нарушен именно этот уникальный индекс.
func isUniqueViolation(err error, constraint string) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == constraint
}
```

В `CreateParticipant` заменить блок с `pgErr` на:

```go
			if isUniqueViolation(err, "idx_santa_participant_user") {
				return fmt.Errorf("santaRepo.CreateParticipant: %w", repo.ErrDuplicate)
			}
```

Создать `internal/repo/persistent/santa_notify_postgres.go`:

```go
package persistent

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"main/internal/entity"
	"main/internal/repo"
)

// insertNotifications кладёт уведомления в outbox внутри уже открытой транзакции.
func insertNotifications(tx *gorm.DB, notes ...entity.SantaNotification) error {
	if len(notes) == 0 {
		return nil
	}
	models := make([]SantaNotificationModel, len(notes))
	for i, n := range notes {
		models[i] = toSantaNotificationModel(n)
	}
	if err := tx.Create(&models).Error; err != nil {
		return santaErr("santaRepo.insertNotifications", err)
	}
	return nil
}

func (r *santaRepo) SetEmail(ctx context.Context, participantID uuid.UUID, email string, code entity.SantaEmailCode) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&SantaParticipantModel{}).Where("id = ?", participantID).Updates(map[string]any{
			"email":             email,
			"email_verified_at": nil,
			"updated_at":        time.Now(),
		})
		if res.Error != nil {
			if isUniqueViolation(res.Error, "idx_santa_participant_email") {
				return fmt.Errorf("santaRepo.SetEmail: %w", repo.ErrDuplicate)
			}
			return santaErr("santaRepo.SetEmail", res.Error)
		}
		if res.RowsAffected == 0 {
			return fmt.Errorf("santaRepo.SetEmail: %w", repo.ErrNotFound)
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

func (r *santaRepo) GetEmailCode(ctx context.Context, participantID uuid.UUID) (entity.SantaEmailCode, error) {
	var m SantaEmailCodeModel
	if err := r.db.WithContext(ctx).First(&m, "participant_id = ?", participantID).Error; err != nil {
		return entity.SantaEmailCode{}, santaErr("santaRepo.GetEmailCode", err)
	}
	return entity.SantaEmailCode{
		ParticipantID: m.ParticipantID, CodeHash: m.CodeHash, ExpiresAt: m.ExpiresAt,
		Attempts: m.Attempts, SentAt: m.SentAt,
	}, nil
}

func (r *santaRepo) IncEmailCodeAttempts(ctx context.Context, participantID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Model(&SantaEmailCodeModel{}).
		Where("participant_id = ?", participantID).
		UpdateColumn("attempts", gorm.Expr("attempts + 1")).Error; err != nil {
		return santaErr("santaRepo.IncEmailCodeAttempts", err)
	}
	return nil
}

func (r *santaRepo) DeleteEmailCode(ctx context.Context, participantID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&SantaEmailCodeModel{}, "participant_id = ?", participantID).Error; err != nil {
		return santaErr("santaRepo.DeleteEmailCode", err)
	}
	return nil
}

func (r *santaRepo) VerifyEmail(ctx context.Context, participantID uuid.UUID, at time.Time, welcome entity.SantaNotification) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&SantaParticipantModel{}).Where("id = ?", participantID).Updates(map[string]any{
			"email_verified_at": at,
			"channel":           string(entity.SantaChannelEmail),
			"updated_at":        at,
		})
		if res.Error != nil {
			return santaErr("santaRepo.VerifyEmail", res.Error)
		}
		if res.RowsAffected == 0 {
			return fmt.Errorf("santaRepo.VerifyEmail: %w", repo.ErrNotFound)
		}
		if err := tx.Delete(&SantaEmailCodeModel{}, "participant_id = ?", participantID).Error; err != nil {
			return santaErr("santaRepo.VerifyEmail code", err)
		}
		return insertNotifications(tx, welcome)
	})
}

func (r *santaRepo) CreateTgLink(ctx context.Context, link entity.SantaTgLink) error {
	m := SantaTgLinkModel{TokenHash: link.TokenHash, ParticipantID: link.ParticipantID, ExpiresAt: link.ExpiresAt}
	if err := r.db.WithContext(ctx).Create(&m).Error; err != nil {
		return santaErr("santaRepo.CreateTgLink", err)
	}
	return nil
}

func (r *santaRepo) LinkTelegram(ctx context.Context, tokenHash string, chatID int64, now time.Time, welcome func(entity.SantaParticipant) entity.SantaNotification) (entity.SantaParticipant, error) {
	var out entity.SantaParticipant
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var link SantaTgLinkModel
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&link, "token_hash = ?", tokenHash).Error; err != nil {
			return santaErr("santaRepo.LinkTelegram link", err)
		}
		if !link.ExpiresAt.After(now) {
			return fmt.Errorf("santaRepo.LinkTelegram: %w", repo.ErrNotFound)
		}
		if err := tx.Model(&SantaParticipantModel{}).Where("id = ?", link.ParticipantID).Updates(map[string]any{
			"tg_chat_id": chatID,
			"channel":    string(entity.SantaChannelTelegram),
			"updated_at": now,
		}).Error; err != nil {
			return santaErr("santaRepo.LinkTelegram participant", err)
		}
		if err := tx.Delete(&SantaTgLinkModel{}, "participant_id = ?", link.ParticipantID).Error; err != nil {
			return santaErr("santaRepo.LinkTelegram cleanup", err)
		}
		var m SantaParticipantModel
		if err := tx.First(&m, "id = ?", link.ParticipantID).Error; err != nil {
			return santaErr("santaRepo.LinkTelegram reload", err)
		}
		out = toSantaParticipantEntity(m)
		return insertNotifications(tx, welcome(out))
	})
	if err != nil {
		return entity.SantaParticipant{}, err
	}
	return out, nil
}

var _ = errors.Is // errors понадобится в задаче 2; убрать, если линтер ругается
```

Последнюю строку (`var _ = errors.Is`) не писать, если `errors` в файле не используется — тогда убрать и импорт `errors`. Он понадобится в задаче 2.

- [ ] **Step 7: Мок**

В `mock/repo/mock_santa_repo.go` добавить методы (добавить `"time"` в импорт):

```go
func (m *MockSantaRepo) SetEmail(ctx context.Context, participantID uuid.UUID, email string, code entity.SantaEmailCode) error {
	return m.Called(ctx, participantID, email, code).Error(0)
}

func (m *MockSantaRepo) GetEmailCode(ctx context.Context, participantID uuid.UUID) (entity.SantaEmailCode, error) {
	args := m.Called(ctx, participantID)
	code, _ := args.Get(0).(entity.SantaEmailCode)
	return code, args.Error(1)
}

func (m *MockSantaRepo) IncEmailCodeAttempts(ctx context.Context, participantID uuid.UUID) error {
	return m.Called(ctx, participantID).Error(0)
}

func (m *MockSantaRepo) DeleteEmailCode(ctx context.Context, participantID uuid.UUID) error {
	return m.Called(ctx, participantID).Error(0)
}

func (m *MockSantaRepo) VerifyEmail(ctx context.Context, participantID uuid.UUID, at time.Time, welcome entity.SantaNotification) error {
	return m.Called(ctx, participantID, at, welcome).Error(0)
}

func (m *MockSantaRepo) CreateTgLink(ctx context.Context, link entity.SantaTgLink) error {
	return m.Called(ctx, link).Error(0)
}

func (m *MockSantaRepo) LinkTelegram(ctx context.Context, tokenHash string, chatID int64, now time.Time, welcome func(entity.SantaParticipant) entity.SantaNotification) (entity.SantaParticipant, error) {
	args := m.Called(ctx, tokenHash, chatID, now, welcome)
	p, _ := args.Get(0).(entity.SantaParticipant)
	return p, args.Error(1)
}
```

- [ ] **Step 8: AutoMigrate в приложении**

В `internal/app/app.go` в списке `db.AutoMigrate(` заменить строку моделей Санты на:

```go
		&persistent.SantaRoomModel{}, &persistent.SantaParticipantModel{}, &persistent.SantaAssignmentModel{},
		&persistent.SantaEmailCodeModel{}, &persistent.SantaTgLinkModel{}, &persistent.SantaNotificationModel{},
```

- [ ] **Step 9: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run (Docker запущен): `go test -tags integration ./internal/repo/persistent/ -run TestSantaRepo -count=1 -v`
Expected: PASS все `TestSantaRepo_*`, включая старые этапа 1 и 6 новых. Если `TestSantaRepo_EmailUniqueWithinRoom` падает на имени индекса — посмотреть фактическое имя (`\d santa_participants` в контейнере или `pgErr.ConstraintName` в логе) и поправить строку в `isUniqueViolation`, а не тест.

- [ ] **Step 10: Commit**

```bash
gofmt -w internal/entity/santa.go internal/repo/persistent/santa_models.go internal/repo/persistent/santa_postgres.go internal/repo/persistent/santa_notify_postgres.go mock/repo/mock_santa_repo.go
git add internal/entity/santa.go internal/repo/ mock/repo/mock_santa_repo.go internal/app/app.go
git commit -m "feat(backend): каналы уведомлений участника Тайного Санты — почта и Telegram в базе"
```

---

### Task 2: Outbox и события в транзакциях

**Files:**
- Modify: `BACK/internal/repo/contracts.go`
- Modify: `BACK/internal/repo/persistent/santa_postgres.go`
- Modify: `BACK/internal/repo/persistent/santa_notify_postgres.go`
- Modify: `BACK/mock/repo/mock_santa_repo.go`
- Modify: `BACK/internal/usecase/santa/draw.go`, `draw_test.go`, `participant.go` (только вызов `UpdateParticipant`), `participant_test.go`
- Modify: `BACK/internal/repo/persistent/santa_integration_test.go`
- Modify: `BACK/internal/repo/persistent/santa_notify_integration_test.go`

**Interfaces:**
- Consumes: Task 1 (`insertNotifications`, `toSantaNotificationEntity`, `entity.SantaNotification`, `seedParticipants`/`seedUnready`).
- Produces (repo): `Draw(ctx, roomID uuid.UUID, expected entity.SantaRoomStatus, build func(ids []uuid.UUID) ([]entity.SantaAssignment, error), note func(giverID uuid.UUID) entity.SantaNotification) error` — тянет только готовых, стирает несданные `drawn` комнаты, кладёт `note` каждому дарящему; `UpdateParticipant(ctx, p entity.SantaParticipant, notes ...entity.SantaNotification) error`; `GetGiver(ctx, roomID, receiverID uuid.UUID) (entity.SantaAssignment, error)`; `Remind(ctx, roomID uuid.UUID, now time.Time, cooldown time.Duration, notes []entity.SantaNotification) error` (`ErrTooSoon`); `ClaimNotifications(ctx, now time.Time, limit int, lease time.Duration) ([]entity.SantaNotification, error)`; `MarkNotificationSent(ctx, id uuid.UUID) error`; `MarkNotificationFailed(ctx, id uuid.UUID, attempts int, retryAt *time.Time, lastErr string) error`.

- [ ] **Step 1: Контракт**

В `SantaRepo` (`internal/repo/contracts.go`) заменить сигнатуры `UpdateParticipant` и `Draw` и добавить методы:

```go
	// UpdateParticipant пишет имя/пожелания/вишлист и кладёт notes в очередь —
	// одной транзакцией.
	UpdateParticipant(ctx context.Context, p entity.SantaParticipant, notes ...entity.SantaNotification) error
```

```go
	// GetGiver — кто дарит receiverID; пар нет — ErrNotFound.
	GetGiver(ctx context.Context, roomID, receiverID uuid.UUID) (entity.SantaAssignment, error)
	// Draw в одной транзакции: блокирует комнату, проверяет статус expected
	// (иначе ErrStatusMismatch), стирает старые пары и несданные уведомления
	// drawn участников комнаты, отдаёт build id ГОТОВЫХ участников (канал
	// подтверждён) в порядке вступления, пишет пары, кладёт note каждому
	// дарящему и ставит status=drawn. Ошибка build откатывает всё и
	// возвращается как есть.
	Draw(ctx context.Context, roomID uuid.UUID, expected entity.SantaRoomStatus, build func(ids []uuid.UUID) ([]entity.SantaAssignment, error), note func(giverID uuid.UUID) entity.SantaNotification) error
	// Remind под блокировкой комнаты: напоминали позже now-cooldown —
	// ErrTooSoon; иначе ставит last_reminded_at=now и кладёт notes.
	Remind(ctx context.Context, roomID uuid.UUID, now time.Time, cooldown time.Duration, notes []entity.SantaNotification) error

	// Outbox.
	// ClaimNotifications берёт до limit созревших pending-уведомлений
	// (FOR UPDATE SKIP LOCKED) и сдвигает им next_try_at на now+lease: второй
	// обработчик их не возьмёт, а упавший — отдаст через lease.
	ClaimNotifications(ctx context.Context, now time.Time, limit int, lease time.Duration) ([]entity.SantaNotification, error)
	MarkNotificationSent(ctx context.Context, id uuid.UUID) error
	// MarkNotificationFailed: retryAt == nil — окончательно failed, иначе
	// снова pending к retryAt.
	MarkNotificationFailed(ctx context.Context, id uuid.UUID, attempts int, retryAt *time.Time, lastErr string) error
```

- [ ] **Step 2: Падающие интеграционные тесты**

В `santa_integration_test.go` добавить хелпер и заменить все вызовы `r.Draw(ctx, room.ID, <status>, <build>)` на `r.Draw(ctx, room.ID, <status>, <build>, noNote)`:

```go
// noNote — уведомление-пустышка для тестов жеребьёвки.
func noNote(giverID uuid.UUID) entity.SantaNotification {
	return entity.NewSantaNotification(giverID, entity.SantaNotifyDrawn, time.Now())
}
```

(добавить `"time"` в импорт). Вызов `r.UpdateParticipant(ctx, p)` в `TestSantaRepo_UpdateParticipantKeepsToken` не меняется — notes вариадические.

В `santa_notify_integration_test.go` добавить:

```go
func drawnNote(now time.Time) func(uuid.UUID) entity.SantaNotification {
	return func(giverID uuid.UUID) entity.SantaNotification {
		return entity.NewSantaNotification(giverID, entity.SantaNotifyDrawn, now)
	}
}

func TestSantaRepo_DrawOnlyReadyAndEnqueues(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	ready := seedParticipants(t, r, room.ID, 3)
	unready := seedUnready(t, r, room.ID, 1)[0]

	var got []uuid.UUID
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, func(in []uuid.UUID) ([]entity.SantaAssignment, error) {
		got = in
		return circle(room.ID)(in)
	}, drawnNote(time.Now())))
	assert.Equal(t, ready, got, "неготовый в жеребьёвку не попал")
	for _, id := range ready {
		assert.EqualValues(t, 1, countNotes(t, db, id, entity.SantaNotifyDrawn))
	}
	assert.EqualValues(t, 0, countNotes(t, db, unready, entity.SantaNotifyDrawn))
	_, err := r.GetAssignment(ctx, room.ID, unready)
	assert.ErrorIs(t, err, repo.ErrNotFound)
}

func TestSantaRepo_RedrawDropsPendingDrawn(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID), drawnNote(time.Now())))
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomDrawn, circle(room.ID), drawnNote(time.Now())))
	for _, id := range ids {
		assert.EqualValues(t, 1, countNotes(t, db, id, entity.SantaNotifyDrawn), "несданное старое drawn стёрто, новое одно")
	}
}

func TestSantaRepo_UpdateParticipantEnqueues(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 2)
	p, err := r.GetParticipant(ctx, ids[0])
	require.NoError(t, err)
	p.Wishes = "Книги"
	require.NoError(t, r.UpdateParticipant(ctx, p, entity.NewSantaNotification(ids[1], entity.SantaNotifyWishesUpdated, time.Now())))
	assert.EqualValues(t, 1, countNotes(t, db, ids[1], entity.SantaNotifyWishesUpdated))
}

func TestSantaRepo_GetGiver(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	_, err := r.GetGiver(ctx, room.ID, ids[1])
	assert.ErrorIs(t, err, repo.ErrNotFound, "до жеребьёвки дарящего нет")

	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID), drawnNote(time.Now())))
	a, err := r.GetGiver(ctx, room.ID, ids[1])
	require.NoError(t, err)
	assert.Equal(t, ids[0], a.GiverID)
}

func TestSantaRepo_RemindCooldown(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	id := seedParticipants(t, r, room.ID, 1)[0]
	now := time.Now().UTC().Truncate(time.Second)
	note := func() []entity.SantaNotification {
		return []entity.SantaNotification{entity.NewSantaNotification(id, entity.SantaNotifyReminderFill, now)}
	}

	require.NoError(t, r.Remind(ctx, room.ID, now, 12*time.Hour, note()))
	saved, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	require.NotNil(t, saved.LastRemindedAt)
	assert.WithinDuration(t, now, *saved.LastRemindedAt, time.Second)

	err = r.Remind(ctx, room.ID, now.Add(11*time.Hour), 12*time.Hour, note())
	assert.ErrorIs(t, err, repo.ErrTooSoon)
	assert.EqualValues(t, 1, countNotes(t, db, id, entity.SantaNotifyReminderFill), "второе напоминание не легло")

	require.NoError(t, r.Remind(ctx, room.ID, now.Add(13*time.Hour), 12*time.Hour, note()))
	assert.EqualValues(t, 2, countNotes(t, db, id, entity.SantaNotifyReminderFill))
}

func TestSantaRepo_ClaimLeasesNotifications(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	now := time.Now().UTC().Truncate(time.Second)
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID), drawnNote(now)))

	first, err := r.ClaimNotifications(ctx, now, 10, 2*time.Minute)
	require.NoError(t, err)
	assert.Len(t, first, 3)

	again, err := r.ClaimNotifications(ctx, now.Add(time.Minute), 10, 2*time.Minute)
	require.NoError(t, err)
	assert.Empty(t, again, "под арендой — второй обработчик не берёт")

	afterLease, err := r.ClaimNotifications(ctx, now.Add(3*time.Minute), 10, 2*time.Minute)
	require.NoError(t, err)
	assert.Len(t, afterLease, 3, "аренда истекла — снова в работе")
	_ = ids
}

func TestSantaRepo_MarkNotification(t *testing.T) {
	ctx := context.Background()
	db := setupSantaDB(t)
	r := persistent.NewSantaRepo(db)
	room := seedRoom(t, r, uuid.New())
	seedParticipants(t, r, room.ID, 3)
	now := time.Now().UTC().Truncate(time.Second)
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID), drawnNote(now)))
	batch, err := r.ClaimNotifications(ctx, now, 10, time.Minute)
	require.NoError(t, err)
	require.Len(t, batch, 3)

	require.NoError(t, r.MarkNotificationSent(ctx, batch[0].ID))
	retry := now.Add(5 * time.Minute)
	require.NoError(t, r.MarkNotificationFailed(ctx, batch[1].ID, 2, &retry, "timeout"))
	require.NoError(t, r.MarkNotificationFailed(ctx, batch[2].ID, 4, nil, "gone"))

	var rows []persistent.SantaNotificationModel
	require.NoError(t, db.Order("id").Find(&rows).Error)
	byID := map[uuid.UUID]persistent.SantaNotificationModel{}
	for _, row := range rows {
		byID[row.ID] = row
	}
	assert.Equal(t, "sent", byID[batch[0].ID].Status)
	assert.Equal(t, "pending", byID[batch[1].ID].Status)
	assert.Equal(t, 2, byID[batch[1].ID].Attempts)
	assert.WithinDuration(t, retry, byID[batch[1].ID].NextTryAt, time.Second)
	assert.Equal(t, "timeout", byID[batch[1].ID].LastError)
	assert.Equal(t, "failed", byID[batch[2].ID].Status)

	due, err := r.ClaimNotifications(ctx, now.Add(10*time.Minute), 10, time.Minute)
	require.NoError(t, err)
	require.Len(t, due, 1, "только отложенное pending")
	assert.Equal(t, batch[1].ID, due[0].ID)
}
```

Run: `go vet -tags integration ./internal/repo/persistent/`
Expected: FAIL — неверное число аргументов `Draw`, нет `GetGiver` и т. д.

- [ ] **Step 3: Реализация в репозитории**

В `santa_postgres.go`:

Добавить константу над `Draw`:

```go
// santaReadySQL — тот же «готов», что entity.SantaParticipant.Ready(); меняются вместе.
const santaReadySQL = "((channel = 'email' AND email IS NOT NULL AND email_verified_at IS NOT NULL) OR (channel = 'telegram' AND tg_chat_id IS NOT NULL))"
```

Заменить `UpdateParticipant` и `Draw`:

```go
func (r *santaRepo) UpdateParticipant(ctx context.Context, p entity.SantaParticipant, notes ...entity.SantaNotification) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&SantaParticipantModel{}).
			Where("id = ?", p.ID).
			Updates(map[string]any{
				"name":         p.Name,
				"wishes":       p.Wishes,
				"wishlist_url": p.WishlistURL,
				"updated_at":   time.Now(),
			})
		if res.Error != nil {
			return santaErr("santaRepo.UpdateParticipant", res.Error)
		}
		if res.RowsAffected == 0 {
			return fmt.Errorf("santaRepo.UpdateParticipant: %w", repo.ErrNotFound)
		}
		return insertNotifications(tx, notes...)
	})
}
```

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
		var ids []uuid.UUID
		if err := tx.Model(&SantaParticipantModel{}).
			Where("room_id = ?", roomID).
			Where(santaReadySQL).
			Order("created_at, id").
			Pluck("id", &ids).Error; err != nil {
			return santaErr("santaRepo.Draw participants", err)
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
		now := time.Now()
		if err := tx.Model(&SantaRoomModel{}).Where("id = ?", roomID).Updates(map[string]any{
			"status":     string(entity.SantaRoomDrawn),
			"drawn_at":   now,
			"updated_at": now,
		}).Error; err != nil {
			return santaErr("santaRepo.Draw status", err)
		}
		return nil
	})
}
```

Добавить после `GetAssignment`:

```go
func (r *santaRepo) GetGiver(ctx context.Context, roomID, receiverID uuid.UUID) (entity.SantaAssignment, error) {
	var m SantaAssignmentModel
	if err := r.db.WithContext(ctx).First(&m, "room_id = ? AND receiver_id = ?", roomID, receiverID).Error; err != nil {
		return entity.SantaAssignment{}, santaErr("santaRepo.GetGiver", err)
	}
	return entity.SantaAssignment{RoomID: m.RoomID, GiverID: m.GiverID, ReceiverID: m.ReceiverID}, nil
}
```

В `santa_notify_postgres.go` добавить (и убрать заглушку `var _ = errors.Is`, если ставили; `errors` в этих функциях не нужен — убрать импорт, если не используется):

```go
func (r *santaRepo) Remind(ctx context.Context, roomID uuid.UUID, now time.Time, cooldown time.Duration, notes []entity.SantaNotification) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var room SantaRoomModel
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&room, "id = ?", roomID).Error; err != nil {
			return santaErr("santaRepo.Remind lock", err)
		}
		if room.LastRemindedAt != nil && room.LastRemindedAt.After(now.Add(-cooldown)) {
			return repo.ErrTooSoon
		}
		if err := tx.Model(&SantaRoomModel{}).Where("id = ?", roomID).
			Update("last_reminded_at", now).Error; err != nil {
			return santaErr("santaRepo.Remind mark", err)
		}
		return insertNotifications(tx, notes...)
	})
}

func (r *santaRepo) ClaimNotifications(ctx context.Context, now time.Time, limit int, lease time.Duration) ([]entity.SantaNotification, error) {
	var models []SantaNotificationModel
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("status = ? AND next_try_at <= ?", string(entity.SantaNotificationPending), now).
			Order("next_try_at, id").
			Limit(limit).
			Find(&models).Error; err != nil {
			return santaErr("santaRepo.ClaimNotifications", err)
		}
		if len(models) == 0 {
			return nil
		}
		ids := make([]uuid.UUID, len(models))
		for i, m := range models {
			ids[i] = m.ID
		}
		if err := tx.Model(&SantaNotificationModel{}).Where("id IN ?", ids).
			Update("next_try_at", now.Add(lease)).Error; err != nil {
			return santaErr("santaRepo.ClaimNotifications lease", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.SantaNotification, len(models))
	for i, m := range models {
		out[i] = toSantaNotificationEntity(m)
	}
	return out, nil
}

func (r *santaRepo) MarkNotificationSent(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Model(&SantaNotificationModel{}).Where("id = ?", id).Updates(map[string]any{
		"status":     string(entity.SantaNotificationSent),
		"last_error": "",
	}).Error; err != nil {
		return santaErr("santaRepo.MarkNotificationSent", err)
	}
	return nil
}

func (r *santaRepo) MarkNotificationFailed(ctx context.Context, id uuid.UUID, attempts int, retryAt *time.Time, lastErr string) error {
	updates := map[string]any{"attempts": attempts, "last_error": lastErr}
	if retryAt == nil {
		updates["status"] = string(entity.SantaNotificationFailed)
	} else {
		updates["status"] = string(entity.SantaNotificationPending)
		updates["next_try_at"] = *retryAt
	}
	if err := r.db.WithContext(ctx).Model(&SantaNotificationModel{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return santaErr("santaRepo.MarkNotificationFailed", err)
	}
	return nil
}
```

- [ ] **Step 4: Мок**

В `mock/repo/mock_santa_repo.go` заменить `UpdateParticipant` и `Draw`, добавить остальные:

```go
func (m *MockSantaRepo) UpdateParticipant(ctx context.Context, p entity.SantaParticipant, notes ...entity.SantaNotification) error {
	return m.Called(ctx, p, notes).Error(0)
}

func (m *MockSantaRepo) Draw(ctx context.Context, roomID uuid.UUID, expected entity.SantaRoomStatus, build func([]uuid.UUID) ([]entity.SantaAssignment, error), note func(uuid.UUID) entity.SantaNotification) error {
	return m.Called(ctx, roomID, expected, build, note).Error(0)
}

func (m *MockSantaRepo) GetGiver(ctx context.Context, roomID, receiverID uuid.UUID) (entity.SantaAssignment, error) {
	args := m.Called(ctx, roomID, receiverID)
	a, _ := args.Get(0).(entity.SantaAssignment)
	return a, args.Error(1)
}

func (m *MockSantaRepo) Remind(ctx context.Context, roomID uuid.UUID, now time.Time, cooldown time.Duration, notes []entity.SantaNotification) error {
	return m.Called(ctx, roomID, now, cooldown, notes).Error(0)
}

func (m *MockSantaRepo) ClaimNotifications(ctx context.Context, now time.Time, limit int, lease time.Duration) ([]entity.SantaNotification, error) {
	args := m.Called(ctx, now, limit, lease)
	notes, _ := args.Get(0).([]entity.SantaNotification)
	return notes, args.Error(1)
}

func (m *MockSantaRepo) MarkNotificationSent(ctx context.Context, id uuid.UUID) error {
	return m.Called(ctx, id).Error(0)
}

func (m *MockSantaRepo) MarkNotificationFailed(ctx context.Context, id uuid.UUID, attempts int, retryAt *time.Time, lastErr string) error {
	return m.Called(ctx, id, attempts, retryAt, lastErr).Error(0)
}
```

- [ ] **Step 5: Use case компилируется с новым Draw**

В `internal/usecase/santa/draw.go` заменить вызов `uc.santa.Draw(...)`:

```go
	now := uc.now()
	err = uc.santa.Draw(ctx, room.ID, expected, func(ids []uuid.UUID) ([]entity.SantaAssignment, error) {
		return buildCycle(room.ID, ids, uc.shuffle)
	}, func(giverID uuid.UUID) entity.SantaNotification {
		return entity.NewSantaNotification(giverID, entity.SantaNotifyDrawn, now)
	})
```

В `draw_test.go` во всех `sr.On("Draw", …)` и `sr.AssertNotCalled(t, "Draw", …)` добавить пятый аргумент `mock.Anything`. В тесте, где через `.Run(func(args mock.Arguments) { … })` вызывается `build`, дополнительно проверить note:

```go
		note := args.Get(4).(func(uuid.UUID) entity.SantaNotification)
		giver := uuid.New()
		n := note(giver)
		assert.Equal(t, giver, n.ParticipantID)
		assert.Equal(t, entity.SantaNotifyDrawn, n.Kind)
```

В `participant_test.go` во всех `sr.On("UpdateParticipant", a, b)` и `sr.AssertNotCalled(t, "UpdateParticipant", a, b)` добавить третий аргумент `mock.Anything`.

Вызов `uc.santa.UpdateParticipant(ctx, p)` в `participant.go` компилируется без правок (notes вариадические).

- [ ] **Step 6: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./internal/repo/persistent/ -run TestSantaRepo -count=1`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
gofmt -w internal/repo mock/repo internal/usecase/santa
git add internal/repo mock/repo internal/usecase/santa
git commit -m "feat(backend): outbox уведомлений Санты — жеребьёвка только готовых, события в транзакциях"
```

---

### Task 3: Транспорт — почта и Telegram

**Files:**
- Create: `BACK/pkg/mailer/mailer.go`, `BACK/pkg/mailer/mailer_test.go`
- Create: `BACK/pkg/telegram/telegram.go`, `BACK/pkg/telegram/telegram_test.go`
- Modify: `BACK/internal/usecase/contracts.go` (интерфейсы `Mailer`, `TelegramSender`)

**Interfaces:**
- Produces: `mailer.Config{Host string; Port int; User, Password, From string}`, `mailer.NewSMTP(cfg Config) (*mailer.SMTP, error)`, `(*SMTP).Send(ctx, to, subject, html, text string) error`, `mailer.NewLog() *mailer.Log` (тот же `Send`, пишет в лог); `telegram.Button{Text, URL string}`, `telegram.New(token string) *telegram.Client`, `telegram.NewWithBase(token, base string, hc *http.Client) *telegram.Client`, `(*Client).SendMessage(ctx, chatID int64, text string, buttons []telegram.Button) error`, `telegram.NewLog() *telegram.Log`, `telegram.Escape(s string) string`; `usecase.Mailer`, `usecase.TelegramSender`.

- [ ] **Step 1: Падающие тесты**

`pkg/mailer/mailer_test.go`:

```go
package mailer

import (
	"io"
	"mime"
	"mime/multipart"
	"net/mail"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildMessage(t *testing.T) {
	from, err := mail.ParseAddress("Тайный Санта <santa@prosto-namekni.ru>")
	require.NoError(t, err)
	raw, err := buildMessage(from, "anna@example.com", "Код: 123456", "<p>Привет</p>", "Привет", time.Date(2026, 12, 1, 10, 0, 0, 0, time.UTC))
	require.NoError(t, err)

	msg, err := mail.ReadMessage(strings.NewReader(string(raw)))
	require.NoError(t, err)
	dec := new(mime.WordDecoder)
	subject, err := dec.DecodeHeader(msg.Header.Get("Subject"))
	require.NoError(t, err)
	assert.Equal(t, "Код: 123456", subject)
	fromHdr, err := dec.DecodeHeader(msg.Header.Get("From"))
	require.NoError(t, err)
	assert.Contains(t, fromHdr, "santa@prosto-namekni.ru")
	assert.Equal(t, "anna@example.com", msg.Header.Get("To"))
	assert.NotEmpty(t, msg.Header.Get("Message-Id"))

	mediaType, params, err := mime.ParseMediaType(msg.Header.Get("Content-Type"))
	require.NoError(t, err)
	assert.Equal(t, "multipart/alternative", mediaType)

	mr := multipart.NewReader(msg.Body, params["boundary"])
	bodies := map[string]string{}
	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		require.NoError(t, err)
		ct, _, _ := mime.ParseMediaType(part.Header.Get("Content-Type"))
		b, err := io.ReadAll(part) // multipart.Reader снимает base64 сам
		require.NoError(t, err)
		bodies[ct] = string(b)
	}
	assert.Equal(t, "Привет", bodies["text/plain"])
	assert.Equal(t, "<p>Привет</p>", bodies["text/html"])
}

func TestNewSMTPRejectsBadFrom(t *testing.T) {
	_, err := NewSMTP(Config{Host: "smtp.example.com", Port: 587, From: "не адрес"})
	assert.Error(t, err)
}
```

`multipart.Reader` декодирует `Content-Transfer-Encoding: quoted-printable` сам, а base64 — нет. Поэтому части пишем в **quoted-printable** (`mime/quotedprintable`), а тест читает их через `multipart.Reader` — он снимет QP.

`pkg/telegram/telegram_test.go`:

```go
package telegram

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSendMessage(t *testing.T) {
	var got map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/botTOKEN/sendMessage", r.URL.Path)
		assert.Equal(t, "application/json", r.Header.Get("Content-Type"))
		b, _ := io.ReadAll(r.Body)
		require.NoError(t, json.Unmarshal(b, &got))
		_, _ = w.Write([]byte(`{"ok":true,"result":{}}`))
	}))
	defer srv.Close()

	c := NewWithBase("TOKEN", srv.URL, srv.Client())
	err := c.SendMessage(context.Background(), 42, "<b>Привет</b>", []Button{{Text: "Открыть", URL: "https://santa.prosto-namekni.ru/r/abcdefgh"}})
	require.NoError(t, err)
	assert.EqualValues(t, 42, got["chat_id"])
	assert.Equal(t, "HTML", got["parse_mode"])
	assert.Equal(t, true, got["disable_web_page_preview"])
	kb := got["reply_markup"].(map[string]any)["inline_keyboard"].([]any)
	btn := kb[0].([]any)[0].(map[string]any)
	assert.Equal(t, "Открыть", btn["text"])
}

func TestSendMessageNoButtons(t *testing.T) {
	var got map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		require.NoError(t, json.Unmarshal(b, &got))
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer srv.Close()
	require.NoError(t, NewWithBase("T", srv.URL, srv.Client()).SendMessage(context.Background(), 1, "x", nil))
	_, has := got["reply_markup"]
	assert.False(t, has)
}

func TestSendMessageAPIError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"ok":false,"error_code":403,"description":"Forbidden: bot was blocked by the user"}`))
	}))
	defer srv.Close()
	err := NewWithBase("T", srv.URL, srv.Client()).SendMessage(context.Background(), 1, "x", nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "blocked")
}

func TestEscape(t *testing.T) {
	assert.Equal(t, "&lt;b&gt;Аня &amp; Ко&lt;/b&gt;", Escape("<b>Аня & Ко</b>"))
}
```

Run: `go test ./pkg/mailer/ ./pkg/telegram/`
Expected: FAIL — пакетов/функций нет.

- [ ] **Step 2: pkg/mailer**

`pkg/mailer/mailer.go`:

```go
// Package mailer отправляет письма через SMTP (Yandex Cloud Postbox) или в лог.
package mailer

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/smtp"
	"net/textproto"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	// From — «Имя <адрес>» или просто адрес.
	From string
}

type SMTP struct {
	cfg  Config
	from *mail.Address
}

func NewSMTP(cfg Config) (*SMTP, error) {
	from, err := mail.ParseAddress(cfg.From)
	if err != nil {
		return nil, fmt.Errorf("mailer: MAIL_FROM: %w", err)
	}
	if cfg.Host == "" || cfg.Port == 0 {
		return nil, errors.New("mailer: SMTP_HOST и SMTP_PORT обязательны")
	}
	return &SMTP{cfg: cfg, from: from}, nil
}

// Send: порт 465 — TLS сразу, иначе STARTTLS (обязателен).
func (s *SMTP) Send(ctx context.Context, to, subject, html, text string) error {
	msg, err := buildMessage(s.from, to, subject, html, text, time.Now())
	if err != nil {
		return err
	}
	addr := net.JoinHostPort(s.cfg.Host, strconv.Itoa(s.cfg.Port))
	dialer := &net.Dialer{Timeout: 15 * time.Second}
	tlsCfg := &tls.Config{ServerName: s.cfg.Host, MinVersion: tls.VersionTLS12}

	var conn net.Conn
	if s.cfg.Port == 465 {
		conn, err = tls.DialWithDialer(dialer, "tcp", addr, tlsCfg)
	} else {
		conn, err = dialer.DialContext(ctx, "tcp", addr)
	}
	if err != nil {
		return fmt.Errorf("mailer: dial: %w", err)
	}
	_ = conn.SetDeadline(time.Now().Add(30 * time.Second))

	c, err := smtp.NewClient(conn, s.cfg.Host)
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("mailer: hello: %w", err)
	}
	defer c.Close()

	if s.cfg.Port != 465 {
		if ok, _ := c.Extension("STARTTLS"); !ok {
			return errors.New("mailer: сервер не умеет STARTTLS")
		}
		if err := c.StartTLS(tlsCfg); err != nil {
			return fmt.Errorf("mailer: starttls: %w", err)
		}
	}
	if s.cfg.User != "" {
		if err := c.Auth(smtp.PlainAuth("", s.cfg.User, s.cfg.Password, s.cfg.Host)); err != nil {
			return fmt.Errorf("mailer: auth: %w", err)
		}
	}
	if err := c.Mail(s.from.Address); err != nil {
		return fmt.Errorf("mailer: mail from: %w", err)
	}
	if err := c.Rcpt(to); err != nil {
		return fmt.Errorf("mailer: rcpt: %w", err)
	}
	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("mailer: data: %w", err)
	}
	if _, err := w.Write(msg); err != nil {
		return fmt.Errorf("mailer: write: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("mailer: close data: %w", err)
	}
	return c.Quit()
}

// buildMessage собирает multipart/alternative: текст и HTML в quoted-printable.
func buildMessage(from *mail.Address, to, subject, html, text string, now time.Time) ([]byte, error) {
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	for _, part := range []struct{ ct, content string }{
		{"text/plain; charset=UTF-8", text},
		{"text/html; charset=UTF-8", html},
	} {
		h := textproto.MIMEHeader{}
		h.Set("Content-Type", part.ct)
		h.Set("Content-Transfer-Encoding", "quoted-printable")
		w, err := mw.CreatePart(h)
		if err != nil {
			return nil, err
		}
		qp := quotedprintable.NewWriter(w)
		if _, err := qp.Write([]byte(part.content)); err != nil {
			return nil, err
		}
		if err := qp.Close(); err != nil {
			return nil, err
		}
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}

	id := make([]byte, 12)
	if _, err := rand.Read(id); err != nil {
		return nil, err
	}
	domain := "localhost"
	if at := strings.LastIndex(from.Address, "@"); at >= 0 {
		domain = from.Address[at+1:]
	}

	var msg bytes.Buffer
	fmt.Fprintf(&msg, "From: %s\r\n", from.String())
	fmt.Fprintf(&msg, "To: %s\r\n", to)
	fmt.Fprintf(&msg, "Subject: %s\r\n", mime.BEncoding.Encode("UTF-8", subject))
	fmt.Fprintf(&msg, "Date: %s\r\n", now.Format(time.RFC1123Z))
	fmt.Fprintf(&msg, "Message-ID: <%s@%s>\r\n", hex.EncodeToString(id), domain)
	msg.WriteString("MIME-Version: 1.0\r\n")
	fmt.Fprintf(&msg, "Content-Type: multipart/alternative; boundary=%q\r\n\r\n", mw.Boundary())
	msg.Write(body.Bytes())
	return msg.Bytes(), nil
}

// Log — почта для разработки: письмо уходит в лог.
type Log struct{}

func NewLog() *Log { return &Log{} }

func (*Log) Send(_ context.Context, to, subject, _, text string) error {
	log.Printf("mailer(log): to=%s subject=%q\n%s", to, subject, text)
	return nil
}
```

Тест читает части через `multipart.Reader`, который сам снимает quoted-printable, — поэтому `TestBuildMessage` сравнивает исходные строки.

- [ ] **Step 3: pkg/telegram**

`pkg/telegram/telegram.go`:

```go
// Package telegram — минимальный клиент Bot API: отправка сообщений.
package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"
	"time"
)

// Button — кнопка-ссылка под сообщением.
type Button struct {
	Text string `json:"text"`
	URL  string `json:"url"`
}

type Client struct {
	token string
	base  string
	http  *http.Client
}

func New(token string) *Client {
	return NewWithBase(token, "https://api.telegram.org", &http.Client{Timeout: 10 * time.Second})
}

func NewWithBase(token, base string, hc *http.Client) *Client {
	return &Client{token: token, base: base, http: hc}
}

// SendMessage шлёт текст с parse_mode=HTML. Пользовательский текст —
// только через Escape.
func (c *Client) SendMessage(ctx context.Context, chatID int64, text string, buttons []Button) error {
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
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/bot"+c.token+"/sendMessage", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("telegram: %w", err)
	}
	defer resp.Body.Close()
	var out struct {
		OK          bool   `json:"ok"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return fmt.Errorf("telegram: status %d: %w", resp.StatusCode, err)
	}
	if !out.OK {
		return fmt.Errorf("telegram: %s (status %d)", out.Description, resp.StatusCode)
	}
	return nil
}

// Escape — экранирование пользовательского текста для parse_mode=HTML.
func Escape(s string) string { return html.EscapeString(s) }

// Log — бот для разработки: сообщения уходят в лог.
type Log struct{}

func NewLog() *Log { return &Log{} }

func (*Log) SendMessage(_ context.Context, chatID int64, text string, buttons []Button) error {
	log.Printf("telegram(log): chat=%d buttons=%v\n%s", chatID, buttons, text)
	return nil
}
```

- [ ] **Step 4: Интерфейсы в use case**

В `internal/usecase/contracts.go` (импорт `"main/pkg/telegram"`):

```go
// Mailer отправляет письмо; реализации — pkg/mailer.
type Mailer interface {
	Send(ctx context.Context, to, subject, html, text string) error
}

// TelegramSender отправляет сообщение в чат; реализации — pkg/telegram.
type TelegramSender interface {
	SendMessage(ctx context.Context, chatID int64, text string, buttons []telegram.Button) error
}
```

- [ ] **Step 5: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./pkg/mailer/ ./pkg/telegram/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
gofmt -w pkg/mailer pkg/telegram internal/usecase/contracts.go
git add pkg/mailer pkg/telegram internal/usecase/contracts.go
git commit -m "feat(backend): отправка писем через SMTP и сообщений Telegram-бота"
```

---

### Task 4: Тексты уведомлений

**Files:**
- Create: `BACK/internal/usecase/santa/messages.go`
- Create: `BACK/internal/usecase/santa/messages_test.go`

**Interfaces:**
- Consumes: `entity.SantaRoom`, `entity.SantaParticipant`, `telegram.Escape`.
- Produces (пакет `santa`, неэкспортируемые): `type message struct{ Subject, HTML, Text, Telegram, ButtonText, URL string }`; `roomLink(publicURL, slug string) string`; `emailCodeMessage(roomTitle, code string) message`; `welcomeMessage(room entity.SantaRoom, link string) message`; `drawnMessage(room entity.SantaRoom, ward entity.SantaParticipant, link string) message`; `reminderMessage(room entity.SantaRoom, link string) message`; `wishesUpdatedMessage(room entity.SantaRoom, ward entity.SantaParticipant, link string) message`; `botHelloText() string`; `botLinkExpiredText() string`; `budgetText(b *int) string`; `dayText(d *time.Time) string`.

- [ ] **Step 1: Падающий тест**

`internal/usecase/santa/messages_test.go`:

```go
package santa

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"main/internal/entity"
)

func intp(v int) *int { return &v }

func TestBudgetAndDay(t *testing.T) {
	assert.Equal(t, "до 3 000 ₽", budgetText(intp(3000)))
	assert.Equal(t, "до 500 ₽", budgetText(intp(500)))
	assert.Equal(t, "без лимита", budgetText(nil))
	d := time.Date(2026, 12, 27, 0, 0, 0, 0, time.UTC)
	assert.Equal(t, "27 декабря", dayText(&d))
	assert.Equal(t, "", dayText(nil))
}

func TestRoomLink(t *testing.T) {
	assert.Equal(t, "https://santa.prosto-namekni.ru/r/abcdefgh", roomLink("https://santa.prosto-namekni.ru/", "abcdefgh"))
}

func TestDrawnMessageEscapesUserText(t *testing.T) {
	room := entity.SantaRoom{Title: "Офис <script>", Slug: "abcdefgh", Budget: intp(2000)}
	ward := entity.SantaParticipant{Name: "Аня & Ко", Wishes: "<b>книги</b>\nчай", WishlistURL: "javascript:alert(1)"}
	m := drawnMessage(room, ward, "https://santa.prosto-namekni.ru/r/abcdefgh")

	assert.Contains(t, m.Subject, "Офис <script>", "тема — простой текст, её кодирует mime")
	assert.NotContains(t, m.HTML, "<script>")
	assert.NotContains(t, m.HTML, "<b>книги</b>")
	assert.Contains(t, m.HTML, "Аня &amp; Ко")
	assert.NotContains(t, m.HTML, "javascript:alert", "html/template вырезает опасную ссылку")
	assert.NotContains(t, m.Telegram, "<b>книги</b>")
	assert.Contains(t, m.Telegram, "&lt;b&gt;книги&lt;/b&gt;")
	assert.Contains(t, m.Telegram, "Аня &amp; Ко")
	assert.Contains(t, m.Text, "Аня & Ко")
	assert.Contains(t, m.Text, "до 2 000 ₽")
	assert.Equal(t, "https://santa.prosto-namekni.ru/r/abcdefgh", m.URL)
	assert.NotEmpty(t, m.ButtonText)
}

func TestDrawnMessageWithoutWishes(t *testing.T) {
	m := drawnMessage(entity.SantaRoom{Title: "Офис"}, entity.SantaParticipant{Name: "Боря"}, "https://x/r/a")
	assert.Contains(t, m.Text, "пожеланий пока нет")
	assert.Contains(t, m.Telegram, "Боря")
}

func TestEmailCodeMessage(t *testing.T) {
	m := emailCodeMessage("Офис", "042137")
	assert.Contains(t, m.Subject, "042137")
	assert.Contains(t, m.Text, "042137")
	assert.Contains(t, m.HTML, "042137")
	assert.Contains(t, m.Text, "15 минут")
}

func TestAllMessagesHaveBothBodies(t *testing.T) {
	room := entity.SantaRoom{Title: "Офис", Slug: "abcdefgh"}
	ward := entity.SantaParticipant{Name: "Боря", Wishes: "носки"}
	for name, m := range map[string]message{
		"welcome":  welcomeMessage(room, "https://x/r/abcdefgh"),
		"reminder": reminderMessage(room, "https://x/r/abcdefgh"),
		"updated":  wishesUpdatedMessage(room, ward, "https://x/r/abcdefgh"),
	} {
		assert.NotEmpty(t, m.Subject, name)
		assert.True(t, strings.HasPrefix(m.HTML, "<!doctype html>"), name)
		assert.NotEmpty(t, m.Text, name)
		assert.NotEmpty(t, m.Telegram, name)
		assert.Equal(t, "https://x/r/abcdefgh", m.URL, name)
	}
	assert.NotEmpty(t, botHelloText())
	assert.NotEmpty(t, botLinkExpiredText())
}
```

Run: `go test ./internal/usecase/santa/ -run 'Budget|RoomLink|Message' -v`
Expected: FAIL — функций нет.

- [ ] **Step 2: Реализация**

`internal/usecase/santa/messages.go`:

```go
package santa

import (
	"bytes"
	"fmt"
	"html/template"
	"strconv"
	"strings"
	"time"

	"main/internal/entity"
	"main/pkg/telegram"
)

// message — одно уведомление во всех видах: письмо (HTML + текст) и Telegram.
type message struct {
	Subject    string
	HTML       string
	Text       string
	Telegram   string // HTML-разметка Telegram, пользовательский текст экранирован
	ButtonText string
	URL        string
}

var monthsGen = [...]string{"января", "февраля", "марта", "апреля", "мая", "июня",
	"июля", "августа", "сентября", "октября", "ноября", "декабря"}

func roomLink(publicURL, slug string) string {
	return strings.TrimRight(publicURL, "/") + "/r/" + slug
}

// budgetText: «до 3 000 ₽» (неразрывный пробел между разрядами) или «без лимита».
func budgetText(b *int) string {
	if b == nil {
		return "без лимита"
	}
	s := strconv.Itoa(*b)
	var out []byte
	for i := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			out = append(out, "\u00a0"...)
		}
		out = append(out, s[i])
	}
	return "до " + string(out) + " ₽"
}

// dayText: «27 декабря»; дата хранится как полночь UTC.
func dayText(d *time.Time) string {
	if d == nil {
		return ""
	}
	u := d.UTC()
	return fmt.Sprintf("%d %s", u.Day(), monthsGen[u.Month()-1])
}

type emailView struct {
	Heading     string
	Lines       []string
	Quote       string
	WishlistURL string
	ButtonText  string
	URL         string
	Footer      string
}

var emailTpl = template.Must(template.New("email").Parse(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:24px;background:#0b1220;font-family:Arial,Helvetica,sans-serif;color:#f4f1ea">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#131c31;border-radius:16px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font-size:13px;color:#e7b14c">★ Тайный Санта · просто намекни</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">{{.Heading}}</h1>
{{range .Lines}}<p style="margin:0 0 10px;font-size:15px;line-height:1.5">{{.}}</p>{{end}}
{{if .Quote}}<p style="margin:16px 0;padding:14px 16px;border-radius:12px;background:#1b2640;font-size:15px;line-height:1.5;white-space:pre-line">{{.Quote}}</p>{{end}}
{{if .WishlistURL}}<p style="margin:0 0 16px;font-size:15px"><a href="{{.WishlistURL}}" style="color:#e7b14c">Вишлист</a></p>{{end}}
{{if .URL}}<p style="margin:24px 0 8px"><a href="{{.URL}}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#c92a47;color:#ffffff;text-decoration:none;font-weight:bold">{{.ButtonText}}</a></p>{{end}}
{{if .Footer}}<p style="margin:16px 0 0;font-size:12px;color:#9aa3b8">{{.Footer}}</p>{{end}}
</td></tr></table></td></tr></table></body></html>`))

// compose собирает письмо, текст и Telegram из одних частей. Всё, что
// пришло от людей, в HTML экранирует html/template, в Telegram — telegram.Escape.
func compose(subject string, v emailView, tg string) message {
	var buf bytes.Buffer
	if err := emailTpl.Execute(&buf, v); err != nil {
		// Шаблон статический; ошибка — баг, но письмо всё равно уйдёт текстом.
		buf.Reset()
	}
	var text strings.Builder
	text.WriteString(v.Heading + "\n\n")
	for _, l := range v.Lines {
		text.WriteString(l + "\n")
	}
	if v.Quote != "" {
		text.WriteString("\n" + v.Quote + "\n")
	}
	if v.WishlistURL != "" {
		text.WriteString("\nВишлист: " + v.WishlistURL + "\n")
	}
	if v.URL != "" {
		text.WriteString("\n" + v.ButtonText + ": " + v.URL + "\n")
	}
	if v.Footer != "" {
		text.WriteString("\n" + v.Footer + "\n")
	}
	return message{Subject: subject, HTML: buf.String(), Text: text.String(), Telegram: tg, ButtonText: v.ButtonText, URL: v.URL}
}

func roomFacts(room entity.SantaRoom) []string {
	lines := []string{"Бюджет: " + budgetText(room.Budget) + "."}
	if day := dayText(room.ExchangeDate); day != "" {
		lines = append(lines, "Обмен подарками: "+day+".")
	}
	return lines
}

func tgFacts(room entity.SantaRoom) string {
	s := "Бюджет: " + budgetText(room.Budget)
	if day := dayText(room.ExchangeDate); day != "" {
		s += "\nОбмен подарками: " + day
	}
	return s
}

func isHTTPURL(s string) bool {
	return strings.HasPrefix(s, "https://") || strings.HasPrefix(s, "http://")
}

func emailCodeMessage(roomTitle, code string) message {
	return compose(
		"Код подтверждения: "+code,
		emailView{
			Heading: "Код подтверждения: " + code,
			Lines: []string{
				"Введите его на странице комнаты «" + roomTitle + "», чтобы получать сюда результат жеребьёвки.",
				"Код действует 15 минут.",
			},
			Footer: "Если вы не вступали в Тайного Санту, просто удалите это письмо.",
		},
		"",
	)
}

func welcomeMessage(room entity.SantaRoom, link string) message {
	return compose(
		"Вы в Тайном Санте «"+room.Title+"»",
		emailView{
			Heading:    "Готово — вы в комнате «" + room.Title + "»",
			Lines:      append([]string{"Когда организатор проведёт жеребьёвку, сюда придёт имя вашего подопечного."}, roomFacts(room)...),
			ButtonText: "Открыть комнату",
			URL:        link,
		},
		"🎄 Готово — вы в комнате <b>«"+telegram.Escape(room.Title)+"»</b>.\n\nКогда организатор проведёт жеребьёвку, сюда придёт имя вашего подопечного.\n\n"+tgFacts(room),
	)
}

func drawnMessage(room entity.SantaRoom, ward entity.SantaParticipant, link string) message {
	wishes := ward.Wishes
	wishlist := ""
	if isHTTPURL(ward.WishlistURL) {
		wishlist = ward.WishlistURL
	}
	lines := append([]string{"Вы — Тайный Санта для " + ward.Name + "."}, roomFacts(room)...)
	if wishes == "" && wishlist == "" {
		lines = append(lines, "Подопечный пока не написал пожеланий — мы сообщим, когда напишет.")
	}

	var tg strings.Builder
	tg.WriteString("🎁 Жеребьёвка в комнате <b>«" + telegram.Escape(room.Title) + "»</b> прошла.\n\n")
	tg.WriteString("Вы дарите подарок: <b>" + telegram.Escape(ward.Name) + "</b>\n\n")
	if wishes != "" {
		tg.WriteString("Пожелания:\n<blockquote>" + telegram.Escape(wishes) + "</blockquote>\n\n")
	} else {
		tg.WriteString("Пожеланий пока нет — сообщим, когда появятся.\n\n")
	}
	if wishlist != "" {
		tg.WriteString("Вишлист: " + telegram.Escape(wishlist) + "\n\n")
	}
	tg.WriteString(tgFacts(room))

	m := compose(
		"Жеребьёвка прошла — «"+room.Title+"»",
		emailView{
			Heading:     "Вы дарите подарок: " + ward.Name,
			Lines:       lines,
			Quote:       wishes,
			WishlistURL: wishlist,
			ButtonText:  "Открыть конверт",
			URL:         link,
			Footer:      "Это тайна: никому не говорите, кому дарите.",
		},
		tg.String(),
	)
	if wishes == "" && wishlist == "" {
		m.Text = strings.Replace(m.Text, "\n\n", "\n\nпожеланий пока нет.\n", 1)
	}
	return m
}

func reminderMessage(room entity.SantaRoom, link string) message {
	return compose(
		"Напишите пожелания — «"+room.Title+"»",
		emailView{
			Heading:    "Ваш Санта ждёт подсказку",
			Lines:      []string{"Организатор комнаты «" + room.Title + "» просит написать пожелания или приложить вишлист — так подарок точно попадёт в цель."},
			ButtonText: "Написать пожелания",
			URL:        link,
		},
		"✍️ Организатор комнаты <b>«"+telegram.Escape(room.Title)+"»</b> просит написать пожелания или приложить вишлист — так подарок точно попадёт в цель.",
	)
}

func wishesUpdatedMessage(room entity.SantaRoom, ward entity.SantaParticipant, link string) message {
	wishlist := ""
	if isHTTPURL(ward.WishlistURL) {
		wishlist = ward.WishlistURL
	}
	tg := "📝 " + telegram.Escape(ward.Name) + " обновил(а) пожелания в комнате <b>«" + telegram.Escape(room.Title) + "»</b>."
	if ward.Wishes != "" {
		tg += "\n\n<blockquote>" + telegram.Escape(ward.Wishes) + "</blockquote>"
	}
	if wishlist != "" {
		tg += "\n\nВишлист: " + telegram.Escape(wishlist)
	}
	return compose(
		ward.Name+" обновил(а) пожелания",
		emailView{
			Heading:     ward.Name + " обновил(а) пожелания",
			Lines:       []string{"Ваш подопечный в комнате «" + room.Title + "» поменял пожелания."},
			Quote:       ward.Wishes,
			WishlistURL: wishlist,
			ButtonText:  "Открыть конверт",
			URL:         link,
		},
		tg,
	)
}

func botHelloText() string {
	return "Привет! Я бот Тайного Санты от «просто намекни».\n\nЧтобы получать сюда результат жеребьёвки, откройте страницу своей комнаты и нажмите «Подключить Telegram»."
}

func botLinkExpiredText() string {
	return "Эта ссылка устарела или уже использована. Откройте страницу комнаты и нажмите «Подключить Telegram» ещё раз."
}
```

Проверить в тесте `TestDrawnMessageWithoutWishes`: текст должен содержать «пожеланий пока нет». Если `strings.Replace`-трюк кажется хрупким — заменить его на явную строку в `lines` («Подопечный пока не написал пожеланий…» уже есть) и поправить ожидание теста на `"пока не написал пожеланий"`. Выбрать один вариант и держать тест в согласии с ним; второй путь проще — предпочесть его.

- [ ] **Step 3: Тесты проходят**

Run: `go test ./internal/usecase/santa/ -run 'Budget|RoomLink|Message' -v`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
gofmt -w internal/usecase/santa/messages.go internal/usecase/santa/messages_test.go
git add internal/usecase/santa/messages.go internal/usecase/santa/messages_test.go
git commit -m "feat(backend): тексты писем и сообщений бота Тайного Санты"
```

---

### Task 5: Use case — подтверждение почты и Telegram

**Files:**
- Modify: `BACK/internal/usecase/contracts.go`
- Modify: `BACK/internal/usecase/santa/santa.go` (конструктор с опциями, `Ready` в представлении участника)
- Modify: `BACK/internal/usecase/santa/participant.go` (`Notify` в `me`)
- Modify: `BACK/internal/usecase/santa/secret.go`
- Create: `BACK/internal/usecase/santa/channels.go`, `channels_test.go`
- Modify: `BACK/internal/controller/restapi/v1/santa_test.go` (только `MockSantaUC` — новые методы, чтобы пакет компилировался)

**Interfaces:**
- Consumes: Task 1 (репозиторий каналов), Task 3 (`usecase.Mailer`, `usecase.TelegramSender`, `telegram.Button`), Task 4 (`emailCodeMessage`, `botHelloText`, `botLinkExpiredText`), этап 1 (`roomBySlug`, `participant`, `me`, `invalid`, `newToken`, `hashToken`, `mapRoomWriteErr`).
- Produces: `usecase.ErrSantaTooSoon` (→429), `usecase.ErrSantaEmailTaken` (→409); `usecase.SantaNotifyView{Channel entity.SantaChannel; Email string; EmailVerified, EmailPending, Telegram, Ready bool}` (json `channel,email,emailVerified,emailPending,telegram,ready`); поле `SantaMe.Notify` (json `notify`); поле `SantaParticipantView.Ready` (json `ready`); `usecase.SantaRemindResult{Sent, Unreachable int}` (json `sent,unreachable`); методы `SantaUseCase`: `RequestEmailCode(ctx, slug string, auth SantaAuth, email string) error`, `VerifyEmail(ctx, slug string, auth SantaAuth, code string) (SantaMe, error)`, `TelegramLink(ctx, slug string, auth SantaAuth) (string, error)`, `TelegramStart(ctx, chatID int64, token string) error`, `Remind(ctx, ownerID, roomID uuid.UUID) (SantaRemindResult, error)` (реализация — Task 6); в пакете `santa`: `type Option func(*santaUseCase)`, `WithMailer(usecase.Mailer) Option`, `WithTelegram(usecase.TelegramSender, botUsername string) Option`, `New(santaRepo repo.SantaRepo, userRepo repo.UserRepo, opts ...Option) usecase.SantaUseCase`, `newEmailCode() (string, error)`, `hashEmailCode(participantID uuid.UUID, code string) string`, константы `emailCodeTTL = 15*time.Minute`, `emailCodeCooldown = time.Minute`, `emailCodeAttempts = 5`, `tgLinkTTL = 24*time.Hour`.

- [ ] **Step 1: Контракт**

В `internal/usecase/contracts.go` в блок ошибок Санты:

```go
	// ErrSantaTooSoon — повтор раньше срока (код на почту, «Напомнить»).
	ErrSantaTooSoon = errors.New("слишком часто — попробуйте чуть позже")
	// ErrSantaEmailTaken — адрес уже у другого участника этой комнаты.
	ErrSantaEmailTaken = errors.New("этот адрес уже у другого участника комнаты")
```

Типы:

```go
// SantaNotifyView — куда участнику придут уведомления (видит только он сам).
type SantaNotifyView struct {
	Channel       entity.SantaChannel `json:"channel"`
	Email         string              `json:"email"`
	EmailVerified bool                `json:"emailVerified"`
	// EmailPending — адрес указан, код отправлен, но ещё не подтверждён.
	EmailPending bool `json:"emailPending"`
	Telegram     bool `json:"telegram"`
	// Ready — канал подтверждён: участник попадёт в жеребьёвку.
	Ready bool `json:"ready"`
}

// SantaRemindResult — итог «Напомнить»: сколько получат напоминание и сколько
// без подтверждённого канала (их организатор зовёт сам).
type SantaRemindResult struct {
	Sent        int `json:"sent"`
	Unreachable int `json:"unreachable"`
}
```

В `SantaParticipantView` после `HasWishlist` добавить `Ready bool `json:"ready"``. В `SantaMe` после `WishlistURL` добавить `Notify SantaNotifyView `json:"notify"``.

В интерфейс `SantaUseCase` — в блок организатора:

```go
	// Remind — «Напомнить»: готовым участникам без пожеланий; не чаще раза в
	// 12 ч — ErrSantaTooSoon.
	Remind(ctx context.Context, ownerID, roomID uuid.UUID) (SantaRemindResult, error)
```

в блок участника:

```go
	// RequestEmailCode ставит адрес и шлёт на него код; раньше чем через
	// минуту после прошлого — ErrSantaTooSoon; адрес занят — ErrSantaEmailTaken.
	RequestEmailCode(ctx context.Context, slug string, auth SantaAuth, email string) error
	// VerifyEmail проверяет код; неверный, устаревший или 5 попыток — ErrSantaInvalid.
	VerifyEmail(ctx context.Context, slug string, auth SantaAuth, code string) (SantaMe, error)
	// TelegramLink — ссылка t.me на бота с одноразовым токеном (24 ч).
	TelegramLink(ctx context.Context, slug string, auth SantaAuth) (string, error)
	// TelegramStart — команда /start <токен> из вебхука бота.
	TelegramStart(ctx context.Context, chatID int64, token string) error
```

- [ ] **Step 2: Падающие тесты**

`internal/usecase/santa/channels_test.go`:

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
	"main/internal/usecase"
	mockrepo "main/mock/repo"
	"main/pkg/telegram"
)

type fakeMailer struct {
	to, subject, text string
	err               error
	calls             int
}

func (f *fakeMailer) Send(_ context.Context, to, subject, _, text string) error {
	f.calls++
	f.to, f.subject, f.text = to, subject, text
	return f.err
}

type fakeTG struct {
	chatID int64
	text   string
	calls  int
}

func (f *fakeTG) SendMessage(_ context.Context, chatID int64, text string, _ []telegram.Button) error {
	f.calls++
	f.chatID, f.text = chatID, text
	return nil
}

var chNow = time.Date(2026, 11, 20, 12, 0, 0, 0, time.UTC)

// channelUC — use case с фиксированным временем, комнатой slug "abcdefgh" и
// участником по токену "tok".
func channelUC(t *testing.T) (*santaUseCase, *mockrepo.MockSantaRepo, *fakeMailer, *fakeTG, entity.SantaRoom, entity.SantaParticipant) {
	t.Helper()
	sr := new(mockrepo.MockSantaRepo)
	ur := new(mockrepo.MockUserRepo)
	ml := &fakeMailer{}
	tg := &fakeTG{}
	uc := New(sr, ur, WithMailer(ml), WithTelegram(tg, "santa_namekni_bot")).(*santaUseCase)
	uc.now = func() time.Time { return chNow }
	room := entity.SantaRoom{ID: uuid.New(), Slug: "abcdefgh", Title: "Офис", Status: entity.SantaRoomOpen}
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Аня", TokenHash: hashToken("tok")}
	sr.On("GetRoomBySlug", mock.Anything, "abcdefgh").Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, hashToken("tok")).Return(p, nil)
	return uc, sr, ml, tg, room, p
}

var tokAuth = usecase.SantaAuth{Token: "tok"}

func TestRequestEmailCode_SendsCodeAndStoresHash(t *testing.T) {
	uc, sr, ml, _, _, p := channelUC(t)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(entity.SantaEmailCode{}, repo.ErrNotFound)
	var stored entity.SantaEmailCode
	sr.On("SetEmail", mock.Anything, p.ID, "anna@example.com", mock.Anything).Run(func(a mock.Arguments) {
		stored = a.Get(3).(entity.SantaEmailCode)
	}).Return(nil)

	require.NoError(t, uc.RequestEmailCode(context.Background(), "abcdefgh", tokAuth, "  Anna@Example.COM "))
	assert.Equal(t, 1, ml.calls)
	assert.Equal(t, "anna@example.com", ml.to)
	code := ml.subject[len(ml.subject)-6:]
	assert.Regexp(t, `^\d{6}$`, code)
	assert.Equal(t, hashEmailCode(p.ID, code), stored.CodeHash, "в базе хэш, а не код")
	assert.NotContains(t, stored.CodeHash, code)
	assert.Equal(t, chNow.Add(emailCodeTTL), stored.ExpiresAt)
	assert.Equal(t, chNow, stored.SentAt)
}

func TestRequestEmailCode_Cooldown(t *testing.T) {
	uc, sr, ml, _, _, p := channelUC(t)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(entity.SantaEmailCode{SentAt: chNow.Add(-30 * time.Second)}, nil)
	err := uc.RequestEmailCode(context.Background(), "abcdefgh", tokAuth, "a@example.com")
	assert.ErrorIs(t, err, usecase.ErrSantaTooSoon)
	assert.Equal(t, 0, ml.calls)
	sr.AssertNotCalled(t, "SetEmail", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestRequestEmailCode_BadAddress(t *testing.T) {
	uc, sr, _, _, _, _ := channelUC(t)
	for _, bad := range []string{"", "не адрес", "Аня <a@example.com>", "a@"} {
		err := uc.RequestEmailCode(context.Background(), "abcdefgh", tokAuth, bad)
		assert.ErrorIs(t, err, usecase.ErrSantaInvalid, bad)
	}
	sr.AssertNotCalled(t, "SetEmail", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestRequestEmailCode_Taken(t *testing.T) {
	uc, sr, ml, _, _, p := channelUC(t)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(entity.SantaEmailCode{}, repo.ErrNotFound)
	sr.On("SetEmail", mock.Anything, p.ID, "a@example.com", mock.Anything).Return(repo.ErrDuplicate)
	err := uc.RequestEmailCode(context.Background(), "abcdefgh", tokAuth, "a@example.com")
	assert.ErrorIs(t, err, usecase.ErrSantaEmailTaken)
	assert.Equal(t, 0, ml.calls)
}

func TestRequestEmailCode_SendFailureDropsCode(t *testing.T) {
	uc, sr, ml, _, _, p := channelUC(t)
	ml.err = errors.New("smtp down")
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(entity.SantaEmailCode{}, repo.ErrNotFound)
	sr.On("SetEmail", mock.Anything, p.ID, "a@example.com", mock.Anything).Return(nil)
	sr.On("DeleteEmailCode", mock.Anything, p.ID).Return(nil)
	err := uc.RequestEmailCode(context.Background(), "abcdefgh", tokAuth, "a@example.com")
	assert.Error(t, err)
	sr.AssertCalled(t, "DeleteEmailCode", mock.Anything, p.ID)
}

func TestRequestEmailCode_NotParticipant(t *testing.T) {
	uc, sr, _, _, room, _ := channelUC(t)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, hashToken("other")).Return(entity.SantaParticipant{}, repo.ErrNotFound)
	err := uc.RequestEmailCode(context.Background(), "abcdefgh", usecase.SantaAuth{Token: "other"}, "a@example.com")
	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
}

func validCode(p entity.SantaParticipant, code string, attempts int) entity.SantaEmailCode {
	return entity.SantaEmailCode{ParticipantID: p.ID, CodeHash: hashEmailCode(p.ID, code), ExpiresAt: chNow.Add(5 * time.Minute), Attempts: attempts, SentAt: chNow}
}

func TestVerifyEmail_Success(t *testing.T) {
	uc, sr, _, _, room, p := channelUC(t)
	p.Email = "a@example.com"
	sr.ExpectedCalls = nil // перенастроить участника с адресом
	sr.On("GetRoomBySlug", mock.Anything, "abcdefgh").Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, hashToken("tok")).Return(p, nil)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(validCode(p, "123456", 0), nil)
	sr.On("VerifyEmail", mock.Anything, p.ID, chNow, mock.MatchedBy(func(n entity.SantaNotification) bool {
		return n.ParticipantID == p.ID && n.Kind == entity.SantaNotifyWelcome
	})).Return(nil)
	sr.On("CountParticipants", mock.Anything, []uuid.UUID{room.ID}).Return(map[uuid.UUID]int{room.ID: 1}, nil)
	uc.users.(*mockrepo.MockUserRepo).On("GetByID", mock.Anything, mock.Anything).Return(nil, repo.ErrNotFound)

	me, err := uc.VerifyEmail(context.Background(), "abcdefgh", tokAuth, " 123456 ")
	require.NoError(t, err)
	assert.True(t, me.Notify.Ready)
	assert.True(t, me.Notify.EmailVerified)
	assert.Equal(t, entity.SantaChannelEmail, me.Notify.Channel)
}

func TestVerifyEmail_WrongCodeCountsAttempt(t *testing.T) {
	uc, sr, _, _, _, p := channelUC(t)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(validCode(p, "123456", 1), nil)
	sr.On("IncEmailCodeAttempts", mock.Anything, p.ID).Return(nil)
	_, err := uc.VerifyEmail(context.Background(), "abcdefgh", tokAuth, "654321")
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
	sr.AssertCalled(t, "IncEmailCodeAttempts", mock.Anything, p.ID)
	sr.AssertNotCalled(t, "VerifyEmail", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestVerifyEmail_LockedAfterFiveAttempts(t *testing.T) {
	uc, sr, _, _, _, p := channelUC(t)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(validCode(p, "123456", emailCodeAttempts), nil)
	_, err := uc.VerifyEmail(context.Background(), "abcdefgh", tokAuth, "123456")
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid, "даже верный код после 5 попыток не принимается")
	sr.AssertNotCalled(t, "VerifyEmail", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestVerifyEmail_Expired(t *testing.T) {
	uc, sr, _, _, _, p := channelUC(t)
	code := validCode(p, "123456", 0)
	code.ExpiresAt = chNow.Add(-time.Second)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(code, nil)
	_, err := uc.VerifyEmail(context.Background(), "abcdefgh", tokAuth, "123456")
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
}

func TestVerifyEmail_NoCode(t *testing.T) {
	uc, sr, _, _, _, p := channelUC(t)
	sr.On("GetEmailCode", mock.Anything, p.ID).Return(entity.SantaEmailCode{}, repo.ErrNotFound)
	_, err := uc.VerifyEmail(context.Background(), "abcdefgh", tokAuth, "123456")
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
}

func TestTelegramLink(t *testing.T) {
	uc, sr, _, _, _, p := channelUC(t)
	var link entity.SantaTgLink
	sr.On("CreateTgLink", mock.Anything, mock.Anything).Run(func(a mock.Arguments) {
		link = a.Get(1).(entity.SantaTgLink)
	}).Return(nil)

	url, err := uc.TelegramLink(context.Background(), "abcdefgh", tokAuth)
	require.NoError(t, err)
	assert.Regexp(t, `^https://t\.me/santa_namekni_bot\?start=[A-Za-z0-9_-]{43}$`, url)
	raw := url[len("https://t.me/santa_namekni_bot?start="):]
	assert.Equal(t, hashToken(raw), link.TokenHash, "в базе хэш токена")
	assert.Equal(t, p.ID, link.ParticipantID)
	assert.Equal(t, chNow.Add(tgLinkTTL), link.ExpiresAt)
}

func TestTelegramLink_NotConfigured(t *testing.T) {
	sr := new(mockrepo.MockSantaRepo)
	uc := New(sr, new(mockrepo.MockUserRepo))
	_, err := uc.TelegramLink(context.Background(), "abcdefgh", tokAuth)
	assert.Error(t, err)
}

func TestTelegramStart_Links(t *testing.T) {
	uc, sr, _, tg, _, p := channelUC(t)
	sr.On("LinkTelegram", mock.Anything, hashToken("RAW"), int64(77), chNow, mock.Anything).Run(func(a mock.Arguments) {
		welcome := a.Get(4).(func(entity.SantaParticipant) entity.SantaNotification)
		n := welcome(p)
		assert.Equal(t, entity.SantaNotifyWelcome, n.Kind)
		assert.Equal(t, p.ID, n.ParticipantID)
	}).Return(p, nil)
	require.NoError(t, uc.TelegramStart(context.Background(), 77, "RAW"))
	assert.Equal(t, 0, tg.calls, "приветствие уйдёт через очередь, не напрямую")
}

func TestTelegramStart_ExpiredLink(t *testing.T) {
	uc, sr, _, tg, _, _ := channelUC(t)
	sr.On("LinkTelegram", mock.Anything, hashToken("OLD"), int64(77), chNow, mock.Anything).Return(entity.SantaParticipant{}, repo.ErrNotFound)
	require.NoError(t, uc.TelegramStart(context.Background(), 77, "OLD"))
	assert.Equal(t, 1, tg.calls)
	assert.Equal(t, botLinkExpiredText(), tg.text)
}

func TestTelegramStart_NoToken(t *testing.T) {
	uc, sr, _, tg, _, _ := channelUC(t)
	require.NoError(t, uc.TelegramStart(context.Background(), 77, ""))
	assert.Equal(t, botHelloText(), tg.text)
	sr.AssertNotCalled(t, "LinkTelegram", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}
```

Перед запуском проверить, как устроен `mockrepo.MockUserRepo.GetByID` (что возвращает первым значением — `*entity.User` или `entity.User`) и поправить `Return(nil, repo.ErrNotFound)` в `TestVerifyEmail_Success` под его тип; использование `uc.users.(*mockrepo.MockUserRepo)` — допустимо, раз `users` — поле `santaUseCase`. Если в существующих тестах этапа 1 есть общий конструктор use case (`newUC` или похожий) — переиспользовать его вместо `channelUC`, сохранив проверки.

Run: `go test ./internal/usecase/santa/ -run 'Email|Telegram' -v`
Expected: FAIL — нет `WithMailer`, `RequestEmailCode` и т. д.

- [ ] **Step 3: Конструктор с опциями**

В `internal/usecase/santa/santa.go` заменить структуру и `New`:

```go
type santaUseCase struct {
	santa       repo.SantaRepo
	users       repo.UserRepo
	shuffle     shuffleFunc
	now         func() time.Time
	mailer      usecase.Mailer
	tg          usecase.TelegramSender
	botUsername string
}

// Option подключает каналы уведомлений; без них use case работает как на этапе 1.
type Option func(*santaUseCase)

func WithMailer(m usecase.Mailer) Option { return func(uc *santaUseCase) { uc.mailer = m } }

func WithTelegram(tg usecase.TelegramSender, botUsername string) Option {
	return func(uc *santaUseCase) {
		uc.tg = tg
		uc.botUsername = botUsername
	}
}

func New(santaRepo repo.SantaRepo, userRepo repo.UserRepo, opts ...Option) usecase.SantaUseCase {
	uc := &santaUseCase{santa: santaRepo, users: userRepo, shuffle: cryptoShuffle, now: time.Now}
	for _, opt := range opts {
		opt(uc)
	}
	return uc
}
```

В `GetRoom`, где собираются `SantaParticipantView`, добавить `Ready: p.Ready(),`.

- [ ] **Step 4: Notify в карточке участника**

В `participant.go`, функция `me`, строку сборки `me := usecase.SantaMe{…}` заменить на:

```go
	me := usecase.SantaMe{
		ParticipantID: p.ID, Name: p.Name, Wishes: p.Wishes, WishlistURL: p.WishlistURL, Room: inv,
		Notify: notifyView(p),
	}
```

И добавить функцию:

```go
func notifyView(p entity.SantaParticipant) usecase.SantaNotifyView {
	return usecase.SantaNotifyView{
		Channel:       p.Channel,
		Email:         p.Email,
		EmailVerified: p.Email != "" && p.EmailVerifiedAt != nil,
		EmailPending:  p.Email != "" && p.EmailVerifiedAt == nil,
		Telegram:      p.TgChatID != nil,
		Ready:         p.Ready(),
	}
}
```

В «минимальной карточке» в `Join` (ветка сбоя `uc.me`) добавить `Notify: notifyView(p),`.

- [ ] **Step 5: Код почты**

В `secret.go` добавить (импорты `"math/big"`, `"fmt"`, `"github.com/google/uuid"` — по необходимости):

```go
// newEmailCode — 6 цифр из crypto/rand.
func newEmailCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// hashEmailCode привязывает код к участнику: одинаковые коды разных людей
// дают разные хэши.
func hashEmailCode(participantID uuid.UUID, code string) string {
	sum := sha256.Sum256([]byte(participantID.String() + ":" + code))
	return hex.EncodeToString(sum[:])
}
```

(`crypto/rand`, `crypto/sha256`, `encoding/hex` в `secret.go` уже есть — проверить и не дублировать.)

- [ ] **Step 6: Каналы**

`internal/usecase/santa/channels.go`:

```go
package santa

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"log"
	"net/mail"
	"strings"
	"time"
	"unicode/utf8"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

const (
	emailCodeTTL      = 15 * time.Minute
	emailCodeCooldown = time.Minute
	emailCodeAttempts = 5
	tgLinkTTL         = 24 * time.Hour
)

// normalizeEmail: нижний регистр, только голый адрес без имени.
func normalizeEmail(raw string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(raw))
	if email == "" {
		return "", invalid("укажите адрес почты")
	}
	if utf8.RuneCountInString(email) > 254 {
		return "", invalid("слишком длинный адрес почты")
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email || !strings.Contains(email[strings.LastIndex(email, "@")+1:], ".") {
		return "", invalid("проверьте адрес почты")
	}
	return email, nil
}

func (uc *santaUseCase) participantBySlug(ctx context.Context, slug string, auth usecase.SantaAuth) (entity.SantaRoom, entity.SantaParticipant, error) {
	room, err := uc.roomBySlug(ctx, slug)
	if err != nil {
		return entity.SantaRoom{}, entity.SantaParticipant{}, err
	}
	p, err := uc.participant(ctx, room, auth)
	if err != nil {
		return entity.SantaRoom{}, entity.SantaParticipant{}, err
	}
	return room, p, nil
}

func (uc *santaUseCase) RequestEmailCode(ctx context.Context, slug string, auth usecase.SantaAuth, rawEmail string) error {
	if uc.mailer == nil {
		return errors.New("santa: почта не настроена")
	}
	room, p, err := uc.participantBySlug(ctx, slug, auth)
	if err != nil {
		return err
	}
	email, err := normalizeEmail(rawEmail)
	if err != nil {
		return err
	}
	now := uc.now()
	prev, err := uc.santa.GetEmailCode(ctx, p.ID)
	switch {
	case err == nil:
		if now.Sub(prev.SentAt) < emailCodeCooldown {
			return usecase.ErrSantaTooSoon
		}
	case !errors.Is(err, repo.ErrNotFound):
		return err
	}
	code, err := newEmailCode()
	if err != nil {
		return err
	}
	rec := entity.SantaEmailCode{
		ParticipantID: p.ID, CodeHash: hashEmailCode(p.ID, code),
		ExpiresAt: now.Add(emailCodeTTL), SentAt: now,
	}
	if err := uc.santa.SetEmail(ctx, p.ID, email, rec); err != nil {
		switch {
		case errors.Is(err, repo.ErrDuplicate):
			return usecase.ErrSantaEmailTaken
		case errors.Is(err, repo.ErrNotFound):
			return usecase.ErrSantaNotFound
		}
		return err
	}
	msg := emailCodeMessage(room.Title, code)
	if err := uc.mailer.Send(ctx, email, msg.Subject, msg.HTML, msg.Text); err != nil {
		// Письмо не ушло — код бесполезен; стираем, чтобы повтор не ждал минуту.
		if delErr := uc.santa.DeleteEmailCode(ctx, p.ID); delErr != nil {
			log.Printf("santa: drop email code: %v", delErr)
		}
		return fmt.Errorf("send email code: %w", err)
	}
	return nil
}

func (uc *santaUseCase) VerifyEmail(ctx context.Context, slug string, auth usecase.SantaAuth, rawCode string) (usecase.SantaMe, error) {
	room, p, err := uc.participantBySlug(ctx, slug, auth)
	if err != nil {
		return usecase.SantaMe{}, err
	}
	rec, err := uc.santa.GetEmailCode(ctx, p.ID)
	if errors.Is(err, repo.ErrNotFound) {
		return usecase.SantaMe{}, invalid("кода нет — запросите новый")
	}
	if err != nil {
		return usecase.SantaMe{}, err
	}
	now := uc.now()
	if !rec.ExpiresAt.After(now) {
		return usecase.SantaMe{}, invalid("код устарел — запросите новый")
	}
	if rec.Attempts >= emailCodeAttempts {
		return usecase.SantaMe{}, invalid("слишком много попыток — запросите новый код")
	}
	code := strings.TrimSpace(rawCode)
	if subtle.ConstantTimeCompare([]byte(hashEmailCode(p.ID, code)), []byte(rec.CodeHash)) != 1 {
		if err := uc.santa.IncEmailCodeAttempts(ctx, p.ID); err != nil {
			return usecase.SantaMe{}, err
		}
		return usecase.SantaMe{}, invalid("неверный код")
	}
	welcome := entity.NewSantaNotification(p.ID, entity.SantaNotifyWelcome, now)
	if err := uc.santa.VerifyEmail(ctx, p.ID, now, welcome); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return usecase.SantaMe{}, usecase.ErrSantaNotFound
		}
		return usecase.SantaMe{}, err
	}
	p.EmailVerifiedAt = &now
	p.Channel = entity.SantaChannelEmail
	return uc.me(ctx, room, p)
}

func (uc *santaUseCase) TelegramLink(ctx context.Context, slug string, auth usecase.SantaAuth) (string, error) {
	if uc.botUsername == "" {
		return "", errors.New("santa: бот Telegram не настроен")
	}
	_, p, err := uc.participantBySlug(ctx, slug, auth)
	if err != nil {
		return "", err
	}
	raw, hash, err := newToken()
	if err != nil {
		return "", err
	}
	link := entity.SantaTgLink{TokenHash: hash, ParticipantID: p.ID, ExpiresAt: uc.now().Add(tgLinkTTL)}
	if err := uc.santa.CreateTgLink(ctx, link); err != nil {
		return "", err
	}
	return fmt.Sprintf("https://t.me/%s?start=%s", uc.botUsername, raw), nil
}

func (uc *santaUseCase) TelegramStart(ctx context.Context, chatID int64, token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return uc.tgReply(ctx, chatID, botHelloText())
	}
	now := uc.now()
	_, err := uc.santa.LinkTelegram(ctx, hashToken(token), chatID, now, func(p entity.SantaParticipant) entity.SantaNotification {
		return entity.NewSantaNotification(p.ID, entity.SantaNotifyWelcome, now)
	})
	if errors.Is(err, repo.ErrNotFound) {
		return uc.tgReply(ctx, chatID, botLinkExpiredText())
	}
	return err
}

func (uc *santaUseCase) tgReply(ctx context.Context, chatID int64, text string) error {
	if uc.tg == nil {
		return nil
	}
	return uc.tg.SendMessage(ctx, chatID, text, nil)
}
```

Временная заглушка `Remind`, чтобы тип удовлетворял интерфейсу (заменяется в Task 6), — в `channels.go` не класть; создать `internal/usecase/santa/remind.go`:

```go
package santa

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"main/internal/usecase"
)

// Remind — реализация в задаче 6.
func (uc *santaUseCase) Remind(ctx context.Context, ownerID, roomID uuid.UUID) (usecase.SantaRemindResult, error) {
	return usecase.SantaRemindResult{}, errors.New("not implemented")
}
```

- [ ] **Step 7: Мок use case в тестах обработчиков**

В `internal/controller/restapi/v1/santa_test.go` к `MockSantaUC` добавить:

```go
func (m *MockSantaUC) Remind(ctx context.Context, ownerID, roomID uuid.UUID) (usecase.SantaRemindResult, error) {
	args := m.Called(ctx, ownerID, roomID)
	r, _ := args.Get(0).(usecase.SantaRemindResult)
	return r, args.Error(1)
}
func (m *MockSantaUC) RequestEmailCode(ctx context.Context, slug string, auth usecase.SantaAuth, email string) error {
	return m.Called(ctx, slug, auth, email).Error(0)
}
func (m *MockSantaUC) VerifyEmail(ctx context.Context, slug string, auth usecase.SantaAuth, code string) (usecase.SantaMe, error) {
	args := m.Called(ctx, slug, auth, code)
	me, _ := args.Get(0).(usecase.SantaMe)
	return me, args.Error(1)
}
func (m *MockSantaUC) TelegramLink(ctx context.Context, slug string, auth usecase.SantaAuth) (string, error) {
	args := m.Called(ctx, slug, auth)
	return args.String(0), args.Error(1)
}
func (m *MockSantaUC) TelegramStart(ctx context.Context, chatID int64, token string) error {
	return m.Called(ctx, chatID, token).Error(0)
}
```

- [ ] **Step 8: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS, в том числе все тесты этапа 1.

- [ ] **Step 9: Commit**

```bash
gofmt -w internal/usecase internal/controller/restapi/v1/santa_test.go
git add internal/usecase internal/controller/restapi/v1/santa_test.go
git commit -m "feat(backend): подтверждение почты кодом и подключение Telegram для участника Санты"
```

---

### Task 6: Use case — события: жеребьёвка, правка пожеланий, «Напомнить»

**Files:**
- Modify: `BACK/internal/usecase/santa/remind.go`
- Create: `BACK/internal/usecase/santa/remind_test.go`
- Modify: `BACK/internal/usecase/santa/participant.go` (`UpdateMe`)
- Modify: `BACK/internal/usecase/santa/participant_test.go`
- Modify: `BACK/internal/usecase/santa/draw_test.go` (если ещё нет проверки note — добавлена в Task 2)

**Interfaces:**
- Consumes: Task 2 (`GetGiver`, `UpdateParticipant(ctx, p, notes...)`, `Remind` репозитория, `repo.ErrTooSoon`), Task 5 (`usecase.SantaRemindResult`, `ErrSantaTooSoon`), этап 1 (`ownedRoom`).
- Produces: `(*santaUseCase).Remind`, константа `remindCooldown = 12 * time.Hour`; `UpdateMe` кладёт `wishes_updated` Санте подопечного, если после жеребьёвки поменялись пожелания или вишлист.

- [ ] **Step 1: Падающие тесты**

`internal/usecase/santa/remind_test.go`:

```go
package santa

import (
	"context"
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

func remindUC(t *testing.T, room entity.SantaRoom, ps []entity.SantaParticipant) (*santaUseCase, *mockrepo.MockSantaRepo) {
	t.Helper()
	sr := new(mockrepo.MockSantaRepo)
	uc := New(sr, new(mockrepo.MockUserRepo)).(*santaUseCase)
	uc.now = func() time.Time { return chNow }
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("ListParticipants", mock.Anything, room.ID).Return(ps, nil)
	return uc, sr
}

func readyP(roomID uuid.UUID, wishes string) entity.SantaParticipant {
	chat := int64(1)
	return entity.SantaParticipant{ID: uuid.New(), RoomID: roomID, Name: "x", Wishes: wishes, Channel: entity.SantaChannelTelegram, TgChatID: &chat}
}

func TestRemind_OnlyReadyWithoutWishes(t *testing.T) {
	owner := uuid.New()
	room := entity.SantaRoom{ID: uuid.New(), OwnerID: owner, Status: entity.SantaRoomOpen}
	empty := readyP(room.ID, "")
	filled := readyP(room.ID, "книги")
	unready := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID}
	uc, sr := remindUC(t, room, []entity.SantaParticipant{empty, filled, unready})
	sr.On("Remind", mock.Anything, room.ID, chNow, remindCooldown, mock.MatchedBy(func(ns []entity.SantaNotification) bool {
		return len(ns) == 1 && ns[0].ParticipantID == empty.ID && ns[0].Kind == entity.SantaNotifyReminderFill
	})).Return(nil)

	res, err := uc.Remind(context.Background(), owner, room.ID)
	require.NoError(t, err)
	assert.Equal(t, usecase.SantaRemindResult{Sent: 1, Unreachable: 1}, res)
}

func TestRemind_NobodyToRemindKeepsCooldown(t *testing.T) {
	owner := uuid.New()
	room := entity.SantaRoom{ID: uuid.New(), OwnerID: owner, Status: entity.SantaRoomOpen}
	uc, sr := remindUC(t, room, []entity.SantaParticipant{readyP(room.ID, "книги")})
	res, err := uc.Remind(context.Background(), owner, room.ID)
	require.NoError(t, err)
	assert.Equal(t, 0, res.Sent)
	sr.AssertNotCalled(t, "Remind", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestRemind_TooSoon(t *testing.T) {
	owner := uuid.New()
	last := chNow.Add(-time.Hour)
	room := entity.SantaRoom{ID: uuid.New(), OwnerID: owner, Status: entity.SantaRoomOpen, LastRemindedAt: &last}
	uc, sr := remindUC(t, room, nil)
	_, err := uc.Remind(context.Background(), owner, room.ID)
	assert.ErrorIs(t, err, usecase.ErrSantaTooSoon)
	sr.AssertNotCalled(t, "ListParticipants", mock.Anything, mock.Anything)
}

func TestRemind_RaceTooSoonFromRepo(t *testing.T) {
	owner := uuid.New()
	room := entity.SantaRoom{ID: uuid.New(), OwnerID: owner, Status: entity.SantaRoomOpen}
	uc, sr := remindUC(t, room, []entity.SantaParticipant{readyP(room.ID, "")})
	sr.On("Remind", mock.Anything, room.ID, chNow, remindCooldown, mock.Anything).Return(repo.ErrTooSoon)
	_, err := uc.Remind(context.Background(), owner, room.ID)
	assert.ErrorIs(t, err, usecase.ErrSantaTooSoon)
}

func TestRemind_StrangerIsNotFound(t *testing.T) {
	room := entity.SantaRoom{ID: uuid.New(), OwnerID: uuid.New(), Status: entity.SantaRoomOpen}
	uc, _ := remindUC(t, room, nil)
	_, err := uc.Remind(context.Background(), uuid.New(), room.ID)
	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
}
```

В `participant_test.go` добавить:

```go
func TestUpdateMe_AfterDrawNotifiesSanta(t *testing.T) {
	sr := new(mockrepo.MockSantaRepo)
	ur := new(mockrepo.MockUserRepo)
	uc := New(sr, ur).(*santaUseCase)
	uc.now = func() time.Time { return chNow }
	room := entity.SantaRoom{ID: uuid.New(), Slug: "abcdefgh", Status: entity.SantaRoomDrawn}
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Аня", Wishes: "старое", TokenHash: hashToken("tok")}
	santaID := uuid.New()
	sr.On("GetRoomBySlug", mock.Anything, "abcdefgh").Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, hashToken("tok")).Return(p, nil)
	sr.On("GetGiver", mock.Anything, room.ID, p.ID).Return(entity.SantaAssignment{RoomID: room.ID, GiverID: santaID, ReceiverID: p.ID}, nil)
	sr.On("UpdateParticipant", mock.Anything, mock.Anything, mock.MatchedBy(func(ns []entity.SantaNotification) bool {
		return len(ns) == 1 && ns[0].ParticipantID == santaID && ns[0].Kind == entity.SantaNotifyWishesUpdated
	})).Return(nil)
	sr.On("CountParticipants", mock.Anything, mock.Anything).Return(map[uuid.UUID]int{}, nil)
	sr.On("GetAssignment", mock.Anything, room.ID, p.ID).Return(entity.SantaAssignment{}, repo.ErrNotFound)
	ur.On("GetByID", mock.Anything, mock.Anything).Return(nil, repo.ErrNotFound)

	_, err := uc.UpdateMe(context.Background(), "abcdefgh", usecase.SantaAuth{Token: "tok"},
		usecase.SantaProfileInput{Name: "Аня", Wishes: "новое"})
	require.NoError(t, err)
	sr.AssertExpectations(t)
}

func TestUpdateMe_AfterDrawSameWishesNoNotify(t *testing.T) {
	sr := new(mockrepo.MockSantaRepo)
	ur := new(mockrepo.MockUserRepo)
	uc := New(sr, ur).(*santaUseCase)
	room := entity.SantaRoom{ID: uuid.New(), Slug: "abcdefgh", Status: entity.SantaRoomDrawn}
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Аня", Wishes: "то же", TokenHash: hashToken("tok")}
	sr.On("GetRoomBySlug", mock.Anything, "abcdefgh").Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, hashToken("tok")).Return(p, nil)
	sr.On("UpdateParticipant", mock.Anything, mock.Anything, []entity.SantaNotification(nil)).Return(nil)
	sr.On("CountParticipants", mock.Anything, mock.Anything).Return(map[uuid.UUID]int{}, nil)
	sr.On("GetAssignment", mock.Anything, room.ID, p.ID).Return(entity.SantaAssignment{}, repo.ErrNotFound)
	ur.On("GetByID", mock.Anything, mock.Anything).Return(nil, repo.ErrNotFound)

	_, err := uc.UpdateMe(context.Background(), "abcdefgh", usecase.SantaAuth{Token: "tok"},
		usecase.SantaProfileInput{Name: "Аня", Wishes: "то же"})
	require.NoError(t, err)
	sr.AssertNotCalled(t, "GetGiver", mock.Anything, mock.Anything, mock.Anything)
}
```

Поправить `ur.On("GetByID", …).Return(...)` под фактический тип `MockUserRepo.GetByID` (как в Task 5). Существующие тесты `UpdateMe` после жеребьёвки, где пожелания меняются, теперь вызовут `GetGiver` — добавить им `sr.On("GetGiver", mock.Anything, mock.Anything, mock.Anything).Return(entity.SantaAssignment{}, repo.ErrNotFound)`.

Run: `go test ./internal/usecase/santa/ -run 'Remind|UpdateMe' -v`
Expected: FAIL — `Remind` возвращает «not implemented», `UpdateMe` не зовёт `GetGiver`.

- [ ] **Step 2: Реализация «Напомнить»**

`internal/usecase/santa/remind.go` заменить целиком:

```go
package santa

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

const remindCooldown = 12 * time.Hour

// Remind — напоминание тем, у кого пусто и в пожеланиях, и в вишлисте. Без
// подтверждённого канала сообщение не дойдёт — таких только считаем, их
// организатор видит в списке и зовёт сам.
func (uc *santaUseCase) Remind(ctx context.Context, ownerID, roomID uuid.UUID) (usecase.SantaRemindResult, error) {
	room, err := uc.ownedRoom(ctx, ownerID, roomID)
	if err != nil {
		return usecase.SantaRemindResult{}, err
	}
	now := uc.now()
	if room.LastRemindedAt != nil && now.Sub(*room.LastRemindedAt) < remindCooldown {
		return usecase.SantaRemindResult{}, usecase.ErrSantaTooSoon
	}
	ps, err := uc.santa.ListParticipants(ctx, room.ID)
	if err != nil {
		return usecase.SantaRemindResult{}, err
	}
	var res usecase.SantaRemindResult
	var notes []entity.SantaNotification
	for _, p := range ps {
		if !p.Ready() {
			res.Unreachable++
			continue
		}
		if p.Wishes == "" && p.WishlistURL == "" {
			notes = append(notes, entity.NewSantaNotification(p.ID, entity.SantaNotifyReminderFill, now))
			res.Sent++
		}
	}
	// Некому слать — время напоминания не тратим.
	if len(notes) == 0 {
		return res, nil
	}
	if err := uc.santa.Remind(ctx, room.ID, now, remindCooldown, notes); err != nil {
		if errors.Is(err, repo.ErrTooSoon) {
			return usecase.SantaRemindResult{}, usecase.ErrSantaTooSoon
		}
		return usecase.SantaRemindResult{}, err
	}
	return res, nil
}
```

- [ ] **Step 3: Правка пожеланий будит Санту**

В `participant.go`, функция `UpdateMe`, заменить блок от `p.Name = in.Name` до вызова `UpdateParticipant` включительно:

```go
	changed := p.Wishes != in.Wishes || p.WishlistURL != in.WishlistURL
	p.Name = in.Name
	p.Wishes = in.Wishes
	p.WishlistURL = in.WishlistURL
	p.UpdatedAt = uc.now()

	var notes []entity.SantaNotification
	if room.Status == entity.SantaRoomDrawn && changed {
		a, err := uc.santa.GetGiver(ctx, room.ID, p.ID)
		switch {
		case err == nil:
			notes = append(notes, entity.NewSantaNotification(a.GiverID, entity.SantaNotifyWishesUpdated, p.UpdatedAt))
		case !errors.Is(err, repo.ErrNotFound):
			return usecase.SantaMe{}, err
		}
	}
	if err := uc.santa.UpdateParticipant(ctx, p, notes...); err != nil {
```

(остаток функции — обработка ошибки и `return uc.me(ctx, room, p)` — без изменений).

- [ ] **Step 4: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -w internal/usecase/santa
git add internal/usecase/santa
git commit -m "feat(backend): «Напомнить» организатора и уведомление Санте о новых пожеланиях"
```

---

### Task 7: Обработчик очереди уведомлений

**Files:**
- Create: `BACK/internal/usecase/santa/notifier.go`
- Create: `BACK/internal/usecase/santa/notifier_test.go`

**Interfaces:**
- Consumes: Task 2 (`ClaimNotifications`, `MarkNotificationSent`, `MarkNotificationFailed`), Task 3 (`usecase.Mailer`, `usecase.TelegramSender`, `telegram.Button`), Task 4 (все `…Message`, `roomLink`).
- Produces: `santa.NewNotifier(santaRepo repo.SantaRepo, mailer usecase.Mailer, tg usecase.TelegramSender, publicURL string) *santa.Notifier`; `(*Notifier).RunOnce(ctx) (sent int, err error)`; `(*Notifier).Run(ctx context.Context, tick time.Duration)`; константы `notifyBatch = 20`, `notifyLease = 2*time.Minute`, `maxNotifyAttempts = 4`; `retryDelays = []time.Duration{time.Minute, 5*time.Minute, 30*time.Minute}`.

- [ ] **Step 1: Падающий тест**

`internal/usecase/santa/notifier_test.go`:

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

type notifierEnv struct {
	n     *Notifier
	sr    *mockrepo.MockSantaRepo
	ml    *fakeMailer
	tg    *fakeTG
	room  entity.SantaRoom
	giver entity.SantaParticipant
	ward  entity.SantaParticipant
}

func newNotifierEnv(t *testing.T) notifierEnv {
	t.Helper()
	sr := new(mockrepo.MockSantaRepo)
	ml := &fakeMailer{}
	tg := &fakeTG{}
	n := NewNotifier(sr, ml, tg, "https://santa.prosto-namekni.ru")
	n.now = func() time.Time { return chNow }
	room := entity.SantaRoom{ID: uuid.New(), Slug: "abcdefgh", Title: "Офис"}
	verified := chNow
	giver := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Аня", Channel: entity.SantaChannelEmail, Email: "anna@example.com", EmailVerifiedAt: &verified}
	chat := int64(55)
	ward := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Боря", Wishes: "носки", Channel: entity.SantaChannelTelegram, TgChatID: &chat}
	sr.On("GetParticipant", mock.Anything, giver.ID).Return(giver, nil)
	sr.On("GetParticipant", mock.Anything, ward.ID).Return(ward, nil)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	return notifierEnv{n: n, sr: sr, ml: ml, tg: tg, room: room, giver: giver, ward: ward}
}

func TestNotifier_DrawnByEmail(t *testing.T) {
	e := newNotifierEnv(t)
	note := entity.NewSantaNotification(e.giver.ID, entity.SantaNotifyDrawn, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("GetAssignment", mock.Anything, e.room.ID, e.giver.ID).Return(entity.SantaAssignment{RoomID: e.room.ID, GiverID: e.giver.ID, ReceiverID: e.ward.ID}, nil)
	e.sr.On("MarkNotificationSent", mock.Anything, note.ID).Return(nil)

	sent, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 1, sent)
	assert.Equal(t, "anna@example.com", e.ml.to)
	assert.Contains(t, e.ml.text, "Боря")
	assert.Contains(t, e.ml.text, "носки")
	assert.Contains(t, e.ml.text, "https://santa.prosto-namekni.ru/r/abcdefgh")
}

func TestNotifier_WelcomeByTelegram(t *testing.T) {
	e := newNotifierEnv(t)
	note := entity.NewSantaNotification(e.ward.ID, entity.SantaNotifyWelcome, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("MarkNotificationSent", mock.Anything, note.ID).Return(nil)

	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.EqualValues(t, 55, e.tg.chatID)
	assert.Contains(t, e.tg.text, "Офис")
}

func TestNotifier_RetrySchedule(t *testing.T) {
	for attempts, want := range map[int]*time.Duration{
		0: durp(time.Minute),
		1: durp(5 * time.Minute),
		2: durp(30 * time.Minute),
		3: nil, // четвёртая неудача — failed
	} {
		e := newNotifierEnv(t)
		e.ml.err = errors.New("smtp down")
		note := entity.NewSantaNotification(e.giver.ID, entity.SantaNotifyWelcome, chNow)
		note.Attempts = attempts
		e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
		var gotRetry *time.Time
		e.sr.On("MarkNotificationFailed", mock.Anything, note.ID, attempts+1, mock.Anything, "smtp down").Run(func(a mock.Arguments) {
			gotRetry = a.Get(3).(*time.Time)
		}).Return(nil)

		_, err := e.n.RunOnce(context.Background())
		require.NoError(t, err)
		if want == nil {
			assert.Nil(t, gotRetry, "попытка %d", attempts+1)
		} else {
			require.NotNil(t, gotRetry, "попытка %d", attempts+1)
			assert.Equal(t, chNow.Add(*want), *gotRetry)
		}
	}
}

func durp(d time.Duration) *time.Duration { return &d }

func TestNotifier_PermanentFailures(t *testing.T) {
	e := newNotifierEnv(t)
	gone := entity.NewSantaNotification(uuid.New(), entity.SantaNotifyWelcome, chNow)
	e.sr.On("GetParticipant", mock.Anything, gone.ParticipantID).Return(entity.SantaParticipant{}, repo.ErrNotFound)
	noPair := entity.NewSantaNotification(e.giver.ID, entity.SantaNotifyDrawn, chNow)
	e.sr.On("GetAssignment", mock.Anything, e.room.ID, e.giver.ID).Return(entity.SantaAssignment{}, repo.ErrNotFound)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{gone, noPair}, nil)
	e.sr.On("MarkNotificationFailed", mock.Anything, gone.ID, 1, (*time.Time)(nil), mock.Anything).Return(nil)
	e.sr.On("MarkNotificationFailed", mock.Anything, noPair.ID, 1, (*time.Time)(nil), mock.Anything).Return(nil)

	sent, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 0, sent)
	e.sr.AssertExpectations(t)
}

func TestNotifier_UnreadyChannelIsPermanent(t *testing.T) {
	e := newNotifierEnv(t)
	plain := entity.SantaParticipant{ID: uuid.New(), RoomID: e.room.ID, Name: "Без канала"}
	e.sr.On("GetParticipant", mock.Anything, plain.ID).Return(plain, nil)
	note := entity.NewSantaNotification(plain.ID, entity.SantaNotifyReminderFill, chNow)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return([]entity.SantaNotification{note}, nil)
	e.sr.On("MarkNotificationFailed", mock.Anything, note.ID, 1, (*time.Time)(nil), mock.Anything).Return(nil)
	_, err := e.n.RunOnce(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 0, e.ml.calls+e.tg.calls)
}

func TestNotifier_ClaimError(t *testing.T) {
	e := newNotifierEnv(t)
	e.sr.On("ClaimNotifications", mock.Anything, chNow, notifyBatch, notifyLease).Return(nil, errors.New("db down"))
	_, err := e.n.RunOnce(context.Background())
	assert.Error(t, err)
}
```

Run: `go test ./internal/usecase/santa/ -run Notifier -v`
Expected: FAIL — нет `NewNotifier`.

- [ ] **Step 2: Реализация**

`internal/usecase/santa/notifier.go`:

```go
package santa

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
	"main/pkg/telegram"
)

const (
	notifyBatch       = 20
	notifyLease       = 2 * time.Minute
	maxNotifyAttempts = 4
)

// retryDelays[i] — пауза после (i+1)-й неудачи; после maxNotifyAttempts — failed.
var retryDelays = []time.Duration{time.Minute, 5 * time.Minute, 30 * time.Minute}

// errPermanent — повторять бессмысленно: участника нет, канал не подтверждён, пары нет.
var errPermanent = errors.New("permanent")

// Notifier разбирает outbox santa_notifications. Текст собирается в момент
// отправки из текущей базы: после перезапуска жеребьёвки уйдёт новая пара.
type Notifier struct {
	santa     repo.SantaRepo
	mailer    usecase.Mailer
	tg        usecase.TelegramSender
	publicURL string
	now       func() time.Time
}

func NewNotifier(santaRepo repo.SantaRepo, mailer usecase.Mailer, tg usecase.TelegramSender, publicURL string) *Notifier {
	return &Notifier{santa: santaRepo, mailer: mailer, tg: tg, publicURL: publicURL, now: time.Now}
}

// Run крутит RunOnce каждые tick до отмены ctx.
func (n *Notifier) Run(ctx context.Context, tick time.Duration) {
	t := time.NewTicker(tick)
	defer t.Stop()
	for {
		if _, err := n.RunOnce(ctx); err != nil && ctx.Err() == nil {
			log.Printf("santa notifier: %v", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		}
	}
}

func (n *Notifier) RunOnce(ctx context.Context) (int, error) {
	now := n.now()
	batch, err := n.santa.ClaimNotifications(ctx, now, notifyBatch, notifyLease)
	if err != nil {
		return 0, err
	}
	sent := 0
	for _, note := range batch {
		err := n.deliver(ctx, note)
		if err == nil {
			if mErr := n.santa.MarkNotificationSent(ctx, note.ID); mErr != nil {
				log.Printf("santa notifier: mark sent %s: %v", note.ID, mErr)
			}
			sent++
			continue
		}
		attempts := note.Attempts + 1
		var retryAt *time.Time
		if !errors.Is(err, errPermanent) && attempts < maxNotifyAttempts {
			at := now.Add(retryDelays[attempts-1])
			retryAt = &at
		}
		if mErr := n.santa.MarkNotificationFailed(ctx, note.ID, attempts, retryAt, err.Error()); mErr != nil {
			log.Printf("santa notifier: mark failed %s: %v", note.ID, mErr)
		}
	}
	return sent, nil
}

func (n *Notifier) deliver(ctx context.Context, note entity.SantaNotification) error {
	p, err := n.santa.GetParticipant(ctx, note.ParticipantID)
	if errors.Is(err, repo.ErrNotFound) {
		return fmt.Errorf("%w: участника нет", errPermanent)
	}
	if err != nil {
		return err
	}
	if !p.Ready() {
		return fmt.Errorf("%w: канал не подтверждён", errPermanent)
	}
	room, err := n.santa.GetRoomByID(ctx, p.RoomID)
	if errors.Is(err, repo.ErrNotFound) {
		return fmt.Errorf("%w: комнаты нет", errPermanent)
	}
	if err != nil {
		return err
	}
	msg, err := n.compose(ctx, note.Kind, room, p)
	if err != nil {
		return err
	}
	switch p.Channel {
	case entity.SantaChannelEmail:
		if n.mailer == nil {
			return fmt.Errorf("%w: почта не настроена", errPermanent)
		}
		return n.mailer.Send(ctx, p.Email, msg.Subject, msg.HTML, msg.Text)
	case entity.SantaChannelTelegram:
		if n.tg == nil {
			return fmt.Errorf("%w: бот не настроен", errPermanent)
		}
		return n.tg.SendMessage(ctx, *p.TgChatID, msg.Telegram, []telegram.Button{{Text: msg.ButtonText, URL: msg.URL}})
	}
	return fmt.Errorf("%w: нет канала", errPermanent)
}

func (n *Notifier) compose(ctx context.Context, kind entity.SantaNotificationKind, room entity.SantaRoom, p entity.SantaParticipant) (message, error) {
	link := roomLink(n.publicURL, room.Slug)
	switch kind {
	case entity.SantaNotifyWelcome:
		return welcomeMessage(room, link), nil
	case entity.SantaNotifyReminderFill:
		return reminderMessage(room, link), nil
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
		if kind == entity.SantaNotifyDrawn {
			return drawnMessage(room, ward, link), nil
		}
		return wishesUpdatedMessage(room, ward, link), nil
	}
	return message{}, fmt.Errorf("%w: неизвестный вид %q", errPermanent, kind)
}
```

- [ ] **Step 3: Тесты проходят**

Run: `go test ./internal/usecase/santa/ -count=1 -v -run Notifier` и затем `go test ./...`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
gofmt -w internal/usecase/santa/notifier.go internal/usecase/santa/notifier_test.go
git add internal/usecase/santa/notifier.go internal/usecase/santa/notifier_test.go
git commit -m "feat(backend): обработчик очереди уведомлений Санты с повторами"
```

---

### Task 8: HTTP, вебхук бота, конфиг и запуск

**Files:**
- Modify: `BACK/internal/controller/restapi/v1/santa.go`
- Modify: `BACK/internal/controller/restapi/v1/santa_test.go`
- Modify: `BACK/internal/controller/restapi/router.go`
- Modify: `BACK/config/config.go`
- Modify: `BACK/internal/app/app.go`
- Modify: `BACK/.env.example`, `BACK/Makefile`

**Interfaces:**
- Consumes: Tasks 3, 5, 6, 7.
- Produces: `v1.NewSantaRouter(router fiber.Router, jwtSecret, webhookSecret string, uc usecase.SantaUseCase)`; маршруты `POST /api/v1/santa/r/:slug/me/email` `{email}` → `{data:true}`; `POST /api/v1/santa/r/:slug/me/email/verify` `{code}` → `{data: SantaMe}`; `POST /api/v1/santa/r/:slug/me/telegram` → `{data:{url}}`; `POST /api/v1/santa/rooms/:id/remind` → `{data: SantaRemindResult}`; `POST /api/v1/telegram/webhook` (только при непустом секрете); `config.NotifyConfig`; `cfg.Notify`.

- [ ] **Step 1: Падающие тесты обработчиков**

В `santa_test.go` посмотреть, как собирается приложение для тестов (функция-хелпер, например `santaApp(uc)`), и передать в `NewSantaRouter` секрет `"hook-secret"`. Добавить тесты:

```go
func TestSantaRequestEmailCode(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc) // хелпер этапа 1, вызывающий v1.NewSantaRouter(app, secret, "hook-secret", uc)
	uc.On("RequestEmailCode", mock.Anything, "abcdefgh", usecase.SantaAuth{Token: "tok"}, "a@example.com").Return(nil)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/r/abcdefgh/me/email", strings.NewReader(`{"email":"a@example.com"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(v1.SantaTokenHeader, "tok")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestSantaRequestEmailCode_TooSoonIs429(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	uc.On("RequestEmailCode", mock.Anything, "abcdefgh", mock.Anything, mock.Anything).Return(usecase.ErrSantaTooSoon)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/r/abcdefgh/me/email", strings.NewReader(`{"email":"a@example.com"}`))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusTooManyRequests, resp.StatusCode)
}

func TestSantaEmailTakenIs409(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	uc.On("RequestEmailCode", mock.Anything, "abcdefgh", mock.Anything, mock.Anything).Return(usecase.ErrSantaEmailTaken)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/r/abcdefgh/me/email", strings.NewReader(`{"email":"a@example.com"}`))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusConflict, resp.StatusCode)
}

func TestSantaVerifyEmail(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	uc.On("VerifyEmail", mock.Anything, "abcdefgh", mock.Anything, "123456").Return(usecase.SantaMe{Name: "Аня", Notify: usecase.SantaNotifyView{Ready: true}}, nil)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/r/abcdefgh/me/email/verify", strings.NewReader(`{"code":"123456"}`))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), `"ready":true`)
}

func TestSantaTelegramLink(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	uc.On("TelegramLink", mock.Anything, "abcdefgh", mock.Anything).Return("https://t.me/bot?start=x", nil)
	resp, err := app.Test(httptest.NewRequest(http.MethodPost, "/api/v1/santa/r/abcdefgh/me/telegram", nil))
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.JSONEq(t, `{"data":{"url":"https://t.me/bot?start=x"}}`, string(body))
}

func TestTelegramWebhook_StartWithToken(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	uc.On("TelegramStart", mock.Anything, int64(77), "RAWTOKEN").Return(nil)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/telegram/webhook",
		strings.NewReader(`{"update_id":1,"message":{"chat":{"id":77},"text":"/start RAWTOKEN"}}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Telegram-Bot-Api-Secret-Token", "hook-secret")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	uc.AssertExpectations(t)
}

func TestTelegramWebhook_RejectsWrongSecret(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/telegram/webhook",
		strings.NewReader(`{"message":{"chat":{"id":77},"text":"/start X"}}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Telegram-Bot-Api-Secret-Token", "wrong")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	uc.AssertNotCalled(t, "TelegramStart", mock.Anything, mock.Anything, mock.Anything)
}

func TestTelegramWebhook_IgnoresOtherUpdates(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	for _, body := range []string{`{"edited_message":{}}`, `{"message":{"chat":{"id":1},"text":"привет"}}`, `не json`} {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/telegram/webhook", strings.NewReader(body))
		req.Header.Set("X-Telegram-Bot-Api-Secret-Token", "hook-secret")
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode, body)
	}
	uc.AssertNotCalled(t, "TelegramStart", mock.Anything, mock.Anything, mock.Anything)
}

func TestSantaRemind(t *testing.T) {
	uc := new(MockSantaUC)
	app := santaTestApp(uc)
	roomID := uuid.New()
	uc.On("Remind", mock.Anything, mock.Anything, roomID).Return(usecase.SantaRemindResult{Sent: 2, Unreachable: 1}, nil)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/rooms/"+roomID.String()+"/remind", nil)
	authorize(t, req) // хелпер этапа 1, ставящий валидный JWT; если зовётся иначе — использовать его
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.JSONEq(t, `{"data":{"sent":2,"unreachable":1}}`, string(body))
}
```

Имена хелперов `santaTestApp` и `authorize` — взять фактические из `santa_test.go` этапа 1 (там уже есть сборка fiber-приложения и выдача JWT для тестов `/rooms`); если хелпера сборки нет — завести `santaTestApp(uc usecase.SantaUseCase) *fiber.App`, повторяющий текущую сборку в тестах. Тест `/remind` без JWT должен давать 401, как остальные `/rooms`.

Run: `go test ./internal/controller/restapi/v1/ -run 'Santa|Telegram' -v`
Expected: FAIL.

- [ ] **Step 2: Обработчики и маршруты**

В `santa.go` (импорты `"crypto/subtle"`, `"encoding/json"`, `"strings"`):

Сигнатура и регистрация:

```go
// TelegramSecretHeader — Telegram кладёт сюда secret_token из setWebhook.
const TelegramSecretHeader = "X-Telegram-Bot-Api-Secret-Token"

func NewSantaRouter(router fiber.Router, jwtSecret, webhookSecret string, uc usecase.SantaUseCase) {
	h := &santaHandler{uc: uc}
	api := router.Group("/api/v1/santa")
	optional := middleware.JWTOptional(jwtSecret)

	api.Get("/r/:slug", h.invite)
	api.Post("/r/:slug/join", optional, h.join)
	api.Get("/r/:slug/me", optional, h.me)
	api.Patch("/r/:slug/me", optional, h.updateMe)
	api.Delete("/r/:slug/me", optional, h.leave)
	api.Post("/r/:slug/me/email", optional, h.requestEmailCode)
	api.Post("/r/:slug/me/email/verify", optional, h.verifyEmail)
	api.Post("/r/:slug/me/telegram", optional, h.telegramLink)

	rooms := api.Group("/rooms", middleware.JWTRequired401(jwtSecret))
	rooms.Get("", h.listRooms)
	rooms.Post("", h.createRoom)
	rooms.Get("/:id", h.getRoom)
	rooms.Patch("/:id", h.updateRoom)
	rooms.Delete("/:id", h.deleteRoom)
	rooms.Delete("/:id/participants/:pid", h.removeParticipant)
	rooms.Post("/:id/draw", h.draw)
	rooms.Post("/:id/redraw", h.redraw)
	rooms.Post("/:id/remind", h.remind)

	// Без секрета вебхук не включаем: иначе любой мог бы слать «апдейты».
	if webhookSecret != "" {
		router.Post("/api/v1/telegram/webhook", h.telegramWebhook(webhookSecret))
	}
}
```

В `santaError` перед `log.Printf`:

```go
	case errors.Is(err, usecase.ErrSantaEmailTaken):
		return c.Status(fiber.StatusConflict).JSON(response.Error(usecase.ErrSantaEmailTaken.Error()))
	case errors.Is(err, usecase.ErrSantaTooSoon):
		return c.Status(fiber.StatusTooManyRequests).JSON(response.Error(usecase.ErrSantaTooSoon.Error()))
```

(case-ветки — внутрь существующего `switch`.)

Обработчики (по образцу существующих `me`/`draw`; посмотреть, как они читают slug и отвечают):

```go
func (h *santaHandler) requestEmailCode(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	if err := h.uc.RequestEmailCode(c.Context(), c.Params("slug"), santaAuth(c), body.Email); err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(true))
}

func (h *santaHandler) verifyEmail(c *fiber.Ctx) error {
	var body struct {
		Code string `json:"code"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	me, err := h.uc.VerifyEmail(c.Context(), c.Params("slug"), santaAuth(c), body.Code)
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(me))
}

func (h *santaHandler) telegramLink(c *fiber.Ctx) error {
	url, err := h.uc.TelegramLink(c.Context(), c.Params("slug"), santaAuth(c))
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(fiber.Map{"url": url}))
}

func (h *santaHandler) remind(c *fiber.Ctx) error {
	userID, roomID, ok, err := ownerParams(c)
	if !ok {
		return err
	}
	res, err := h.uc.Remind(c.Context(), userID, roomID)
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(res))
}

type telegramUpdate struct {
	Message *struct {
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text string `json:"text"`
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
		if text == "/start" || strings.HasPrefix(text, "/start ") {
			token := strings.TrimSpace(strings.TrimPrefix(text, "/start"))
			if err := h.uc.TelegramStart(c.Context(), u.Message.Chat.ID, token); err != nil {
				log.Printf("santa: telegram start: %v", err)
			}
		}
		return c.SendStatus(fiber.StatusOK)
	}
}
```

- [ ] **Step 3: Роутер**

В `internal/controller/restapi/router.go`:

- лимитер не должен душить Telegram (все апдейты с немногих IP):

```go
	app.Use(limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Second,
		// Вебхук бота защищён секретом; апдейты Telegram идут с немногих IP.
		Next: func(c *fiber.Ctx) bool { return c.Path() == "/api/v1/telegram/webhook" },
	}))
```

- вызов `v1.NewSantaRouter(app, cfg.Auth.JWTSecret, santaUC)` заменить на `v1.NewSantaRouter(app, cfg.Auth.JWTSecret, cfg.Notify.TelegramWebhookSecret, santaUC)`.

- [ ] **Step 4: Конфиг**

В `config/config.go`: в `Config` добавить поле `Notify NotifyConfig`; тип:

```go
// NotifyConfig — уведомления Тайного Санты.
type NotifyConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	MailFrom     string
	// TelegramBotToken — SANTA_BOT_TOKEN, по умолчанию бот входа BOT_TOKEN.
	TelegramBotToken      string
	TelegramBotUsername   string
	TelegramWebhookSecret string
	// SantaPublicURL — адрес поддомена для ссылок в письмах и сообщениях.
	SantaPublicURL string
}
```

в `LoadConfig` после `Minio`:

```go
		Notify: NotifyConfig{
			SMTPHost:              getEnv("SMTP_HOST", ""),
			SMTPPort:              getEnvAsInt("SMTP_PORT", 587),
			SMTPUser:              getEnv("SMTP_USER", ""),
			SMTPPassword:          getEnv("SMTP_PASSWORD", ""),
			MailFrom:              getEnv("MAIL_FROM", "Тайный Санта <santa@prosto-namekni.ru>"),
			TelegramBotToken:      getEnv("SANTA_BOT_TOKEN", getEnv("BOT_TOKEN", "")),
			TelegramBotUsername:   getEnv("BOT_USERNAME", ""),
			TelegramWebhookSecret: getEnv("TELEGRAM_WEBHOOK_SECRET", ""),
			SantaPublicURL:        getEnv("SANTA_PUBLIC_URL", "https://santa.prosto-namekni.ru"),
		},
```

и хелпер:

```go
func getEnvAsInt(key string, defaultValue int) int {
	if valueStr := getEnv(key, ""); valueStr != "" {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
}
```

- [ ] **Step 5: Запуск**

В `internal/app/app.go` (импорты `"context"`, `"time"`, `"main/internal/usecase"`, `"main/pkg/mailer"`, `"main/pkg/telegram"`):

заменить строку `santaUseCase := santaUC.New(santaRepo, userRepo)` на:

```go
	// Уведомления Санты: без SMTP и токена бота — в лог (разработка).
	var mail usecase.Mailer = mailer.NewLog()
	if cfg.Notify.SMTPHost != "" {
		smtpMailer, err := mailer.NewSMTP(mailer.Config{
			Host: cfg.Notify.SMTPHost, Port: cfg.Notify.SMTPPort,
			User: cfg.Notify.SMTPUser, Password: cfg.Notify.SMTPPassword, From: cfg.Notify.MailFrom,
		})
		if err != nil {
			log.Fatalf("mailer: %v", err)
		}
		mail = smtpMailer
	} else {
		log.Println("WARNING: SMTP_HOST не задан — письма Санты уходят в лог")
	}
	var bot usecase.TelegramSender = telegram.NewLog()
	if cfg.Notify.TelegramBotToken != "" {
		bot = telegram.New(cfg.Notify.TelegramBotToken)
	} else {
		log.Println("WARNING: токен бота не задан — сообщения Санты уходят в лог")
	}
	santaUseCase := santaUC.New(santaRepo, userRepo,
		santaUC.WithMailer(mail), santaUC.WithTelegram(bot, cfg.Notify.TelegramBotUsername))
	notifyCtx, stopNotify := context.WithCancel(context.Background())
	defer stopNotify()
	go santaUC.NewNotifier(santaRepo, mail, bot, cfg.Notify.SantaPublicURL).Run(notifyCtx, 5*time.Second)
```

После `log.Println("Shutting down server...")` добавить `stopNotify()`.

- [ ] **Step 6: .env.example и Makefile**

В `.env.example` после блока Auth:

```
# Тайный Санта — уведомления
# Без SMTP_HOST письма пишутся в лог; без токена бота — сообщения в лог.
SANTA_PUBLIC_URL=https://santa.prosto-namekni.ru
API_PUBLIC_URL=https://api.prosto-namekni.ru
# Yandex Cloud Postbox: 587 — STARTTLS, 465 — TLS
SMTP_HOST=postbox.cloud.yandex.net
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=Тайный Санта <santa@prosto-namekni.ru>
# Бот: по умолчанию тот же, что вход через Telegram (BOT_TOKEN)
SANTA_BOT_TOKEN=
BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
```

В `Makefile` — в `.PHONY` добавить `tg-webhook` и цель:

```make
# Регистрирует вебхук бота Санты. Нужны SANTA_BOT_TOKEN (или BOT_TOKEN),
# TELEGRAM_WEBHOOK_SECRET и API_PUBLIC_URL в окружении:
#   SANTA_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… API_PUBLIC_URL=https://api.prosto-namekni.ru make tg-webhook
tg-webhook:
	@curl -fsS "https://api.telegram.org/bot$${SANTA_BOT_TOKEN:-$$BOT_TOKEN}/setWebhook" \
		--data-urlencode "url=$${API_PUBLIC_URL}/api/v1/telegram/webhook" \
		--data-urlencode "secret_token=$${TELEGRAM_WEBHOOK_SECRET}" \
		--data-urlencode 'allowed_updates=["message"]'
	@echo
```

- [ ] **Step 7: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./... -count=1`
Expected: PASS (Docker запущен).

- [ ] **Step 8: Commit**

```bash
gofmt -w internal config
git add internal config .env.example Makefile
git commit -m "feat(backend): API уведомлений Санты, вебхук бота и запуск обработчика очереди"
```

---

## Фронтенд

### Task 9: Типы, хелперы и хуки

**Files:**
- Modify: `FRONT/shared/types.ts`
- Modify: `FRONT/shared/santa.ts`
- Modify: `FRONT/tests/santa.test.cjs`
- Modify: `FRONT/api/santa/index.ts`

**Interfaces:**
- Consumes: контракт API из Task 8.
- Produces (types): `SantaChannel`, `SantaNotifyView`, поле `SantaMe.notify`, `SantaParticipantView.ready`, `SantaRoom.lastRemindedAt`, `SantaRemindResult`.
- Produces (`shared/santa.ts`): `emailSchema`, `type EmailValues`, `codeSchema`, `type CodeValues`, `REMIND_COOLDOWN_MS`, `remindAvailableAt(lastRemindedAt: string | null): Date | null`, `canRemind(lastRemindedAt: string | null, now?: number): boolean`, `readyCount(ps: { ready: boolean }[]): number`, `channelLabel(n: SantaNotifyView): string`, `formatTime(d: Date): string`.
- Produces (hooks): `useApiSantaRequestEmailCode(slug)` (переменная — строка email), `useApiSantaVerifyEmail(slug)` (переменная — строка code; кладёт ответ в `['santa-me', slug]`), `useApiSantaTelegramLink(slug)` (ответ `{ data: { url } }`), `useApiSantaRemind(roomId)` (ответ `{ data: SantaRemindResult }`, инвалидирует `['santa-room', roomId]`).

- [ ] **Step 1: Падающий тест**

В `tests/santa.test.cjs` расширить деструктуризацию `load('shared/santa.ts')` именами `emailSchema, codeSchema, canRemind, remindAvailableAt, readyCount, channelLabel` и добавить:

```js
test('почта и код: проверка формы', () => {
  assert.equal(emailSchema.safeParse({ email: 'anna@example.com' }).success, true)
  assert.equal(emailSchema.safeParse({ email: 'не адрес' }).success, false)
  assert.equal(emailSchema.safeParse({ email: '' }).success, false)
  assert.equal(codeSchema.safeParse({ code: '042137' }).success, true)
  assert.equal(codeSchema.safeParse({ code: ' 042137 ' }).success, true)
  assert.equal(codeSchema.safeParse({ code: '42137' }).success, false)
  assert.equal(codeSchema.safeParse({ code: 'abcdef' }).success, false)
})

test('напомнить можно раз в 12 часов', () => {
  const at = '2026-11-20T10:00:00Z'
  const base = Date.parse(at)
  assert.equal(canRemind(null), true)
  assert.equal(canRemind(at, base + 11 * 3600e3), false)
  assert.equal(canRemind(at, base + 12 * 3600e3), true)
  assert.equal(remindAvailableAt(null), null)
  assert.equal(remindAvailableAt(at).getTime(), base + 12 * 3600e3)
})

test('готовые к жеребьёвке и подпись канала', () => {
  assert.equal(readyCount([{ ready: true }, { ready: false }, { ready: true }]), 2)
  const base = { channel: '', email: '', emailVerified: false, emailPending: false, telegram: false, ready: false }
  assert.equal(channelLabel({ ...base, channel: 'telegram', telegram: true, ready: true }), 'в Telegram')
  assert.equal(channelLabel({ ...base, channel: 'email', email: 'a@b.ru', emailVerified: true, ready: true }), 'на почту a@b.ru')
  assert.equal(channelLabel(base), '')
})
```

Run: `node --test tests/santa.test.cjs`
Expected: FAIL — нет экспортов.

- [ ] **Step 2: Типы**

В `shared/types.ts`:

в `SantaRoom` после `drawnAt` — `lastRemindedAt: string | null`;
в `SantaParticipantView` после `hasWishlist` — `/** Канал подтверждён: попадёт в жеребьёвку. */ ready: boolean`;
перед `SantaMe`:

```ts
export type SantaChannel = '' | 'email' | 'telegram'

/** Куда участнику придут уведомления; видит только он сам. */
export type SantaNotifyView = {
  channel: SantaChannel
  email: string
  emailVerified: boolean
  /** Код отправлен, адрес ещё не подтверждён. */
  emailPending: boolean
  telegram: boolean
  /** Канал подтверждён — участник попадёт в жеребьёвку. */
  ready: boolean
}
```

в `SantaMe` после `wishlistUrl` — `notify: SantaNotifyView`;
после `SantaJoinResult`:

```ts
/** Итог «Напомнить»: сколько получат и сколько без канала. */
export type SantaRemindResult = { sent: number; unreachable: number }
```

- [ ] **Step 3: Хелперы**

В `shared/santa.ts` (импорт `SantaNotifyView` из `./types`):

```ts
export const emailSchema = z.object({
  email: z.string().trim().min(1, 'Укажите почту').max(254, 'Слишком длинный адрес').email('Проверьте адрес'),
})
export type EmailValues = z.infer<typeof emailSchema>

export const codeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Код — 6 цифр из письма'),
})
export type CodeValues = z.infer<typeof codeSchema>

/** «Напомнить» — не чаще раза в 12 ч (как на бэке). */
export const REMIND_COOLDOWN_MS = 12 * 60 * 60 * 1000

export function remindAvailableAt(lastRemindedAt: string | null): Date | null {
  if (!lastRemindedAt) return null
  const t = Date.parse(lastRemindedAt)
  return Number.isNaN(t) ? null : new Date(t + REMIND_COOLDOWN_MS)
}

export function canRemind(lastRemindedAt: string | null, now: number = Date.now()): boolean {
  const at = remindAvailableAt(lastRemindedAt)
  return !at || at.getTime() <= now
}

export function readyCount(ps: { ready: boolean }[]): number {
  return ps.filter(p => p.ready).length
}

/** «в Telegram» / «на почту a@b.ru» / '' — для фразы «Результат придёт …». */
export function channelLabel(n: SantaNotifyView): string {
  if (!n.ready) return ''
  return n.channel === 'telegram' ? 'в Telegram' : `на почту ${n.email}`
}

export function formatTime(d: Date): string {
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}
```

- [ ] **Step 4: Хуки**

В `api/santa/index.ts` (тип `SantaRemindResult` — в импорт типов):

```ts
export const useApiSantaRemind = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaRemindResult>, AxiosError>({
    mutationFn: () => api.post(`santa/rooms/${seg(roomId)}/remind`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['santa-room', roomId] }),
  })
}
```

(в блок «Организатор»), и в блок «Участник»:

```ts
export const useApiSantaRequestEmailCode = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError, string>({
    mutationFn: email => api.post(`santa/r/${seg(slug)}/me/email`, { email }, { headers: santaHeaders(slug) }),
    // emailPending и новый адрес — из карточки участника.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-me', slug] }),
  })
}

export const useApiSantaVerifyEmail = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaMe>, AxiosError, string>({
    mutationFn: code => api.post(`santa/r/${seg(slug)}/me/email/verify`, { code }, { headers: santaHeaders(slug) }),
    onSuccess: res => queryClient.setQueryData(['santa-me', slug], res),
  })
}

export const useApiSantaTelegramLink = (slug: string) =>
  useMutation<Data<{ url: string }>, AxiosError>({
    mutationFn: () => api.post(`santa/r/${seg(slug)}/me/telegram`, undefined, { headers: santaHeaders(slug) }),
  })
```

- [ ] **Step 5: Проверки**

Run: `pnpm test` — PASS; `pnpm exec tsc --noEmit` — ошибки только там, где компоненты ещё не знают про новые обязательные поля (если `tsc` ругается на тестовые фикстуры или моки `SantaMe` без `notify` — дописать туда `notify` с пустыми значениями); `pnpm lint` — 0 ошибок.

- [ ] **Step 6: Commit**

```bash
git add shared/types.ts shared/santa.ts tests/santa.test.cjs api/santa/index.ts
git commit -m "feat(front): типы, хелперы и хуки уведомлений Тайного Санты"
```

---

### Task 10: Участник — «Куда прислать результат»

**Files:**
- Create: `FRONT/app/santa/r/[slug]/components/notify-card.tsx`
- Modify: `FRONT/app/santa/r/[slug]/page.tsx`
- Modify: `FRONT/app/santa/r/[slug]/components/envelope.tsx`

**Interfaces:**
- Consumes: Task 9 (хуки, `emailSchema`, `codeSchema`, `channelLabel`, `SantaNotifyView`), `Form*`, `Input`, `Button`, `toast`, `apiErrorMessage`.
- Produces: `NotifyCard({ slug, notify, drawn }: { slug: string; notify: SantaNotifyView; drawn: boolean })`; `Envelope` получает проп `ready: boolean`.

- [ ] **Step 1: Компонент**

`app/santa/r/[slug]/components/notify-card.tsx`:

```tsx
'use client'

import { useApiSantaRequestEmailCode, useApiSantaTelegramLink, useApiSantaVerifyEmail } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { type CodeValues, type EmailValues, apiErrorMessage, channelLabel, codeSchema, emailSchema } from '@/shared/santa'
import type { SantaNotifyView } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { BellRing, Mail, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

const RESEND_SECONDS = 60
const TG_POLL_MS = 4000
const TG_POLL_LIMIT_MS = 3 * 60 * 1000

export function NotifyCard({ slug, notify, drawn }: { slug: string; notify: SantaNotifyView; drawn: boolean }) {
  const [editing, setEditing] = useState(false)
  const showChooser = !notify.ready || editing

  return (
    <section className="space-y-5 rounded-card border border-border bg-card p-6" aria-labelledby="notify-title">
      <div className="flex items-center gap-2.5">
        <BellRing className="size-5 text-tone-gold" aria-hidden />
        <h2 id="notify-title" className="text-title-sm">Куда прислать результат</h2>
      </div>

      {notify.ready && !editing && (
        <div className="space-y-3">
          <p className="text-body">
            {drawn ? 'Новости о подопечном придут ' : 'Имя подопечного придёт '}
            <span className="font-semibold">{channelLabel(notify)}</span>.
          </p>
          <Button variant="ghost" onClick={() => setEditing(true)}>Сменить</Button>
        </div>
      )}

      {showChooser && (
        <>
          {!notify.ready && (
            <p className="text-body-sm text-muted-foreground">
              {drawn
                ? 'Подключите почту или Telegram — пришлём, если подопечный поменяет пожелания.'
                : 'Без подтверждённой почты или Telegram вы не попадёте в жеребьёвку: так мы точно сообщим вам имя подопечного.'}
            </p>
          )}
          <TelegramConnect slug={slug} connected={notify.telegram} />
          <div className="flex items-center gap-3 text-caption text-muted-foreground" aria-hidden>
            <span className="h-px flex-1 bg-border" />или<span className="h-px flex-1 bg-border" />
          </div>
          <EmailConnect slug={slug} notify={notify} onDone={() => setEditing(false)} />
          {editing && <Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button>}
        </>
      )}
    </section>
  )
}

function TelegramConnect({ slug, connected }: { slug: string; connected: boolean }) {
  const queryClient = useQueryClient()
  const link = useApiSantaTelegramLink(slug)
  const url = link.data?.data.url ?? null

  // Пока человек в Telegram жмёт «Старт», переспрашиваем карточку: бот отметит канал.
  useEffect(() => {
    if (!url || connected) return
    const started = Date.now()
    const id = window.setInterval(() => {
      if (Date.now() - started > TG_POLL_LIMIT_MS) {
        window.clearInterval(id)
        return
      }
      void queryClient.invalidateQueries({ queryKey: ['santa-me', slug] })
    }, TG_POLL_MS)
    return () => window.clearInterval(id)
  }, [url, connected, slug, queryClient])

  if (connected) {
    return <p className="text-body-sm">Telegram подключён.</p>
  }
  if (url) {
    return (
      <div className="space-y-2">
        <Button asChild variant="festive" size="lg" className="w-full">
          <a href={url} target="_blank" rel="noopener noreferrer"><Send aria-hidden />Открыть бота в Telegram</a>
        </Button>
        <p className="text-caption text-muted-foreground">
          Нажмите в боте «Старт» — эта страница сама заметит подключение. Ссылка одноразовая и действует сутки.
        </p>
      </div>
    )
  }
  return (
    <Button
      variant="secondary" size="lg" className="w-full" loading={link.isPending}
      onClick={() => link.mutate(undefined, { onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }) })}
    >
      <Send aria-hidden />Подключить Telegram
    </Button>
  )
}

function EmailConnect({ slug, notify, onDone }: { slug: string; notify: SantaNotifyView; onDone: () => void }) {
  const request = useApiSantaRequestEmailCode(slug)
  const verify = useApiSantaVerifyEmail(slug)
  const [sentTo, setSentTo] = useState<string | null>(notify.emailPending ? notify.email : null)
  const [cooldown, setCooldown] = useState(0)

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: notify.email },
  })
  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: { code: '' } })

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown(s => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const onError = (err: unknown) => toast({ variant: 'destructive', title: apiErrorMessage(err) })

  const send = (email: string) =>
    request.mutate(email, {
      onSuccess: () => {
        setSentTo(email)
        setCooldown(RESEND_SECONDS)
        codeForm.reset({ code: '' })
      },
      onError,
    })

  if (sentTo) {
    return (
      <Form {...codeForm}>
        <form
          className="space-y-4"
          onSubmit={codeForm.handleSubmit(v => verify.mutate(v.code, {
            onSuccess: () => {
              toast({ title: 'Почта подтверждена' })
              setSentTo(null)
              onDone()
            },
            onError,
          }))}
        >
          <FormField control={codeForm.control} name="code" render={({ field }) => (
            <FormItem>
              <FormLabel>Код из письма на {sentTo}</FormLabel>
              <FormControl>
                <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="festive" loading={verify.isPending}>Подтвердить</Button>
            <Button type="button" variant="ghost" disabled={cooldown > 0} loading={request.isPending} onClick={() => send(sentTo)}>
              {cooldown > 0 ? `Ещё раз через ${cooldown} с` : 'Прислать код ещё раз'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSentTo(null)}>Другой адрес</Button>
          </div>
          <p className="text-caption text-muted-foreground">Код действует 15 минут. Не пришло — проверьте «Спам».</p>
        </form>
      </Form>
    )
  }

  return (
    <Form {...emailForm}>
      <form className="space-y-4" onSubmit={emailForm.handleSubmit(v => send(v.email.trim().toLowerCase()))}>
        <FormField control={emailForm.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Почта</FormLabel>
            <FormControl><Input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" variant="secondary" size="lg" className="w-full" loading={request.isPending}>
          <Mail aria-hidden />Прислать код
        </Button>
      </form>
    </Form>
  )
}
```

Если `Button` не принимает `size="lg"` вместе с `asChild` или лишних пропсов — свериться с `components/ui/button.tsx` (варианты `festive`, `secondary`, `ghost`; размеры `lg`, `default`) и не вводить новых. Иконки `BellRing`, `Mail`, `Send` есть в `lucide-react`.

- [ ] **Step 2: Страница приглашения**

В `app/santa/r/[slug]/page.tsx` импортировать `NotifyCard` и вставить его:

в ветке «конверт» (`mine && mine.room.status === 'drawn'`):

```tsx
      <div className="mx-auto max-w-xl space-y-8">
        <Envelope slug={slug} room={mine.room} receiver={mine.receiver} ready={mine.notify.ready} />
        <NotifyCard slug={slug} notify={mine.notify} drawn />
        <MyCard slug={slug} me={mine} />
      </div>
```

в основной ветке после `<InviteHeader … />`:

```tsx
      {mine && <NotifyCard slug={slug} notify={mine.notify} drawn={false} />}
      {mine && <MyCard slug={slug} me={mine} />}
```

(заменив прежнюю строку `{mine && <MyCard … />}`).

- [ ] **Step 3: Конверт для не попавших в жеребьёвку**

В `components/envelope.tsx` расширить пропсы `ready: boolean` и заменить ветку `if (!receiver)`:

```tsx
  if (!receiver) {
    return (
      <p className="text-body text-muted-foreground">
        {ready
          ? 'Пары обновляются — загляните чуть позже.'
          : 'Вы не попали в жеребьёвку: к её началу не была подтверждена почта или Telegram. Напишите организатору — он может перезапустить жеребьёвку, когда вы подключите канал ниже.'}
      </p>
    )
  }
```

Хуки в `Envelope` объявлены до этой ветки — порядок хуков не меняется.

- [ ] **Step 4: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `node tests/token-audit.cjs app/santa components shared`
Expected: чисто, аудит `всего 0`.

- [ ] **Step 5: Commit**

```bash
git add "app/santa/r/"
git commit -m "feat(front): участник Санты подключает почту или Telegram для результата"
```

---

### Task 11: Организатор — готовность и «Напомнить»

**Files:**
- Modify: `FRONT/app/santa/rooms/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 9 (`useApiSantaRemind`, `readyCount`, `canRemind`, `remindAvailableAt`, `formatTime`, `participantsLabel`, `MIN_PARTICIPANTS`).
- Produces: на странице комнаты — отметка готовности у каждого участника, счётчик готовых в блоке жеребьёвки, кнопка «Напомнить».

- [ ] **Step 1: Готовность в списке**

В `app/santa/rooms/[id]/page.tsx`:

импорты — добавить `useApiSantaRemind` из `@/api/santa`; `canRemind, formatTime, readyCount, remindAvailableAt` из `@/shared/santa`; иконки `BellRing, CircleCheck, CircleDashed` из `lucide-react`.

в теле компонента рядом с другими мутациями: `const remind = useApiSantaRemind(id)`.

после `const { room, participants } = details`:

```tsx
  const ready = readyCount(participants)
  const enough = ready >= MIN_PARTICIPANTS
  const remindAt = remindAvailableAt(room.lastRemindedAt)
  const remindOpen = canRemind(room.lastRemindedAt)
```

(прежнюю строку `const enough = participants.length >= MIN_PARTICIPANTS` удалить.)

в строке участника заменить подпись под именем:

```tsx
                  <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    {p.ready
                      ? <CircleCheck className="size-3.5 text-success" aria-hidden />
                      : <CircleDashed className="size-3.5" aria-hidden />}
                    {p.ready ? 'канал подтверждён' : 'нет почты или Telegram'}
                    {' · '}
                    {[p.hasWishes && 'пожелания', p.hasWishlist && 'вишлист'].filter(Boolean).join(' + ') || 'пожеланий нет'}
                  </span>
```

Цвет `text-success` — проверить, что токен `success` есть в дизайн-системе (на этапе 1 `--success` упоминался для схемы `.santa`); если нет — использовать `text-tone-gold`. Размер `size-3.5` — проверить аудитом; если не пропускает — `size-4`.

- [ ] **Step 2: Жеребьёвка по готовым**

В блоке «Жеребьёвка», ветка `open`, текст заменить:

```tsx
                <p className="text-body-sm text-muted-foreground">
                  {enough
                    ? `Готовы ${ready} из ${participants.length}. Каждый готовый получит подопечного; кто не подтвердил почту или Telegram — в жеребьёвку не попадёт.`
                    : `Нужно минимум ${participantsLabel(MIN_PARTICIPANTS)} с подтверждённой почтой или Telegram, сейчас готовы ${ready} из ${participants.length}.`}
                </p>
```

`disabled={!enough}` у кнопки жеребьёвки остаётся — теперь по готовым.

- [ ] **Step 3: «Напомнить»**

В `<aside>` после секции «Жеребьёвка» добавить:

```tsx
          <section className="space-y-4 rounded-card border border-border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <BellRing className="size-5 text-tone-gold" aria-hidden />
              <h2 className="text-title-xs">Напомнить</h2>
            </div>
            <p className="text-body-sm text-muted-foreground">
              Пришлём просьбу написать пожелания тем, у кого их нет. Участникам без почты и Telegram
              напоминание не дойдёт — позовите их сами.
            </p>
            <Button
              variant="secondary" className="w-full" disabled={!remindOpen} loading={remind.isPending}
              onClick={() => remind.mutate(undefined, {
                onSuccess: res => {
                  const { sent, unreachable } = res.data
                  toast({
                    title: sent > 0 ? `Напомнили: ${participantsLabel(sent)}` : 'Всем уже есть что подарить',
                    description: unreachable > 0 ? `Ещё ${participantsLabel(unreachable)} без почты и Telegram.` : undefined,
                  })
                },
                onError,
              })}
            >
              Напомнить
            </Button>
            {!remindOpen && remindAt && (
              <p className="text-caption text-muted-foreground">Следующее напоминание — {formatTime(remindAt)}.</p>
            )}
          </section>
```

Проверить, что `toast` принимает `description` (`hooks/use-toast`); если нет — склеить в `title`.

- [ ] **Step 4: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `node tests/token-audit.cjs app/santa components shared`
Expected: чисто, аудит `всего 0`.

- [ ] **Step 5: Commit**

```bash
git add "app/santa/rooms/[id]/page.tsx"
git commit -m "feat(front): организатор Санты видит готовность участников и напоминает о пожеланиях"
```

---

### Task 12: Выкладка (делает пользователь)

**Files:** — (настройки Yandex Cloud, DNS, Telegram, Dokploy)

- [ ] **Step 1: Почта.** В Yandex Cloud Postbox подтвердить домен отправителя `prosto-namekni.ru` (или поддомен для почты): добавить в DNS записи SPF, DKIM (из консоли Postbox) и DMARC (`v=DMARC1; p=none; rua=mailto:…` для начала). Создать SMTP-пароль сервисного аккаунта.
- [ ] **Step 2: Бот.** Решить: тот же бот, что вход через Telegram, или отдельный «@…santa_bot» через BotFather. Для отдельного — задать `SANTA_BOT_TOKEN`; в обоих случаях — `BOT_USERNAME` (без `@`).
- [ ] **Step 3: Env бэка в Dokploy:** `SMTP_HOST=postbox.cloud.yandex.net`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM=Тайный Санта <santa@prosto-namekni.ru>`, `BOT_USERNAME`, при необходимости `SANTA_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (случайная строка, `openssl rand -hex 32`), `SANTA_PUBLIC_URL=https://santa.prosto-namekni.ru`. Перезапустить — `AutoMigrate` создаст три таблицы и колонки.
- [ ] **Step 4: Вебхук:** `SANTA_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… API_PUBLIC_URL=https://api.prosto-namekni.ru make tg-webhook` (или тот же `curl` вручную) → ответ `{"ok":true,…}`. Проверка: `https://api.telegram.org/bot<токен>/getWebhookInfo`.
- [ ] **Step 5: Дымовая проверка на тестовом стеке:** три участника; один подтверждает почту (письмо с кодом, затем приветствие), один — Telegram (приветствие в боте), третий без канала → жеребьёвка недоступна, у организатора «готовы 2 из 3»; третий подключает канал → жеребьёвка → двоим/троим приходит «кому дарить»; подопечный меняет пожелания → его Санте приходит обновление; «Напомнить» → второй раз в течение 12 ч недоступно.
- [ ] **Step 6: Финиш ветки** — `superpowers:finishing-a-development-branch` в обоих репозиториях; слияние `feature/santa-stage2` → `feature/santa`.
