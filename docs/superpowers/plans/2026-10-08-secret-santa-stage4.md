# Тайный Санта, этап 4: воронка и полировка — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Санта приводит людей и связывается с вишлистами: полный лендинг с SEO и JSON-LD, статья в блоге, карточка «Устройте Тайного Санту» в кабинете (1 ноября — 31 декабря), вошедший участник выбирает свой вишлист вместо ссылки, QR-код приглашения, отметка «Подарок готов» и счётчик у организатора, вишлист подопечного открывается гостевой страницей с анонимной бронью.

**Architecture:** бэк — одна новая возможность: `PUT /r/:slug/me/gift` ставит `gift_ready` участнику с парой (транзакция под `FOR SHARE` комнаты, как сообщение чата), перезапуск жеребьёвки сбрасывает отметки, организатор получает `giftsReady` в карточке комнаты. Всё остальное — фронт: чистые хелперы в `shared/santa.ts` под `node --test`, лендинг — серверный компонент с `JsonLd`, QR — `qrcode.react` (уже в зависимостях), гостевая страница вишлиста узнаёт Санту по `?from=santa` и ставит «Анонимно» по умолчанию.

**Tech Stack:** Go 1.25, fiber v2, gorm + Postgres 17, testify, testcontainers; Next.js 16, TanStack Query 5, react-hook-form + zod, qrcode.react 4, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-05-secret-santa-design.md`, раздел «Этап 4. Воронка и полировка» и решения в начале. Макет — канвас «Тайный Санта — дизайн» (https://claude.ai/artifact/5uWUWHZFqXiFpoe7Ji3pWc): артборды «Лендинг», «Переход из вишлиста», «Участник · вступление», «Участник · кому я дарю», «Организатор · комната». Этапы 1–3 уже влиты в `feature/santa`.

**Репозитории:** фронт — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-front` (FRONT), бэк — `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back` (BACK; модуль Go — `main`). Ветка `feature/santa-stage4` от `feature/santa` в обоих. Коммиты — от имени пользователя, **без трейлера `Co-Authored-By`**.

## Global Constraints

- Пакетный менеджер фронта — `pnpm`.
- Дизайн-система фронта: только токены по роли (`text-body`, `rounded-control`, `h-control`, `shadow-float`, `duration-base`); никаких стоковых размеров текста/скруглений/теней и `[…]`, цветов `#…`/`rgb(` в TSX. Проверка: `node tests/token-audit.cjs app/santa app/wishlist app/s app/blog components shared` → `всего 0`.
- Тексты интерфейса — по-русски, на «вы» (блог — как в остальных статьях, на «ты»).
- Пары тайные для всех, включая организатора: счётчик готовых подарков — число, без имён.
- Карточка в кабинете показывается с 1 ноября по 31 декабря включительно (по времени браузера).
- Ошибки API: 404 — нет комнаты/участника; 409 — `жеребьёвки ещё не было`, `вы не попали в эту жеребьёвку`; 422 — валидация.

## Review Focus

1. **«Подарок готов» после перезапуска жеребьёвки** — у нового подопечного подарка ещё нет: отметки сбрасываются. Тест: `TestSantaRepo_RedrawResetsGiftReady` (задача 1).
2. **Отметка без пары** (канал подключили после жеребьёвки) — 409 «вы не попали в эту жеребьёвку», а не 200. Тесты: `TestSantaRepo_SetGiftReadyNeedsPair` (задача 1), `TestSetGiftReady_NotInDraw` (задача 2).
3. **Тайна пар у организатора** — в карточке комнаты только `giftsReady` числом, без отметки у каждого участника. Тест: `TestGetRoom_CountsGiftsReadyWithoutNames` (задача 2).
4. **Ссылка на вишлист подопечного** — свой сервис узнаём только по точному адресу `prosto-namekni.ru/s/<id>` (и `www.`), чужие ссылки и похожие домены (`prosto-namekni.ru.evil.com`) — обычной внешней ссылкой. Тест: «короткий id вишлиста сервиса» (задача 3).
5. **Карточка в кабинете на границах сезона** — 31 октября 23:59 нет, 1 ноября 00:00 есть, 31 декабря 23:59 есть, 1 января нет. Тест: «сезон карточки Санты» (задача 3).

---

## Карта файлов

**BACK**
- Modify `internal/repo/contracts.go`, `internal/repo/persistent/santa_postgres.go` (`drawLocked`), create `internal/repo/persistent/santa_gift_postgres.go`, modify `mock/repo/mock_santa_repo.go`; create `internal/repo/persistent/santa_gift_integration_test.go`.
- Modify `internal/usecase/contracts.go`, `internal/usecase/santa/participant.go` (`me`), `internal/usecase/santa/santa.go` (`GetRoom`); create `internal/usecase/santa/gift.go`, `gift_test.go`; modify `santa_test.go`.
- Modify `internal/controller/restapi/v1/santa.go`, `santa_test.go`.

**FRONT**
- Modify `shared/types.ts`, `shared/santa.ts`, `tests/santa.test.cjs`, `api/santa/index.ts`, `api/wishlist/index.ts`.
- Modify `app/santa/page.tsx`, `app/santa/layout.tsx`; create `app/santa/components/sample-envelope.tsx`.
- Create `content/blog/secret-santa.mdx`; modify `content/blog/index.ts`, `content/blog/wishlist-gifts.mdx`.
- Create `app/wishlist/components/santa-promo.tsx`; modify `app/wishlist/page.tsx`.
- Modify `app/santa/r/[slug]/components/profile-form.tsx`, `join-form.tsx`, `my-card.tsx`; create `app/santa/r/[slug]/components/wishlist-picker.tsx`.
- Create `app/santa/rooms/[id]/components/invite-qr.tsx`; modify `app/santa/rooms/[id]/page.tsx`.
- Create `app/santa/r/[slug]/components/gift-ready.tsx`, `ward-wishlist.tsx`; modify `envelope.tsx`.
- Modify `app/s/[shortId]/components/gifts-section.tsx`.

---

## Бэкенд

### Task 1: «Подарок готов» — репозиторий

**Files:**
- Modify: `BACK/internal/repo/contracts.go`
- Create: `BACK/internal/repo/persistent/santa_gift_postgres.go`
- Modify: `BACK/internal/repo/persistent/santa_postgres.go` (`drawLocked`)
- Modify: `BACK/mock/repo/mock_santa_repo.go`
- Create: `BACK/internal/repo/persistent/santa_gift_integration_test.go`

**Interfaces:**
- Consumes: `drawnRoom(t, r)` и `seedRoom`/`seedParticipants` из интеграционных тестов этапов 1–3.
- Produces: `SantaRepo.SetGiftReady(ctx, roomID, participantID uuid.UUID, ready bool) error` — комната не drawn → `ErrStatusMismatch`; участник не дарит в этой комнате → `ErrNotFound`. `drawLocked` ставит `gift_ready = false` всем участникам комнаты.

- [ ] **Step 1: Контракт и мок**

`internal/repo/contracts.go`, в `SantaRepo` после `FindChatNotification`:

```go
	// SetGiftReady — отметка «Подарок готов» участника, который дарит в этой
	// комнате; под блокировкой комнаты (FOR SHARE), чтобы перезапуск жеребьёвки
	// не проскочил между проверкой пары и записью. Комната не drawn —
	// ErrStatusMismatch; пары нет — ErrNotFound.
	SetGiftReady(ctx context.Context, roomID, participantID uuid.UUID, ready bool) error
```

`mock/repo/mock_santa_repo.go`, в конец:

```go
func (m *MockSantaRepo) SetGiftReady(ctx context.Context, roomID, participantID uuid.UUID, ready bool) error {
	return m.Called(ctx, roomID, participantID, ready).Error(0)
}
```

- [ ] **Step 2: Падающие интеграционные тесты**

