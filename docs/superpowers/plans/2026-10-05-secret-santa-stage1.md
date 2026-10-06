# Тайный Санта, этап 1: ядро комнат и поддомен — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** организатор создаёт комнату, участники вступают по ссылке без
регистрации, организатор проводит жеребьёвку, каждый открывает «конверт» с
подопечным на поддомене `santa.prosto-namekni.ru`.

**Architecture:** бэк — новый пакет `usecase/santa` по образцу существующих
(entity → repo-интерфейс → gorm-репозиторий → использование → fiber-обработчик),
маршруты `/api/v1/santa/*` регистрируются отдельной функцией до основного
роутера. Фронт — `app/santa/*` того же Next.js; `middleware.ts` переписывает
хост `santa.*` на `/santa/*`; цветовая схема `.santa` на токенах дизайн-системы.
Участник без аккаунта авторизуется секретным токеном в `localStorage` и
заголовке `X-Santa-Token`.

**Tech Stack:** Go 1.25, fiber v2, gorm + Postgres 17, testify; Next.js 16
App Router, TanStack Query 5, react-hook-form + zod, Tailwind (токены
дизайн-системы), `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-05-secret-santa-design.md` (этап 1).
Макет — канвас «Тайный Санта — дизайн».

**Репозитории:** фронт — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-front`
(далее FRONT), бэк — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back`
(далее BACK; модуль Go называется `main`). Перед началом — ветка
`feature/santa-stage1` в обоих. Коммиты — от имени пользователя, **без
трейлера `Co-Authored-By`** (правило CLAUDE.md).

## Global Constraints

- Пакетный менеджер фронта — `pnpm`, не npm/yarn.
- Дизайн-система: только токены по роли (`text-body`, `rounded-control`,
  `h-control`, `shadow-float`, `duration-base`); никаких стоковых размеров и
  `[…]`. Цвета в TSX — только классами ролей. Проверка:
  `node tests/token-audit.cjs app/santa components shared` → `всего 0` для новых файлов.
- Схема БД — gorm `AutoMigrate`, без SQL-миграций.
- Ограничения полей (спека): название 1–80, сообщение ≤ 500, бюджет
  0–1 000 000 ₽ или без лимита, имя 1–40, пожелания ≤ 1000, ссылка на
  вишлист — пусто или `http(s)://…` ≤ 500.
- Жеребьёвка — один круг, минимум 3 участника; после неё нельзя вступить,
  выйти, удалить участника, править комнату и менять имя; пожелания и
  вишлист менять можно.
- Пары не видит никто, включая организатора: ни один ответ API организатору
  не содержит пар и текста пожеланий.
- Ошибки API: 404 — нет комнаты, чужая комната или неверный токен (одинаково);
  409 — действие невозможно в текущем статусе; 422 — валидация и «меньше 3».
- Тексты интерфейса — по-русски, на «вы».

## Review Focus

1. **Чужой или устаревший токен** в `localStorage` (комнату удалили, участника
   убрали) — страница приглашения показывает форму вступления, а не ошибку.
   Тест: `TestGetMe_WrongTokenIsNotFound` (задача 5) + обработка 404 в
   `useApiSantaMe` (задача 11).
2. **Организатор открывает чужую комнату по id** — 404, а не 403, и без
   обращения к участникам. Тест: `TestGetRoom_StrangerGetsNotFound` (задача 4).
3. **Двойное нажатие «Провести жеребьёвку»** — вторая жеребьёвка не
   перезаписывает пары, а отвечает 409. Тест:
   `TestSantaRepo_DrawWritesCycleAndLocksStatus` (задача 1) +
   `TestDraw_SecondCallIsConflict` (задача 6).
4. **Публичные маршруты Санты не требуют входа**, хотя основной роутер
   навешивает JWT на весь `/api/v1`. Тест:
   `TestSantaRoutes_PublicBeforeProtectedGroup` (задача 7).
5. **Открытый редирект после входа** (`?next=//evil.com`,
   `?next=https://evil.com`) — игнорируется. Тест: `safeNext` в
   `tests/santa-route.test.cjs` (задача 8).

---

## Карта файлов

**BACK**
- Create `internal/entity/santa.go` — сущности комнаты, участника, пары.
- Modify `internal/repo/contracts.go` — `ErrNotFound`, `ErrStatusMismatch`, `SantaRepo`.
- Create `internal/repo/persistent/santa_models.go` — gorm-модели и конвертеры.
- Create `internal/repo/persistent/santa_postgres.go` — репозиторий.
- Create `internal/repo/persistent/santa_integration_test.go` — тесты на Postgres.
- Modify `internal/usecase/contracts.go` — ошибки, типы, `SantaUseCase`.
- Create `internal/usecase/santa/cycle.go`, `secret.go`, `validate.go`,
  `santa.go`, `participant.go`, `draw.go` + тесты `cycle_test.go`,
  `secret_test.go`, `santa_test.go`, `participant_test.go`, `draw_test.go`.
- Create `mock/repo/mock_santa_repo.go`.
- Create `internal/controller/restapi/v1/santa.go`, `santa_test.go`.
- Modify `internal/controller/restapi/router.go`, `internal/app/app.go`, `.env.example`.

**FRONT**
- Create `shared/santa-route.ts`, `shared/auth-next.ts`, `shared/santa.ts`,
  `shared/santa-token.ts`; tests `tests/santa-route.test.cjs`, `tests/santa.test.cjs`.
- Modify `middleware.ts`, `components/auth-form.tsx`, `app/oauth/page.tsx`,
  `app/login/page.tsx`; create `components/Auth/remember-next.tsx`.
- Modify `app/globals.css`, `tailwind.config.ts`, `components/ui/button.tsx`,
  `docs/design-system.md`, `shared/types.ts`, `next-sitemap.config.js`, `.env`.
- Create `api/santa/index.ts`.
- Create `app/santa/layout.tsx`, `app/santa/page.tsx`,
  `app/santa/components/{santa-header,room-chips,copy-field,confirm-action,room-form}.tsx`,
  `app/santa/rooms/page.tsx`, `app/santa/rooms/new/page.tsx`,
  `app/santa/rooms/[id]/page.tsx`, `app/santa/rooms/[id]/edit/page.tsx`,
  `app/santa/r/[slug]/page.tsx`,
  `app/santa/r/[slug]/components/{invite-header,profile-form,join-form,my-card,envelope}.tsx`.

---

## Бэкенд

### Task 1: Сущности и репозиторий комнат

**Files:**
- Create: `BACK/internal/entity/santa.go`
- Modify: `BACK/internal/repo/contracts.go`
- Create: `BACK/internal/repo/persistent/santa_models.go`
- Create: `BACK/internal/repo/persistent/santa_postgres.go`
- Test: `BACK/internal/repo/persistent/santa_integration_test.go`

**Interfaces:**
- Produces: `entity.SantaRoom`, `entity.SantaParticipant`, `entity.SantaAssignment`,
  `entity.SantaRoomStatus` (`SantaRoomOpen`, `SantaRoomDrawn`);
  `repo.ErrNotFound`, `repo.ErrStatusMismatch`, `repo.SantaRepo`;
  `persistent.NewSantaRepo(db) *santaRepo`; модели `persistent.SantaRoomModel`,
  `SantaParticipantModel`, `SantaAssignmentModel`.

- [ ] **Step 1: Сущности**

`BACK/internal/entity/santa.go`:

```go
package entity

import (
	"time"

	"github.com/google/uuid"
)

// SantaRoomStatus — этап жизни комнаты Тайного Санты.
type SantaRoomStatus string

const (
	// SantaRoomOpen — идёт сбор участников.
	SantaRoomOpen SantaRoomStatus = "open"
	// SantaRoomDrawn — пары вытянуты, состав заморожен.
	SantaRoomDrawn SantaRoomStatus = "drawn"
)

type SantaRoom struct {
	ID      uuid.UUID `json:"id"`
	OwnerID uuid.UUID `json:"ownerId"`
	// Slug — короткий адрес комнаты в ссылке-приглашении.
	Slug  string `json:"slug"`
	Title string `json:"title"`
	// Budget в рублях; nil — без лимита.
	Budget       *int            `json:"budget"`
	ExchangeDate *time.Time      `json:"exchangeDate"`
	// DrawAt хранится с этапа 1, срабатывает с этапа 3.
	DrawAt    *time.Time      `json:"drawAt"`
	Message   string          `json:"message"`
	Status    SantaRoomStatus `json:"status"`
	DrawnAt   *time.Time      `json:"drawnAt"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

type SantaParticipant struct {
	ID     uuid.UUID
	RoomID uuid.UUID
	// UserID — у вошедших пользователей; у гостей nil.
	UserID      *uuid.UUID
	Name        string
	Wishes      string
	WishlistURL string
	// TokenHash — sha256 секрета из личной ссылки. Сам секрет не хранится.
	TokenHash string
	GiftReady bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

// SantaAssignment — «GiverID дарит ReceiverID».
type SantaAssignment struct {
	RoomID     uuid.UUID
	GiverID    uuid.UUID
	ReceiverID uuid.UUID
}
```

- [ ] **Step 2: Контракт репозитория**

В `BACK/internal/repo/contracts.go` добавить `"errors"` в импорты и в конец файла:

```go
// ErrNotFound — записи нет. Использование отличает по нему 404 от сбоя базы,
// не зная про gorm. Пока его возвращает только SantaRepo.
var ErrNotFound = errors.New("not found")

// ErrStatusMismatch — комната не в том статусе, которого ждал вызов.
var ErrStatusMismatch = errors.New("status mismatch")

type SantaRepo interface {
	CreateRoom(ctx context.Context, room entity.SantaRoom) error
	GetRoomByID(ctx context.Context, id uuid.UUID) (entity.SantaRoom, error)
	GetRoomBySlug(ctx context.Context, slug string) (entity.SantaRoom, error)
	// ListRoomsByUser — комнаты, где пользователь владелец или участник, новые сверху.
	ListRoomsByUser(ctx context.Context, userID uuid.UUID) ([]entity.SantaRoom, error)
	UpdateRoom(ctx context.Context, room entity.SantaRoom) error
	// DeleteRoom удаляет комнату вместе с участниками и парами.
	DeleteRoom(ctx context.Context, id uuid.UUID) error

	CreateParticipant(ctx context.Context, p entity.SantaParticipant) error
	GetParticipant(ctx context.Context, id uuid.UUID) (entity.SantaParticipant, error)
	// GetParticipantByToken ищет только внутри комнаты: токен из другой
	// комнаты здесь «не найден».
	GetParticipantByToken(ctx context.Context, roomID uuid.UUID, tokenHash string) (entity.SantaParticipant, error)
	GetParticipantByUser(ctx context.Context, roomID, userID uuid.UUID) (entity.SantaParticipant, error)
	// ListParticipants — в порядке вступления.
	ListParticipants(ctx context.Context, roomID uuid.UUID) ([]entity.SantaParticipant, error)
	CountParticipants(ctx context.Context, roomIDs []uuid.UUID) (map[uuid.UUID]int, error)
	UpdateParticipant(ctx context.Context, p entity.SantaParticipant) error
	DeleteParticipant(ctx context.Context, id uuid.UUID) error

	GetAssignment(ctx context.Context, roomID, giverID uuid.UUID) (entity.SantaAssignment, error)
	// Draw в одной транзакции: блокирует комнату, проверяет статус expected
	// (иначе ErrStatusMismatch), стирает старые пары, отдаёт build id
	// участников в порядке вступления, пишет пары и ставит status=drawn.
	// Ошибка build откатывает всё и возвращается как есть.
	Draw(ctx context.Context, roomID uuid.UUID, expected entity.SantaRoomStatus, build func(ids []uuid.UUID) ([]entity.SantaAssignment, error)) error
}
```

- [ ] **Step 3: Модели и конвертеры**

`BACK/internal/repo/persistent/santa_models.go`:

```go
package persistent

import (
	"time"

	"github.com/google/uuid"

	"main/internal/entity"
)

type SantaRoomModel struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey"`
	OwnerID      uuid.UUID  `gorm:"type:uuid;not null;index"`
	Slug         string     `gorm:"not null;uniqueIndex"`
	Title        string     `gorm:"not null"`
	Budget       *int
	ExchangeDate *time.Time `gorm:"type:date"`
	DrawAt       *time.Time
	Message      string     `gorm:"not null;default:''"`
	Status       string     `gorm:"not null;default:open"`
	DrawnAt      *time.Time
	CreatedAt    time.Time  `gorm:"autoCreateTime"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime"`
}

func (SantaRoomModel) TableName() string { return "santa_rooms" }

type SantaParticipantModel struct {
	ID     uuid.UUID `gorm:"type:uuid;primaryKey"`
	RoomID uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_santa_participant_user"`
	// NULL у гостей: уникальность (room_id, user_id) их не задевает.
	UserID      *uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_santa_participant_user"`
	Name        string     `gorm:"not null"`
	Wishes      string     `gorm:"not null;default:''"`
	WishlistURL string     `gorm:"column:wishlist_url;not null;default:''"`
	TokenHash   string     `gorm:"not null;uniqueIndex"`
	GiftReady   bool       `gorm:"not null;default:false"`
	CreatedAt   time.Time  `gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime"`
}

func (SantaParticipantModel) TableName() string { return "santa_participants" }

type SantaAssignmentModel struct {
	RoomID     uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_santa_receiver"`
	GiverID    uuid.UUID `gorm:"type:uuid;primaryKey"`
	ReceiverID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_santa_receiver"`
}

func (SantaAssignmentModel) TableName() string { return "santa_assignments" }

func toSantaRoomModel(r entity.SantaRoom) SantaRoomModel {
	return SantaRoomModel{
		ID: r.ID, OwnerID: r.OwnerID, Slug: r.Slug, Title: r.Title, Budget: r.Budget,
		ExchangeDate: r.ExchangeDate, DrawAt: r.DrawAt, Message: r.Message,
		Status: string(r.Status), DrawnAt: r.DrawnAt, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
	}
}

func toSantaRoomEntity(m SantaRoomModel) entity.SantaRoom {
	return entity.SantaRoom{
		ID: m.ID, OwnerID: m.OwnerID, Slug: m.Slug, Title: m.Title, Budget: m.Budget,
		ExchangeDate: m.ExchangeDate, DrawAt: m.DrawAt, Message: m.Message,
		Status: entity.SantaRoomStatus(m.Status), DrawnAt: m.DrawnAt, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}

func toSantaParticipantModel(p entity.SantaParticipant) SantaParticipantModel {
	return SantaParticipantModel{
		ID: p.ID, RoomID: p.RoomID, UserID: p.UserID, Name: p.Name, Wishes: p.Wishes,
		WishlistURL: p.WishlistURL, TokenHash: p.TokenHash, GiftReady: p.GiftReady,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt,
	}
}

func toSantaParticipantEntity(m SantaParticipantModel) entity.SantaParticipant {
	return entity.SantaParticipant{
		ID: m.ID, RoomID: m.RoomID, UserID: m.UserID, Name: m.Name, Wishes: m.Wishes,
		WishlistURL: m.WishlistURL, TokenHash: m.TokenHash, GiftReady: m.GiftReady,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}
```

- [ ] **Step 4: Написать падающий интеграционный тест**

`BACK/internal/repo/persistent/santa_integration_test.go`:

```go
//go:build integration

package persistent_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/repo/persistent"
)

func setupSantaDB(t *testing.T) *gorm.DB {
	t.Helper()
	db := setupDB(t)
	require.NoError(t, db.AutoMigrate(
		&persistent.SantaRoomModel{},
		&persistent.SantaParticipantModel{},
		&persistent.SantaAssignmentModel{},
	))
	return db
}

func seedRoom(t *testing.T, r repo.SantaRepo, owner uuid.UUID) entity.SantaRoom {
	t.Helper()
	room := entity.SantaRoom{
		ID: uuid.New(), OwnerID: owner, Slug: uuid.NewString()[:8],
		Title: "Офис", Status: entity.SantaRoomOpen,
	}
	require.NoError(t, r.CreateRoom(context.Background(), room))
	return room
}

func seedParticipants(t *testing.T, r repo.SantaRepo, roomID uuid.UUID, n int) []uuid.UUID {
	t.Helper()
	ids := make([]uuid.UUID, n)
	for i := range ids {
		p := entity.SantaParticipant{ID: uuid.New(), RoomID: roomID, Name: "Участник", TokenHash: uuid.NewString()}
		require.NoError(t, r.CreateParticipant(context.Background(), p))
		ids[i] = p.ID
	}
	return ids
}

func circle(roomID uuid.UUID) func([]uuid.UUID) ([]entity.SantaAssignment, error) {
	return func(ids []uuid.UUID) ([]entity.SantaAssignment, error) {
		out := make([]entity.SantaAssignment, len(ids))
		for i, id := range ids {
			out[i] = entity.SantaAssignment{RoomID: roomID, GiverID: id, ReceiverID: ids[(i+1)%len(ids)]}
		}
		return out, nil
	}
}

func TestSantaRepo_DrawWritesCycleAndLocksStatus(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)

	var got []uuid.UUID
	err := r.Draw(ctx, room.ID, entity.SantaRoomOpen, func(in []uuid.UUID) ([]entity.SantaAssignment, error) {
		got = in
		return circle(room.ID)(in)
	})
	require.NoError(t, err)
	assert.Equal(t, ids, got, "участники приходят в порядке вступления")

	saved, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Equal(t, entity.SantaRoomDrawn, saved.Status)
	assert.NotNil(t, saved.DrawnAt)

	a, err := r.GetAssignment(ctx, room.ID, ids[0])
	require.NoError(t, err)
	assert.Equal(t, ids[1], a.ReceiverID)

	// Вторая жеребьёвка с ожиданием open — отказ, пары прежние.
	err = r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID))
	assert.ErrorIs(t, err, repo.ErrStatusMismatch)
}

func TestSantaRepo_RedrawReplacesPairs(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID)))

	reversed := func(in []uuid.UUID) ([]entity.SantaAssignment, error) {
		out := make([]entity.SantaAssignment, len(in))
		for i, id := range in {
			out[i] = entity.SantaAssignment{RoomID: room.ID, GiverID: id, ReceiverID: in[(i+len(in)-1)%len(in)]}
		}
		return out, nil
	}
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomDrawn, reversed))

	a, err := r.GetAssignment(ctx, room.ID, ids[0])
	require.NoError(t, err)
	assert.Equal(t, ids[2], a.ReceiverID)
}

func TestSantaRepo_DrawRollsBackOnBuildError(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 2)

	boom := errors.New("boom")
	err := r.Draw(ctx, room.ID, entity.SantaRoomOpen, func([]uuid.UUID) ([]entity.SantaAssignment, error) {
		return nil, boom
	})
	assert.ErrorIs(t, err, boom)

	saved, err := r.GetRoomByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Equal(t, entity.SantaRoomOpen, saved.Status)
	_, err = r.GetAssignment(ctx, room.ID, ids[0])
	assert.ErrorIs(t, err, repo.ErrNotFound)
}

func TestSantaRepo_ListRoomsByUser(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	me := uuid.New()
	mine := seedRoom(t, r, me)
	joined := seedRoom(t, r, uuid.New())
	seedRoom(t, r, uuid.New()) // чужая, без меня

	require.NoError(t, r.CreateParticipant(ctx, entity.SantaParticipant{
		ID: uuid.New(), RoomID: joined.ID, UserID: &me, Name: "Я", TokenHash: uuid.NewString(),
	}))

	rooms, err := r.ListRoomsByUser(ctx, me)
	require.NoError(t, err)
	got := []uuid.UUID{}
	for _, room := range rooms {
		got = append(got, room.ID)
	}
	assert.ElementsMatch(t, []uuid.UUID{mine.ID, joined.ID}, got)
}

func TestSantaRepo_ParticipantLookups(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	other := seedRoom(t, r, uuid.New())
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Маша", TokenHash: "hash-1"}
	require.NoError(t, r.CreateParticipant(ctx, p))
	seedParticipants(t, r, room.ID, 2)

	found, err := r.GetParticipantByToken(ctx, room.ID, "hash-1")
	require.NoError(t, err)
	assert.Equal(t, p.ID, found.ID)

	_, err = r.GetParticipantByToken(ctx, other.ID, "hash-1")
	assert.ErrorIs(t, err, repo.ErrNotFound, "токен чужой комнаты не подходит")

	_, err = r.GetParticipantByToken(ctx, room.ID, "nope")
	assert.ErrorIs(t, err, repo.ErrNotFound)

	counts, err := r.CountParticipants(ctx, []uuid.UUID{room.ID, other.ID})
	require.NoError(t, err)
	assert.Equal(t, 3, counts[room.ID])
	assert.Equal(t, 0, counts[other.ID])
}

func TestSantaRepo_UserJoinsRoomOnce(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	user := uuid.New()
	first := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, UserID: &user, Name: "А", TokenHash: uuid.NewString()}
	second := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, UserID: &user, Name: "Б", TokenHash: uuid.NewString()}
	require.NoError(t, r.CreateParticipant(ctx, first))
	assert.Error(t, r.CreateParticipant(ctx, second))
}