Создать `internal/repo/persistent/santa_gift_integration_test.go`:

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

func TestSantaRepo_SetGiftReady(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room, ids := drawnRoom(t, r)

	require.NoError(t, r.SetGiftReady(ctx, room.ID, ids[0], true))
	p, err := r.GetParticipant(ctx, ids[0])
	require.NoError(t, err)
	assert.True(t, p.GiftReady)

	require.NoError(t, r.SetGiftReady(ctx, room.ID, ids[0], false))
	p, err = r.GetParticipant(ctx, ids[0])
	require.NoError(t, err)
	assert.False(t, p.GiftReady, "отметку можно снять")
}

func TestSantaRepo_SetGiftReadyNeedsPair(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room, _ := drawnRoom(t, r)
	late := seedUnready(t, r, room.ID, 1)[0] // вступил до жеребьёвки без канала — пары нет

	assert.ErrorIs(t, r.SetGiftReady(ctx, room.ID, late, true), repo.ErrNotFound)

	open := seedRoom(t, r, uuid.New())
	pid := seedParticipants(t, r, open.ID, 1)[0]
	assert.ErrorIs(t, r.SetGiftReady(ctx, open.ID, pid, true), repo.ErrStatusMismatch, "до жеребьёвки")
}

func TestSantaRepo_RedrawResetsGiftReady(t *testing.T) {
	ctx := context.Background()
	r := persistent.NewSantaRepo(setupSantaDB(t))
	room, ids := drawnRoom(t, r)
	require.NoError(t, r.SetGiftReady(ctx, room.ID, ids[0], true))

	require.NoError(t, r.Draw(ctx, room.ID, entity.SantaRoomDrawn, circle(room.ID), drawnNote(time.Now())))

	p, err := r.GetParticipant(ctx, ids[0])
	require.NoError(t, err)
	assert.False(t, p.GiftReady, "новый подопечный — подарка для него ещё нет")
}
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `go vet -tags integration ./internal/repo/persistent/`
Expected: FAIL — `*santaRepo does not implement repo.SantaRepo (missing method SetGiftReady)`.

- [ ] **Step 4: Репозиторий**

Создать `internal/repo/persistent/santa_gift_postgres.go`:

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

func (r *santaRepo) SetGiftReady(ctx context.Context, roomID, participantID uuid.UUID, ready bool) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// FOR SHARE против FOR UPDATE жеребьёвки: перезапуск сбросит отметку
		// после нас или мы увидим новые пары.
		var room SantaRoomModel
		if err := tx.Clauses(clause.Locking{Strength: "SHARE"}).First(&room, "id = ?", roomID).Error; err != nil {
			return santaErr("santaRepo.SetGiftReady lock", err)
		}
		if room.Status != string(entity.SantaRoomDrawn) {
			return repo.ErrStatusMismatch
		}
		res := tx.Model(&SantaParticipantModel{}).
			Where("id = ? AND room_id = ?", participantID, roomID).
			Where("EXISTS (SELECT 1 FROM santa_assignments a WHERE a.room_id = ? AND a.giver_id = ?)", roomID, participantID).
			Updates(map[string]any{"gift_ready": ready, "updated_at": time.Now()})
		if res.Error != nil {
			return santaErr("santaRepo.SetGiftReady", res.Error)
		}
		if res.RowsAffected == 0 {
			return fmt.Errorf("santaRepo.SetGiftReady: %w", repo.ErrNotFound)
		}
		return nil
	})
}
```

`internal/repo/persistent/santa_postgres.go`, в `drawLocked` после очистки сообщений (`santaRepo.Draw clear messages`):

```go
	// Подарок готовили прошлому подопечному — у нового его ещё нет.
	if err := tx.Model(&SantaParticipantModel{}).Where("room_id = ? AND gift_ready", roomID).
		Update("gift_ready", false).Error; err != nil {
		return santaErr("santaRepo.Draw clear gifts", err)
	}
```

- [ ] **Step 5: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.
Run: `go test -tags integration ./internal/repo/persistent/ -run TestSantaRepo -count=1`
Expected: PASS, включая три новых.

- [ ] **Step 6: Commit**

```bash
git add internal/repo mock/repo
git commit -m "feat(backend): Санта — отметка «Подарок готов» в репозитории, сброс при перезапуске"
```

---

### Task 2: «Подарок готов» — use case, счётчик организатора, API

**Files:**
- Modify: `BACK/internal/usecase/contracts.go`
- Create: `BACK/internal/usecase/santa/gift.go`, `BACK/internal/usecase/santa/gift_test.go`
- Modify: `BACK/internal/usecase/santa/participant.go` (`me`), `santa.go` (`GetRoom`), `santa_test.go`
- Modify: `BACK/internal/controller/restapi/v1/santa.go`, `santa_test.go`

**Interfaces:**
- Consumes: `SantaRepo.SetGiftReady` (задача 1); `participantBySlug`, `me`, `newChatEnv`/`withPairs` (тесты этапа 3).
- Produces: `usecase.SantaMe.GiftReady bool` (`json:"giftReady"`); `usecase.SantaRoomDetails.GiftsReady int` (`json:"giftsReady"`); `SantaUseCase.SetGiftReady(ctx, slug string, auth SantaAuth, ready bool) (SantaMe, error)`; маршрут `PUT /api/v1/santa/r/:slug/me/gift` с телом `{"ready": bool}` → `{data: SantaMe}`.

- [ ] **Step 1: Контракты**

`internal/usecase/contracts.go`:

В `SantaRoomDetails` после `Participants`:

```go
	// GiftsReady — сколько участников отметили «Подарок готов»; без имён.
	GiftsReady int `json:"giftsReady"`
```

В `SantaMe` после `Chat`:

```go
	// GiftReady — участник отметил, что подарок подопечному готов.
	GiftReady bool `json:"giftReady"`
```

В интерфейс `SantaUseCase` после `TelegramReply`:

```go
	// SetGiftReady — отметка «Подарок готов» (её видит организатор числом).
	// До жеребьёвки — ErrSantaNotDrawn, без пары — ErrSantaNotInDraw.
	SetGiftReady(ctx context.Context, slug string, auth SantaAuth, ready bool) (SantaMe, error)
```

`internal/controller/restapi/v1/santa_test.go`, после `TelegramReply` у `MockSantaUC`:

```go
func (m *MockSantaUC) SetGiftReady(ctx context.Context, slug string, auth usecase.SantaAuth, ready bool) (usecase.SantaMe, error) {
	args := m.Called(ctx, slug, auth, ready)
	return args.Get(0).(usecase.SantaMe), args.Error(1)
}
```

- [ ] **Step 2: Падающие тесты use case**

Создать `internal/usecase/santa/gift_test.go`:

```go
package santa

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
	mockrepo "main/mock/repo"
)

func TestSetGiftReady_Marks(t *testing.T) {
	e := newChatEnv(t)
	e.sr.On("SetGiftReady", mock.Anything, e.room.ID, e.p.ID, true).Return(nil)
	// me(): карточка с подопечным после отметки.
	e.sr.On("CountParticipants", mock.Anything, mock.Anything).Return(map[uuid.UUID]int{e.room.ID: 3}, nil)
	e.uc.users.(*mockrepo.MockUserRepo).On("GetByID", mock.Anything, mock.Anything).Return(entity.User{}, repo.ErrNotFound)
	e.sr.On("GetAssignment", mock.Anything, e.room.ID, e.p.ID).Return(e.toWard, nil)
	e.sr.On("GetParticipant", mock.Anything, e.toWard.ReceiverID).Return(entity.SantaParticipant{ID: e.toWard.ReceiverID, Name: "Маша"}, nil)
	e.sr.On("CountUnread", mock.Anything, e.room.ID, e.p.ID).Return(0, 0, nil)

	me, err := e.uc.SetGiftReady(context.Background(), "abcdefgh", tokAuth, true)
	require.NoError(t, err)
	assert.True(t, me.GiftReady)
	e.sr.AssertCalled(t, "SetGiftReady", mock.Anything, e.room.ID, e.p.ID, true)
}

func TestSetGiftReady_NotInDraw(t *testing.T) {
	e := newChatEnv(t)
	e.sr.On("SetGiftReady", mock.Anything, e.room.ID, e.p.ID, true).Return(repo.ErrNotFound)
	_, err := e.uc.SetGiftReady(context.Background(), "abcdefgh", tokAuth, true)
	assert.ErrorIs(t, err, usecase.ErrSantaNotInDraw)
}

func TestSetGiftReady_BeforeDraw(t *testing.T) {
	uc, _, _, _, _, _ := channelUC(t) // комната open
	_, err := uc.SetGiftReady(context.Background(), "abcdefgh", tokAuth, true)
	assert.ErrorIs(t, err, usecase.ErrSantaNotDrawn)
}

func TestSetGiftReady_RedrawMeanwhile(t *testing.T) {
	e := newChatEnv(t)
	e.sr.On("SetGiftReady", mock.Anything, e.room.ID, e.p.ID, true).Return(repo.ErrStatusMismatch)
	_, err := e.uc.SetGiftReady(context.Background(), "abcdefgh", tokAuth, true)
	assert.ErrorIs(t, err, usecase.ErrSantaNotDrawn)
}
```

(в импорт `gift_test.go` добавить `"github.com/google/uuid"` — нужен для `map[uuid.UUID]int`.)

В `internal/usecase/santa/santa_test.go` после `TestGetRoom_HidesWishesText`:

```go
func TestGetRoom_CountsGiftsReadyWithoutNames(t *testing.T) {
	sr, _, uc := newUC()
	owner := uuid.New()
	room := drawnRoom(owner)
	sr.On("GetRoomByID", mock.Anything, room.ID).Return(room, nil)
	sr.On("ListParticipants", mock.Anything, room.ID).Return([]entity.SantaParticipant{
		{ID: uuid.New(), RoomID: room.ID, Name: "Аня", GiftReady: true},
		{ID: uuid.New(), RoomID: room.ID, Name: "Боря", GiftReady: true},
		{ID: uuid.New(), RoomID: room.ID, Name: "Вера"},
	}, nil)

	details, err := uc.GetRoom(ctx, owner, room.ID)

	require.NoError(t, err)
	assert.Equal(t, 2, details.GiftsReady)
	raw, err := json.Marshal(details.Participants)
	require.NoError(t, err)
	assert.NotContains(t, string(raw), "giftReady", "кто именно готов — организатору не видно")
}
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `go test ./internal/usecase/santa/ -run 'GiftReady|GiftsReady' -v`
Expected: FAIL — нет `SetGiftReady` у use case, нет поля `GiftsReady`.

- [ ] **Step 4: Use case**

Создать `internal/usecase/santa/gift.go`:

```go
package santa

import (
	"context"
	"errors"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
)

func (uc *santaUseCase) SetGiftReady(ctx context.Context, slug string, auth usecase.SantaAuth, ready bool) (usecase.SantaMe, error) {
	room, p, err := uc.participantBySlug(ctx, slug, auth)
	if err != nil {
		return usecase.SantaMe{}, err
	}
	if room.Status != entity.SantaRoomDrawn {
		return usecase.SantaMe{}, usecase.ErrSantaNotDrawn
	}
	if err := uc.santa.SetGiftReady(ctx, room.ID, p.ID, ready); err != nil {
		switch {
		case errors.Is(err, repo.ErrNotFound):
			return usecase.SantaMe{}, usecase.ErrSantaNotInDraw
		case errors.Is(err, repo.ErrStatusMismatch):
			return usecase.SantaMe{}, usecase.ErrSantaNotDrawn
		}
		return usecase.SantaMe{}, err
	}
	p.GiftReady = ready
	return uc.me(ctx, room, p)
}
```

`internal/usecase/santa/participant.go`, в `me` литерал `usecase.SantaMe{…}` дополнить полем `GiftReady: p.GiftReady,`.

`internal/usecase/santa/santa.go`, в `GetRoom` цикл и возврат заменить:

```go
	views := make([]usecase.SantaParticipantView, len(ps))
	giftsReady := 0
	for i, p := range ps {
		views[i] = usecase.SantaParticipantView{
			ID: p.ID, Name: p.Name, HasWishes: p.Wishes != "", HasWishlist: p.WishlistURL != "", Ready: p.Ready(),
			IsOwner: p.UserID != nil && *p.UserID == room.OwnerID, CreatedAt: p.CreatedAt,
		}
		if p.GiftReady {
			giftsReady++
		}
	}
	return usecase.SantaRoomDetails{Room: room, Participants: views, GiftsReady: giftsReady}, nil
```

- [ ] **Step 5: Падающие тесты контроллера**

В конец `internal/controller/restapi/v1/santa_test.go`:

```go
func TestSantaGiftReady(t *testing.T) {
	m := &MockSantaUC{}
	m.On("SetGiftReady", mock.Anything, "AbCd2345", usecase.SantaAuth{Token: "tok"}, true).
		Return(usecase.SantaMe{Name: "Аня", GiftReady: true}, nil)
	req := jsonReq("/api/v1/santa/r/AbCd2345/me/gift", `{"ready":true}`)
	req.Method = http.MethodPut
	req.Header.Set(v1.SantaTokenHeader, "tok")

	status, body := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusOK, status)
	assert.Contains(t, body, `"giftReady":true`)
}

func TestSantaGiftReady_NotInDraw(t *testing.T) {
	m := &MockSantaUC{}
	m.On("SetGiftReady", mock.Anything, mock.Anything, mock.Anything, false).
		Return(usecase.SantaMe{}, usecase.ErrSantaNotInDraw)
	req := jsonReq("/api/v1/santa/r/AbCd2345/me/gift", `{"ready":false}`)
	req.Method = http.MethodPut

	status, body := doReq(t, newSantaApp(m), req)

	assert.Equal(t, http.StatusConflict, status)
	assert.Contains(t, body, usecase.ErrSantaNotInDraw.Error())
}
```

Run: `go test ./internal/controller/restapi/v1/ -run SantaGiftReady -v`
Expected: FAIL — маршрута нет (404/405).

- [ ] **Step 6: Маршрут**

`internal/controller/restapi/v1/santa.go`, в `NewSantaRouter` после `api.Post("/r/:slug/me/chat", …)`:

```go
	api.Put("/r/:slug/me/gift", optional, h.giftReady)
```

После `sendChat`:

```go
func (h *santaHandler) giftReady(c *fiber.Ctx) error {
	var body struct {
		Ready bool `json:"ready"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	me, err := h.uc.SetGiftReady(c.Context(), c.Params("slug"), santaAuth(c), body.Ready)
	if err != nil {
		return santaError(c, err)
	}
	return c.JSON(response.Data(me))
}
```

- [ ] **Step 7: Тесты проходят**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add internal/usecase internal/controller/restapi/v1
git commit -m "feat(backend): Санта — «Подарок готов» у участника и счётчик у организатора"
```

---

## Фронтенд

### Task 3: Хелперы, типы и хуки

**Files:**
- Modify: `FRONT/shared/types.ts`, `FRONT/shared/santa.ts`, `FRONT/tests/santa.test.cjs`
- Modify: `FRONT/api/santa/index.ts`, `FRONT/api/wishlist/index.ts`