func TestSantaRepo_DeleteRoomRemovesEverything(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room := seedRoom(t, r, uuid.New())
	ids := seedParticipants(t, r, room.ID, 3)
	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomOpen, circle(room.ID)))

	require.NoError(t, r.DeleteRoom(ctx, room.ID))

	_, err := r.GetRoomByID(ctx, room.ID)
	assert.ErrorIs(t, err, repo.ErrNotFound)
	_, err = r.GetParticipant(ctx, ids[0])
	assert.ErrorIs(t, err, repo.ErrNotFound)
}
```

- [ ] **Step 5: Запустить — должен не собраться**

Run (из BACK, нужен Docker): `go test -tags integration ./internal/repo/persistent/ -run SantaRepo -v`
Expected: FAIL — `undefined: persistent.NewSantaRepo`.

- [ ] **Step 6: Реализация репозитория**

`BACK/internal/repo/persistent/santa_postgres.go`:

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

type santaRepo struct {
	db *gorm.DB
}

func NewSantaRepo(db *gorm.DB) *santaRepo {
	return &santaRepo{db: db}
}

// santaErr подменяет «записи нет» gorm на repo.ErrNotFound.
func santaErr(op string, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("%s: %w", op, repo.ErrNotFound)
	}
	return fmt.Errorf("%s: %w", op, err)
}

func (r *santaRepo) CreateRoom(ctx context.Context, room entity.SantaRoom) error {
	m := toSantaRoomModel(room)
	if err := r.db.WithContext(ctx).Create(&m).Error; err != nil {
		return santaErr("santaRepo.CreateRoom", err)
	}
	return nil
}

func (r *santaRepo) GetRoomByID(ctx context.Context, id uuid.UUID) (entity.SantaRoom, error) {
	var m SantaRoomModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return entity.SantaRoom{}, santaErr("santaRepo.GetRoomByID", err)
	}
	return toSantaRoomEntity(m), nil
}

func (r *santaRepo) GetRoomBySlug(ctx context.Context, slug string) (entity.SantaRoom, error) {
	var m SantaRoomModel
	if err := r.db.WithContext(ctx).First(&m, "slug = ?", slug).Error; err != nil {
		return entity.SantaRoom{}, santaErr("santaRepo.GetRoomBySlug", err)
	}
	return toSantaRoomEntity(m), nil
}

func (r *santaRepo) ListRoomsByUser(ctx context.Context, userID uuid.UUID) ([]entity.SantaRoom, error) {
	joined := r.db.Model(&SantaParticipantModel{}).Select("room_id").Where("user_id = ?", userID)
	var models []SantaRoomModel
	if err := r.db.WithContext(ctx).
		Where("owner_id = ? OR id IN (?)", userID, joined).
		Order("created_at DESC").
		Find(&models).Error; err != nil {
		return nil, santaErr("santaRepo.ListRoomsByUser", err)
	}
	rooms := make([]entity.SantaRoom, len(models))
	for i, m := range models {
		rooms[i] = toSantaRoomEntity(m)
	}
	return rooms, nil
}

func (r *santaRepo) UpdateRoom(ctx context.Context, room entity.SantaRoom) error {
	m := toSantaRoomModel(room)
	if err := r.db.WithContext(ctx).Save(&m).Error; err != nil {
		return santaErr("santaRepo.UpdateRoom", err)
	}
	return nil
}

func (r *santaRepo) DeleteRoom(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("room_id = ?", id).Delete(&SantaAssignmentModel{}).Error; err != nil {
			return santaErr("santaRepo.DeleteRoom assignments", err)
		}
		if err := tx.Where("room_id = ?", id).Delete(&SantaParticipantModel{}).Error; err != nil {
			return santaErr("santaRepo.DeleteRoom participants", err)
		}
		if err := tx.Delete(&SantaRoomModel{}, "id = ?", id).Error; err != nil {
			return santaErr("santaRepo.DeleteRoom", err)
		}
		return nil
	})
}

func (r *santaRepo) CreateParticipant(ctx context.Context, p entity.SantaParticipant) error {
	m := toSantaParticipantModel(p)
	if err := r.db.WithContext(ctx).Create(&m).Error; err != nil {
		return santaErr("santaRepo.CreateParticipant", err)
	}
	return nil
}

func (r *santaRepo) getParticipant(ctx context.Context, op string, query string, args ...any) (entity.SantaParticipant, error) {
	var m SantaParticipantModel
	if err := r.db.WithContext(ctx).Where(query, args...).First(&m).Error; err != nil {
		return entity.SantaParticipant{}, santaErr(op, err)
	}
	return toSantaParticipantEntity(m), nil
}

func (r *santaRepo) GetParticipant(ctx context.Context, id uuid.UUID) (entity.SantaParticipant, error) {
	return r.getParticipant(ctx, "santaRepo.GetParticipant", "id = ?", id)
}

func (r *santaRepo) GetParticipantByToken(ctx context.Context, roomID uuid.UUID, tokenHash string) (entity.SantaParticipant, error) {
	return r.getParticipant(ctx, "santaRepo.GetParticipantByToken", "room_id = ? AND token_hash = ?", roomID, tokenHash)
}

func (r *santaRepo) GetParticipantByUser(ctx context.Context, roomID, userID uuid.UUID) (entity.SantaParticipant, error) {
	return r.getParticipant(ctx, "santaRepo.GetParticipantByUser", "room_id = ? AND user_id = ?", roomID, userID)
}

func (r *santaRepo) ListParticipants(ctx context.Context, roomID uuid.UUID) ([]entity.SantaParticipant, error) {
	var models []SantaParticipantModel
	if err := r.db.WithContext(ctx).
		Where("room_id = ?", roomID).
		Order("created_at, id").
		Find(&models).Error; err != nil {
		return nil, santaErr("santaRepo.ListParticipants", err)
	}
	out := make([]entity.SantaParticipant, len(models))
	for i, m := range models {
		out[i] = toSantaParticipantEntity(m)
	}
	return out, nil
}

func (r *santaRepo) CountParticipants(ctx context.Context, roomIDs []uuid.UUID) (map[uuid.UUID]int, error) {
	counts := make(map[uuid.UUID]int, len(roomIDs))
	if len(roomIDs) == 0 {
		return counts, nil
	}
	var rows []struct {
		RoomID uuid.UUID
		N      int
	}
	if err := r.db.WithContext(ctx).
		Model(&SantaParticipantModel{}).
		Select("room_id, count(*) AS n").
		Where("room_id IN ?", roomIDs).
		Group("room_id").
		Scan(&rows).Error; err != nil {
		return nil, santaErr("santaRepo.CountParticipants", err)
	}
	for _, row := range rows {
		counts[row.RoomID] = row.N
	}
	return counts, nil
}

func (r *santaRepo) UpdateParticipant(ctx context.Context, p entity.SantaParticipant) error {
	m := toSantaParticipantModel(p)
	if err := r.db.WithContext(ctx).Save(&m).Error; err != nil {
		return santaErr("santaRepo.UpdateParticipant", err)
	}
	return nil
}

func (r *santaRepo) DeleteParticipant(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&SantaParticipantModel{}, "id = ?", id).Error; err != nil {
		return santaErr("santaRepo.DeleteParticipant", err)
	}
	return nil
}

func (r *santaRepo) GetAssignment(ctx context.Context, roomID, giverID uuid.UUID) (entity.SantaAssignment, error) {
	var m SantaAssignmentModel
	if err := r.db.WithContext(ctx).First(&m, "room_id = ? AND giver_id = ?", roomID, giverID).Error; err != nil {
		return entity.SantaAssignment{}, santaErr("santaRepo.GetAssignment", err)
	}
	return entity.SantaAssignment{RoomID: m.RoomID, GiverID: m.GiverID, ReceiverID: m.ReceiverID}, nil
}

func (r *santaRepo) Draw(ctx context.Context, roomID uuid.UUID, expected entity.SantaRoomStatus, build func([]uuid.UUID) ([]entity.SantaAssignment, error)) error {
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
		var ids []uuid.UUID
		if err := tx.Model(&SantaParticipantModel{}).
			Where("room_id = ?", roomID).
			Order("created_at, id").
			Pluck("id", &ids).Error; err != nil {
			return santaErr("santaRepo.Draw participants", err)
		}
		pairs, err := build(ids)
		if err != nil {
			return err
		}
		models := make([]SantaAssignmentModel, len(pairs))
		for i, p := range pairs {
			models[i] = SantaAssignmentModel{RoomID: p.RoomID, GiverID: p.GiverID, ReceiverID: p.ReceiverID}
		}
		if len(models) > 0 {
			if err := tx.Create(&models).Error; err != nil {
				return santaErr("santaRepo.Draw insert", err)
			}
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

- [ ] **Step 7: Запустить тесты**

Run: `go build ./... && go test -tags integration ./internal/repo/persistent/ -run SantaRepo -v`
Expected: PASS, все 7 тестов. Если Docker недоступен — `go build ./... && go vet ./internal/repo/...` должны пройти, интеграционные тесты прогнать позже и отметить это в отчёте.

- [ ] **Step 8: Commit**

```bash
git add internal/entity/santa.go internal/repo/contracts.go internal/repo/persistent/santa_models.go internal/repo/persistent/santa_postgres.go internal/repo/persistent/santa_integration_test.go
git commit -m "feat(backend): хранилище комнат Тайного Санты"
```

---

### Task 2: Круг жеребьёвки, токены и ошибки Санты

**Files:**
- Modify: `BACK/internal/usecase/contracts.go`
- Create: `BACK/internal/usecase/santa/cycle.go`
- Create: `BACK/internal/usecase/santa/secret.go`
- Test: `BACK/internal/usecase/santa/cycle_test.go`, `BACK/internal/usecase/santa/secret_test.go`

**Interfaces:**
- Consumes: `entity.SantaAssignment` (Task 1).
- Produces: `usecase.ErrSantaNotFound`, `ErrSantaDrawn`, `ErrSantaNotDrawn`,
  `ErrSantaAlreadyJoined`, `ErrSantaTooFew`, `ErrSantaInvalid`;
  в пакете `santa`: `type shuffleFunc func([]uuid.UUID)`, `cryptoShuffle`,
  `buildCycle(roomID uuid.UUID, ids []uuid.UUID, shuffle shuffleFunc) ([]entity.SantaAssignment, error)`,
  `minParticipants = 3`, `newSlug() (string, error)`,
  `newToken() (raw, hash string, err error)`, `hashToken(raw string) string`.

- [ ] **Step 1: Ошибки**

В конец `BACK/internal/usecase/contracts.go`:

```go
// Ошибки Тайного Санты. Обработчик переводит их в 404 / 409 / 422.
var (
	// ErrSantaNotFound — нет комнаты, комната чужая или токен не подошёл.
	// Один ответ на все три случая: по нему нельзя перебрать чужие комнаты.
	ErrSantaNotFound = errors.New("комната не найдена")
	// ErrSantaDrawn — действие возможно только до жеребьёвки.
	ErrSantaDrawn = errors.New("жеребьёвка уже прошла")
	// ErrSantaNotDrawn — действие возможно только после жеребьёвки.
	ErrSantaNotDrawn = errors.New("жеребьёвки ещё не было")
	ErrSantaAlreadyJoined = errors.New("вы уже в этой комнате")
	ErrSantaTooFew        = errors.New("для жеребьёвки нужно минимум 3 участника")
	// ErrSantaInvalid оборачивается с подробностью: «неверные данные: …».
	ErrSantaInvalid = errors.New("неверные данные")
)
```

- [ ] **Step 2: Падающие тесты**

`BACK/internal/usecase/santa/cycle_test.go`:

```go
package santa

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/usecase"
)

func newIDs(n int) []uuid.UUID {
	ids := make([]uuid.UUID, n)
	for i := range ids {
		ids[i] = uuid.New()
	}
	return ids
}

func TestBuildCycle_TooFew(t *testing.T) {
	_, err := buildCycle(uuid.New(), newIDs(2), cryptoShuffle)
	assert.ErrorIs(t, err, usecase.ErrSantaTooFew)
}

func TestBuildCycle_ChainsInShuffledOrder(t *testing.T) {
	room := uuid.New()
	ids := newIDs(3)
	pairs, err := buildCycle(room, ids, func([]uuid.UUID) {})
	require.NoError(t, err)
	assert.Equal(t, []entity.SantaAssignment{
		{RoomID: room, GiverID: ids[0], ReceiverID: ids[1]},
		{RoomID: room, GiverID: ids[1], ReceiverID: ids[2]},
		{RoomID: room, GiverID: ids[2], ReceiverID: ids[0]},
	}, pairs)
}

func TestBuildCycle_DoesNotMutateInput(t *testing.T) {
	ids := newIDs(5)
	before := append([]uuid.UUID(nil), ids...)
	_, err := buildCycle(uuid.New(), ids, cryptoShuffle)
	require.NoError(t, err)
	assert.Equal(t, before, ids)
}

// Каждый дарит ровно одному, каждый получает ровно от одного, себя нет,
// и все стоят в одном круге — для любого размера комнаты.
func TestBuildCycle_AlwaysOneCircle(t *testing.T) {
	for n := 3; n <= 50; n++ {
		for run := 0; run < 200; run++ {
			ids := newIDs(n)
			pairs, err := buildCycle(uuid.New(), ids, cryptoShuffle)
			require.NoError(t, err)

			next := make(map[uuid.UUID]uuid.UUID, n)
			received := make(map[uuid.UUID]bool, n)
			for _, p := range pairs {
				require.NotEqual(t, p.GiverID, p.ReceiverID)
				_, dup := next[p.GiverID]
				require.False(t, dup, "дарит дважды")
				require.False(t, received[p.ReceiverID], "получает дважды")
				next[p.GiverID] = p.ReceiverID
				received[p.ReceiverID] = true
			}
			require.Len(t, next, n)

			cur := ids[0]
			for i := 1; i < n; i++ {
				cur = next[cur]
				require.NotEqual(t, ids[0], cur, "круг замкнулся раньше: пар больше одного круга")
			}
			require.Equal(t, ids[0], next[cur])
		}
	}
}

func TestCryptoShuffle_Varies(t *testing.T) {
	ids := newIDs(5)
	seen := map[uuid.UUID]bool{}
	for i := 0; i < 100; i++ {
		order := append([]uuid.UUID(nil), ids...)
		cryptoShuffle(order)
		seen[order[0]] = true
	}
	assert.Greater(t, len(seen), 1, "первый всегда один и тот же — перемешивания нет")
}
```

`BACK/internal/usecase/santa/secret_test.go`:

```go
package santa

import (
	"regexp"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewSlug_Format(t *testing.T) {
	a, err := newSlug()
	require.NoError(t, err)
	b, err := newSlug()
	require.NoError(t, err)
	assert.Regexp(t, regexp.MustCompile(`^[a-zA-Z0-9]{8}$`), a)
	assert.NotEqual(t, a, b)
}

func TestNewToken_HashMatches(t *testing.T) {
	raw, hash, err := newToken()
	require.NoError(t, err)
	assert.Len(t, raw, 43) // 32 байта в base64url без паддинга
	assert.Len(t, hash, 64)
	assert.Equal(t, hash, hashToken(raw))
	assert.NotEqual(t, raw, hash)
}
```

- [ ] **Step 3: Запустить — не собирается**

Run: `go test ./internal/usecase/santa/ -v`
Expected: FAIL — `undefined: buildCycle`.

- [ ] **Step 4: Реализация**

`BACK/internal/usecase/santa/cycle.go`:

```go
package santa

import (
	"crypto/rand"
	"fmt"
	"math/big"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/usecase"
)

const minParticipants = 3

// shuffleFunc перемешивает срез на месте. В тестах подменяется.
type shuffleFunc func([]uuid.UUID)

// cryptoShuffle — Фишер–Йетс на crypto/rand: по результату нельзя
// предсказать пары, даже зная время жеребьёвки.
func cryptoShuffle(ids []uuid.UUID) {
	for i := len(ids) - 1; i > 0; i-- {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		if err != nil {
			panic(fmt.Sprintf("crypto/rand: %v", err))
		}
		j := int(n.Int64())
		ids[i], ids[j] = ids[j], ids[i]
	}
}

// buildCycle ставит участников в один круг: i-й дарит (i+1)-му, последний —
// первому. Не случайная перестановка: в ней кто-то вытянул бы себя, а
// компания распадалась бы на пары «дарим друг другу».
func buildCycle(roomID uuid.UUID, ids []uuid.UUID, shuffle shuffleFunc) ([]entity.SantaAssignment, error) {
	if len(ids) < minParticipants {
		return nil, usecase.ErrSantaTooFew
	}
	order := append([]uuid.UUID(nil), ids...)
	shuffle(order)
	pairs := make([]entity.SantaAssignment, len(order))
	for i, giver := range order {
		pairs[i] = entity.SantaAssignment{RoomID: roomID, GiverID: giver, ReceiverID: order[(i+1)%len(order)]}
	}
	return pairs, nil
}
```

`BACK/internal/usecase/santa/secret.go`:

```go
package santa

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"math/big"
)

const slugAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// newSlug — 8 символов адреса комнаты: 62^8 вариантов, перебором не найти.
func newSlug() (string, error) {
	b := make([]byte, 8)
	for i := range b {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(slugAlphabet))))
		if err != nil {
			return "", err
		}
		b[i] = slugAlphabet[n.Int64()]
	}
	return string(b), nil
}

// newToken — секрет личной ссылки участника и его хэш для базы.
func newToken() (raw, hash string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	raw = base64.RawURLEncoding.EncodeToString(b)
	return raw, hashToken(raw), nil
}

// hashToken — sha256 без соли: токен сам по себе случайный, словарь к нему
// не подобрать, а поиск по хэшу должен быть точным.
func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
```

- [ ] **Step 5: Тесты проходят**

Run: `go test ./internal/usecase/santa/ -v`
Expected: PASS (5 + 2 теста).

- [ ] **Step 6: Commit**

```bash
git add internal/usecase/contracts.go internal/usecase/santa/
git commit -m "feat(backend): круг жеребьёвки и секреты Тайного Санты"
```

---

### Task 3: Мок репозитория и типы использования

**Files:**
- Create: `BACK/mock/repo/mock_santa_repo.go`
- Modify: `BACK/internal/usecase/contracts.go`

**Interfaces:**
- Consumes: `repo.SantaRepo` (Task 1).
- Produces: `mockrepo.MockSantaRepo`; типы `usecase.SantaRoomInput`,
  `SantaProfileInput`, `SantaAuth`, `SantaRoomSummary`, `SantaParticipantView`,
  `SantaRoomDetails`, `SantaInvite`, `SantaReceiver`, `SantaMe`,
  `SantaJoinResult`; интерфейс `usecase.SantaUseCase` (пока только методы
  организатора — задачи 5 и 6 его дополняют).

- [ ] **Step 1: Мок**

`BACK/mock/repo/mock_santa_repo.go`:

```go
package mockrepo

import (
	"context"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"

	"main/internal/entity"
)

type MockSantaRepo struct {
	mock.Mock
}

func (m *MockSantaRepo) CreateRoom(ctx context.Context, room entity.SantaRoom) error {
	return m.Called(ctx, room).Error(0)
}

func (m *MockSantaRepo) GetRoomByID(ctx context.Context, id uuid.UUID) (entity.SantaRoom, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(entity.SantaRoom), args.Error(1)
}

func (m *MockSantaRepo) GetRoomBySlug(ctx context.Context, slug string) (entity.SantaRoom, error) {
	args := m.Called(ctx, slug)
	return args.Get(0).(entity.SantaRoom), args.Error(1)
}

func (m *MockSantaRepo) ListRoomsByUser(ctx context.Context, userID uuid.UUID) ([]entity.SantaRoom, error) {
	args := m.Called(ctx, userID)
	rooms, _ := args.Get(0).([]entity.SantaRoom)
	return rooms, args.Error(1)
}

func (m *MockSantaRepo) UpdateRoom(ctx context.Context, room entity.SantaRoom) error {
	return m.Called(ctx, room).Error(0)
}

func (m *MockSantaRepo) DeleteRoom(ctx context.Context, id uuid.UUID) error {
	return m.Called(ctx, id).Error(0)
}

func (m *MockSantaRepo) CreateParticipant(ctx context.Context, p entity.SantaParticipant) error {
	return m.Called(ctx, p).Error(0)
}

func (m *MockSantaRepo) GetParticipant(ctx context.Context, id uuid.UUID) (entity.SantaParticipant, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(entity.SantaParticipant), args.Error(1)
}

func (m *MockSantaRepo) GetParticipantByToken(ctx context.Context, roomID uuid.UUID, tokenHash string) (entity.SantaParticipant, error) {
	args := m.Called(ctx, roomID, tokenHash)
	return args.Get(0).(entity.SantaParticipant), args.Error(1)
}

func (m *MockSantaRepo) GetParticipantByUser(ctx context.Context, roomID, userID uuid.UUID) (entity.SantaParticipant, error) {
	args := m.Called(ctx, roomID, userID)
	return args.Get(0).(entity.SantaParticipant), args.Error(1)
}

func (m *MockSantaRepo) ListParticipants(ctx context.Context, roomID uuid.UUID) ([]entity.SantaParticipant, error) {
	args := m.Called(ctx, roomID)
	ps, _ := args.Get(0).([]entity.SantaParticipant)
	return ps, args.Error(1)
}

func (m *MockSantaRepo) CountParticipants(ctx context.Context, roomIDs []uuid.UUID) (map[uuid.UUID]int, error) {
	args := m.Called(ctx, roomIDs)
	counts, _ := args.Get(0).(map[uuid.UUID]int)
	return counts, args.Error(1)
}

func (m *MockSantaRepo) UpdateParticipant(ctx context.Context, p entity.SantaParticipant) error {
	return m.Called(ctx, p).Error(0)
}

func (m *MockSantaRepo) DeleteParticipant(ctx context.Context, id uuid.UUID) error {
	return m.Called(ctx, id).Error(0)
}

func (m *MockSantaRepo) GetAssignment(ctx context.Context, roomID, giverID uuid.UUID) (entity.SantaAssignment, error) {
	args := m.Called(ctx, roomID, giverID)
	return args.Get(0).(entity.SantaAssignment), args.Error(1)
}

func (m *MockSantaRepo) Draw(ctx context.Context, roomID uuid.UUID, expected entity.SantaRoomStatus, build func([]uuid.UUID) ([]entity.SantaAssignment, error)) error {
	return m.Called(ctx, roomID, expected, build).Error(0)
}
```

- [ ] **Step 2: Типы и интерфейс**

В `BACK/internal/usecase/contracts.go` после ошибок Санты:

```go
// SantaRoomInput — создание и правка комнаты.
type SantaRoomInput struct {
	Title        string
	Budget       *int
	ExchangeDate *time.Time
	DrawAt       *time.Time
	Message      string
	// Только при создании: организатор сразу становится участником.
	OrganizerJoins  bool
	OrganizerName   string
	OrganizerWishes string
}

// SantaProfileInput — что участник пишет о себе.
type SantaProfileInput struct {
	Name        string
	Wishes      string
	WishlistURL string
}

// SantaAuth — кто пришёл в комнату: секрет из личной ссылки и/или вошедший
// пользователь. Токен проверяется первым.
type SantaAuth struct {
	Token  string
	UserID *uuid.UUID
}

type SantaRoomSummary struct {
	entity.SantaRoom
	IsOwner           bool `json:"isOwner"`
	ParticipantsCount int  `json:"participantsCount"`
}

// SantaParticipantView — участник глазами организатора: без текста
// пожеланий и без пар.
type SantaParticipantView struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	HasWishes   bool      `json:"hasWishes"`
	HasWishlist bool      `json:"hasWishlist"`
	IsOwner     bool      `json:"isOwner"`
	CreatedAt   time.Time `json:"createdAt"`
}