**Interfaces:**
- Consumes: ответы бэка из задачи 2; `MAIN_ORIGIN` (`shared/santa-route.ts`).
- Produces (типы): `SantaMe.giftReady: boolean`; `SantaRoomDetails.giftsReady: number`.
- Produces (`shared/santa.ts`): `santaPromoVisible(now: Date): boolean`; `serviceWishlistShortId(url: string): string | null`; `wishlistOptions(wishlists: { title: string; shortId?: string }[], mainOrigin: string): { title: string; url: string }[]`; `guestWishlistHref(shortId: string, mainOrigin: string): string` (с `?from=santa`); `isFromSanta(search: string): boolean`; `giftsReadyLabel(ready: number, total: number): string`.
- Produces (`api`): `useApiSantaGiftReady(slug: string)` — мутация с переменной `boolean`, кладёт ответ в `['santa-me', slug]`; `useApiGetAllWishlists(enabled = true)`.

- [ ] **Step 1: Падающие тесты**

В `tests/santa.test.cjs` в деструктуризацию `load('shared/santa.ts')` добавить `santaPromoVisible, serviceWishlistShortId, wishlistOptions, guestWishlistHref, isFromSanta, giftsReadyLabel`, а в конец файла:

```js
test('сезон карточки Санты: с 1 ноября по 31 декабря', () => {
  assert.equal(santaPromoVisible(new Date(2026, 9, 31, 23, 59)), false)
  assert.equal(santaPromoVisible(new Date(2026, 10, 1, 0, 0)), true)
  assert.equal(santaPromoVisible(new Date(2026, 11, 31, 23, 59)), true)
  assert.equal(santaPromoVisible(new Date(2027, 0, 1, 0, 0)), false)
  assert.equal(santaPromoVisible(new Date(2027, 5, 15)), false)
})

test('короткий id вишлиста сервиса', () => {
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/s/abc123'), 'abc123')
  assert.equal(serviceWishlistShortId('https://www.prosto-namekni.ru/s/abc123/'), 'abc123')
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/s/abc123?x=1'), 'abc123')
  assert.equal(serviceWishlistShortId('http://prosto-namekni.ru/s/abc123'), 'abc123')
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru.evil.com/s/abc123'), null)
  assert.equal(serviceWishlistShortId('https://evil.com/s/abc123'), null)
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/wishlist/abc'), null)
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/s/'), null)
  assert.equal(serviceWishlistShortId('мусор'), null)
  assert.equal(serviceWishlistShortId(''), null)
})

test('свои вишлисты для выбора: только с коротким адресом', () => {
  assert.deepEqual(wishlistOptions([
    { title: 'День рождения', shortId: 'abc' },
    { title: 'Черновик' },
    { title: '  ', shortId: 'def' },
  ], 'https://prosto-namekni.ru'), [
    { title: 'День рождения', url: 'https://prosto-namekni.ru/s/abc' },
    { title: 'Без названия', url: 'https://prosto-namekni.ru/s/def' },
  ])
})

test('гостевая страница вишлиста из конверта', () => {
  assert.equal(guestWishlistHref('abc', 'https://prosto-namekni.ru'), 'https://prosto-namekni.ru/s/abc?from=santa')
  assert.equal(isFromSanta('?from=santa'), true)
  assert.equal(isFromSanta('?x=1&from=santa'), true)
  assert.equal(isFromSanta('?from=other'), false)
  assert.equal(isFromSanta(''), false)
})

test('счётчик готовых подарков', () => {
  assert.equal(giftsReadyLabel(0, 5), 'Подарки готовы у 0 из 5')
  assert.equal(giftsReadyLabel(5, 5), 'Подарки готовы у всех 5')
})
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `node --test tests/santa.test.cjs`
Expected: FAIL — `santaPromoVisible is not a function` и т. п.

- [ ] **Step 3: Хелперы**

В конец `shared/santa.ts`:

```ts
/** Карточку «Устройте Тайного Санту» показываем с 1 ноября по 31 декабря. */
export function santaPromoVisible(now: Date): boolean {
  return now.getMonth() >= 10
}

const SERVICE_HOSTS = new Set(['prosto-namekni.ru', 'www.prosto-namekni.ru'])

/** Вишлист с нашего сервиса — короткий id из «https://prosto-namekni.ru/s/<id>»; иначе null. */
export function serviceWishlistShortId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!SERVICE_HOSTS.has(u.hostname)) return null
    const m = /^\/s\/([A-Za-z0-9_-]+)\/?$/.exec(u.pathname)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/** Свои вишлисты для выбора при вступлении: только опубликованные короткой ссылкой. */
export function wishlistOptions(wishlists: { title: string; shortId?: string }[], mainOrigin: string): { title: string; url: string }[] {
  return wishlists
    .filter(w => w.shortId)
    .map(w => ({ title: w.title.trim() || 'Без названия', url: `${mainOrigin}/s/${w.shortId}` }))
}

/** Гостевая страница вишлиста подопечного: from=santa включает анонимную бронь. */
export function guestWishlistHref(shortId: string, mainOrigin: string): string {
  return `${mainOrigin}/s/${encodeURIComponent(shortId)}?from=santa`
}

export function isFromSanta(search: string): boolean {
  return new URLSearchParams(search).get('from') === 'santa'
}

/** «Подарки готовы у 3 из 7». Только число: кто именно — тайна. */
export function giftsReadyLabel(ready: number, total: number): string {
  return ready === total && total > 0 ? `Подарки готовы у всех ${total}` : `Подарки готовы у ${ready} из ${total}`
}
```

- [ ] **Step 4: Типы**

`shared/types.ts`: в `SantaMe` после `chat` —

```ts
  /** Участник отметил, что подарок подопечному готов. */
  giftReady: boolean
```

`SantaRoomDetails` заменить:

```ts
/** giftsReady — сколько отметили «Подарок готов»; без имён: пары тайные. */
export type SantaRoomDetails = { room: SantaRoom; participants: SantaParticipantView[]; giftsReady: number }
```

- [ ] **Step 5: Хуки**

`api/wishlist/index.ts`, `useApiGetAllWishlists` заменить:

```ts
export const useApiGetAllWishlists = (enabled = true) => {
  return useQuery({
    queryKey: [ 'wishlists' ],
    enabled,
    queryFn: async () => api.get<{ data: Wishlist[] }>('wishlists'),
  })
}
```

В конец `api/santa/index.ts`:

```ts
export const useApiSantaGiftReady = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaMe>, AxiosError, boolean>({
    mutationFn: ready => api.put(`santa/r/${seg(slug)}/me/gift`, { ready }, { headers: santaHeaders(slug) }),
    onSuccess: res => queryClient.setQueryData(['santa-me', slug], res),
  })
}
```

- [ ] **Step 6: Проверки**

Run: `node --test tests/santa.test.cjs` — PASS; `pnpm exec tsc --noEmit` — 0 ошибок; `pnpm lint` — 0 ошибок.

- [ ] **Step 7: Commit**

```bash
git add shared/types.ts shared/santa.ts tests/santa.test.cjs api/santa/index.ts api/wishlist/index.ts
git commit -m "feat(front): Санта — хелперы и хуки этапа 4: сезон карточки, вишлисты сервиса, «Подарок готов»"
```

---

### Task 4: Полный лендинг, SEO и JSON-LD

**Files:**
- Create: `FRONT/app/santa/components/sample-envelope.tsx`
- Modify: `FRONT/app/santa/page.tsx`, `FRONT/app/santa/layout.tsx`

**Interfaces:**
- Consumes: `JsonLd` (`components/json-ld.tsx`), `santaHref`, `SANTA_ORIGIN`, `MAIN_ORIGIN`.
- Produces: страница лендинга с секциями «герой», «Четыре шага», «Вишлист», «Вопросы», финальный призыв; `metadata` лендинга с canonical и Open Graph; JSON-LD `WebApplication` и `FAQPage`.

- [ ] **Step 1: Пример конверта для героя**

Создать `app/santa/components/sample-envelope.tsx`:

```tsx
import { MessageCircle, Star } from 'lucide-react'