type SantaRoomDetails struct {
	Room         entity.SantaRoom       `json:"room"`
	Participants []SantaParticipantView `json:"participants"`
}

// SantaInvite — публичная карточка приглашения.
type SantaInvite struct {
	Slug              string                 `json:"slug"`
	Title             string                 `json:"title"`
	OrganizerName     string                 `json:"organizerName"`
	Budget            *int                   `json:"budget"`
	ExchangeDate      *time.Time             `json:"exchangeDate"`
	DrawAt            *time.Time             `json:"drawAt"`
	Message           string                 `json:"message"`
	ParticipantsCount int                    `json:"participantsCount"`
	Status            entity.SantaRoomStatus `json:"status"`
}

type SantaReceiver struct {
	Name        string `json:"name"`
	Wishes      string `json:"wishes"`
	WishlistURL string `json:"wishlistUrl"`
}

type SantaMe struct {
	ParticipantID uuid.UUID   `json:"participantId"`
	Name          string      `json:"name"`
	Wishes        string      `json:"wishes"`
	WishlistURL   string      `json:"wishlistUrl"`
	Room          SantaInvite `json:"room"`
	// Receiver — подопечный; nil до жеребьёвки.
	Receiver *SantaReceiver `json:"receiver"`
}

type SantaJoinResult struct {
	// Token — секрет личной ссылки. Отдаётся один раз, в базе только хэш.
	Token string  `json:"token"`
	Me    SantaMe `json:"me"`
}

// SantaUseCase — Тайный Санта.
type SantaUseCase interface {
	// Организатор. Чужая комната — ErrSantaNotFound.
	CreateRoom(ctx context.Context, ownerID uuid.UUID, in SantaRoomInput) (entity.SantaRoom, error)
	ListRooms(ctx context.Context, userID uuid.UUID) ([]SantaRoomSummary, error)
	GetRoom(ctx context.Context, ownerID, roomID uuid.UUID) (SantaRoomDetails, error)
	UpdateRoom(ctx context.Context, ownerID, roomID uuid.UUID, in SantaRoomInput) (entity.SantaRoom, error)
	DeleteRoom(ctx context.Context, ownerID, roomID uuid.UUID) error
	RemoveParticipant(ctx context.Context, ownerID, roomID, participantID uuid.UUID) error
}
```

- [ ] **Step 3: Собирается**

Run: `go build ./... && go vet ./mock/... ./internal/usecase/`
Expected: без ошибок (`SantaUseCase` пока нигде не реализуется).

- [ ] **Step 4: Commit**

```bash
git add mock/repo/mock_santa_repo.go internal/usecase/contracts.go
git commit -m "feat(backend): контракт использования Тайного Санты"
```

---

### Task 4: Использование — комнаты организатора

**Files:**
- Create: `BACK/internal/usecase/santa/validate.go`
- Create: `BACK/internal/usecase/santa/santa.go`
- Test: `BACK/internal/usecase/santa/santa_test.go`

**Interfaces:**
- Consumes: Task 1–3.
- Produces: `santa.New(santaRepo repo.SantaRepo, userRepo repo.UserRepo) usecase.SantaUseCase`;
  внутренние `(*santaUseCase).ownedRoom`, `validateRoom`, `normalizeProfile`,
  `validateProfile`, `invalid`, константа `maxParticipants = 100`.

- [ ] **Step 1: Падающие тесты**

`BACK/internal/usecase/santa/santa_test.go`:

```go
package santa_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
	"main/internal/usecase/santa"
	mockrepo "main/mock/repo"
)

var ctx = context.Background()

func newUC() (*mockrepo.MockSantaRepo, *mockrepo.MockUserRepo, usecase.SantaUseCase) {
	sr := &mockrepo.MockSantaRepo{}
	ur := &mockrepo.MockUserRepo{}
	return sr, ur, santa.New(sr, ur)
}

func openRoom(owner uuid.UUID) entity.SantaRoom {
	return entity.SantaRoom{ID: uuid.New(), OwnerID: owner, Slug: "AbCd2345", Title: "Офис", Status: entity.SantaRoomOpen}
}

func drawnRoom(owner uuid.UUID) entity.SantaRoom {
	r := openRoom(owner)
	r.Status = entity.SantaRoomDrawn
	return r
}

func intPtr(v int) *int { return &v }

func TestCreateRoom_RejectsEmptyTitle(t *testing.T) {
	sr, _, uc := newUC()
	_, err := uc.CreateRoom(ctx, uuid.New(), usecase.SantaRoomInput{Title: "   "})
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
	sr.AssertNotCalled(t, "CreateRoom", mock.Anything, mock.Anything)
}

func TestCreateRoom_RejectsBadBudget(t *testing.T) {
	_, _, uc := newUC()
	_, err := uc.CreateRoom(ctx, uuid.New(), usecase.SantaRoomInput{Title: "Офис", Budget: intPtr(-1)})
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
	_, err = uc.CreateRoom(ctx, uuid.New(), usecase.SantaRoomInput{Title: "Офис", Budget: intPtr(1_000_001)})
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
}

func TestCreateRoom_RejectsPastDrawAt(t *testing.T) {
	_, _, uc := newUC()
	past := time.Now().Add(-time.Hour)
	_, err := uc.CreateRoom(ctx, uuid.New(), usecase.SantaRoomInput{Title: "Офис", DrawAt: &past})
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
}

func TestCreateRoom_OrganizerNeedsName(t *testing.T) {
	sr, _, uc := newUC()
	_, err := uc.CreateRoom(ctx, uuid.New(), usecase.SantaRoomInput{Title: "Офис", OrganizerJoins: true})
	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
	sr.AssertNotCalled(t, "CreateRoom", mock.Anything, mock.Anything)
}

func TestCreateRoom_AddsOrganizerAsParticipant(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	sr.On("GetRoomBySlug", mock.Anything, mock.Anything).Return(entity.SantaRoom{}, repo.ErrNotFound)
	sr.On("CreateRoom", mock.Anything, mock.MatchedBy(func(r entity.SantaRoom) bool {
		return r.OwnerID == owner && r.Status == entity.SantaRoomOpen
	})).Return(nil)
	sr.On("CreateParticipant", mock.Anything, mock.MatchedBy(func(p entity.SantaParticipant) bool {
		return p.UserID != nil && *p.UserID == owner && p.Name == "Никита" && p.TokenHash != ""
	})).Return(nil)

	room, err := uc.CreateRoom(ctx, owner, usecase.SantaRoomInput{
		Title: "  Офис  ", Budget: intPtr(3000), OrganizerJoins: true, OrganizerName: " Никита ",
	})

	require.NoError(t, err)
	assert.Equal(t, "Офис", room.Title)
	assert.Len(t, room.Slug, 8)
	sr.AssertExpectations(t)
}

func TestCreateRoom_WithoutOrganizer(t *testing.T) {
	sr, _, uc := newUC()
	sr.On("GetRoomBySlug", mock.Anything, mock.Anything).Return(entity.SantaRoom{}, repo.ErrNotFound)
	sr.On("CreateRoom", mock.Anything, mock.Anything).Return(nil)

	_, err := uc.CreateRoom(ctx, uuid.New(), usecase.SantaRoomInput{Title: "Офис"})

	require.NoError(t, err)
	sr.AssertNotCalled(t, "CreateParticipant", mock.Anything, mock.Anything)
}

func TestListRooms_MarksOwnership(t *testing.T) {
	sr, _, uc := newUC()
	me := uuid.New()
	mine, theirs := openRoom(me), openRoom(uuid.New())
	sr.On("ListRoomsByUser", mock.Anything, me).Return([]entity.SantaRoom{mine, theirs}, nil)
	sr.On("CountParticipants", mock.Anything, []uuid.UUID{mine.ID, theirs.ID}).
		Return(map[uuid.UUID]int{mine.ID: 4}, nil)

	rooms, err := uc.ListRooms(ctx, me)

	require.NoError(t, err)
	require.Len(t, rooms, 2)
	assert.True(t, rooms[0].IsOwner)
	assert.Equal(t, 4, rooms[0].ParticipantsCount)
	assert.False(t, rooms[1].IsOwner)
	assert.Equal(t, 0, rooms[1].ParticipantsCount)
}

func TestGetRoom_StrangerGetsNotFound(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)

	_, err := uc.GetRoom(ctx, uuid.New(), room.ID)

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
	sr.AssertNotCalled(t, "ListParticipants", mock.Anything, mock.Anything)
}

func TestGetRoom_MissingIsNotFound(t *testing.T) {
	sr, _, uc := newUC()
	id := uuid.New()
	sr.On("GetRoomByID", mock.Anything, id).Return(entity.SantaRoom{}, repo.ErrNotFound)

	_, err := uc.GetRoom(ctx, uuid.New(), id)

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
}

// Организатор видит, кто заполнил пожелания, но не сам текст.
func TestGetRoom_HidesWishesText(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("ListParticipants", mock.Anything, room.ID).Return([]entity.SantaParticipant{
		{ID: uuid.New(), RoomID: room.ID, UserID: &owner, Name: "Никита", Wishes: "секретный чай"},
		{ID: uuid.New(), RoomID: room.ID, Name: "Маша", WishlistURL: "https://example.com/w"},
	}, nil)

	details, err := uc.GetRoom(ctx, owner, room.ID)

	require.NoError(t, err)
	require.Len(t, details.Participants, 2)
	assert.True(t, details.Participants[0].IsOwner)
	assert.True(t, details.Participants[0].HasWishes)
	assert.True(t, details.Participants[1].HasWishlist)
	raw, err := json.Marshal(details)
	require.NoError(t, err)
	assert.NotContains(t, string(raw), "секретный чай")
	assert.NotContains(t, string(raw), "example.com")
}

func TestUpdateRoom_AfterDrawIsClosed(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := drawnRoom(owner)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)

	_, err := uc.UpdateRoom(ctx, owner, room.ID, usecase.SantaRoomInput{Title: "Новое"})

	assert.ErrorIs(t, err, usecase.ErrSantaDrawn)
	sr.AssertNotCalled(t, "UpdateRoom", mock.Anything, mock.Anything)
}

func TestUpdateRoom_SavesFields(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("UpdateRoom", mock.Anything, mock.MatchedBy(func(r entity.SantaRoom) bool {
		return r.Title == "Новое" && r.Budget != nil && *r.Budget == 5000 && r.Slug == room.Slug
	})).Return(nil)

	updated, err := uc.UpdateRoom(ctx, owner, room.ID, usecase.SantaRoomInput{Title: "Новое", Budget: intPtr(5000)})

	require.NoError(t, err)
	assert.Equal(t, "Новое", updated.Title)
	sr.AssertExpectations(t)
}

func TestDeleteRoom_Stranger(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)

	err := uc.DeleteRoom(ctx, uuid.New(), room.ID)

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
	sr.AssertNotCalled(t, "DeleteRoom", mock.Anything, mock.Anything)
}

func TestRemoveParticipant_FromAnotherRoomIsNotFound(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	stranger := entity.SantaParticipant{ID: uuid.New(), RoomID: uuid.New()}
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("GetParticipant", mock.Anything, stranger.ID).Return(stranger, nil)

	err := uc.RemoveParticipant(ctx, owner, room.ID, stranger.ID)

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
	sr.AssertNotCalled(t, "DeleteParticipant", mock.Anything, mock.Anything)
}

func TestRemoveParticipant_AfterDrawIsClosed(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := drawnRoom(owner)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)

	err := uc.RemoveParticipant(ctx, owner, room.ID, uuid.New())

	assert.ErrorIs(t, err, usecase.ErrSantaDrawn)
}

func TestRemoveParticipant_Deletes(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID}
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("GetParticipant", mock.Anything, p.ID).Return(p, nil)
	sr.On("DeleteParticipant", mock.Anything, p.ID).Return(nil)

	require.NoError(t, uc.RemoveParticipant(ctx, owner, room.ID, p.ID))
	sr.AssertExpectations(t)
}
```

- [ ] **Step 2: Не собирается**

Run: `go test ./internal/usecase/santa/ -run 'Room|Participant' -v`
Expected: FAIL — `undefined: santa.New`.

- [ ] **Step 3: Проверки полей**

`BACK/internal/usecase/santa/validate.go`:

```go
package santa

import (
	"fmt"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"main/internal/usecase"
)

const (
	maxTitle   = 80
	maxMessage = 500
	maxBudget  = 1_000_000
	maxName    = 40
	maxWishes  = 1000
	maxURL     = 500
)

func invalid(msg string) error {
	return fmt.Errorf("%w: %s", usecase.ErrSantaInvalid, msg)
}

func normalizeRoom(in usecase.SantaRoomInput) usecase.SantaRoomInput {
	in.Title = strings.TrimSpace(in.Title)
	in.Message = strings.TrimSpace(in.Message)
	in.OrganizerName = strings.TrimSpace(in.OrganizerName)
	in.OrganizerWishes = strings.TrimSpace(in.OrganizerWishes)
	return in
}

func validateRoom(in usecase.SantaRoomInput, now time.Time) error {
	if n := utf8.RuneCountInString(in.Title); n == 0 || n > maxTitle {
		return invalid("название — от 1 до 80 символов")
	}
	if utf8.RuneCountInString(in.Message) > maxMessage {
		return invalid("сообщение участникам — до 500 символов")
	}
	if in.Budget != nil && (*in.Budget < 0 || *in.Budget > maxBudget) {
		return invalid("бюджет — от 0 до 1 000 000 ₽")
	}
	if in.DrawAt != nil && !in.DrawAt.After(now) {
		return invalid("время жеребьёвки уже прошло")
	}
	return nil
}

func normalizeProfile(in usecase.SantaProfileInput) usecase.SantaProfileInput {
	in.Name = strings.TrimSpace(in.Name)
	in.Wishes = strings.TrimSpace(in.Wishes)
	in.WishlistURL = strings.TrimSpace(in.WishlistURL)
	return in
}

func validateProfile(in usecase.SantaProfileInput) error {
	if n := utf8.RuneCountInString(in.Name); n == 0 || n > maxName {
		return invalid("имя — от 1 до 40 символов")
	}
	if utf8.RuneCountInString(in.Wishes) > maxWishes {
		return invalid("пожелания — до 1000 символов")
	}
	if in.WishlistURL != "" {
		// Ссылку увидит Санта и нажмёт её: javascript: и прочее сюда не пускаем.
		u, err := url.Parse(in.WishlistURL)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || len(in.WishlistURL) > maxURL {
			return invalid("ссылка на вишлист должна начинаться с http:// или https://")
		}
	}
	return nil
}
```

- [ ] **Step 4: Использование организатора**

`BACK/internal/usecase/santa/santa.go`:

```go
package santa

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

const (
	maxParticipants = 100
	slugAttempts    = 5
)

type santaUseCase struct {
	santa   repo.SantaRepo
	users   repo.UserRepo
	shuffle shuffleFunc
	now     func() time.Time
}

func New(santaRepo repo.SantaRepo, userRepo repo.UserRepo) usecase.SantaUseCase {
	return &santaUseCase{santa: santaRepo, users: userRepo, shuffle: cryptoShuffle, now: time.Now}
}

func (uc *santaUseCase) CreateRoom(ctx context.Context, ownerID uuid.UUID, in usecase.SantaRoomInput) (entity.SantaRoom, error) {
	in = normalizeRoom(in)
	if err := validateRoom(in, uc.now()); err != nil {
		return entity.SantaRoom{}, err
	}
	organizer := normalizeProfile(usecase.SantaProfileInput{Name: in.OrganizerName, Wishes: in.OrganizerWishes})
	if in.OrganizerJoins {
		if err := validateProfile(organizer); err != nil {
			return entity.SantaRoom{}, err
		}
	}

	slug, err := uc.freeSlug(ctx)
	if err != nil {
		return entity.SantaRoom{}, err
	}
	now := uc.now()
	room := entity.SantaRoom{
		ID: uuid.New(), OwnerID: ownerID, Slug: slug, Title: in.Title, Budget: in.Budget,
		ExchangeDate: in.ExchangeDate, DrawAt: in.DrawAt, Message: in.Message,
		Status: entity.SantaRoomOpen, CreatedAt: now, UpdatedAt: now,
	}
	if err := uc.santa.CreateRoom(ctx, room); err != nil {
		return entity.SantaRoom{}, fmt.Errorf("create room: %w", err)
	}

	if in.OrganizerJoins {
		// Организатор входит по аккаунту, личная ссылка ему не нужна —
		// токен генерируется только ради непустого уникального хэша.
		_, hash, err := newToken()
		if err != nil {
			return entity.SantaRoom{}, err
		}
		owner := ownerID
		p := entity.SantaParticipant{
			ID: uuid.New(), RoomID: room.ID, UserID: &owner, Name: organizer.Name,
			Wishes: organizer.Wishes, TokenHash: hash, CreatedAt: now, UpdatedAt: now,
		}
		if err := uc.santa.CreateParticipant(ctx, p); err != nil {
			return entity.SantaRoom{}, fmt.Errorf("create organizer: %w", err)
		}
	}
	return room, nil
}

func (uc *santaUseCase) freeSlug(ctx context.Context) (string, error) {
	for i := 0; i < slugAttempts; i++ {
		slug, err := newSlug()
		if err != nil {
			return "", err
		}
		_, err = uc.santa.GetRoomBySlug(ctx, slug)
		if errors.Is(err, repo.ErrNotFound) {
			return slug, nil
		}
		if err != nil {
			return "", fmt.Errorf("check slug: %w", err)
		}
	}
	return "", errors.New("не удалось подобрать адрес комнаты")
}

// ownedRoom отвечает «не найдено» и на чужую комнату: по id нельзя узнать,
// существует ли она.
func (uc *santaUseCase) ownedRoom(ctx context.Context, ownerID, roomID uuid.UUID) (entity.SantaRoom, error) {
	room, err := uc.santa.GetRoomByID(ctx, roomID)
	if errors.Is(err, repo.ErrNotFound) {
		return entity.SantaRoom{}, usecase.ErrSantaNotFound
	}
	if err != nil {
		return entity.SantaRoom{}, err
	}
	if room.OwnerID != ownerID {
		return entity.SantaRoom{}, usecase.ErrSantaNotFound
	}
	return room, nil
}

func (uc *santaUseCase) ListRooms(ctx context.Context, userID uuid.UUID) ([]usecase.SantaRoomSummary, error) {
	rooms, err := uc.santa.ListRoomsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	ids := make([]uuid.UUID, len(rooms))
	for i, r := range rooms {
		ids[i] = r.ID
	}
	counts, err := uc.santa.CountParticipants(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]usecase.SantaRoomSummary, len(rooms))
	for i, r := range rooms {
		out[i] = usecase.SantaRoomSummary{SantaRoom: r, IsOwner: r.OwnerID == userID, ParticipantsCount: counts[r.ID]}
	}
	return out, nil
}

func (uc *santaUseCase) GetRoom(ctx context.Context, ownerID, roomID uuid.UUID) (usecase.SantaRoomDetails, error) {
	room, err := uc.ownedRoom(ctx, ownerID, roomID)
	if err != nil {
		return usecase.SantaRoomDetails{}, err
	}
	ps, err := uc.santa.ListParticipants(ctx, room.ID)
	if err != nil {
		return usecase.SantaRoomDetails{}, err
	}
	views := make([]usecase.SantaParticipantView, len(ps))
	for i, p := range ps {
		views[i] = usecase.SantaParticipantView{
			ID: p.ID, Name: p.Name, HasWishes: p.Wishes != "", HasWishlist: p.WishlistURL != "",
			IsOwner: p.UserID != nil && *p.UserID == room.OwnerID, CreatedAt: p.CreatedAt,
		}
	}
	return usecase.SantaRoomDetails{Room: room, Participants: views}, nil
}

func (uc *santaUseCase) UpdateRoom(ctx context.Context, ownerID, roomID uuid.UUID, in usecase.SantaRoomInput) (entity.SantaRoom, error) {
	room, err := uc.ownedRoom(ctx, ownerID, roomID)
	if err != nil {
		return entity.SantaRoom{}, err
	}
	if room.Status != entity.SantaRoomOpen {
		return entity.SantaRoom{}, usecase.ErrSantaDrawn
	}
	in = normalizeRoom(in)
	if err := validateRoom(in, uc.now()); err != nil {
		return entity.SantaRoom{}, err
	}
	room.Title = in.Title
	room.Budget = in.Budget
	room.ExchangeDate = in.ExchangeDate
	room.DrawAt = in.DrawAt
	room.Message = in.Message
	room.UpdatedAt = uc.now()
	if err := uc.santa.UpdateRoom(ctx, room); err != nil {
		return entity.SantaRoom{}, err
	}
	return room, nil
}

func (uc *santaUseCase) DeleteRoom(ctx context.Context, ownerID, roomID uuid.UUID) error {
	if _, err := uc.ownedRoom(ctx, ownerID, roomID); err != nil {
		return err
	}
	return uc.santa.DeleteRoom(ctx, roomID)
}

func (uc *santaUseCase) RemoveParticipant(ctx context.Context, ownerID, roomID, participantID uuid.UUID) error {
	room, err := uc.ownedRoom(ctx, ownerID, roomID)
	if err != nil {
		return err
	}
	if room.Status != entity.SantaRoomOpen {
		return usecase.ErrSantaDrawn
	}
	p, err := uc.santa.GetParticipant(ctx, participantID)
	if errors.Is(err, repo.ErrNotFound) || (err == nil && p.RoomID != room.ID) {
		return usecase.ErrSantaNotFound
	}
	if err != nil {
		return err
	}
	return uc.santa.DeleteParticipant(ctx, p.ID)
}
```

- [ ] **Step 5: Тесты проходят**

Run: `go test ./internal/usecase/santa/ -v`
Expected: PASS — все тесты задач 2 и 4.

- [ ] **Step 6: Commit**

```bash
git add internal/usecase/santa/
git commit -m "feat(backend): комнаты организатора Тайного Санты"
```

---

### Task 5: Использование — приглашение и участник

**Files:**
- Modify: `BACK/internal/usecase/contracts.go` (интерфейс `SantaUseCase`)
- Create: `BACK/internal/usecase/santa/participant.go`
- Test: `BACK/internal/usecase/santa/participant_test.go`

**Interfaces:**
- Consumes: Task 4 (`santaUseCase`, `normalizeProfile`, `validateProfile`, `invalid`, `maxParticipants`, `newToken`, `hashToken`).
- Produces: методы `GetInvite(ctx, slug string) (SantaInvite, error)`,
  `Join(ctx, slug string, userID *uuid.UUID, in SantaProfileInput) (SantaJoinResult, error)`,
  `GetMe(ctx, slug string, auth SantaAuth) (SantaMe, error)`,
  `UpdateMe(ctx, slug string, auth SantaAuth, in SantaProfileInput) (SantaMe, error)`,
  `LeaveMe(ctx, slug string, auth SantaAuth) error`.

- [ ] **Step 1: Расширить интерфейс**

В `SantaUseCase` (`contracts.go`) добавить:

```go
	// Участник. Комната по slug; нет комнаты или участника — ErrSantaNotFound.
	GetInvite(ctx context.Context, slug string) (SantaInvite, error)
	Join(ctx context.Context, slug string, userID *uuid.UUID, in SantaProfileInput) (SantaJoinResult, error)
	GetMe(ctx context.Context, slug string, auth SantaAuth) (SantaMe, error)
	// UpdateMe: после жеребьёвки имя менять нельзя (его уже знает Санта),
	// пожелания и вишлист — можно.
	UpdateMe(ctx context.Context, slug string, auth SantaAuth, in SantaProfileInput) (SantaMe, error)
	LeaveMe(ctx context.Context, slug string, auth SantaAuth) error