/** Картинка героя: как выглядит конверт участника. Вымышленные данные, без действий. */
export function SampleEnvelope() {
  return (
    <figure className="relative mx-auto w-full max-w-sm" aria-label="Пример: так участник увидит своего подопечного">
      <div aria-hidden className="absolute inset-0 -rotate-6 rounded-sheet border border-border bg-card" />
      <div aria-hidden className="relative flex rotate-2 flex-col gap-5 rounded-sheet border border-border bg-background p-7 shadow-overlay">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow uppercase text-muted-foreground">Новый год в отделе</span>
          <Star className="size-5 text-tone-gold" fill="currentColor" />
        </div>
        <div>
          <p className="text-body text-muted-foreground">Вы — Тайный Санта для</p>
          <p className="mt-1 text-display-sm">Маши К.</p>
        </div>
        <p className="rounded-control-lg bg-card p-4 text-body">
          «Люблю зелёный чай, настолки и всё для рисования. Размер свитера — M»
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="flex h-control-sm items-center rounded-tag bg-tone-pink/15 px-3 text-label font-semibold text-tone-pink">до 3 000 ₽</span>
          <span className="flex h-control-sm items-center rounded-tag bg-tone-gold/15 px-3 text-label font-semibold text-tone-gold">обмен 27 декабря</span>
        </div>
        <span className="flex h-control-lg items-center justify-center gap-2 rounded-control-lg border border-border bg-card text-body font-semibold">
          <MessageCircle className="size-4" />
          Спросить анонимно
        </span>
      </div>
    </figure>
  )
}
```

- [ ] **Step 2: Лендинг**

`app/santa/page.tsx` заменить целиком:

```tsx
import { JsonLd } from '@/components/json-ld'
import { Button } from '@/components/ui/button'
import { MAIN_ORIGIN, SANTA_ORIGIN, santaHref } from '@/shared/santa-route'
import { Check, Gift, ListChecks } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SampleEnvelope } from './components/sample-envelope'

const LANDING_URL = SANTA_ORIGIN ? `${SANTA_ORIGIN}/` : 'https://santa.prosto-namekni.ru/'

export const metadata: Metadata = {
  title: { absolute: 'Тайный Санта онлайн — жеребьёвка без бумажек | Просто намекни' },
  description:
    'Бесплатная онлайн-жеребьёвка Тайного Санты для офиса, семьи и друзей: комната по ссылке, пожелания и вишлисты, результат в Telegram или на почту, анонимный чат с подопечным.',
  alternates: { canonical: LANDING_URL },
  openGraph: {
    type: 'website',
    url: LANDING_URL,
    title: 'Тайный Санта онлайн — без бумажек в шапке',
    description: 'Соберите своих в комнату — мы тайно распределим, кто кому дарит, и сообщим каждому.',
    siteName: 'Просто намекни',
    locale: 'ru_RU',
  },
}

const STEPS = [
  { n: '01', tone: 'text-tone-pink', title: 'Создайте комнату', text: 'Название, бюджет и дата обмена. Жеребьёвку запустите сами или назначьте на день и час.' },
  { n: '02', tone: 'text-tone-gold', title: 'Позовите своих', text: 'Отправьте ссылку или QR-код. Каждый пишет имя, пожелания и выбирает, куда прислать результат: Telegram или почта.' },
  { n: '03', tone: 'text-success', title: 'Жеребьёвка', text: 'Пары складываются в один круг: каждый дарит одному и получает от другого. Себя не вытянуть.' },
  { n: '04', tone: 'text-tone-cyan', title: 'Узнайте подопечного', text: 'Придёт сообщение: кому вы дарите и что он любит. Уточнить размер можно в анонимном чате.' },
] as const

const FAQ = [
  {
    q: 'Это бесплатно?',
    a: 'Да. Комнаты, жеребьёвка, уведомления и анонимный чат бесплатны, без ограничения на число участников.',
  },
  {
    q: 'Участникам нужно регистрироваться?',
    a: 'Нет. Участник вступает по ссылке и получает личную ссылку на свою карточку. Аккаунт нужен только организатору.',
  },
  {
    q: 'Как участник узнает, кому дарит?',
    a: 'Каждый подключает Telegram-бота или подтверждает почту. Сразу после жеребьёвки туда придёт имя подопечного и его пожелания; то же видно в конверте по ссылке.',
  },
  {
    q: 'Организатор увидит пары?',
    a: 'Нет. Пары тайные для всех, включая организатора. Он видит только, кто готов к жеребьёвке и сколько подарков уже готово.',
  },
  {
    q: 'Можно задать подопечному вопрос?',
    a: 'Да, в анонимном чате на странице комнаты или ответом на сообщение бота. Подопечный не узнает, кто вы, пока не придёт время дарить.',
  },
  {
    q: 'Что если кто-то присоединится позже?',
    a: 'Пока жеребьёвки не было, вступить может любой по ссылке. После неё состав не меняется — организатор может перезапустить жеребьёвку, и все получат новых подопечных.',
  },
] as const

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Тайный Санта — Просто намекни',
    url: LANDING_URL,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    inLanguage: 'ru',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
    publisher: { '@type': 'Organization', name: 'Просто намекни', url: MAIN_ORIGIN },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
]