```

- [ ] **Step 2: Падающие тесты**

`BACK/internal/usecase/santa/participant_test.go`:

```go
package santa_test

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

func TestGetInvite_UnknownSlug(t *testing.T) {
	sr, _, uc := newUC()
	sr.On("GetRoomBySlug", mock.Anything, "nope").Return(entity.SantaRoom{}, repo.ErrNotFound)

	_, err := uc.GetInvite(ctx, "nope")

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
}

func TestGetInvite_OrganizerNameFallsBackToUsername(t *testing.T) {
	sr, ur, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("CountParticipants", mock.Anything, []uuid.UUID{room.ID}).Return(map[uuid.UUID]int{room.ID: 5}, nil)
	ur.On("GetByID", mock.Anything, room.OwnerID).Return(entity.User{Username: "nikita"}, nil)

	inv, err := uc.GetInvite(ctx, room.Slug)

	require.NoError(t, err)
	assert.Equal(t, "nikita", inv.OrganizerName)
	assert.Equal(t, 5, inv.ParticipantsCount)
	assert.Equal(t, entity.SantaRoomOpen, inv.Status)
}

func TestJoin_AfterDrawIsClosed(t *testing.T) {
	sr, _, uc := newUC()
	room := drawnRoom(uuid.New())
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)

	_, err := uc.Join(ctx, room.Slug, nil, usecase.SantaProfileInput{Name: "Маша"})

	assert.ErrorIs(t, err, usecase.ErrSantaDrawn)
	sr.AssertNotCalled(t, "CreateParticipant", mock.Anything, mock.Anything)
}

func TestJoin_RejectsScriptLink(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)

	_, err := uc.Join(ctx, room.Slug, nil, usecase.SantaProfileInput{Name: "Маша", WishlistURL: "javascript:alert(1)"})

	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
}

func TestJoin_UserCannotJoinTwice(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	user := uuid.New()
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("GetParticipantByUser", mock.Anything, room.ID, user).Return(entity.SantaParticipant{ID: uuid.New()}, nil)

	_, err := uc.Join(ctx, room.Slug, &user, usecase.SantaProfileInput{Name: "Маша"})

	assert.ErrorIs(t, err, usecase.ErrSantaAlreadyJoined)
}

func TestJoin_FullRoom(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("CountParticipants", mock.Anything, []uuid.UUID{room.ID}).Return(map[uuid.UUID]int{room.ID: 100}, nil)

	_, err := uc.Join(ctx, room.Slug, nil, usecase.SantaProfileInput{Name: "Маша"})

	assert.ErrorIs(t, err, usecase.ErrSantaInvalid)
}

func TestJoin_ReturnsTokenAndStoresOnlyHash(t *testing.T) {
	sr, ur, uc := newUC()
	room := openRoom(uuid.New())
	var stored entity.SantaParticipant
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("CountParticipants", mock.Anything, []uuid.UUID{room.ID}).Return(map[uuid.UUID]int{room.ID: 2}, nil)
	sr.On("CreateParticipant", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		stored = args.Get(1).(entity.SantaParticipant)
	}).Return(nil)
	ur.On("GetByID", mock.Anything, room.OwnerID).Return(entity.User{DisplayName: "Никита"}, nil)

	res, err := uc.Join(ctx, room.Slug, nil, usecase.SantaProfileInput{Name: " Маша ", Wishes: "чай"})

	require.NoError(t, err)
	assert.NotEmpty(t, res.Token)
	assert.NotEqual(t, res.Token, stored.TokenHash)
	assert.Len(t, stored.TokenHash, 64)
	assert.Nil(t, stored.UserID)
	assert.Equal(t, "Маша", res.Me.Name)
	assert.Nil(t, res.Me.Receiver)
}

func TestGetMe_WrongTokenIsNotFound(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, mock.Anything).Return(entity.SantaParticipant{}, repo.ErrNotFound)

	_, err := uc.GetMe(ctx, room.Slug, usecase.SantaAuth{Token: "stale"})

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
}

func TestGetMe_NoCredentialsIsNotFound(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)

	_, err := uc.GetMe(ctx, room.Slug, usecase.SantaAuth{})

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
}

func TestGetMe_FallsBackToAccount(t *testing.T) {
	sr, ur, uc := newUC()
	room := openRoom(uuid.New())
	user := uuid.New()
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, UserID: &user, Name: "Никита"}
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, mock.Anything).Return(entity.SantaParticipant{}, repo.ErrNotFound)
	sr.On("GetParticipantByUser", mock.Anything, room.ID, user).Return(p, nil)
	sr.On("CountParticipants", mock.Anything, []uuid.UUID{room.ID}).Return(map[uuid.UUID]int{room.ID: 3}, nil)
	ur.On("GetByID", mock.Anything, room.OwnerID).Return(entity.User{}, nil)

	me, err := uc.GetMe(ctx, room.Slug, usecase.SantaAuth{Token: "old", UserID: &user})

	require.NoError(t, err)
	assert.Equal(t, p.ID, me.ParticipantID)
}

func TestGetMe_DrawnShowsReceiver(t *testing.T) {
	sr, ur, uc := newUC()
	room := drawnRoom(uuid.New())
	me := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Артём"}
	ward := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Маша", Wishes: "чай", WishlistURL: "https://x.ru/w"}
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, mock.Anything).Return(me, nil)
	sr.On("CountParticipants", mock.Anything, []uuid.UUID{room.ID}).Return(map[uuid.UUID]int{room.ID: 3}, nil)
	ur.On("GetByID", mock.Anything, room.OwnerID).Return(entity.User{}, nil)
	sr.On("GetAssignment", mock.Anything, room.ID, me.ID).Return(entity.SantaAssignment{RoomID: room.ID, GiverID: me.ID, ReceiverID: ward.ID}, nil)
	sr.On("GetParticipant", mock.Anything, ward.ID).Return(ward, nil)

	got, err := uc.GetMe(ctx, room.Slug, usecase.SantaAuth{Token: "tok"})

	require.NoError(t, err)
	require.NotNil(t, got.Receiver)
	assert.Equal(t, usecase.SantaReceiver{Name: "Маша", Wishes: "чай", WishlistURL: "https://x.ru/w"}, *got.Receiver)
}

func TestUpdateMe_RenameAfterDrawIsClosed(t *testing.T) {
	sr, _, uc := newUC()
	room := drawnRoom(uuid.New())
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Артём"}
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, mock.Anything).Return(p, nil)

	_, err := uc.UpdateMe(ctx, room.Slug, usecase.SantaAuth{Token: "tok"}, usecase.SantaProfileInput{Name: "Тёма"})

	assert.ErrorIs(t, err, usecase.ErrSantaDrawn)
	sr.AssertNotCalled(t, "UpdateParticipant", mock.Anything, mock.Anything)
}

func TestUpdateMe_WishesAfterDrawAreSaved(t *testing.T) {
	sr, ur, uc := newUC()
	room := drawnRoom(uuid.New())
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID, Name: "Артём"}
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, mock.Anything).Return(p, nil)
	sr.On("UpdateParticipant", mock.Anything, mock.MatchedBy(func(u entity.SantaParticipant) bool {
		return u.Wishes == "кофе" && u.Name == "Артём"
	})).Return(nil)
	sr.On("CountParticipants", mock.Anything, mock.Anything).Return(map[uuid.UUID]int{}, nil)
	ur.On("GetByID", mock.Anything, mock.Anything).Return(entity.User{}, nil)
	sr.On("GetAssignment", mock.Anything, room.ID, p.ID).Return(entity.SantaAssignment{}, repo.ErrNotFound)

	_, err := uc.UpdateMe(ctx, room.Slug, usecase.SantaAuth{Token: "tok"}, usecase.SantaProfileInput{Name: "Артём", Wishes: "кофе"})

	require.NoError(t, err)
	sr.AssertExpectations(t)
}

func TestLeaveMe_AfterDrawIsClosed(t *testing.T) {
	sr, _, uc := newUC()
	room := drawnRoom(uuid.New())
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)

	err := uc.LeaveMe(ctx, room.Slug, usecase.SantaAuth{Token: "tok"})

	assert.ErrorIs(t, err, usecase.ErrSantaDrawn)
	sr.AssertNotCalled(t, "DeleteParticipant", mock.Anything, mock.Anything)
}

func TestLeaveMe_Deletes(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	p := entity.SantaParticipant{ID: uuid.New(), RoomID: room.ID}
	sr.On("GetRoomBySlug", mock.Anything, room.Slug).Return(room, nil)
	sr.On("GetParticipantByToken", mock.Anything, room.ID, mock.Anything).Return(p, nil)
	sr.On("DeleteParticipant", mock.Anything, p.ID).Return(nil)

	require.NoError(t, uc.LeaveMe(ctx, room.Slug, usecase.SantaAuth{Token: "tok"}))
}
```

- [ ] **Step 3: Не собирается**

Run: `go test ./internal/usecase/santa/ -v`
Expected: FAIL — `*santaUseCase does not implement usecase.SantaUseCase (missing method GetInvite)`.

- [ ] **Step 4: Реализация**

`BACK/internal/usecase/santa/participant.go`:

```go
package santa

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

func (uc *santaUseCase) roomBySlug(ctx context.Context, slug string) (entity.SantaRoom, error) {
	room, err := uc.santa.GetRoomBySlug(ctx, slug)
	if errors.Is(err, repo.ErrNotFound) {
		return entity.SantaRoom{}, usecase.ErrSantaNotFound
	}
	return room, err
}

func (uc *santaUseCase) invite(ctx context.Context, room entity.SantaRoom) (usecase.SantaInvite, error) {
	counts, err := uc.santa.CountParticipants(ctx, []uuid.UUID{room.ID})
	if err != nil {
		return usecase.SantaInvite{}, err
	}
	// Имя организатора — украшение приглашения: если пользователь не
	// нашёлся, карточка всё равно открывается.
	organizer := ""
	if owner, err := uc.users.GetByID(ctx, room.OwnerID); err == nil {
		organizer = owner.DisplayName
		if organizer == "" {
			organizer = owner.Username
		}
	}
	return usecase.SantaInvite{
		Slug: room.Slug, Title: room.Title, OrganizerName: organizer, Budget: room.Budget,
		ExchangeDate: room.ExchangeDate, DrawAt: room.DrawAt, Message: room.Message,
		ParticipantsCount: counts[room.ID], Status: room.Status,
	}, nil
}

// participant: сначала секрет из личной ссылки, потом аккаунт. Устаревший
// токен в браузере не мешает войти по аккаунту.
func (uc *santaUseCase) participant(ctx context.Context, room entity.SantaRoom, auth usecase.SantaAuth) (entity.SantaParticipant, error) {
	if auth.Token != "" {
		p, err := uc.santa.GetParticipantByToken(ctx, room.ID, hashToken(auth.Token))
		if err == nil {
			return p, nil
		}
		if !errors.Is(err, repo.ErrNotFound) {
			return entity.SantaParticipant{}, err
		}
	}
	if auth.UserID != nil {
		p, err := uc.santa.GetParticipantByUser(ctx, room.ID, *auth.UserID)
		if err == nil {
			return p, nil
		}
		if !errors.Is(err, repo.ErrNotFound) {
			return entity.SantaParticipant{}, err
		}
	}
	return entity.SantaParticipant{}, usecase.ErrSantaNotFound
}

func (uc *santaUseCase) me(ctx context.Context, room entity.SantaRoom, p entity.SantaParticipant) (usecase.SantaMe, error) {
	inv, err := uc.invite(ctx, room)
	if err != nil {
		return usecase.SantaMe{}, err
	}
	me := usecase.SantaMe{ParticipantID: p.ID, Name: p.Name, Wishes: p.Wishes, WishlistURL: p.WishlistURL, Room: inv}
	if room.Status != entity.SantaRoomDrawn {
		return me, nil
	}
	a, err := uc.santa.GetAssignment(ctx, room.ID, p.ID)
	if errors.Is(err, repo.ErrNotFound) {
		return me, nil
	}
	if err != nil {
		return usecase.SantaMe{}, err
	}
	ward, err := uc.santa.GetParticipant(ctx, a.ReceiverID)
	if err != nil {
		return usecase.SantaMe{}, fmt.Errorf("receiver: %w", err)
	}
	me.Receiver = &usecase.SantaReceiver{Name: ward.Name, Wishes: ward.Wishes, WishlistURL: ward.WishlistURL}
	return me, nil
}

func (uc *santaUseCase) GetInvite(ctx context.Context, slug string) (usecase.SantaInvite, error) {
	room, err := uc.roomBySlug(ctx, slug)
	if err != nil {
		return usecase.SantaInvite{}, err
	}
	return uc.invite(ctx, room)
}

func (uc *santaUseCase) Join(ctx context.Context, slug string, userID *uuid.UUID, in usecase.SantaProfileInput) (usecase.SantaJoinResult, error) {
	room, err := uc.roomBySlug(ctx, slug)
	if err != nil {
		return usecase.SantaJoinResult{}, err
	}
	if room.Status != entity.SantaRoomOpen {
		return usecase.SantaJoinResult{}, usecase.ErrSantaDrawn
	}
	in = normalizeProfile(in)
	if err := validateProfile(in); err != nil {
		return usecase.SantaJoinResult{}, err
	}
	if userID != nil {
		_, err := uc.santa.GetParticipantByUser(ctx, room.ID, *userID)
		if err == nil {
			return usecase.SantaJoinResult{}, usecase.ErrSantaAlreadyJoined
		}
		if !errors.Is(err, repo.ErrNotFound) {
			return usecase.SantaJoinResult{}, err
		}
	}
	counts, err := uc.santa.CountParticipants(ctx, []uuid.UUID{room.ID})
	if err != nil {
		return usecase.SantaJoinResult{}, err
	}
	if counts[room.ID] >= maxParticipants {
		return usecase.SantaJoinResult{}, invalid("в комнате уже 100 участников")
	}

	raw, hash, err := newToken()
	if err != nil {
		return usecase.SantaJoinResult{}, err
	}
	now := uc.now()
	p := entity.SantaParticipant{
		ID: uuid.New(), RoomID: room.ID, UserID: userID, Name: in.Name, Wishes: in.Wishes,
		WishlistURL: in.WishlistURL, TokenHash: hash, CreatedAt: now, UpdatedAt: now,
	}
	if err := uc.santa.CreateParticipant(ctx, p); err != nil {
		return usecase.SantaJoinResult{}, fmt.Errorf("join: %w", err)
	}
	me, err := uc.me(ctx, room, p)
	if err != nil {
		return usecase.SantaJoinResult{}, err
	}
	return usecase.SantaJoinResult{Token: raw, Me: me}, nil
}

func (uc *santaUseCase) GetMe(ctx context.Context, slug string, auth usecase.SantaAuth) (usecase.SantaMe, error) {
	room, err := uc.roomBySlug(ctx, slug)
	if err != nil {
		return usecase.SantaMe{}, err
	}
	p, err := uc.participant(ctx, room, auth)
	if err != nil {
		return usecase.SantaMe{}, err
	}
	return uc.me(ctx, room, p)
}

func (uc *santaUseCase) UpdateMe(ctx context.Context, slug string, auth usecase.SantaAuth, in usecase.SantaProfileInput) (usecase.SantaMe, error) {
	room, err := uc.roomBySlug(ctx, slug)
	if err != nil {
		return usecase.SantaMe{}, err
	}
	p, err := uc.participant(ctx, room, auth)
	if err != nil {
		return usecase.SantaMe{}, err
	}
	in = normalizeProfile(in)
	if err := validateProfile(in); err != nil {
		return usecase.SantaMe{}, err
	}
	if room.Status != entity.SantaRoomOpen && in.Name != p.Name {
		return usecase.SantaMe{}, usecase.ErrSantaDrawn
	}
	p.Name = in.Name
	p.Wishes = in.Wishes
	p.WishlistURL = in.WishlistURL
	p.UpdatedAt = uc.now()
	if err := uc.santa.UpdateParticipant(ctx, p); err != nil {
		return usecase.SantaMe{}, err
	}
	return uc.me(ctx, room, p)
}

func (uc *santaUseCase) LeaveMe(ctx context.Context, slug string, auth usecase.SantaAuth) error {
	room, err := uc.roomBySlug(ctx, slug)
	if err != nil {
		return err
	}
	if room.Status != entity.SantaRoomOpen {
		return usecase.ErrSantaDrawn
	}
	p, err := uc.participant(ctx, room, auth)
	if err != nil {
		return err
	}
	return uc.santa.DeleteParticipant(ctx, p.ID)
}
```

- [ ] **Step 5: Тесты проходят**

Run: `go test ./internal/usecase/santa/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/usecase/contracts.go internal/usecase/santa/participant.go internal/usecase/santa/participant_test.go
git commit -m "feat(backend): вступление и карточка участника Тайного Санты"
```

---

### Task 6: Использование — жеребьёвка и перезапуск

**Files:**
- Modify: `BACK/internal/usecase/contracts.go`
- Create: `BACK/internal/usecase/santa/draw.go`
- Test: `BACK/internal/usecase/santa/draw_test.go`

**Interfaces:**
- Consumes: `repo.SantaRepo.Draw`, `buildCycle`, `ownedRoom`.
- Produces: `Draw(ctx, ownerID, roomID uuid.UUID) error`, `Redraw(ctx, ownerID, roomID uuid.UUID) error`.

- [ ] **Step 1: Расширить интерфейс**

В `SantaUseCase` добавить:

```go
	// Draw тянет пары; уже прошла — ErrSantaDrawn, меньше 3 — ErrSantaTooFew.
	Draw(ctx context.Context, ownerID, roomID uuid.UUID) error
	// Redraw стирает пары и тянет заново; не было жеребьёвки — ErrSantaNotDrawn.
	Redraw(ctx context.Context, ownerID, roomID uuid.UUID) error
```

- [ ] **Step 2: Падающие тесты**

`BACK/internal/usecase/santa/draw_test.go`:

```go
package santa_test

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

type buildFunc = func([]uuid.UUID) ([]entity.SantaAssignment, error)

func TestDraw_StrangerIsNotFound(t *testing.T) {
	sr, _, uc := newUC()
	room := openRoom(uuid.New())
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)

	err := uc.Draw(ctx, uuid.New(), room.ID)

	assert.ErrorIs(t, err, usecase.ErrSantaNotFound)
	sr.AssertNotCalled(t, "Draw", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestDraw_BuildsOneCircle(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	var build buildFunc
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("Draw", mock.Anything, room.ID, entity.SantaRoomOpen, mock.Anything).Run(func(args mock.Arguments) {
		build = args.Get(3).(buildFunc)
	}).Return(nil)

	require.NoError(t, uc.Draw(ctx, owner, room.ID))

	ids := []uuid.UUID{uuid.New(), uuid.New(), uuid.New(), uuid.New()}
	pairs, err := build(ids)
	require.NoError(t, err)
	require.Len(t, pairs, 4)
	for _, p := range pairs {
		assert.Equal(t, room.ID, p.RoomID)
		assert.NotEqual(t, p.GiverID, p.ReceiverID)
	}

	_, err = build(ids[:2])
	assert.ErrorIs(t, err, usecase.ErrSantaTooFew)
}

func TestDraw_SecondCallIsConflict(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("Draw", mock.Anything, room.ID, entity.SantaRoomOpen, mock.Anything).Return(repo.ErrStatusMismatch)

	err := uc.Draw(ctx, owner, room.ID)

	assert.ErrorIs(t, err, usecase.ErrSantaDrawn)
}

func TestRedraw_BeforeDrawIsConflict(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := openRoom(owner)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("Draw", mock.Anything, room.ID, entity.SantaRoomDrawn, mock.Anything).Return(repo.ErrStatusMismatch)

	err := uc.Redraw(ctx, owner, room.ID)

	assert.ErrorIs(t, err, usecase.ErrSantaNotDrawn)
}
```

- [ ] **Step 3: Не собирается**

Run: `go test ./internal/usecase/santa/ -run 'Draw' -v`
Expected: FAIL — `missing method Draw`.

- [ ] **Step 4: Реализация**

`BACK/internal/usecase/santa/draw.go`:

```go
package santa

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

func (uc *santaUseCase) Draw(ctx context.Context, ownerID, roomID uuid.UUID) error {
	return uc.draw(ctx, ownerID, roomID, entity.SantaRoomOpen, usecase.ErrSantaDrawn)
}

func (uc *santaUseCase) Redraw(ctx context.Context, ownerID, roomID uuid.UUID) error {
	return uc.draw(ctx, ownerID, roomID, entity.SantaRoomDrawn, usecase.ErrSantaNotDrawn)
}

// draw: статус проверяет репозиторий под блокировкой строки, а не мы до
// вызова — иначе два одновременных нажатия прошли бы оба.
func (uc *santaUseCase) draw(ctx context.Context, ownerID, roomID uuid.UUID, expected entity.SantaRoomStatus, wrongStatus error) error {
	room, err := uc.ownedRoom(ctx, ownerID, roomID)
	if err != nil {
		return err
	}
	err = uc.santa.Draw(ctx, room.ID, expected, func(ids []uuid.UUID) ([]entity.SantaAssignment, error) {
		return buildCycle(room.ID, ids, uc.shuffle)
	})
	if errors.Is(err, repo.ErrStatusMismatch) {
		return wrongStatus
	}
	return err
}
```

- [ ] **Step 5: Тесты проходят**

Run: `go test ./internal/usecase/santa/ -v && go build ./...`
Expected: PASS, сборка без ошибок.

- [ ] **Step 6: Commit**

```bash
git add internal/usecase/contracts.go internal/usecase/santa/draw.go internal/usecase/santa/draw_test.go
git commit -m "feat(backend): жеребьёвка Тайного Санты"
```

---

### Task 7: HTTP-обработчики, маршруты и сборка приложения

**Files:**
- Create: `BACK/internal/controller/restapi/v1/santa.go`
- Test: `BACK/internal/controller/restapi/v1/santa_test.go`
- Modify: `BACK/internal/controller/restapi/router.go`
- Modify: `BACK/internal/app/app.go`
- Modify: `BACK/.env.example`

**Interfaces:**
- Consumes: `usecase.SantaUseCase` целиком (задачи 3–6), `santa.New`, `persistent.NewSantaRepo`.
- Produces: `v1.NewSantaRouter(router fiber.Router, jwtSecret string, uc usecase.SantaUseCase)`,
  `v1.SantaTokenHeader = "X-Santa-Token"`; HTTP API из спеки (раздел «API»).

- [ ] **Step 1: Падающие тесты**

`BACK/internal/controller/restapi/v1/santa_test.go`:

```go
package v1_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	v1 "main/internal/controller/restapi/v1"
	"main/internal/usecase"
)

type MockSantaUC struct{ mock.Mock }

func (m *MockSantaUC) CreateRoom(ctx context.Context, ownerID uuid.UUID, in usecase.SantaRoomInput) (entity.SantaRoom, error) {
	args := m.Called(ctx, ownerID, in)
	return args.Get(0).(entity.SantaRoom), args.Error(1)
}
func (m *MockSantaUC) ListRooms(ctx context.Context, userID uuid.UUID) ([]usecase.SantaRoomSummary, error) {
	args := m.Called(ctx, userID)
	rooms, _ := args.Get(0).([]usecase.SantaRoomSummary)
	return rooms, args.Error(1)
}
func (m *MockSantaUC) GetRoom(ctx context.Context, ownerID, roomID uuid.UUID) (usecase.SantaRoomDetails, error) {
	args := m.Called(ctx, ownerID, roomID)
	return args.Get(0).(usecase.SantaRoomDetails), args.Error(1)
}
func (m *MockSantaUC) UpdateRoom(ctx context.Context, ownerID, roomID uuid.UUID, in usecase.SantaRoomInput) (entity.SantaRoom, error) {
	args := m.Called(ctx, ownerID, roomID, in)
	return args.Get(0).(entity.SantaRoom), args.Error(1)
}
func (m *MockSantaUC) DeleteRoom(ctx context.Context, ownerID, roomID uuid.UUID) error {
	return m.Called(ctx, ownerID, roomID).Error(0)
}
func (m *MockSantaUC) RemoveParticipant(ctx context.Context, ownerID, roomID, participantID uuid.UUID) error {
	return m.Called(ctx, ownerID, roomID, participantID).Error(0)
}
func (m *MockSantaUC) GetInvite(ctx context.Context, slug string) (usecase.SantaInvite, error) {
	args := m.Called(ctx, slug)
	return args.Get(0).(usecase.SantaInvite), args.Error(1)
}
func (m *MockSantaUC) Join(ctx context.Context, slug string, userID *uuid.UUID, in usecase.SantaProfileInput) (usecase.SantaJoinResult, error) {
	args := m.Called(ctx, slug, userID, in)
	return args.Get(0).(usecase.SantaJoinResult), args.Error(1)
}
func (m *MockSantaUC) GetMe(ctx context.Context, slug string, auth usecase.SantaAuth) (usecase.SantaMe, error) {
	args := m.Called(ctx, slug, auth)
	return args.Get(0).(usecase.SantaMe), args.Error(1)
}
func (m *MockSantaUC) UpdateMe(ctx context.Context, slug string, auth usecase.SantaAuth, in usecase.SantaProfileInput) (usecase.SantaMe, error) {
	args := m.Called(ctx, slug, auth, in)
	return args.Get(0).(usecase.SantaMe), args.Error(1)
}
func (m *MockSantaUC) LeaveMe(ctx context.Context, slug string, auth usecase.SantaAuth) error {
	return m.Called(ctx, slug, auth).Error(0)
}
func (m *MockSantaUC) Draw(ctx context.Context, ownerID, roomID uuid.UUID) error {
	return m.Called(ctx, ownerID, roomID).Error(0)
}
func (m *MockSantaUC) Redraw(ctx context.Context, ownerID, roomID uuid.UUID) error {
	return m.Called(ctx, ownerID, roomID).Error(0)
}

func newSantaApp(m *MockSantaUC) *fiber.App {
	app := fiber.New()
	v1.NewSantaRouter(app, testSecret, m)
	return app
}

func doReq(t *testing.T, app *fiber.App, req *http.Request) (int, string) {
	t.Helper()
	resp, err := app.Test(req)
	require.NoError(t, err)
	body, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(body)
}

func TestSantaInvite_NotFound(t *testing.T) {
	m := &MockSantaUC{}
	m.On("GetInvite", mock.Anything, "nope").Return(usecase.SantaInvite{}, usecase.ErrSantaNotFound)

	status, _ := doReq(t, newSantaApp(m), httptest.NewRequest(http.MethodGet, "/api/v1/santa/r/nope", nil))

	assert.Equal(t, http.StatusNotFound, status)
}

func TestSantaRooms_RequireLogin(t *testing.T) {
	m := &MockSantaUC{}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/rooms", strings.NewReader(`{"title":"Офис"}`))
	req.Header.Set("Content-Type", "application/json")

	status, _ := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusUnauthorized, status)
	m.AssertNotCalled(t, "CreateRoom", mock.Anything, mock.Anything, mock.Anything)
}

func TestSantaCreateRoom_ParsesDates(t *testing.T) {
	m := &MockSantaUC{}
	user := uuid.New()
	m.On("CreateRoom", mock.Anything, user, mock.MatchedBy(func(in usecase.SantaRoomInput) bool {
		return in.Title == "Офис" && in.ExchangeDate != nil && in.ExchangeDate.Format("2006-01-02") == "2026-12-27" &&
			in.Budget != nil && *in.Budget == 3000 && in.OrganizerJoins
	})).Return(entity.SantaRoom{ID: uuid.New(), Title: "Офис"}, nil)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/rooms",
		strings.NewReader(`{"title":"Офис","budget":3000,"exchangeDate":"2026-12-27","organizerJoins":true,"organizerName":"Никита"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeTestToken(user))

	status, _ := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusCreated, status)
	m.AssertExpectations(t)
}

func TestSantaCreateRoom_BadDateIs400(t *testing.T) {
	m := &MockSantaUC{}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/rooms", strings.NewReader(`{"title":"Офис","exchangeDate":"27.12.2026"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeTestToken(uuid.New()))

	status, _ := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusBadRequest, status)
}

func TestSantaDraw_TooFewIs422(t *testing.T) {
	m := &MockSantaUC{}
	user, room := uuid.New(), uuid.New()
	m.On("Draw", mock.Anything, user, room).Return(usecase.ErrSantaTooFew)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/rooms/"+room.String()+"/draw", nil)
	req.Header.Set("Authorization", "Bearer "+makeTestToken(user))

	status, body := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusUnprocessableEntity, status)
	assert.Contains(t, body, "минимум 3")
}

func TestSantaDraw_RepeatIs409(t *testing.T) {
	m := &MockSantaUC{}
	user, room := uuid.New(), uuid.New()
	m.On("Draw", mock.Anything, user, room).Return(usecase.ErrSantaDrawn)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/rooms/"+room.String()+"/draw", nil)
	req.Header.Set("Authorization", "Bearer "+makeTestToken(user))

	status, _ := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusConflict, status)
}

func TestSantaMe_PassesTokenHeader(t *testing.T) {
	m := &MockSantaUC{}
	m.On("GetMe", mock.Anything, "AbCd2345", usecase.SantaAuth{Token: "tok"}).
		Return(usecase.SantaMe{Name: "Маша"}, nil)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/santa/r/AbCd2345/me", nil)
	req.Header.Set(v1.SantaTokenHeader, "tok")

	status, body := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusOK, status)
	assert.Contains(t, body, `"name":"Маша"`)
}

func TestSantaJoin_LoggedInUserIsPassed(t *testing.T) {
	m := &MockSantaUC{}
	user := uuid.New()
	m.On("Join", mock.Anything, "AbCd2345", mock.MatchedBy(func(id *uuid.UUID) bool { return id != nil && *id == user }),
		usecase.SantaProfileInput{Name: "Маша", Wishes: "чай", WishlistURL: ""}).
		Return(usecase.SantaJoinResult{Token: "tok"}, nil)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/santa/r/AbCd2345/join", strings.NewReader(`{"name":"Маша","wishes":"чай"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeTestToken(user))

	status, body := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusCreated, status)
	assert.Contains(t, body, `"token":"tok"`)
}

// Публичные маршруты Санты зарегистрированы до основного роутера, иначе его
// защищённая группа с префиксом "" требовала бы вход и на них.
func TestSantaRoutes_PublicBeforeProtectedGroup(t *testing.T) {
	m := &MockSantaUC{}
	m.On("GetInvite", mock.Anything, "AbCd2345").Return(usecase.SantaInvite{Title: "Офис"}, nil)
	app := fiber.New()
	v1.NewSantaRouter(app, testSecret, m)
	v1.NewRouter(app, testSecret, "", false, &MockUserUC{}, &MockWishlistUC{}, &MockPresentUC{}, &MockUploadUC{}, &MockGuestDataUC{}, &MockTemplateUC{})

	status, _ := doReq(t, app, httptest.NewRequest(http.MethodGet, "/api/v1/santa/r/AbCd2345", nil))

	assert.Equal(t, http.StatusOK, status)
}
```

- [ ] **Step 2: Не собирается**

Run: `go test ./internal/controller/restapi/v1/ -run Santa -v`
Expected: FAIL — `undefined: v1.NewSantaRouter`.

- [ ] **Step 3: Обработчики**

`BACK/internal/controller/restapi/v1/santa.go`:

```go
package v1

import (
	"errors"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"main/internal/controller/restapi/middleware"
	"main/internal/controller/restapi/v1/response"
	"main/internal/usecase"
)

// SantaTokenHeader — секрет участника без аккаунта. Фронт хранит его в
// localStorage и шлёт с каждым запросом к своей комнате.
const SantaTokenHeader = "X-Santa-Token"

type santaHandler struct {
	uc usecase.SantaUseCase
}

// NewSantaRouter вешает маршруты Тайного Санты. Вызывать ДО NewRouter: там
// защищённая группа с префиксом "" навешивает JWT на весь /api/v1, и
// публичные маршруты, зарегистрированные после неё, требовали бы вход.
func NewSantaRouter(router fiber.Router, jwtSecret string, uc usecase.SantaUseCase) {
	h := &santaHandler{uc: uc}
	api := router.Group("/api/v1/santa")
	optional := middleware.JWTOptional(jwtSecret)

	api.Get("/r/:slug", h.invite)
	api.Post("/r/:slug/join", optional, h.join)
	api.Get("/r/:slug/me", optional, h.me)
	api.Patch("/r/:slug/me", optional, h.updateMe)
	api.Delete("/r/:slug/me", optional, h.leave)

	rooms := api.Group("/rooms", middleware.JWTProtected(jwtSecret))
	rooms.Get("", h.listRooms)
	rooms.Post("", h.createRoom)
	rooms.Get("/:id", h.getRoom)
	rooms.Patch("/:id", h.updateRoom)
	rooms.Delete("/:id", h.deleteRoom)
	rooms.Delete("/:id/participants/:pid", h.removeParticipant)
	rooms.Post("/:id/draw", h.draw)
	rooms.Post("/:id/redraw", h.redraw)
}

func santaError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, usecase.ErrSantaNotFound):
		return c.Status(fiber.StatusNotFound).JSON(response.Error(err.Error()))
	case errors.Is(err, usecase.ErrSantaDrawn), errors.Is(err, usecase.ErrSantaNotDrawn), errors.Is(err, usecase.ErrSantaAlreadyJoined):
		return c.Status(fiber.StatusConflict).JSON(response.Error(err.Error()))
	case errors.Is(err, usecase.ErrSantaTooFew), errors.Is(err, usecase.ErrSantaInvalid):
		return c.Status(fiber.StatusUnprocessableEntity).JSON(response.Error(err.Error()))
	}
	log.Printf("santa: %v", err)
	return c.Status(fiber.StatusInternalServerError).JSON(response.Error("внутренняя ошибка"))
}

type santaRoomBody struct {
	Title           string `json:"title"`
	Budget          *int   `json:"budget"`
	ExchangeDate    string `json:"exchangeDate"`
	DrawAt          string `json:"drawAt"`
	Message         string `json:"message"`
	OrganizerJoins  bool   `json:"organizerJoins"`
	OrganizerName   string `json:"organizerName"`
	OrganizerWishes string `json:"organizerWishes"`
}

func (b santaRoomBody) input() (usecase.SantaRoomInput, error) {
	in := usecase.SantaRoomInput{
		Title: b.Title, Budget: b.Budget, Message: b.Message, OrganizerJoins: b.OrganizerJoins,
		OrganizerName: b.OrganizerName, OrganizerWishes: b.OrganizerWishes,
	}
	if b.ExchangeDate != "" {
		d, err := time.Parse(time.DateOnly, b.ExchangeDate)
		if err != nil {
			return in, errors.New("exchangeDate: нужен формат ГГГГ-ММ-ДД")
		}
		in.ExchangeDate = &d
	}
	if b.DrawAt != "" {
		t, err := time.Parse(time.RFC3339, b.DrawAt)
		if err != nil {
			return in, errors.New("drawAt: нужен формат RFC 3339")
		}
		in.DrawAt = &t
	}
	return in, nil
}

type santaProfileBody struct {
	Name        string `json:"name"`
	Wishes      string `json:"wishes"`
	WishlistURL string `json:"wishlistUrl"`
}

func (b santaProfileBody) input() usecase.SantaProfileInput {
	return usecase.SantaProfileInput{Name: b.Name, Wishes: b.Wishes, WishlistURL: b.WishlistURL}
}

func santaAuth(c *fiber.Ctx) usecase.SantaAuth {
	return usecase.SantaAuth{Token: c.Get(SantaTokenHeader), UserID: getOptionalUserID(c)}
}

// ownerParams — пользователь из JWT и комната из пути. ok=false — ответ уже отправлен.
func ownerParams(c *fiber.Ctx) (userID, roomID uuid.UUID, ok bool, err error) {
	userID, err = getUserID(c)
	if err != nil {
		return uuid.Nil, uuid.Nil, false, c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	roomID, err = uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, uuid.Nil, false, santaError(c, usecase.ErrSantaNotFound)
	}
	return userID, roomID, true, nil
}

func (h *santaHandler) createRoom(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	var body santaRoomBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	in, err := body.input()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	room, err := h.uc.CreateRoom(c.Context(), userID, in)
	if err != nil {
		return santaError(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(response.Data(room))
}

func (h *santaHandler) listRooms(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	rooms, err := h.uc.ListRooms(c.Context(), userID)
	if err != nil {
		return santaError(c, err)
	}
	if rooms == nil {
		rooms = []usecase.SantaRoomSummary{}
	}
	return c.JSON(response.Data(rooms))
}

func (h *santaHandler) getRoom(c *fiber.Ctx) error {
	userID, roomID, ok, err := ownerParams(c)
	if !ok {
		return err
	}
	details, err := h.uc.GetRoom(c.Context(), userID, roomID)
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(details))
}

func (h *santaHandler) updateRoom(c *fiber.Ctx) error {
	userID, roomID, ok, err := ownerParams(c)
	if !ok {
		return err
	}
	var body santaRoomBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	in, err := body.input()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	room, err := h.uc.UpdateRoom(c.Context(), userID, roomID, in)
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(room))
}

func (h *santaHandler) deleteRoom(c *fiber.Ctx) error {
	userID, roomID, ok, err := ownerParams(c)
	if !ok {
		return err
	}
	if err := h.uc.DeleteRoom(c.Context(), userID, roomID); err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(true))
}

func (h *santaHandler) removeParticipant(c *fiber.Ctx) error {
	userID, roomID, ok, err := ownerParams(c)
	if !ok {
		return err
	}
	pid, err := uuid.Parse(c.Params("pid"))
	if err != nil {
		return santaError(c, usecase.ErrSantaNotFound)
	}
	if err := h.uc.RemoveParticipant(c.Context(), userID, roomID, pid); err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(true))
}

func (h *santaHandler) draw(c *fiber.Ctx) error {
	userID, roomID, ok, err := ownerParams(c)
	if !ok {
		return err
	}
	if err := h.uc.Draw(c.Context(), userID, roomID); err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(true))
}

func (h *santaHandler) redraw(c *fiber.Ctx) error {
	userID, roomID, ok, err := ownerParams(c)
	if !ok {
		return err
	}
	if err := h.uc.Redraw(c.Context(), userID, roomID); err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(true))
}

func (h *santaHandler) invite(c *fiber.Ctx) error {
	inv, err := h.uc.GetInvite(c.Context(), c.Params("slug"))
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(inv))
}

func (h *santaHandler) join(c *fiber.Ctx) error {
	var body santaProfileBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	res, err := h.uc.Join(c.Context(), c.Params("slug"), getOptionalUserID(c), body.input())
	if err != nil {
		return santaError(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(response.Data(res))
}

func (h *santaHandler) me(c *fiber.Ctx) error {
	me, err := h.uc.GetMe(c.Context(), c.Params("slug"), santaAuth(c))
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(me))
}

func (h *santaHandler) updateMe(c *fiber.Ctx) error {
	var body santaProfileBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	me, err := h.uc.UpdateMe(c.Context(), c.Params("slug"), santaAuth(c), body.input())
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(me))
}

func (h *santaHandler) leave(c *fiber.Ctx) error {
	if err := h.uc.LeaveMe(c.Context(), c.Params("slug"), santaAuth(c)); err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(true))
}
```

- [ ] **Step 4: Тесты обработчиков проходят**

Run: `go test ./internal/controller/restapi/v1/ -v`
Expected: PASS — новые тесты Санты и все старые.

- [ ] **Step 5: Подключить к приложению**

`BACK/internal/controller/restapi/router.go`:
- в параметры `NewRouter` после `templateUC usecase.TemplateUseCase,` добавить `santaUC usecase.SantaUseCase,`;
- в `AllowHeaders` дописать `, X-Santa-Token` (итог: `"Origin, Content-Type, Accept, Authorization, X-Custom-Header, If-Match, X-Santa-Token"`) и над строкой комментарий `// X-Santa-Token — секрет участника Тайного Санты без аккаунта.`;
- перед строкой `v1.NewRouter(app, ...)` вставить:

```go
	// До основного роутера: см. комментарий у NewSantaRouter.
	v1.NewSantaRouter(app, cfg.Auth.JWTSecret, santaUC)
```

`BACK/internal/app/app.go`:
- импорт `santaUC "main/internal/usecase/santa"`;
- в `db.AutoMigrate(` после `&persistent.TemplateLikeModel{},` добавить
  `&persistent.SantaRoomModel{}, &persistent.SantaParticipantModel{}, &persistent.SantaAssignmentModel{},`;
- после `templateRepo := …` — `santaRepo := persistent.NewSantaRepo(db)`;
- после `templateUseCase := …` — `santaUseCase := santaUC.New(santaRepo, userRepo)`;
- вызов: `restapi.NewRouter(app, cfg, userUseCase, wishlistUseCase, presentUseCase, uploadUseCase, guestDataUseCase, templateUseCase, santaUseCase)`.

`BACK/.env.example`: строку `CORS_ORIGIN=https://prosto-namekni.ru` заменить на
`CORS_ORIGIN=https://prosto-namekni.ru,https://santa.prosto-namekni.ru`.

- [ ] **Step 6: Полная проверка бэка**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: всё PASS. Затем `make infra && make run` и вручную:
`curl -i http://localhost:8080/api/v1/santa/r/nope` → `404` с `{"error":"комната не найдена"}`.

- [ ] **Step 7: Commit**

```bash
git add internal/controller/restapi/v1/santa.go internal/controller/restapi/v1/santa_test.go internal/controller/restapi/router.go internal/app/app.go .env.example
git commit -m "feat(backend): API Тайного Санты"
```

---

## Фронтенд

### Task 8: Поддомен и возврат после входа

**Files:**
- Create: `FRONT/shared/santa-route.ts`
- Create: `FRONT/shared/auth-next.ts`
- Create: `FRONT/components/Auth/remember-next.tsx`
- Test: `FRONT/tests/santa-route.test.cjs`
- Modify: `FRONT/middleware.ts`, `FRONT/components/auth-form.tsx`, `FRONT/app/oauth/page.tsx`, `FRONT/app/login/page.tsx`, `FRONT/.env`

**Interfaces:**
- Produces: `SANTA_BASE`, `SANTA_ORIGIN`, `MAIN_ORIGIN`,
  `santaHref(path: string, base?: string): string`,
  `resolveSantaRoute(host: string, pathname: string, santaOrigin: string): SantaRoute`,
  `needsLogin(pathname: string): boolean`,
  `safeNext(raw: string | null | undefined, allowedOrigins: string[]): string | null`,
  `loginUrl(returnTo: string, mainOrigin?: string): string`;
  `rememberNext(raw: string | null): void`, `takeNext(fallback?: string): string`;
  компонент `RememberNext`.

- [ ] **Step 1: Падающий тест**

`FRONT/tests/santa-route.test.cjs`:

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const { santaHref, resolveSantaRoute, needsLogin, safeNext, loginUrl } = load('shared/santa-route.ts')

const ORIGIN = 'https://santa.prosto-namekni.ru'

test('ссылка внутри Санты: на поддомене без префикса, в разработке с /santa', () => {
  assert.equal(santaHref('/', ''), '/')
  assert.equal(santaHref('/rooms', ''), '/rooms')
  assert.equal(santaHref('/', '/santa'), '/santa')
  assert.equal(santaHref('/r/AbCd2345', '/santa'), '/santa/r/AbCd2345')
})