export default function SantaLanding() {
  return (
    <div className="space-y-20">
      {jsonLd.map(data => <JsonLd key={String(data['@type'])} data={data} />)}

      <section className="santa-snow -mx-4 grid items-center gap-12 px-4 py-16 md:-mx-16 md:grid-cols-2 md:px-16 md:py-24">
        <div className="space-y-7">
          <p className="text-eyebrow uppercase text-tone-gold">Новый год · офис · семья · друзья</p>
          <h1 className="text-display-sm md:text-display">
            Тайный Санта
            <br />
            <span className="text-primary">без бумажек</span>
            <br />
            в шапке
          </h1>
          <p className="max-w-xl text-body-lg text-muted-foreground">
            Соберите своих в комнату. Каждый напишет, что хочет получить, а мы тайно распределим пары
            и сообщим каждому, кому он дарит, — в Telegram или на почту.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="festive" size="xl">
              <Link href={santaHref('/rooms/new')}>
                <Gift aria-hidden />
                Создать комнату
              </Link>
            </Button>
            <Button asChild variant="secondary" size="xl">
              <a href="#how">Как это работает</a>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Участникам не нужна регистрация</li>
            <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Никто не вытянет сам себя</li>
          </ul>
        </div>
        <SampleEnvelope />
      </section>

      <section id="how" className="scroll-mt-24 space-y-8" aria-labelledby="how-title">
        <h2 id="how-title" className="text-title-lg md:text-display-md">Четыре шага до праздника</h2>
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

      <section className="flex flex-col gap-6 rounded-sheet border border-border bg-card p-8 md:flex-row md:items-center md:gap-10 md:p-10">
        <span className="flex size-control-xl shrink-0 items-center justify-center rounded-card bg-tone-cyan/15 text-tone-cyan">
          <ListChecks className="size-7" aria-hidden />
        </span>
        <div className="flex-1 space-y-2">
          <h2 className="text-title">Уже есть вишлист в «Просто намекни»?</h2>
          <p className="text-body text-muted-foreground">
            Приложите его к пожеланиям — Санта увидит конкретные подарки и сможет тайно забронировать один из них.
          </p>
        </div>
        <Button asChild variant="secondary" size="lg">
          <a href={`${MAIN_ORIGIN}/wishlist`}>Мои вишлисты</a>
        </Button>
      </section>

      <section className="space-y-8" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-title-lg md:text-display-md">Вопросы</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map(item => (
            <details key={item.q} className="group rounded-card border border-border bg-card p-6">
              <summary className="cursor-pointer list-none text-title-xs marker:hidden">{item.q}</summary>
              <p className="mt-3 text-body text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 py-10 text-center">
        <h2 className="text-title-lg md:text-display-md">Соберите своих до праздников</h2>
        <p className="max-w-xl text-body-lg text-muted-foreground">Комната создаётся за пару минут, а ссылку можно отправить в общий чат прямо сейчас.</p>
        <Button asChild variant="festive" size="xl">
          <Link href={santaHref('/rooms/new')}>
            <Gift aria-hidden />
            Создать комнату
          </Link>
        </Button>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Метаданные раздела**

`app/santa/layout.tsx`, в `metadata` после `description` добавить:

```ts
  applicationName: 'Тайный Санта — Просто намекни',
  openGraph: { siteName: 'Просто намекни', locale: 'ru_RU', type: 'website' },
```

- [ ] **Step 4: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `node tests/token-audit.cjs app/santa components shared`
Expected: чисто, аудит `всего 0`.
Run: `pnpm build` — сборка проходит (лендинг статический: нет хуков и `use client`).

- [ ] **Step 5: Commit**

```bash
git add app/santa/page.tsx app/santa/layout.tsx app/santa/components/sample-envelope.tsx
git commit -m "feat(front): Санта — полный лендинг по макету, SEO-метаданные и JSON-LD"
```

---

### Task 5: Ссылки с блога

**Files:**
- Create: `FRONT/content/blog/secret-santa.mdx`
- Modify: `FRONT/content/blog/index.ts`, `FRONT/content/blog/wishlist-gifts.mdx`

**Interfaces:**
- Consumes: механизм статей блога (`lib/blog.ts`, `app/blog/[slug]/page.tsx` импортирует `@/content/blog/<slug>.mdx`).
- Produces: статья `/blog/secret-santa` со ссылками на `https://santa.prosto-namekni.ru/`.

- [ ] **Step 1: Статья**

Создать `content/blog/secret-santa.mdx`:

```mdx
# Тайный Санта онлайн: как провести жеребьёвку без бумажек

Тайный Санта — простой способ обменяться подарками в большой компании: каждый дарит одному человеку, а не всем сразу. Бумажки в шапке работают, пока все в одной комнате. Если коллеги на удалёнке, а родственники в разных городах, удобнее провести жеребьёвку онлайн.

## Как это устроено в «Просто намекни»

1. **Организатор создаёт комнату** на [santa.prosto-namekni.ru](https://santa.prosto-namekni.ru/): название, бюджет и дата обмена. Жеребьёвку можно запустить вручную или назначить на день и час.
2. **Участники вступают по ссылке** — регистрация им не нужна. Каждый пишет имя, пожелания и может приложить свой вишлист.
3. **Каждый выбирает, куда прислать результат:** Telegram-бот или почта.
4. **Жеребьёвка складывает всех в один круг.** Никто не вытянет сам себя, и не будет замкнутых пар внутри компании.
5. **Каждый узнаёт подопечного** — в Telegram или письмом, и в конверте по личной ссылке.

## Что делать, если не знаешь, что подарить

У подопечного можно спросить анонимно: в чате на странице комнаты или ответом на сообщение бота. Он не узнает, кто ты, до самого обмена.

Если подопечный приложил вишлист из «Просто намекни», можно сразу забронировать подарок из него — бронь будет анонимной, и никто другой не купит то же самое.

## Советы организатору

- **Назначь бюджет.** Одинаковый лимит снимает неловкость: никто не потратит втрое больше остальных.
- **Позови заранее.** За две-три недели до обмена все успеют написать пожелания и заказать подарок с доставкой.
- **Проверь, кто готов.** В комнате видно, кто подключил Telegram или почту, — без этого человек не попадёт в жеребьёвку. Кнопка «Напомнить» пришлёт просьбу написать пожелания.

[Создать комнату Тайного Санты →](https://santa.prosto-namekni.ru/)
```

- [ ] **Step 2: Запись в списке статей**

`content/blog/index.ts`, в начало массива `blogPosts`:

```ts
  {
    slug: 'secret-santa',
    title: 'Тайный Санта онлайн: как провести жеребьёвку без бумажек',
    description: 'Как устроить Тайного Санту для офиса, семьи или друзей онлайн: комната по ссылке, жеребьёвка, анонимный чат и подарки из вишлиста.',
    date: '2026-10-08',
  },
```

- [ ] **Step 3: Ссылка из соседней статьи**

В конец `content/blog/wishlist-gifts.mdx`:

```mdx

## А если подарков много, а дарящих — один на всех?

Для большой компании подойдёт Тайный Санта: каждый дарит одному человеку, а вишлист подскажет, что именно. Как провести жеребьёвку онлайн — [в отдельной статье](/blog/secret-santa).
```

- [ ] **Step 4: Проверки**

Run: `pnpm build` — страница `/blog/secret-santa` собирается.
Run: `node tests/token-audit.cjs content app/blog` — `всего 0`.

- [ ] **Step 5: Commit**

```bash
git add content/blog
git commit -m "feat(front): статья о Тайном Санте в блоге со ссылками на поддомен"
```

---

### Task 6: Карточка «Устройте Тайного Санту» в кабинете

**Files:**
- Create: `FRONT/app/wishlist/components/santa-promo.tsx`
- Modify: `FRONT/app/wishlist/page.tsx`

**Interfaces:**
- Consumes: `santaPromoVisible` (задача 3); `SANTA_ORIGIN`, `santaHref`.
- Produces: `SantaPromo()` — карточка; рендерит `null` вне сезона. Время берётся после монтирования (не на сервере): иначе разошлись бы серверный и клиентский HTML.

- [ ] **Step 1: Карточка**

Создать `app/wishlist/components/santa-promo.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { santaPromoVisible } from '@/shared/santa'
import { SANTA_ORIGIN, santaHref } from '@/shared/santa-route'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

/** «Устройте Тайного Санту» — с 1 ноября по 31 декабря (макет «Переход из вишлиста»). */
export function SantaPromo() {
  const [visible, setVisible] = useState(false)
  useEffect(() => setVisible(santaPromoVisible(new Date())), [])
  if (!visible) return null

  return (
    <section className="dark santa santa-snow flex flex-col gap-5 rounded-card border border-border bg-card p-6 text-foreground md:flex-row md:items-center md:gap-8 md:p-8">
      <span className="flex size-control-xl shrink-0 items-center justify-center rounded-card bg-festive text-tone-gold">
        <Star className="size-7" fill="currentColor" aria-hidden />
      </span>
      <div className="flex-1 space-y-2">
        <p className="text-eyebrow uppercase text-tone-gold">Новое к Новому году</p>
        <h3 className="text-title">Устройте Тайного Санту</h3>
        <p className="text-body text-muted-foreground">
          Соберите друзей или коллег — мы тайно распределим, кто кому дарит. Ваши вишлисты подтянутся сами.
        </p>
      </div>
      <Button asChild variant="festive" size="lg">
        <a href={`${SANTA_ORIGIN}${santaHref('/rooms/new')}`}>Создать комнату</a>
      </Button>
    </section>
  )
}
```

- [ ] **Step 2: Место в кабинете**

`app/wishlist/page.tsx`:

1. Импорт: `import { SantaPromo } from '@/app/wishlist/components/santa-promo'`.
2. В основном `return` после блока заголовка (закрывающий `</div>` блока с «Мои вишлисты» и кнопкой «Новый вишлист») вставить `<SantaPromo />`.
3. В ветке пустого кабинета (`wishlists.length === 0`) внутрь корневого `div` последним элементом вставить `<div className="w-full max-w-2xl text-left"><SantaPromo /></div>`.

- [ ] **Step 3: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `node tests/token-audit.cjs app/wishlist` — чисто, `всего 0`.

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/components/santa-promo.tsx app/wishlist/page.tsx
git commit -m "feat(front): карточка «Устройте Тайного Санту» в кабинете с 1 ноября по 31 декабря"
```

---

### Task 7: Вошедший участник выбирает свой вишлист

**Files:**
- Create: `FRONT/app/santa/r/[slug]/components/wishlist-picker.tsx`
- Modify: `FRONT/app/santa/r/[slug]/components/profile-form.tsx`, `join-form.tsx`, `my-card.tsx`

**Interfaces:**
- Consumes: `wishlistOptions`, `useApiGetAllWishlists(enabled)` (задача 3); `useApiGetMyProfile`; `MAIN_ORIGIN`.
- Produces: `WishlistPicker({ value, onChange, options })`; `ProfileForm` принимает `wishlists?: { title: string; url: string }[]` — непустой список заменяет поле ссылки выбором; хук `useMyWishlistOptions()` в `wishlist-picker.tsx` → `{ title, url }[]` (пусто без входа).

- [ ] **Step 1: Выбор вишлиста**

Создать `app/santa/r/[slug]/components/wishlist-picker.tsx`:

```tsx
'use client'

import { useApiGetMyProfile } from '@/api/user'
import { useApiGetAllWishlists } from '@/api/wishlist'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { wishlistOptions } from '@/shared/santa'
import { MAIN_ORIGIN } from '@/shared/santa-route'
import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'

export type WishlistOption = { title: string; url: string }

/** Свои вишлисты вошедшего пользователя; без входа — пусто. */
export function useMyWishlistOptions(): WishlistOption[] {
  const profile = useApiGetMyProfile()
  const signedIn = Boolean(profile.data?.user)
  const { data } = useApiGetAllWishlists(signedIn)
  return useMemo(() => (signedIn ? wishlistOptions(data?.data ?? [], MAIN_ORIGIN) : []), [signedIn, data])
}

const OPTION = 'flex min-h-control-lg w-full items-center gap-3 rounded-control-lg border px-4 py-2 text-left text-body transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Вишлист из своих, без вишлиста или чужая ссылка. value — итоговая ссылка ('' — без вишлиста). */
export function WishlistPicker({ value, onChange, options }: {
  value: string
  onChange: (url: string) => void
  options: WishlistOption[]
}) {
  const own = options.some(o => o.url === value)
  const [custom, setCustom] = useState(value !== '' && !own)

  const pick = (url: string) => {
    setCustom(false)
    onChange(url)
  }
  const item = (selected: boolean) => cn(OPTION, selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50')

  return (
    <div role="group" aria-label="Вишлист" className="space-y-2">
      {options.map(o => (
        <button key={o.url} type="button" aria-pressed={value === o.url && !custom} className={item(value === o.url && !custom)} onClick={() => pick(o.url)}>
          <span className="flex-1 truncate font-semibold">{o.title}</span>
          {value === o.url && !custom && <Check className="size-4 text-primary" aria-hidden />}
        </button>
      ))}
      <button type="button" aria-pressed={!custom && value === ''} className={item(!custom && value === '')} onClick={() => pick('')}>
        <span className="flex-1">Без вишлиста</span>
      </button>
      <button type="button" aria-pressed={custom} className={item(custom)} onClick={() => { setCustom(true); if (own) onChange('') }}>
        <span className="flex-1">Другая ссылка</span>
      </button>
      {custom && (
        <Input
          type="url" inputMode="url" placeholder="https://…" aria-label="Ссылка на вишлист"
          value={value} onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Форма профиля**

`app/santa/r/[slug]/components/profile-form.tsx`:

1. Импорт: `import { type WishlistOption, WishlistPicker } from './wishlist-picker'`.
2. В пропсы добавить `wishlists = []` с типом `wishlists?: WishlistOption[]` и комментарием `/** Свои вишлисты вошедшего — выбором вместо ссылки. */`.
3. Поле `wishlistUrl` заменить:

```tsx
        <FormField control={form.control} name="wishlistUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>{wishlists.length > 0 ? 'Вишлист — необязательно' : 'Ссылка на вишлист — необязательно'}</FormLabel>
            {wishlists.length > 0 ? (
              <WishlistPicker value={field.value} onChange={field.onChange} options={wishlists} />
            ) : (
              <FormControl><Input type="url" inputMode="url" placeholder="https://prosto-namekni.ru/s/…" {...field} /></FormControl>
            )}
            {wishlists.length > 0 && <p className="text-caption text-muted-foreground">Санта увидит подарки и сможет тайно забронировать один из них.</p>}
            <FormMessage />
          </FormItem>
        )} />
```

- [ ] **Step 3: Вступление и карточка участника**

`join-form.tsx`: импорт `import { useMyWishlistOptions } from './wishlist-picker'`; в компоненте `const wishlists = useMyWishlistOptions()`; `ProfileForm` получает `wishlists={wishlists}`, а `key={name}` → `key={`${name}:${wishlists.length}`}` (список приходит после профиля — форма пересобирается с ним). Абзац под формой дополнить первой строкой для гостя:

```tsx
      {!profile?.user && (
        <p className="text-body-sm text-muted-foreground">
          Есть аккаунт в «Просто намекни»? Войдите — имя и вишлист подставятся сами.
        </p>
      )}
```

`my-card.tsx`: импорт `import { useMyWishlistOptions } from './wishlist-picker'`; `const wishlists = useMyWishlistOptions()`; `ProfileForm` получает `wishlists={wishlists}` и `key={wishlists.length}`.

- [ ] **Step 4: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `node tests/token-audit.cjs app/santa` — чисто, `всего 0`.

Ручная проверка: войти, открыть приглашение — имя из профиля, список своих вишлистов; выбрать — после «Вступить» в карточке участника выбран тот же вишлист. В инкогнито — поле ссылки и подсказка «Войдите».

- [ ] **Step 5: Commit**

```bash
git add "app/santa/r/[slug]/components"
git commit -m "feat(front): Санта — вошедший участник выбирает вишлист из своих"
```

---

### Task 8: QR-код приглашения

**Files:**
- Create: `FRONT/app/santa/rooms/[id]/components/invite-qr.tsx`
- Modify: `FRONT/app/santa/rooms/[id]/page.tsx`

**Interfaces:**
- Consumes: `qrcode.react` (`QRCodeCanvas`), `components/ui/dialog.tsx`.
- Produces: `InviteQr({ link, title })` — кнопка «QR-код для офиса» и окно с кодом и «Скачать PNG».

- [ ] **Step 1: Окно с кодом**

Создать `app/santa/rooms/[id]/components/invite-qr.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef } from 'react'

/** QR-код ссылки-приглашения: распечатать в офисе или показать с экрана. */
export function InviteQr({ link, title }: { link: string; title: string }) {
  const box = useRef<HTMLDivElement>(null)

  const download = () => {
    const canvas = box.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'santa-qr.png'
    a.click()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full"><QrCode aria-hidden />QR-код для офиса</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR-код приглашения</DialogTitle>
          <DialogDescription>Наведите камеру телефона — откроется комната «{title}».</DialogDescription>
        </DialogHeader>
        <div ref={box} className="mx-auto rounded-card bg-white p-4">
          <QRCodeCanvas value={link} size={240} marginSize={2} title={`Приглашение в комнату «${title}»`} />
        </div>
        <Button onClick={download}>Скачать PNG</Button>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Кнопка в «Позвать людей»**

`app/santa/rooms/[id]/page.tsx`: импорт `import { InviteQr } from './components/invite-qr'`; в секции «Позвать людей» после `{origin && <CopyField … />}` добавить `{origin && open && <InviteQr link={inviteLink} title={room.title} />}`.

- [ ] **Step 3: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `node tests/token-audit.cjs app/santa` — чисто, `всего 0`.
Ручная проверка: кнопка открывает окно, код читается камерой телефона, «Скачать PNG» сохраняет картинку.

- [ ] **Step 4: Commit**

```bash
git add "app/santa/rooms/[id]"
git commit -m "feat(front): Санта — QR-код приглашения в комнате организатора"
```

---

### Task 9: «Подарок готов» у участника, счётчик у организатора, вишлист подопечного

**Files:**
- Create: `FRONT/app/santa/r/[slug]/components/gift-ready.tsx`, `FRONT/app/santa/r/[slug]/components/ward-wishlist.tsx`
- Modify: `FRONT/app/santa/r/[slug]/components/envelope.tsx`, `FRONT/app/santa/r/[slug]/page.tsx`
- Modify: `FRONT/app/santa/rooms/[id]/page.tsx`
- Modify: `FRONT/app/s/[shortId]/components/gifts-section.tsx`

**Interfaces:**
- Consumes: `useApiSantaGiftReady`, `giftsReadyLabel`, `serviceWishlistShortId`, `guestWishlistHref`, `isFromSanta`, `SantaMe.giftReady`, `SantaRoomDetails.giftsReady` (задача 3).
- Produces: `GiftReady({ slug, ready })`; `WardWishlist({ name, url })`; `Envelope` больше не рисует кнопку вишлиста сам — `WardWishlist`.

- [ ] **Step 1: Отметка «Подарок готов»**

Создать `app/santa/r/[slug]/components/gift-ready.tsx`:

```tsx
'use client'

import { useApiSantaGiftReady } from '@/api/santa'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage } from '@/shared/santa'

export function GiftReady({ slug, ready }: { slug: string; ready: boolean }) {
  const mark = useApiSantaGiftReady(slug)
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-control-lg border border-border bg-card px-4 py-3.5">
      <Switch
        checked={ready}
        disabled={mark.isPending}
        onCheckedChange={value => mark.mutate(value, {
          onSuccess: () => toast({ title: value ? 'Отметили: подарок готов' : 'Отметку сняли' }),
          onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
        })}
      />
      <span className="text-body font-semibold">Подарок готов</span>
      <span className="ml-auto text-caption text-muted-foreground">организатор видит только число</span>
    </label>
  )
}
```

(проверить сигнатуру `components/ui/switch.tsx`: Radix Switch — `checked`, `onCheckedChange`, `disabled`.)

- [ ] **Step 2: Вишлист подопечного**

Создать `app/santa/r/[slug]/components/ward-wishlist.tsx`:

```tsx
import { Button } from '@/components/ui/button'
import { guestWishlistHref, serviceWishlistShortId } from '@/shared/santa'
import { MAIN_ORIGIN } from '@/shared/santa-route'
import { ChevronRight, ExternalLink, Gift } from 'lucide-react'

const isHttpUrl = (value: string) => /^https?:\/\/[^\s/]+/i.test(value)

/**
 * Вишлист с нашего сервиса — гостевой страницей с анонимной бронью (from=santa);
 * чужая ссылка — как есть.
 */
export function WardWishlist({ name, url }: { name: string; url: string }) {
  if (!url || !isHttpUrl(url)) return null
  const shortId = serviceWishlistShortId(url)
  if (!shortId) {
    return (
      <Button asChild variant="secondary" size="lg">
        <a href={url} target="_blank" rel="noopener noreferrer nofollow">
          <ExternalLink aria-hidden />
          Открыть вишлист
        </a>
      </Button>
    )
  }
  return (
    <a
      href={guestWishlistHref(shortId, MAIN_ORIGIN)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 rounded-card border border-tone-cyan/40 bg-card p-4 transition-colors duration-fast hover:border-tone-cyan"
    >
      <span className="flex size-control-lg shrink-0 items-center justify-center rounded-control-lg bg-tone-cyan/15 text-tone-cyan">
        <Gift className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Вишлист: {name}</span>
        <span className="block text-body-sm text-muted-foreground">Забронируйте подарок — {name} не узнает от кого</span>
      </span>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </a>
  )
}
```

- [ ] **Step 3: Конверт**

`app/santa/r/[slug]/components/envelope.tsx`:

1. Импорты: убрать `ExternalLink` из `lucide-react` (останется `Star`) и `Button`, если больше не используется кнопкой «Открыть конверт» — `Button` остаётся. Добавить `import { WardWishlist } from './ward-wishlist'`. Удалить локальный `isHttpUrl`.
2. В открытом конверте блок `{receiver.wishlistUrl && isHttpUrl(receiver.wishlistUrl) && (<Button asChild …>…</Button>)}` заменить на `<WardWishlist name={receiver.name} url={receiver.wishlistUrl} />`.

`app/santa/r/[slug]/page.tsx`: импорт `import { GiftReady } from './components/gift-ready'`; в ветке разыгранной комнаты внутрь `Envelope` после `ChatCard`:

```tsx
          {mine.receiver && <GiftReady slug={slug} ready={mine.giftReady} />}
```

- [ ] **Step 4: Счётчик у организатора**

`app/santa/rooms/[id]/page.tsx`:

1. Импорт из `@/shared/santa` — добавить `giftsReadyLabel`.
2. `const { room, participants } = details` → `const { room, participants, giftsReady } = details`.
3. В секции «Жеребьёвка», ветка `drawn`, после абзаца «Жеребьёвка прошла…»:

```tsx
                <p className="flex items-center gap-2 text-body-sm">
                  <Gift className="size-4 text-success" aria-hidden />
                  {giftsReadyLabel(giftsReady, participants.filter(p => p.ready).length)}
                </p>
```

(`Gift` добавить в импорт из `lucide-react`.)

- [ ] **Step 5: Анонимная бронь для Санты**

`app/s/[shortId]/components/gifts-section.tsx`:

1. Импорт: `import { isFromSanta } from '@/shared/santa'`; `useEffect` — в импорт из `react`.
2. В `GiftAction` после `const [anonymous, setAnonymous] = useState(false)`:

```tsx
  const [santa, setSanta] = useState(false)
  // Пришли из конверта Тайного Санты — бронь по умолчанию без имени.
  useEffect(() => {
    if (isFromSanta(window.location.search)) {
      setSanta(true)
      setAnonymous(true)
    }
  }, [])
```

3. В форме брони после чекбокса «Анонимно»:

```tsx
      {santa && <p className="text-caption text-muted-foreground">Вы Тайный Санта — бронь без имени, подопечный не узнает, кто дарит.</p>}
```

- [ ] **Step 6: Проверки**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `node tests/token-audit.cjs app/santa app/s components shared` — чисто, `всего 0`.

Ручная проверка: в открытом конверте подопечного с вишлистом сервиса — карточка «Вишлист: Маша»; по ней — гостевая страница, «Забронировать» → «Анонимно» отмечено, подсказка про Санту. Переключатель «Подарок готов» → у организатора «Подарки готовы у 1 из N»; перезапуск жеребьёвки — переключатель снят.

- [ ] **Step 7: Commit**

```bash
git add "app/santa/r/[slug]" "app/santa/rooms/[id]/page.tsx" "app/s/[shortId]/components/gifts-section.tsx"
git commit -m "feat(front): Санта — «Подарок готов», счётчик у организатора, вишлист подопечного с анонимной бронью"
```

---

### Task 10: Выкладка (делает пользователь)

- [ ] **Step 1: Бэк.** Задеплоить ветку на тестовый стек Dokploy. Новых переменных и миграций нет (`gift_ready` есть с этапа 1).
- [ ] **Step 2: Фронт.** Задеплоить; проверить `https://santa.prosto-namekni.ru/` — исходный код страницы содержит два `application/ld+json`; Rich Results Test видит `FAQPage`.
- [ ] **Step 3: Дымовая проверка:** карточка в `/wishlist` (с 1 ноября; до этого — временно подменить дату в DevTools Sensors); вступление вошедшим с выбором вишлиста; QR читается телефоном; «Подарок готов» и счётчик; бронь из конверта анонимная; статья `/blog/secret-santa` открывается, ссылка ведёт на поддомен.
- [ ] **Step 4: Финиш ветки** — `superpowers:finishing-a-development-branch` в обоих репозиториях; слияние `feature/santa-stage4` → `feature/santa`.