test('поддомен переписывается на /santa', () => {
  assert.deepEqual(resolveSantaRoute('santa.prosto-namekni.ru', '/', ORIGIN), { type: 'rewrite', pathname: '/santa' })
  assert.deepEqual(resolveSantaRoute('santa.prosto-namekni.ru', '/rooms/1', ORIGIN), { type: 'rewrite', pathname: '/santa/rooms/1' })
})

test('префикс на поддомене не удваивается', () => {
  assert.deepEqual(resolveSantaRoute('santa.prosto-namekni.ru', '/santa/rooms', ORIGIN), { type: 'redirect', url: `${ORIGIN}/rooms` })
})

test('/santa на основном домене уводит на поддомен, если он настроен', () => {
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/santa', ORIGIN), { type: 'redirect', url: `${ORIGIN}/` })
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/santa/r/x', ORIGIN), { type: 'redirect', url: `${ORIGIN}/r/x` })
  assert.deepEqual(resolveSantaRoute('localhost:3000', '/santa/rooms', ''), { type: 'next' })
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/santaclaus', ORIGIN), { type: 'next' })
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/wishlist', ORIGIN), { type: 'next' })
})

test('вход нужен кабинету вишлистов и комнатам организатора', () => {
  assert.equal(needsLogin('/wishlist'), true)
  assert.equal(needsLogin('/wishlist/1'), true)
  assert.equal(needsLogin('/santa/rooms'), true)
  assert.equal(needsLogin('/santa/rooms/new'), true)
  assert.equal(needsLogin('/santa'), false)
  assert.equal(needsLogin('/santa/r/AbCd2345'), false)
})

test('после входа ведём только к себе', () => {
  const allowed = ['https://prosto-namekni.ru', ORIGIN]
  assert.equal(safeNext('/wishlist', allowed), '/wishlist')
  assert.equal(safeNext(`${ORIGIN}/rooms/new`, allowed), `${ORIGIN}/rooms/new`)
  assert.equal(safeNext('//evil.com', allowed), null)
  assert.equal(safeNext('/\\evil.com', allowed), null)
  assert.equal(safeNext('https://evil.com/x', allowed), null)
  assert.equal(safeNext('javascript:alert(1)', allowed), null)
  assert.equal(safeNext('', allowed), null)
  assert.equal(safeNext(null, allowed), null)
})

test('ссылка на вход несёт адрес возврата', () => {
  assert.equal(
    loginUrl(`${ORIGIN}/rooms?a=1`, 'https://prosto-namekni.ru'),
    'https://prosto-namekni.ru/login?next=https%3A%2F%2Fsanta.prosto-namekni.ru%2Frooms%3Fa%3D1',
  )
})
```

- [ ] **Step 2: Тест падает**

Run: `node --test tests/santa-route.test.cjs`
Expected: FAIL — `santaHref is not a function`.

- [ ] **Step 3: Реализация**

`FRONT/shared/santa-route.ts`:

```ts
/**
 * Где живёт Тайный Санта. На проде — поддомен santa.prosto-namekni.ru и пути
 * без префикса (NEXT_PUBLIC_SANTA_BASE=''). В разработке — /santa на основном
 * адресе: кука входа с localhost не доходит до santa.localhost.
 */
export const SANTA_BASE = process.env.NEXT_PUBLIC_SANTA_BASE ?? '/santa'
export const SANTA_ORIGIN = process.env.NEXT_PUBLIC_SANTA_ORIGIN ?? ''
export const MAIN_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prosto-namekni.ru'

/** Путь страницы Санты с учётом того, где он живёт. */
export function santaHref(path: string, base: string = SANTA_BASE): string {
  if (!base) return path
  return path === '/' ? base : `${base}${path}`
}

export type SantaRoute =
  | { type: 'next' }
  | { type: 'rewrite'; pathname: string }
  | { type: 'redirect'; url: string }

const PREFIX = '/santa'

function isSantaPath(pathname: string): boolean {
  return pathname === PREFIX || pathname.startsWith(`${PREFIX}/`)
}

/** Что сделать с запросом: переписать поддомен на /santa, увести на поддомен или пропустить. */
export function resolveSantaRoute(host: string, pathname: string, santaOrigin: string): SantaRoute {
  if (host.startsWith('santa.')) {
    // Старая ссылка с префиксом на поддомене — убрать префикс, а не удвоить.
    if (isSantaPath(pathname)) return { type: 'redirect', url: `${santaOrigin}${pathname.slice(PREFIX.length) || '/'}` }
    return { type: 'rewrite', pathname: pathname === '/' ? PREFIX : `${PREFIX}${pathname}` }
  }
  if (santaOrigin && isSantaPath(pathname)) {
    return { type: 'redirect', url: `${santaOrigin}${pathname.slice(PREFIX.length) || '/'}` }
  }
  return { type: 'next' }
}

export function needsLogin(pathname: string): boolean {
  return pathname.startsWith('/wishlist') || pathname === '/santa/rooms' || pathname.startsWith('/santa/rooms/')
}

/** Адрес возврата после входа — только свой: иначе ссылка на вход стала бы открытым редиректом. */
export function safeNext(raw: string | null | undefined, allowedOrigins: string[]): string | null {
  if (!raw) return null
  // «//evil.com» и «/\evil.com» браузер читает как адрес другого сайта.
  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) return raw
  try {
    const url = new URL(raw)
    return allowedOrigins.includes(url.origin) ? url.toString() : null
  } catch {
    return null
  }
}

export function loginUrl(returnTo: string, mainOrigin: string = MAIN_ORIGIN): string {
  return `${mainOrigin}/login?next=${encodeURIComponent(returnTo)}`
}
```

`FRONT/shared/auth-next.ts`:

```ts
import { MAIN_ORIGIN, SANTA_ORIGIN, safeNext } from './santa-route'

const KEY = 'auth:next'

function allowed(): string[] {
  return [MAIN_ORIGIN, SANTA_ORIGIN].filter(Boolean)
}

/**
 * Запомнить ?next= со страницы входа. Вход через Telegram уходит на /oauth
 * и параметр теряет — поэтому sessionStorage, а не только адресная строка.
 */
export function rememberNext(raw: string | null): void {
  const next = safeNext(raw, allowed())
  try {
    if (next) sessionStorage.setItem(KEY, next)
    else sessionStorage.removeItem(KEY)
  } catch {
    // Приватный режим без хранилища: вернём в кабинет.
  }
}

/** Куда вести после входа; запомненное стирается. */
export function takeNext(fallback = '/wishlist'): string {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {
    raw = null
  }
  return safeNext(raw, allowed()) ?? fallback
}
```

`FRONT/components/Auth/remember-next.tsx`:

```tsx
'use client'

import { rememberNext } from '@/shared/auth-next'
import { useEffect } from 'react'

/** Ставится на страницу входа: запоминает, куда вернуть человека. */
export function RememberNext() {
  useEffect(() => {
    rememberNext(new URLSearchParams(window.location.search).get('next'))
  }, [])
  return null
}
```

- [ ] **Step 4: Тест проходит**

Run: `node --test tests/santa-route.test.cjs`
Expected: PASS, 7 тестов.

- [ ] **Step 5: Middleware, вход и окружение**

`FRONT/middleware.ts` — заменить целиком:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { loginUrl, needsLogin, resolveSantaRoute } from '@/shared/santa-route'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname, search } = request.nextUrl
  const route = resolveSantaRoute(host, pathname, process.env.NEXT_PUBLIC_SANTA_ORIGIN ?? '')

  if (route.type === 'redirect') return NextResponse.redirect(`${route.url}${search}`, 308)

  const effective = route.type === 'rewrite' ? route.pathname : pathname
  if (needsLogin(effective) && !request.cookies.get('token')?.value) {
    // Возвращаем на адрес, который видел человек, а не на внутренний /santa/…
    const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
    return NextResponse.redirect(loginUrl(`${proto}://${host}${pathname}${search}`))
  }

  if (route.type === 'rewrite') {
    const url = request.nextUrl.clone()
    url.pathname = route.pathname
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  // Всё, кроме статики Next и файлов с расширением: поддомен переписывается целиком.
  matcher: ['/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)'],
}
```

`FRONT/components/auth-form.tsx`: импорт `import { takeNext } from '@/shared/auth-next'`; обе строки `window.location.replace('/wishlist')` → `window.location.replace(takeNext())`.

`FRONT/app/oauth/page.tsx`: импорт `import { takeNext } from '@/shared/auth-next'`; строку 31 `onSuccess: () => window.location.replace('/wishlist'),` → `onSuccess: () => window.location.replace(takeNext()),`.

`FRONT/app/login/page.tsx`: импорт `import { RememberNext } from '@/components/Auth/remember-next'` и первым ребёнком внешнего `<div>` — `<RememberNext />`.

`FRONT/.env` — дописать:

```
# Санта в разработке живёт на /santa; на проде — NEXT_PUBLIC_SANTA_BASE= (пусто)
# и NEXT_PUBLIC_SANTA_ORIGIN=https://santa.prosto-namekni.ru
NEXT_PUBLIC_SANTA_BASE=/santa
NEXT_PUBLIC_SANTA_ORIGIN=
```

- [ ] **Step 6: Проверка**

Run: `pnpm test && pnpm lint`
Expected: все тесты PASS, линтер без ошибок. Вручную: `pnpm dev`, выйти из аккаунта,
открыть `http://localhost:3000/santa/rooms` → редирект на
`/login?next=http%3A%2F%2Flocalhost%3A3000%2Fsanta%2Frooms`; после входа
логином — возврат на `/santa/rooms` (пока 404 — страницы появятся в задаче 12).

- [ ] **Step 7: Commit**

```bash
git add shared/santa-route.ts shared/auth-next.ts components/Auth/remember-next.tsx tests/santa-route.test.cjs middleware.ts components/auth-form.tsx app/oauth/page.tsx app/login/page.tsx .env
git commit -m "feat(front): поддомен Тайного Санты и возврат после входа"
```

---

### Task 9: Праздничная схема и каркас раздела

**Files:**
- Modify: `FRONT/app/globals.css`, `FRONT/tailwind.config.ts`, `FRONT/components/ui/button.tsx`, `FRONT/docs/design-system.md`, `FRONT/next-sitemap.config.js`
- Create: `FRONT/app/santa/layout.tsx`, `FRONT/app/santa/components/santa-header.tsx`, `FRONT/app/santa/page.tsx`

**Interfaces:**
- Consumes: `santaHref`, `loginUrl`, `MAIN_ORIGIN` (Task 8); `useApiGetMyProfile` (`api/user`).
- Produces: CSS-класс схемы `.santa`, утилита `.santa-snow`, цвет `tone-gold`
  (`text-tone-gold`, `bg-tone-gold/15`), фон `bg-festive`, `Button variant="festive"`,
  `SantaHeader`.

- [ ] **Step 1: Переменные схемы**

`FRONT/app/globals.css`:
1. В блок `:root, .powder, .linen, .pastel { … }` добавить строку `--tone-gold: 38 92% 34%;` после `--tone-pink`.
2. Селектор тёмного блока `.dark, .space, .midnight, .graphite, .lavender, .malachite, .lagoon` дополнить `, .santa`, а в сам блок добавить `--tone-gold: 43 96% 64%;` после `--tone-pink`.
3. Сразу после закрывающей скобки блока `.space { … }` вставить:

```css
/*
 * Тайный Санта — ночь «Космоса» с клюквой и золотом. Это не схема вишлиста:
 * её нет в выборе, ею красится только раздел santa. Кнопка «Создать» —
 * bg-festive, а primary здесь светлая клюква: она же цвет ссылок и
 * выделения, поэтому должна читаться на тёмном фоне.
 */
.santa {
  --background: 222 55% 10%;
  --foreground: 220 33% 95%;
  --card: 222 48% 13%;
  --card-foreground: 220 33% 95%;
  --popover: 222 48% 13%;
  --popover-foreground: 220 33% 95%;
  --primary: 350 85% 74%;
  --primary-foreground: 222 55% 10%;
  --secondary: 222 38% 19%;
  --secondary-foreground: 220 33% 95%;
  --muted: 222 38% 19%;
  --muted-foreground: 220 14% 62%;
  --accent: 345 45% 26%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 63% 42%;
  --destructive-foreground: 220 33% 95%;
  --border: 222 38% 19%;
  --input: 222 38% 19%;
  --ring: 350 85% 74%;
  --radius: 0.875rem;
}

/* Снег: две сетки точек со сдвигом — не выглядит узором. */
.santa-snow {
  background-image:
    radial-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1.6px),
    radial-gradient(rgb(255 255 255 / 0.2) 1px, transparent 1.6px);
  background-size: 140px 140px, 70px 70px;
  background-position: 0 0, 35px 45px;
}
```

- [ ] **Step 2: Токены Tailwind и кнопка**

`FRONT/tailwind.config.ts`:
- в `tone: { … }` добавить `gold: 'hsl(var(--tone-gold) / <alpha-value>)',`;
- в `backgroundImage` после `'brand': …` добавить:

```ts
        // Главная кнопка Тайного Санты: клюква → ягода. Белый текст читается
        // на обоих концах (контраст ≥ 4.5).
        'festive': 'linear-gradient(90deg, #C92A47, #9E2F68)',
```

`FRONT/components/ui/button.tsx` — в `variant` после `brand: …`:

```ts
        // Главное действие Тайного Санты.
        festive:
          "bg-festive text-white font-bold hover:opacity-90",
```

`FRONT/docs/design-system.md`:
- в разделе «Цвета» после упоминания `bg-brand` дописать: «`bg-festive` (градиент главной кнопки Тайного Санты)»;
- в «Лендинг и иллюстрации» в список тонов добавить `tone-gold`;
- в «Компоненты», у `Button` в списке `variant` добавить `festive` (градиент Санты);
- новым абзацем в «Цвета»: «Раздел Тайного Санты красится схемой `.santa` (вместе с `.dark`), фон-снег — `santa-snow`».

`FRONT/next-sitemap.config.js`: в `exclude` добавить `'/santa', '/santa/*'`
(у поддомена будет своя карта на этапе 4), в `disallow` — `'/santa/'`.

- [ ] **Step 3: Каркас раздела**

`FRONT/app/santa/components/santa-header.tsx`:

```tsx
'use client'

import { useApiGetMyProfile } from '@/api/user'
import { Button } from '@/components/ui/button'
import { MAIN_ORIGIN, loginUrl, santaHref } from '@/shared/santa-route'
import { Star } from 'lucide-react'
import Link from 'next/link'

export function SantaHeader() {
  const { data } = useApiGetMyProfile()
  const signedIn = Boolean(data?.user)

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 md:px-16">
        <Link href={santaHref('/')} className="flex items-center gap-2.5 text-foreground">
          <Star className="size-6 text-tone-gold" fill="currentColor" aria-hidden />
          <span className="flex flex-col">
            <span className="text-micro text-muted-foreground">просто намекни</span>
            <span className="text-title-xs">тайный санта</span>
          </span>
        </Link>
        <nav className="flex gap-6 text-body-sm font-semibold text-muted-foreground">
          <Link href={santaHref('/rooms')} className="hover:text-foreground">Мои комнаты</Link>
          <a href={`${MAIN_ORIGIN}/wishlist`} className="hover:text-foreground">Вишлисты</a>
        </nav>
        <div className="ml-auto">
          {signedIn ? (
            <Button asChild variant="festive">
              <Link href={santaHref('/rooms/new')}>Создать комнату</Link>
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => window.location.assign(loginUrl(window.location.href))}>
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
```

`FRONT/app/santa/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import type * as React from 'react'
import { SantaHeader } from './components/santa-header'

export const metadata: Metadata = {
  title: {
    default: 'Тайный Санта онлайн — жеребьёвка без бумажек',
    template: '%s | Тайный Санта',
  },
  description: 'Соберите друзей или коллег в комнату: каждый напишет пожелания, а мы тайно распределим, кто кому дарит.',
}

export default function SantaLayout({ children }: { children: React.ReactNode }) {
  // Санта всегда ночной, какой бы ни была тема сайта: «dark» включает
  // dark:-варианты компонентов, «santa» задаёт цвета.
  return (
    <div className="dark santa min-h-svh bg-background text-foreground">
      <SantaHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-16">{children}</main>
    </div>
  )
}
```

`FRONT/app/santa/page.tsx` (упрощённый лендинг этапа 1):

```tsx
import { Button } from '@/components/ui/button'
import { santaHref } from '@/shared/santa-route'
import { Gift } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { n: '01', tone: 'text-tone-pink', title: 'Создайте комнату', text: 'Название, бюджет и дата обмена — пара минут.' },
  { n: '02', tone: 'text-tone-gold', title: 'Позовите своих', text: 'Отправьте ссылку. Каждый пишет имя и что хотел бы получить.' },
  { n: '03', tone: 'text-success', title: 'Жеребьёвка', text: 'Все встают в один круг: каждый дарит одному и получает от другого. Себя не вытянуть.' },
  { n: '04', tone: 'text-tone-cyan', title: 'Узнайте подопечного', text: 'Откройте конверт: имя, пожелания и вишлист того, кому вы дарите.' },
] as const

export default function SantaLanding() {
  return (
    <div className="space-y-20">
      <section className="santa-snow -mx-4 space-y-7 px-4 py-16 md:-mx-16 md:px-16 md:py-24">
        <p className="text-eyebrow uppercase text-tone-gold">Новый год · офис · семья · друзья</p>
        <h1 className="text-display-sm md:text-display">
          Тайный Санта
          <br />
          <span className="text-primary">без бумажек в шапке</span>
        </h1>
        <p className="max-w-xl text-body-lg text-muted-foreground">
          Соберите своих в комнату. Каждый напишет, что хочет получить, а мы тайно распределим,
          кто кому дарит.
        </p>
        <Button asChild variant="festive" size="xl">
          <Link href={santaHref('/rooms/new')}>
            <Gift aria-hidden />
            Создать комнату
          </Link>
        </Button>
      </section>

      <section className="space-y-8" aria-labelledby="how">
        <h2 id="how" className="text-title-lg md:text-display-md">Четыре шага до праздника</h2>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(step => (
            <li key={step.n} className="space-y-3 rounded-card border border-border bg-card p-7">
              <span className={`block text-display-sm ${step.tone}`}>{step.n}</span>
              <h3 className="text-title-sm">{step.title}</h3>
              <p className="text-body text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Проверка**

Run: `node tests/token-audit.cjs app/santa components/ui/button.tsx && pnpm test && pnpm lint`
Expected: аудит `всего 0`; тесты и линтер чистые (в т. ч. `tests/design-tokens.test.cjs`,
`tests/tailwind-tokens.test.cjs` — если какой-то из них сверяет список вариантов
кнопки или тонов с документацией, дописать `festive`/`tone-gold` туда, где он
перечисляет допустимые значения).
Вручную: `pnpm dev`, `http://localhost:3000/santa` — ночной фон, снег, клюквенная
кнопка; в светлой теме сайта раздел остаётся ночным.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tailwind.config.ts components/ui/button.tsx docs/design-system.md next-sitemap.config.js app/santa/
git commit -m "feat(front): праздничная схема и лендинг Тайного Санты"
```

---

### Task 10: Типы, хелперы и схемы форм

**Files:**
- Modify: `FRONT/shared/types.ts`
- Create: `FRONT/shared/santa.ts`, `FRONT/shared/santa-token.ts`
- Test: `FRONT/tests/santa.test.cjs`

**Interfaces:**
- Produces (types): `SantaRoomStatus`, `SantaRoom`, `SantaRoomSummary`,
  `SantaParticipantView`, `SantaRoomDetails`, `SantaInvite`, `SantaReceiver`,
  `SantaMe`, `SantaJoinResult`, `SantaRoomInput`, `SantaProfileInput`.
- Produces (`shared/santa.ts`): `formatBudget(budget: number | null): string`,
  `formatDay(value: string | null): string | null`,
  `participantsLabel(n: number): string`, `MIN_PARTICIPANTS = 3`,
  `roomSchema`, `type RoomFormValues`, `EMPTY_ROOM_FORM`,
  `toRoomInput(v: RoomFormValues): SantaRoomInput`,
  `roomToFormValues(room: SantaRoom): RoomFormValues`,
  `profileSchema`, `type ProfileValues`, `apiErrorMessage(err: unknown): string`.
- Produces (`shared/santa-token.ts`): `getSantaToken(slug)`, `setSantaToken(slug, token)`,
  `clearSantaToken(slug)`, `santaHeaders(slug): Record<string, string>`.

- [ ] **Step 1: Типы**

В конец `FRONT/shared/types.ts`:

```ts
// ── Тайный Санта ─────────────────────────────────────────────────────
// Даты приходят из Go как ISO-строки; exchangeDate — полночь UTC дня обмена.

export type SantaRoomStatus = 'open' | 'drawn'

export type SantaRoom = {
  id: string
  ownerId: string
  slug: string
  title: string
  /** Рубли; null — без лимита. */
  budget: number | null
  exchangeDate: string | null
  drawAt: string | null
  message: string
  status: SantaRoomStatus
  drawnAt: string | null
  createdAt: string
  updatedAt: string
}

export type SantaRoomSummary = SantaRoom & { isOwner: boolean; participantsCount: number }

/** Участник глазами организатора: без текста пожеланий и без пар. */
export type SantaParticipantView = {
  id: string
  name: string
  hasWishes: boolean
  hasWishlist: boolean
  isOwner: boolean
  createdAt: string
}

export type SantaRoomDetails = { room: SantaRoom; participants: SantaParticipantView[] }

export type SantaInvite = {
  slug: string
  title: string
  organizerName: string
  budget: number | null
  exchangeDate: string | null
  drawAt: string | null
  message: string
  participantsCount: number
  status: SantaRoomStatus
}

export type SantaReceiver = { name: string; wishes: string; wishlistUrl: string }

export type SantaMe = {
  participantId: string
  name: string
  wishes: string
  wishlistUrl: string
  room: SantaInvite
  /** Подопечный; null до жеребьёвки. */
  receiver: SantaReceiver | null
}

export type SantaJoinResult = { token: string; me: SantaMe }

export type SantaRoomInput = {
  title: string
  budget: number | null
  /** ГГГГ-ММ-ДД или null. */
  exchangeDate: string | null
  message: string
  organizerJoins: boolean
  organizerName: string
  organizerWishes: string
}

export type SantaProfileInput = { name: string; wishes: string; wishlistUrl: string }
```

- [ ] **Step 2: Падающий тест**

`FRONT/tests/santa.test.cjs`:

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const {
  formatBudget, formatDay, participantsLabel, toRoomInput, roomToFormValues,
  roomSchema, profileSchema, apiErrorMessage, EMPTY_ROOM_FORM,
} = load('shared/santa.ts')

test('бюджет: рубли с неразрывным пробелом или «без лимита»', () => {
  assert.equal(formatBudget(3000), 'до 3\u00A0000 ₽')
  assert.equal(formatBudget(500), 'до 500 ₽')
  assert.equal(formatBudget(null), 'без лимита')
})

test('день обмена читается из даты бэка без сдвига пояса', () => {
  assert.equal(formatDay('2026-12-27T00:00:00Z'), '27 декабря')
  assert.equal(formatDay('2026-01-01'), '1 января')
  assert.equal(formatDay(null), null)
  assert.equal(formatDay('мусор'), null)
})

test('участники склоняются', () => {
  assert.equal(participantsLabel(1), '1 участник')
  assert.equal(participantsLabel(3), '3 участника')
  assert.equal(participantsLabel(11), '11 участников')
})

test('форма комнаты → запрос', () => {
  assert.deepEqual(toRoomInput({
    ...EMPTY_ROOM_FORM, title: '  Офис ', budget: '3000', exchangeDate: '2026-12-27', organizerName: ' Никита ',
  }), {
    title: 'Офис', budget: 3000, exchangeDate: '2026-12-27', message: '',
    organizerJoins: true, organizerName: 'Никита', organizerWishes: '',
  })
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', budget: '' }).budget, null)
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', exchangeDate: '' }).exchangeDate, null)
})

test('комната → форма правки', () => {
  const values = roomToFormValues({
    id: '1', ownerId: '2', slug: 's', title: 'Офис', budget: null, exchangeDate: '2026-12-27T00:00:00Z',
    drawAt: null, message: 'Привет', status: 'open', drawnAt: null, createdAt: '', updatedAt: '',
  })
  assert.equal(values.budget, '')
  assert.equal(values.exchangeDate, '2026-12-27')
  assert.equal(values.organizerJoins, false)
})

test('организатору-участнику нужно имя', () => {
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerName: '' }).success, false)
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerJoins: false, organizerName: '' }).success, true)
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerName: 'Н', budget: '3 000' }).success, false)
})

test('ссылка на вишлист — только http(s)', () => {
  const base = { name: 'Маша', wishes: '' }
  assert.equal(profileSchema.safeParse({ ...base, wishlistUrl: '' }).success, true)
  assert.equal(profileSchema.safeParse({ ...base, wishlistUrl: 'https://prosto-namekni.ru/s/abc' }).success, true)
  assert.equal(profileSchema.safeParse({ ...base, wishlistUrl: 'javascript:alert(1)' }).success, false)
  assert.equal(profileSchema.safeParse({ ...base, name: '   ', wishlistUrl: '' }).success, false)
})

test('текст ошибки берётся из ответа API', () => {
  assert.equal(apiErrorMessage({ response: { data: { error: 'жеребьёвка уже прошла' } } }), 'жеребьёвка уже прошла')
  assert.equal(apiErrorMessage(new Error('x')), 'Что-то пошло не так. Попробуйте ещё раз.')
})
```

- [ ] **Step 3: Тест падает**

Run: `node --test tests/santa.test.cjs`
Expected: FAIL — `formatBudget is not a function`.

- [ ] **Step 4: Реализация**

`FRONT/shared/santa.ts`:

```ts
import { z } from 'zod'
import { pluralRu } from './event-date'
import type { SantaRoom, SantaRoomInput } from './types'

export const MIN_PARTICIPANTS = 3

/** «до 3 000 ₽» или «без лимита». */
export function formatBudget(budget: number | null): string {
  if (budget === null) return 'без лимита'
  return `до ${budget.toLocaleString('ru-RU')} ₽`
}

/**
 * «27 декабря». Берём только ГГГГ-ММ-ДД: полночь UTC в поясе минус часы
 * превратилась бы в 26-е.
 */
export function formatDay(value: string | null): string | null {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function participantsLabel(n: number): string {
  return `${n} ${pluralRu(n, ['участник', 'участника', 'участников'])}`
}

export const roomSchema = z.object({
  title: z.string().trim().min(1, 'Назовите комнату').max(80, 'До 80 символов'),
  // Пусто — без лимита.
  budget: z.string().trim().regex(/^\d{0,7}$/, 'Только цифры, без пробелов'),
  exchangeDate: z.string(),
  message: z.string().max(500, 'До 500 символов'),
  organizerJoins: z.boolean(),
  organizerName: z.string().trim().max(40, 'До 40 символов'),
  organizerWishes: z.string().max(1000, 'До 1000 символов'),
}).refine(v => !v.organizerJoins || v.organizerName.length > 0, {
  path: ['organizerName'],
  message: 'Как вас назвать в комнате?',
})

export type RoomFormValues = z.infer<typeof roomSchema>

export const EMPTY_ROOM_FORM: RoomFormValues = {
  title: '',
  budget: '3000',
  exchangeDate: '',
  message: '',
  organizerJoins: true,
  organizerName: '',
  organizerWishes: '',
}

export function toRoomInput(v: RoomFormValues): SantaRoomInput {
  return {
    title: v.title.trim(),
    budget: v.budget.trim() === '' ? null : Number(v.budget),
    exchangeDate: v.exchangeDate || null,
    message: v.message.trim(),
    organizerJoins: v.organizerJoins,
    organizerName: v.organizerName.trim(),
    organizerWishes: v.organizerWishes.trim(),
  }
}

/** Значения формы правки. Организатор в комнату тут не добавляется. */
export function roomToFormValues(room: SantaRoom): RoomFormValues {
  return {
    title: room.title,
    budget: room.budget === null ? '' : String(room.budget),
    exchangeDate: room.exchangeDate ? room.exchangeDate.slice(0, 10) : '',
    message: room.message,
    organizerJoins: false,
    organizerName: '',
    organizerWishes: '',
  }
}

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Как вас зовут?').max(40, 'До 40 символов'),
  wishes: z.string().max(1000, 'До 1000 символов'),
  wishlistUrl: z.string().trim().max(500, 'Слишком длинная ссылка').refine(
    v => v === '' || /^https?:\/\/[^\s/]+/i.test(v),
    'Ссылка должна начинаться с http:// или https://',
  ),
})

export type ProfileValues = z.infer<typeof profileSchema>

/** Текст ошибки для тоста: бэк кладёт его в { error }. */
export function apiErrorMessage(err: unknown): string {
  const message = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error
  return typeof message === 'string' && message ? message : 'Что-то пошло не так. Попробуйте ещё раз.'
}
```

`FRONT/shared/santa-token.ts`:

```ts
/**
 * Секрет участника без аккаунта — из ответа на вступление или из личной
 * ссылки ?t=. Живёт в localStorage этого браузера; на другом устройстве
 * человек входит по личной ссылке.
 */
const key = (slug: string) => `santa:${slug}`

export function getSantaToken(slug: string): string | null {
  try {
    return localStorage.getItem(key(slug))
  } catch {
    return null
  }
}

export function setSantaToken(slug: string, token: string): void {
  try {
    localStorage.setItem(key(slug), token)
  } catch {
    // Без хранилища участник останется в комнате до перезагрузки страницы.
  }
}

export function clearSantaToken(slug: string): void {
  try {
    localStorage.removeItem(key(slug))
  } catch {
    // нечего стирать
  }
}

export function santaHeaders(slug: string): Record<string, string> {
  const token = getSantaToken(slug)
  return token ? { 'X-Santa-Token': token } : {}
}
```

- [ ] **Step 5: Тест проходит**

Run: `node --test tests/santa.test.cjs && node tests/token-audit.cjs shared`
Expected: PASS, 8 тестов; аудит без новых нарушений.

- [ ] **Step 6: Commit**

```bash
git add shared/types.ts shared/santa.ts shared/santa-token.ts tests/santa.test.cjs
git commit -m "feat(front): типы и хелперы Тайного Санты"
```

---

### Task 11: Хуки API

**Files:**
- Create: `FRONT/api/santa/index.ts`

**Interfaces:**
- Consumes: типы (Task 10), `santaHeaders`, `setSantaToken`, `clearSantaToken`, `api` из `lib/api.ts`.
- Produces:
  `useApiSantaRooms()`, `useApiSantaRoom(id)`, `useApiCreateSantaRoom()`,
  `useApiUpdateSantaRoom(id)`, `useApiDeleteSantaRoom(id)`,
  `useApiRemoveSantaParticipant(roomId)`, `useApiSantaDraw(roomId)`,
  `useApiSantaRedraw(roomId)`, `useApiSantaInvite(slug)`,
  `useApiSantaMe(slug, enabled)` (данные `{ data: SantaMe } | null`; null — не участник),
  `useApiSantaJoin(slug)`, `useApiSantaUpdateMe(slug)`, `useApiSantaLeave(slug)`.
  Ключи кэша: `['santa-rooms']`, `['santa-room', id]`, `['santa-invite', slug]`, `['santa-me', slug]`.

- [ ] **Step 1: Хуки**

`FRONT/api/santa/index.ts`:

```ts
import api from '@/lib/api'
import { clearSantaToken, santaHeaders, setSantaToken } from '@/shared/santa-token'
import type {
  SantaInvite, SantaJoinResult, SantaMe, SantaProfileInput, SantaRoom,
  SantaRoomDetails, SantaRoomInput, SantaRoomSummary,
} from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError, isAxiosError } from 'axios'

type Data<T> = { data: T }

// ── Организатор ────────────────────────────────────────────────────

export const useApiSantaRooms = () =>
  useQuery({
    queryKey: ['santa-rooms'],
    queryFn: () => api.get<Data<SantaRoomSummary[]>>('santa/rooms'),
  })

export const useApiSantaRoom = (id: string) =>
  useQuery({
    queryKey: ['santa-room', id],
    queryFn: () => api.get<Data<SantaRoomDetails>>(`santa/rooms/${id}`),
    retry: false,
  })

export const useApiCreateSantaRoom = () => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaRoom>, AxiosError, SantaRoomInput>({
    mutationFn: body => api.post('santa/rooms', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-rooms'] }),
  })
}

export const useApiUpdateSantaRoom = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaRoom>, AxiosError, SantaRoomInput>({
    mutationFn: body => api.patch(`santa/rooms/${id}`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['santa-room', id] })
      await queryClient.invalidateQueries({ queryKey: ['santa-rooms'] })
    },
  })
}

export const useApiDeleteSantaRoom = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError>({
    mutationFn: () => api.delete(`santa/rooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-rooms'] }),
  })
}

export const useApiRemoveSantaParticipant = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError, string>({
    mutationFn: participantId => api.delete(`santa/rooms/${roomId}/participants/${participantId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-room', roomId] }),
  })
}

const useRoomAction = (roomId: string, action: 'draw' | 'redraw') => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError>({
    mutationFn: () => api.post(`santa/rooms/${roomId}/${action}`),
    onSettled: async () => {
      // И при 409: комнату могли разыграть в другой вкладке — показать как есть.
      await queryClient.invalidateQueries({ queryKey: ['santa-room', roomId] })
      await queryClient.invalidateQueries({ queryKey: ['santa-rooms'] })
    },
  })
}

export const useApiSantaDraw = (roomId: string) => useRoomAction(roomId, 'draw')
export const useApiSantaRedraw = (roomId: string) => useRoomAction(roomId, 'redraw')

// ── Участник ───────────────────────────────────────────────────────

export const useApiSantaInvite = (slug: string) =>
  useQuery({
    queryKey: ['santa-invite', slug],
    queryFn: () => api.get<Data<SantaInvite>>(`santa/r/${slug}`),
    retry: false,
  })

/** null — этот браузер (и аккаунт) в комнате не состоит: показать вступление. */
export const useApiSantaMe = (slug: string, enabled: boolean) =>
  useQuery({
    queryKey: ['santa-me', slug],
    enabled,
    retry: false,
    queryFn: async () => {
      try {
        return await api.get<Data<SantaMe>>(`santa/r/${slug}/me`, { headers: santaHeaders(slug) })
      } catch (err) {
        // Устаревший токен (участника убрали, комнату удалили) — не ошибка,
        // а «вы не в комнате».
        if (isAxiosError(err) && err.response?.status === 404) return null
        throw err
      }
    },
  })

export const useApiSantaJoin = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaJoinResult>, AxiosError, SantaProfileInput>({
    mutationFn: body => api.post(`santa/r/${slug}/join`, body),
    onSuccess: res => {
      setSantaToken(slug, res.data.token)
      queryClient.setQueryData(['santa-me', slug], { data: res.data.me })
      return queryClient.invalidateQueries({ queryKey: ['santa-invite', slug] })
    },
  })
}

export const useApiSantaUpdateMe = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaMe>, AxiosError, SantaProfileInput>({
    mutationFn: body => api.patch(`santa/r/${slug}/me`, body, { headers: santaHeaders(slug) }),
    onSuccess: res => queryClient.setQueryData(['santa-me', slug], res),
  })
}

export const useApiSantaLeave = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError>({
    mutationFn: () => api.delete(`santa/r/${slug}/me`, { headers: santaHeaders(slug) }),
    onSuccess: () => {
      clearSantaToken(slug)
      queryClient.setQueryData(['santa-me', slug], null)
      return queryClient.invalidateQueries({ queryKey: ['santa-invite', slug] })
    },
  })
}
```

- [ ] **Step 2: Проверка типов и линтер**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint`
Expected: без ошибок в `api/santa/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add api/santa/index.ts
git commit -m "feat(front): хуки API Тайного Санты"
```

---

### Task 12: Комнаты организатора — список, создание, правка

**Files:**
- Create: `FRONT/app/santa/components/room-chips.tsx`
- Create: `FRONT/app/santa/components/room-form.tsx`
- Create: `FRONT/app/santa/rooms/page.tsx`
- Create: `FRONT/app/santa/rooms/new/page.tsx`
- Create: `FRONT/app/santa/rooms/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: хуки (Task 11), хелперы (Task 10), `santaHref` (Task 8),
  `Button variant="festive"` (Task 9), `Form*` из `components/ui/form`,
  `Input`, `Textarea`, `Toggle` из `components/ui/switch`, `toast` из `hooks/use-toast`.
- Produces: `RoomChips({ budget, exchangeDate, participantsCount? })`,
  `RoomForm({ defaultValues, showOrganizer, submitLabel, pending, onSubmit })`.

- [ ] **Step 1: Плашки комнаты**

`FRONT/app/santa/components/room-chips.tsx`:

```tsx
import { formatBudget, formatDay, participantsLabel } from '@/shared/santa'

const CHIP = 'flex h-control-sm items-center rounded-tag px-3 text-label font-semibold'

export function RoomChips({ budget, exchangeDate, participantsCount }: {
  budget: number | null
  exchangeDate: string | null
  participantsCount?: number
}) {
  const day = formatDay(exchangeDate)
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`${CHIP} bg-tone-pink/15 text-tone-pink`}>{formatBudget(budget)}</span>
      {day && <span className={`${CHIP} bg-tone-gold/15 text-tone-gold`}>обмен {day}</span>}
      {participantsCount !== undefined && (
        <span className={`${CHIP} bg-secondary text-muted-foreground`}>{participantsLabel(participantsCount)}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Форма комнаты**

`FRONT/app/santa/components/room-form.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type RoomFormValues, roomSchema } from '@/shared/santa'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const BUDGETS = [['1000', '1 000'], ['3000', '3 000'], ['5000', '5 000'], ['', 'Без лимита']] as const

export function RoomForm({ defaultValues, showOrganizer, submitLabel, pending, onSubmit }: {
  defaultValues: RoomFormValues
  /** Только при создании: «я тоже участвую». */
  showOrganizer: boolean
  submitLabel: string
  pending: boolean
  onSubmit: (values: RoomFormValues) => void
}) {
  const form = useForm<RoomFormValues>({ resolver: zodResolver(roomSchema), defaultValues })
  const joins = form.watch('organizerJoins')
  const budget = form.watch('budget')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Название</FormLabel>
            <FormControl><Input placeholder="Новый год в отделе дизайна" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="budget" render={({ field }) => (
            <FormItem>
              <FormLabel>Бюджет на подарок, ₽</FormLabel>
              <FormControl><Input inputMode="numeric" placeholder="Без лимита" {...field} /></FormControl>
              <div className="flex flex-wrap gap-1.5">
                {BUDGETS.map(([value, label]) => (
                  <Button
                    key={label}
                    type="button"
                    size="sm"
                    variant={budget === value ? 'default' : 'secondary'}
                    aria-pressed={budget === value}
                    onClick={() => form.setValue('budget', value, { shouldValidate: true })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="exchangeDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Дата обмена подарками</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>Пара слов участникам — необязательно</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Например: дарим в пятницу на офисной ёлке" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {showOrganizer && (
          <div className="space-y-4 rounded-card border border-border bg-card p-5">
            <FormField control={form.control} name="organizerJoins" render={({ field }) => (
              <FormItem>
                <Toggle checked={field.value} onChange={field.onChange} label="Я тоже участвую" />
                <p className="text-caption text-muted-foreground">
                  Пары не увидит никто, и вы тоже: для организатора результат такой же тайный.
                </p>
              </FormItem>
            )} />
            {joins && (
              <>
                <FormField control={form.control} name="organizerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ваше имя в комнате</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="organizerWishes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Что хотели бы получить</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Хобби, размеры, что точно не дарить" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}
          </div>
        )}

        <Button type="submit" variant="festive" size="xl" loading={pending}>{submitLabel}</Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 3: Список комнат**

`FRONT/app/santa/rooms/page.tsx`:

```tsx
'use client'

import { useApiSantaRooms } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { formatBudget, formatDay, participantsLabel } from '@/shared/santa'
import { santaHref } from '@/shared/santa-route'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function SantaRoomsPage() {
  const { data, isLoading } = useApiSantaRooms()
  const rooms = data?.data ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-title-lg">Мои комнаты</h1>
        <Button asChild variant="festive" size="lg">
          <Link href={santaHref('/rooms/new')}><Plus aria-hidden />Новая комната</Link>
        </Button>
      </div>

      {!isLoading && rooms.length === 0 && (
        <p className="text-body text-muted-foreground">
          Комнат пока нет. Создайте первую и отправьте ссылку друзьям.
        </p>
      )}

      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => {
          const day = formatDay(room.exchangeDate)
          // Участнику — его карточка с конвертом, организатору — управление.
          const href = room.isOwner ? `/rooms/${room.id}` : `/r/${room.slug}`
          return (
            <li key={room.id}>
              <Link
                href={santaHref(href)}
                className="flex h-full flex-col gap-3 rounded-card border border-border bg-card p-6 transition-colors duration-fast hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-label text-muted-foreground">
                  {room.isOwner ? 'Вы организатор' : 'Вы участник'} · {room.status === 'drawn' ? 'жеребьёвка прошла' : 'идёт сбор'}
                </span>
                <span className="text-title">{room.title}</span>
                <span className="text-body-sm text-muted-foreground">
                  {participantsLabel(room.participantsCount)} · {formatBudget(room.budget)}{day ? ` · обмен ${day}` : ''}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Создание**

`FRONT/app/santa/rooms/new/page.tsx`:

```tsx
'use client'

import { useApiCreateSantaRoom } from '@/api/santa'
import { useApiGetMyProfile } from '@/api/user'
import { toast } from '@/hooks/use-toast'
import { EMPTY_ROOM_FORM, apiErrorMessage, toRoomInput } from '@/shared/santa'
import { santaHref } from '@/shared/santa-route'
import { useRouter } from 'next/navigation'
import { RoomForm } from '../../components/room-form'

export default function NewSantaRoomPage() {
  const router = useRouter()
  const create = useApiCreateSantaRoom()
  const { data: profile } = useApiGetMyProfile()
  const name = profile?.user?.displayName || profile?.user?.username || ''

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title-lg">Новая комната</h1>
        <p className="mt-2 text-lead text-muted-foreground">Всё можно поменять до жеребьёвки.</p>
      </div>
      <RoomForm
        // Имя приходит после загрузки профиля — форма пересоздаётся с ним.
        key={name}
        defaultValues={{ ...EMPTY_ROOM_FORM, organizerName: name }}
        showOrganizer
        submitLabel="Создать и получить ссылку"
        pending={create.isPending}
        onSubmit={values => create.mutate(toRoomInput(values), {
          onSuccess: res => router.push(santaHref(`/rooms/${res.data.id}`)),
          onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
        })}
      />
    </div>
  )
}
```

- [ ] **Step 5: Правка**

`FRONT/app/santa/rooms/[id]/edit/page.tsx`:

```tsx
'use client'

import { useApiSantaRoom, useApiUpdateSantaRoom } from '@/api/santa'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage, roomToFormValues, toRoomInput } from '@/shared/santa'
import { santaHref } from '@/shared/santa-route'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { RoomForm } from '../../../components/room-form'

export default function EditSantaRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isError } = useApiSantaRoom(id)
  const update = useApiUpdateSantaRoom(id)
  const room = data?.data.room

  if (isError) return <p className="text-body text-muted-foreground">Комната не найдена.</p>
  if (!room) return null

  return (
    <div className="space-y-8">
      <div>
        <Link href={santaHref(`/rooms/${id}`)} className="text-body-sm text-muted-foreground hover:text-foreground">← {room.title}</Link>
        <h1 className="mt-2 text-title-lg">Настройки комнаты</h1>
      </div>
      {room.status === 'drawn' ? (
        <p className="text-body text-muted-foreground">Жеребьёвка уже прошла — настройки больше не меняются.</p>
      ) : (
        <RoomForm
          defaultValues={roomToFormValues(room)}
          showOrganizer={false}
          submitLabel="Сохранить"
          pending={update.isPending}
          onSubmit={values => update.mutate(toRoomInput(values), {
            onSuccess: () => router.push(santaHref(`/rooms/${id}`)),
            onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
          })}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Проверка**

Run: `node tests/token-audit.cjs app/santa && pnpm lint && pnpm exec tsc --noEmit -p .`
Expected: аудит `всего 0`, линтер и типы чистые.
Вручную (бэк запущен): войти, `http://localhost:3000/santa/rooms/new` → создать
комнату с «Я тоже участвую» → переход на `/santa/rooms/<id>` (страница — в
задаче 13, пока 404); `/santa/rooms` показывает созданную комнату.

- [ ] **Step 7: Commit**

```bash
git add app/santa/components/room-chips.tsx app/santa/components/room-form.tsx app/santa/rooms/
git commit -m "feat(front): создание и список комнат Тайного Санты"
```

---

### Task 13: Комната организатора

**Files:**
- Create: `FRONT/app/santa/components/copy-field.tsx`
- Create: `FRONT/app/santa/components/confirm-action.tsx`
- Create: `FRONT/app/santa/rooms/[id]/page.tsx`

**Interfaces:**
- Consumes: `useApiSantaRoom`, `useApiSantaDraw`, `useApiSantaRedraw`,
  `useApiRemoveSantaParticipant`, `useApiDeleteSantaRoom` (Task 11);
  `RoomChips` (Task 12); `MIN_PARTICIPANTS`, `formatDay`, `participantsLabel`, `apiErrorMessage`.
- Produces: `CopyField({ label, value })`,
  `ConfirmAction({ trigger, title, description, confirmLabel, onConfirm })`.

- [ ] **Step 1: Общие компоненты**

`FRONT/app/santa/components/copy-field.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Copy } from 'lucide-react'

export function CopyField({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: 'Ссылка скопирована' })
    } catch {
      toast({ variant: 'destructive', title: 'Не получилось скопировать — выделите ссылку вручную' })
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="text-caption font-semibold text-muted-foreground">{label}</div>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          aria-label={label}
          onFocus={e => e.currentTarget.select()}
          className="h-control min-w-0 flex-1 rounded-control border border-border bg-background px-3 text-body-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" variant="secondary" size="icon" onClick={copy} aria-label="Скопировать ссылку">
          <Copy aria-hidden />
        </Button>
      </div>
    </div>
  )
}
```

`FRONT/app/santa/components/confirm-action.tsx`:

```tsx
'use client'

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type * as React from 'react'

export function ConfirmAction({ trigger, title, description, confirmLabel, onConfirm }: {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      {/* Диалог рисуется в портале вне раздела — схему Санты задаём ему явно. */}
      <AlertDialogContent className="dark santa">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Страница комнаты**

`FRONT/app/santa/rooms/[id]/page.tsx`:

```tsx
'use client'

import {
  useApiDeleteSantaRoom, useApiRemoveSantaParticipant, useApiSantaDraw, useApiSantaRedraw, useApiSantaRoom,
} from '@/api/santa'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { MIN_PARTICIPANTS, apiErrorMessage, formatDay, participantsLabel } from '@/shared/santa'
import { santaHref } from '@/shared/santa-route'
import { Settings, Shuffle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmAction } from '../../components/confirm-action'
import { CopyField } from '../../components/copy-field'
import { RoomChips } from '../../components/room-chips'

export default function SantaRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isError } = useApiSantaRoom(id)
  const draw = useApiSantaDraw(id)
  const redraw = useApiSantaRedraw(id)
  const remove = useApiRemoveSantaParticipant(id)
  const del = useApiDeleteSantaRoom(id)
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])

  if (isError) return <p className="text-body text-muted-foreground">Комната не найдена.</p>
  const details = data?.data
  if (!details) return null

  const { room, participants } = details
  const open = room.status === 'open'
  const enough = participants.length >= MIN_PARTICIPANTS
  const ownerJoined = participants.some(p => p.isOwner)
  const inviteLink = `${origin}${santaHref(`/r/${room.slug}`)}`
  const onError = (err: unknown) => toast({ variant: 'destructive', title: apiErrorMessage(err) })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-4">
          <Link href={santaHref('/rooms')} className="text-body-sm text-muted-foreground hover:text-foreground">← Мои комнаты</Link>
          <h1 className="text-title-lg md:text-display-sm">{room.title}</h1>
          <RoomChips budget={room.budget} exchangeDate={room.exchangeDate} />
        </div>
        {open && (
          <Button asChild variant="secondary">
            <Link href={santaHref(`/rooms/${id}/edit`)}><Settings aria-hidden />Настройки</Link>
          </Button>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-card border border-border bg-card lg:col-span-2" aria-labelledby="people">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <h2 id="people" className="text-title-sm">Участники · {participants.length}</h2>
          </div>
          {participants.length === 0 && (
            <p className="px-6 py-5 text-body text-muted-foreground">Пока никого. Отправьте ссылку-приглашение.</p>
          )}
          <ul>
            {participants.map(p => (
              <li key={p.id} className="flex items-center gap-3 border-b border-border px-6 py-3.5 last:border-b-0">
                <span className="flex size-control-sm shrink-0 items-center justify-center rounded-full bg-accent text-label font-bold text-accent-foreground">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold">{p.name}{p.isOwner ? ' · вы' : ''}</span>
                  <span className="block text-caption text-muted-foreground">
                    {[p.hasWishes && 'пожелания', p.hasWishlist && 'вишлист'].filter(Boolean).join(' + ') || 'пожеланий нет'}
                  </span>
                </span>
                {open && (
                  <ConfirmAction
                    trigger={<Button variant="ghost" size="icon-sm" aria-label={`Убрать ${p.name}`}><Trash2 aria-hidden /></Button>}
                    title={`Убрать ${p.name}?`}
                    description="Его имя и пожелания удалятся. Он сможет вступить снова по ссылке, пока не прошла жеребьёвка."
                    confirmLabel="Убрать"
                    onConfirm={() => remove.mutate(p.id, { onError })}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="space-y-4 rounded-card border border-border bg-card p-6">
            <h2 className="text-title-xs">Позвать людей</h2>
            {origin && <CopyField label="Ссылка-приглашение" value={inviteLink} />}
            {!ownerJoined && open && (
              <p className="text-body-sm text-muted-foreground">
                Вы не участвуете. Чтобы участвовать, откройте{' '}
                <Link href={santaHref(`/r/${room.slug}`)} className="text-primary underline-offset-4 hover:underline">приглашение</Link>.
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-card border border-border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <Shuffle className="size-5 text-tone-pink" aria-hidden />
              <h2 className="text-title-xs">Жеребьёвка</h2>
            </div>
            {open ? (
              <>
                <p className="text-body-sm text-muted-foreground">
                  {enough
                    ? 'Каждый получит одного подопечного. После жеребьёвки вступить в комнату и убрать участника будет нельзя.'
                    : `Нужно минимум ${MIN_PARTICIPANTS} участника, сейчас ${participantsLabel(participants.length)}.`}
                </p>
                <ConfirmAction
                  trigger={<Button variant="festive" size="lg" className="w-full" disabled={!enough} loading={draw.isPending}>Провести жеребьёвку</Button>}
                  title="Провести жеребьёвку?"
                  description="Пары сложатся в один круг. Состав комнаты после этого не меняется."
                  confirmLabel="Тянуть пары"
                  onConfirm={() => draw.mutate(undefined, { onError })}
                />
              </>
            ) : (
              <>
                <p className="text-body-sm text-muted-foreground">
                  Жеребьёвка прошла{room.drawnAt ? ` ${formatDay(room.drawnAt)}` : ''}. Каждый откроет своего
                  подопечного по ссылке-приглашению.
                </p>
                <ConfirmAction
                  trigger={<Button variant="secondary" className="w-full" loading={redraw.isPending}>Перетянуть пары</Button>}
                  title="Перетянуть пары?"
                  description="Все получат новых подопечных, старые пары пропадут. Кто уже купил подарок — расстроится."
                  confirmLabel="Перетянуть"
                  onConfirm={() => redraw.mutate(undefined, { onError })}
                />
              </>
            )}
          </section>

          <ConfirmAction
            trigger={<Button variant="ghost" className="w-full text-destructive">Удалить комнату</Button>}
            title="Удалить комнату?"
            description="Участники, пожелания и пары удалятся навсегда."
            confirmLabel="Удалить"
            onConfirm={() => del.mutate(undefined, { onSuccess: () => router.push(santaHref('/rooms')), onError })}
          />
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Проверка**

Run: `node tests/token-audit.cjs app/santa && pnpm lint && pnpm exec tsc --noEmit -p .`
Expected: аудит `всего 0`, линтер и типы чистые.
Вручную: открыть созданную комнату; ссылка копируется; кнопка жеребьёвки
неактивна при двух участниках; удаление участника спрашивает подтверждение.

- [ ] **Step 4: Commit**

```bash
git add app/santa/components/copy-field.tsx app/santa/components/confirm-action.tsx "app/santa/rooms/[id]/page.tsx"
git commit -m "feat(front): комната организатора Тайного Санты"
```

---

### Task 14: Приглашение, карточка участника и конверт

**Files:**
- Create: `FRONT/app/santa/r/[slug]/page.tsx`
- Create: `FRONT/app/santa/r/[slug]/components/invite-header.tsx`
- Create: `FRONT/app/santa/r/[slug]/components/profile-form.tsx`
- Create: `FRONT/app/santa/r/[slug]/components/join-form.tsx`
- Create: `FRONT/app/santa/r/[slug]/components/my-card.tsx`
- Create: `FRONT/app/santa/r/[slug]/components/envelope.tsx`

**Interfaces:**
- Consumes: `useApiSantaInvite`, `useApiSantaMe`, `useApiSantaJoin`,
  `useApiSantaUpdateMe`, `useApiSantaLeave` (Task 11); `setSantaToken`,
  `getSantaToken` (Task 10); `profileSchema`, `ProfileValues`, `apiErrorMessage`;
  `RoomChips`, `CopyField`, `ConfirmAction` (Tasks 12–13).
- Produces: страница `/r/[slug]` со всеми состояниями (не найдена; вступить;
  вступить нельзя; в комнате; конверт).

- [ ] **Step 1: Шапка приглашения и форма профиля**

`FRONT/app/santa/r/[slug]/components/invite-header.tsx`:

```tsx
import type { SantaInvite } from '@/shared/types'
import { Star } from 'lucide-react'
import { RoomChips } from '../../../components/room-chips'

export function InviteHeader({ invite }: { invite: SantaInvite }) {
  return (
    <header className="santa-snow space-y-4 rounded-sheet border border-border px-6 py-8">
      <Star className="size-8 text-tone-gold" fill="currentColor" aria-hidden />
      {invite.organizerName && (
        <p className="text-body-sm text-muted-foreground">{invite.organizerName} зовёт вас в Тайного Санту</p>
      )}
      <h1 className="text-title md:text-title-lg">{invite.title}</h1>
      <RoomChips budget={invite.budget} exchangeDate={invite.exchangeDate} participantsCount={invite.participantsCount} />
      {invite.message && <p className="whitespace-pre-line text-body text-muted-foreground">{invite.message}</p>}
    </header>
  )
}
```

`FRONT/app/santa/r/[slug]/components/profile-form.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type ProfileValues, profileSchema } from '@/shared/santa'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

export function ProfileForm({ defaultValues, nameLocked = false, submitLabel, pending, onSubmit }: {
  defaultValues: ProfileValues
  /** После жеребьёвки имя уже знает Санта — не меняем. */
  nameLocked?: boolean
  submitLabel: string
  pending: boolean
  onSubmit: (values: ProfileValues) => void
}) {
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Как вас зовут</FormLabel>
            <FormControl><Input placeholder="Имя, которое увидит ваш Санта" disabled={nameLocked} {...field} /></FormControl>
            {nameLocked && <p className="text-caption text-muted-foreground">Имя уже знает ваш Санта — оно не меняется.</p>}
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="wishes" render={({ field }) => (
          <FormItem>
            <FormLabel>Что хотели бы получить</FormLabel>
            <FormControl><Textarea rows={4} placeholder="Хобби, размеры, что точно не дарить" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="wishlistUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>Ссылка на вишлист — необязательно</FormLabel>
            <FormControl><Input type="url" inputMode="url" placeholder="https://prosto-namekni.ru/s/…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" variant="festive" size="lg" className="w-full md:w-auto" loading={pending}>{submitLabel}</Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 2: Вступление и карточка участника**

`FRONT/app/santa/r/[slug]/components/join-form.tsx`:

```tsx
'use client'

import { useApiSantaJoin } from '@/api/santa'
import { useApiGetMyProfile } from '@/api/user'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage } from '@/shared/santa'
import { ProfileForm } from './profile-form'

export function JoinForm({ slug }: { slug: string }) {
  const { data: profile } = useApiGetMyProfile()
  const join = useApiSantaJoin(slug)
  const name = profile?.user?.displayName || profile?.user?.username || ''

  return (
    <section className="space-y-5 rounded-card border border-border bg-card p-6">
      <h2 className="text-title-sm">Вступить в комнату</h2>
      <ProfileForm
        key={name}
        defaultValues={{ name, wishes: '', wishlistUrl: '' }}
        submitLabel="Вступить"
        pending={join.isPending}
        onSubmit={values => join.mutate(values, {
          onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
        })}
      />
    </section>
  )
}
```

`FRONT/app/santa/r/[slug]/components/my-card.tsx`:

```tsx
'use client'

import { useApiSantaLeave, useApiSantaUpdateMe } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage } from '@/shared/santa'
import { getSantaToken } from '@/shared/santa-token'
import type { SantaMe } from '@/shared/types'
import { useEffect, useState } from 'react'
import { ConfirmAction } from '../../../components/confirm-action'
import { CopyField } from '../../../components/copy-field'
import { ProfileForm } from './profile-form'

export function MyCard({ slug, me }: { slug: string; me: SantaMe }) {
  const update = useApiSantaUpdateMe(slug)
  const leave = useApiSantaLeave(slug)
  const drawn = me.room.status === 'drawn'
  const [personalLink, setPersonalLink] = useState<string | null>(null)

  useEffect(() => {
    // Ссылка только у вошедших по токену; по аккаунту и так узнаем.
    const token = getSantaToken(slug)
    if (token) setPersonalLink(`${window.location.origin}${window.location.pathname}?t=${encodeURIComponent(token)}`)
  }, [slug])

  const onError = (err: unknown) => toast({ variant: 'destructive', title: apiErrorMessage(err) })

  return (
    <section className="space-y-6 rounded-card border border-border bg-card p-6">
      <div>
        <h2 className="text-title-sm">{drawn ? 'Ваши пожелания' : 'Вы в комнате'}</h2>
        {!drawn && (
          <p className="mt-1 text-body-sm text-muted-foreground">
            Когда организатор проведёт жеребьёвку, здесь появится конверт с именем вашего подопечного.
          </p>
        )}
      </div>
      {personalLink && (
        <CopyField label="Личная ссылка — сохраните и никому не отправляйте: по ней вы вернётесь с другого устройства" value={personalLink} />
      )}
      <ProfileForm
        defaultValues={{ name: me.name, wishes: me.wishes, wishlistUrl: me.wishlistUrl }}
        nameLocked={drawn}
        submitLabel="Сохранить"
        pending={update.isPending}
        onSubmit={values => update.mutate(values, { onSuccess: () => toast({ title: 'Сохранено' }), onError })}
      />
      {!drawn && (
        <ConfirmAction
          trigger={<Button variant="ghost" className="text-destructive">Выйти из комнаты</Button>}
          title="Выйти из комнаты?"
          description="Ваши имя и пожелания удалятся. Вернуться можно по приглашению, пока не прошла жеребьёвка."
          confirmLabel="Выйти"
          onConfirm={() => leave.mutate(undefined, { onError })}
        />
      )}
    </section>
  )
}
```

- [ ] **Step 3: Конверт**

`FRONT/app/santa/r/[slug]/components/envelope.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import type { SantaInvite, SantaReceiver } from '@/shared/types'
import { ExternalLink, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RoomChips } from '../../../components/room-chips'

export function Envelope({ slug, room, receiver }: { slug: string; room: SantaInvite; receiver: SantaReceiver | null }) {
  const key = `santa:${slug}:opened`
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    try {
      setOpened(localStorage.getItem(key) === '1')
    } catch {
      setOpened(false)
    }
  }, [key])

  const reveal = () => {
    setOpened(true)
    try {
      localStorage.setItem(key, '1')
    } catch {
      // откроется снова при следующем визите — не страшно
    }
  }

  if (!receiver) {
    return <p className="text-body text-muted-foreground">Пары обновляются — загляните чуть позже.</p>
  }

  if (!opened) {
    return (
      <section className="flex flex-col items-center gap-7 py-10 text-center">
        <div aria-hidden className="flex h-40 w-60 items-center justify-center rounded-card bg-festive shadow-overlay">
          <Star className="size-12 text-tone-gold" fill="currentColor" />
        </div>
        <h1 className="text-title-lg">Жеребьёвка прошла</h1>
        <p className="max-w-sm text-lead text-muted-foreground">
          Внутри — имя того, кому вы дарите. Откройте, когда никто не подглядывает.
        </p>
        <Button variant="festive" size="xl" onClick={reveal}>Открыть конверт</Button>
      </section>
    )
  }

  return (
    <section className="space-y-6" aria-live="polite">
      <div>
        <p className="text-lead text-muted-foreground">Вы — Тайный Санта для</p>
        <h1 className="mt-2 text-display-sm">{receiver.name}</h1>
      </div>
      <RoomChips budget={room.budget} exchangeDate={room.exchangeDate} />
      {receiver.wishes ? (
        <div className="space-y-2 rounded-card border border-border bg-card p-5">
          <p className="text-eyebrow uppercase text-muted-foreground">Пожелания</p>
          <p className="whitespace-pre-line text-body">{receiver.wishes}</p>
        </div>
      ) : (
        <p className="text-body text-muted-foreground">Пожеланий нет — придётся угадывать. Посмотрите, нет ли вишлиста.</p>
      )}
      {receiver.wishlistUrl && (
        <Button asChild variant="secondary" size="lg">
          <a href={receiver.wishlistUrl} target="_blank" rel="noopener noreferrer nofollow">
            <ExternalLink aria-hidden />
            Открыть вишлист
          </a>
        </Button>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Страница**

`FRONT/app/santa/r/[slug]/page.tsx`:

```tsx
'use client'

import { useApiSantaInvite, useApiSantaMe } from '@/api/santa'
import { setSantaToken } from '@/shared/santa-token'
import { usePathname, useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Envelope } from './components/envelope'
import { InviteHeader } from './components/invite-header'
import { JoinForm } from './components/join-form'
import { MyCard } from './components/my-card'

function InvitePage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const urlToken = useSearchParams().get('t')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Личная ссылка ?t=… — токен в хранилище, из адресной строки прочь:
    // иначе он уедет в историю браузера и в скриншоты.
    if (urlToken) {
      setSantaToken(slug, urlToken)
      router.replace(pathname)
    }
    setReady(true)
  }, [urlToken, slug, pathname, router])

  const invite = useApiSantaInvite(slug)
  const me = useApiSantaMe(slug, ready)

  if (invite.isError) {
    return <p className="text-body text-muted-foreground">Комната не найдена. Проверьте ссылку у организатора.</p>
  }
  if (!invite.data || !ready || me.isPending) {
    return <p className="text-body text-muted-foreground">Загружаем приглашение…</p>
  }

  const room = invite.data.data
  const mine = me.data?.data ?? null

  if (mine && mine.room.status === 'drawn') {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <Envelope slug={slug} room={mine.room} receiver={mine.receiver} />
        <MyCard slug={slug} me={mine} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <InviteHeader invite={room} />
      {mine && <MyCard slug={slug} me={mine} />}
      {!mine && room.status === 'open' && <JoinForm slug={slug} />}
      {!mine && room.status === 'drawn' && (
        <p className="text-body text-muted-foreground">
          Жеребьёвка уже прошла — вступить нельзя. Если вы участник, откройте свою личную ссылку
          или войдите в аккаунт, с которым вступали.
        </p>
      )}
    </div>
  )
}

export default function SantaInvitePage() {
  // useSearchParams требует границу Suspense.
  return (
    <Suspense fallback={null}>
      <InvitePage />
    </Suspense>
  )
}
```

- [ ] **Step 5: Проверка**

Run: `node tests/token-audit.cjs app/santa && pnpm lint && pnpm exec tsc --noEmit -p . && pnpm build`
Expected: аудит `всего 0`, линтер и типы чистые, сборка проходит.

Ручной сценарий (бэк и фронт запущены):
1. Организатор создаёт комнату с «Я тоже участвую», копирует приглашение.
2. В двух приватных окнах открыть приглашение, вступить как «Маша» и «Артём»;
   у каждого видна личная ссылка.
3. Перезагрузить окно Маши — она по-прежнему «в комнате» (токен из `localStorage`).
4. Организатор проводит жеребьёвку; повторное нажатие в другой вкладке → тост «жеребьёвка уже прошла».
5. У Маши — конверт; после «Открыть конверт» — имя подопечного и его пожелания.
   Подопечный ≠ Маша.
6. Личную ссылку Маши открыть в третьем окне — та же карточка, `?t=` пропал из адреса.
7. В `localStorage` окна Артёма вписать мусор в `santa:<slug>` и перезагрузить —
   страница показывает «жеребьёвка уже прошла — вступить нельзя», а не ошибку.

- [ ] **Step 6: Commit**

```bash
git add "app/santa/r/"
git commit -m "feat(front): приглашение, карточка участника и конверт Тайного Санты"
```

---

### Task 15: Выкладка

**Files:**
- Modify: настройки Dokploy / DNS (вне репозиториев) — по шагам ниже.

**Interfaces:** —

- [ ] **Step 1: DNS** — A-запись (или CNAME) `santa.prosto-namekni.ru` на тот же
  сервер, что и `prosto-namekni.ru`.
- [ ] **Step 2: Фронт в Dokploy** — в приложении фронта добавить домен
  `santa.prosto-namekni.ru` (HTTPS, Let's Encrypt) к тому же сервису.
  Переменные сборки (они `NEXT_PUBLIC_*`, читаются при сборке — после изменения
  пересобрать): `NEXT_PUBLIC_SANTA_BASE=` (пусто),
  `NEXT_PUBLIC_SANTA_ORIGIN=https://santa.prosto-namekni.ru`,
  `NEXT_PUBLIC_APP_URL=https://prosto-namekni.ru`.
- [ ] **Step 3: Бэк в Dokploy** — `CORS_ORIGIN=https://prosto-namekni.ru,https://santa.prosto-namekni.ru`;
  `COOKIE_DOMAIN=prosto-namekni.ru` уже стоит (кука входа видна поддомену). Перезапустить —
  `AutoMigrate` создаст три таблицы.
- [ ] **Step 4: Дымовая проверка на тестовом стеке, затем на проде**:
  `https://santa.prosto-namekni.ru` — лендинг; `https://prosto-namekni.ru/santa` → 308 на поддомен;
  «Войти» с поддомена → вход → возврат на поддомен; сценарий из задачи 14, шаги 1–6.
- [ ] **Step 5: Финиш ветки** — `superpowers:finishing-a-development-branch` в обоих репозиториях.
