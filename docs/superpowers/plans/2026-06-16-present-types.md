# Расширенные типы подарков (group/multi) + фикс описания — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить два новых типа подарка — групповой (счётчик «я хочу подарить») и многосоставной (галерея картинок + несколько ссылок), и починить обрезание описания на мобильных.

**Architecture:** Бэкенд (Go/Fiber/GORM) получает на `Present` поля `Type`, `ParticipantsCount`, `Images[]`, `Links[]` (jsonb через новый `StringSliceJSON`), два публичных роута `join`/`leave` для счётчика. Фронт (Next.js) расширяет форму селектором типа и условными полями, публичную карточку — слайдером (embla) и групповой кнопкой, и убирает `line-clamp-3` у описания.

**Tech Stack:** Go, Fiber v2, GORM, testify (бэкенд-тесты); Next.js 16, React Query, react-hook-form + zod, shadcn/ui, embla-carousel-react (фронт, без тест-фреймворка — верификация через `pnpm lint` + `pnpm build`).

**Пути:** бэкенд — `/Users/nvsmagin/GolandProjects/wishlist`; фронт — `/Users/nvsmagin/WebstormProjects/wish-list-2-front`.

---

## ЧАСТЬ A — Бэкенд

### Task A1: Сущность Present + входные данные

**Files:**
- Modify: `internal/entity/present.go`
- Modify: `internal/usecase/contracts.go:48-61` (`CreatePresentInput`)

- [ ] **Step 1: Добавить поля в сущность**

В `internal/entity/present.go` в структуру `Present` после `Price *float64` добавить:

```go
	Type              string   `json:"type"`              // "single" | "group" | "multi"
	ParticipantsCount int      `json:"participantsCount"`
	Images            []string `json:"images"`
	Links             []string `json:"links"`
```

- [ ] **Step 2: Расширить CreatePresentInput**

В `internal/usecase/contracts.go` в структуру `CreatePresentInput` добавить (после `OriginalURL string`):

```go
	Type   string   // "single" | "group" | "multi"; пусто => "single"
	Images []string // галерея для multi
	Links  []string // несколько ссылок для multi
```

- [ ] **Step 3: Скомпилировать**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...`
Expected: успешная компиляция (без ошибок).

- [ ] **Step 4: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/entity/present.go internal/usecase/contracts.go
git commit -m "feat: add type/participantsCount/images/links to Present entity"
```

---

### Task A2: GORM-модель + StringSliceJSON + конвертеры

**Files:**
- Modify: `internal/repo/persistent/models.go:42-55` (PresentModel) + новый тип в конце файла
- Modify: `internal/repo/persistent/converters.go:136-164`

- [ ] **Step 1: Добавить тип StringSliceJSON**

В конец `internal/repo/persistent/models.go` добавить (рядом с `BlocksJSON`, тот же паттерн nil-safe):

```go
// StringSliceJSON — JSONB-тип для хранения массива строк (картинки/ссылки)
type StringSliceJSON []string

func (s *StringSliceJSON) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan StringSliceJSON")
	}
	return json.Unmarshal(bytes, s)
}

func (s StringSliceJSON) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}
```

- [ ] **Step 2: Добавить колонки в PresentModel**

В `PresentModel` (`models.go:42`) после `Price *float64 ...` добавить:

```go
	Type              string          `gorm:"not null;default:'single'"`
	ParticipantsCount int             `gorm:"not null;default:0"`
	Images            StringSliceJSON `gorm:"type:jsonb"`
	Links             StringSliceJSON `gorm:"type:jsonb"`
```

- [ ] **Step 3: Обновить конвертеры**

В `internal/repo/persistent/converters.go`:

`toPresentEntity` — добавить в возвращаемую `entity.Present{...}`:

```go
		Type:              m.Type,
		ParticipantsCount: m.ParticipantsCount,
		Images:            []string(m.Images),
		Links:             []string(m.Links),
```

`toPresentModel` — добавить в возвращаемую `PresentModel{...}`:

```go
		Type:              p.Type,
		ParticipantsCount: p.ParticipantsCount,
		Images:            StringSliceJSON(p.Images),
		Links:             StringSliceJSON(p.Links),
```

- [ ] **Step 4: Round-trip тест конвертера**

В `internal/repo/persistent/converters_test.go` добавить тест (рядом с существующим present-тестом ~строка 115):

```go
func TestPresentConverter_NewFields(t *testing.T) {
	p := entity.Present{
		ID:                uuid.New(),
		Title:             "Gift",
		Type:              "multi",
		ParticipantsCount: 3,
		Images:            []string{"a.jpg", "b.jpg"},
		Links:             []string{"http://x", "http://y"},
		WishlistID:        uuid.New(),
	}
	got := toPresentEntity(toPresentModel(p))
	assert.Equal(t, "multi", got.Type)
	assert.Equal(t, 3, got.ParticipantsCount)
	assert.Equal(t, []string{"a.jpg", "b.jpg"}, got.Images)
	assert.Equal(t, []string{"http://x", "http://y"}, got.Links)
}
```

- [ ] **Step 2.5: Запустить тест — должен упасть до Step 1-3, проверить что проходит после**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/repo/persistent/ -run TestPresentConverter_NewFields -v`
Expected: PASS.

- [ ] **Step 5: Сборка**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...`
Expected: успешно.

- [ ] **Step 6: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/repo/persistent/models.go internal/repo/persistent/converters.go internal/repo/persistent/converters_test.go
git commit -m "feat: persist present type/images/links via StringSliceJSON"
```

---

### Task A3: Usecase — проставление новых полей в Create/Update

**Files:**
- Modify: `internal/usecase/present/present.go:36-96` (Create), `106-151` (Update)
- Test: `internal/usecase/present/present_test.go`

- [ ] **Step 1: Написать падающий тест**

В `internal/usecase/present/present_test.go` добавить:

```go
func TestCreate_MultiTypeFields(t *testing.T) {
	pr := &mockrepo.MockPresentRepo{}
	wr := &mockrepo.MockWishlistRepo{}
	fs := &mockminio.MockFileStorage{}
	uc := newPresentUC(pr, wr, fs)

	wid := uuid.New()
	wr.On("GetByID", mock.Anything, wid).Return(entity.Wishlist{ID: wid}, nil)
	pr.On("CountByWishlistID", mock.Anything, wid).Return(int64(0), nil)
	pr.On("Create", mock.Anything, mock.Anything).Return(nil)
	wr.On("IncrementPresentsCount", mock.Anything, wid).Return(nil)

	p, err := uc.Create(context.Background(), wid, usecase.CreatePresentInput{
		Title:  "Set",
		Type:   "multi",
		Images: []string{"a.jpg", "b.jpg"},
		Links:  []string{"http://x"},
	})
	require.NoError(t, err)
	assert.Equal(t, "multi", p.Type)
	assert.Equal(t, []string{"a.jpg", "b.jpg"}, p.Images)
	assert.Equal(t, []string{"http://x"}, p.Links)
}

func TestCreate_DefaultTypeSingle(t *testing.T) {
	pr := &mockrepo.MockPresentRepo{}
	wr := &mockrepo.MockWishlistRepo{}
	fs := &mockminio.MockFileStorage{}
	uc := newPresentUC(pr, wr, fs)

	wid := uuid.New()
	wr.On("GetByID", mock.Anything, wid).Return(entity.Wishlist{ID: wid}, nil)
	pr.On("CountByWishlistID", mock.Anything, wid).Return(int64(0), nil)
	pr.On("Create", mock.Anything, mock.Anything).Return(nil)
	wr.On("IncrementPresentsCount", mock.Anything, wid).Return(nil)

	p, err := uc.Create(context.Background(), wid, usecase.CreatePresentInput{Title: "X"})
	require.NoError(t, err)
	assert.Equal(t, "single", p.Type)
}
```

- [ ] **Step 2: Запустить — падает**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/usecase/present/ -run 'TestCreate_MultiTypeFields|TestCreate_DefaultTypeSingle' -v`
Expected: FAIL (p.Type пуст / поля не проставлены).

- [ ] **Step 3: Добавить нормализацию типа и проставление полей**

В `internal/usecase/present/present.go` добавить helper в конец файла:

```go
func normalizeType(t string) string {
	switch t {
	case "group", "multi":
		return t
	default:
		return "single"
	}
}
```

В `Create`, при сборке `p := entity.Present{...}` (строка ~62) добавить поля:

```go
		Type:   normalizeType(input.Type),
		Images: input.Images,
		Links:  input.Links,
```

В `Update`, после `p.Link = input.Link` (строка ~118) добавить:

```go
	p.Type = normalizeType(input.Type)
	p.Images = input.Images
	p.Links = input.Links
```

- [ ] **Step 4: Запустить — проходит**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/usecase/present/ -v`
Expected: PASS (включая существующие тесты).

- [ ] **Step 5: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/usecase/present/present.go internal/usecase/present/present_test.go
git commit -m "feat: set type/images/links in present Create/Update"
```

---

### Task A4: Usecase — Join/Leave счётчика группового подарка

**Files:**
- Modify: `internal/usecase/contracts.go:114-122` (интерфейс `PresentUseCase`)
- Modify: `internal/usecase/present/present.go` (новые методы)
- Test: `internal/usecase/present/present_test.go`

- [ ] **Step 1: Падающий тест**

В `present_test.go` добавить:

```go
func TestJoin_GroupIncrements(t *testing.T) {
	pr := &mockrepo.MockPresentRepo{}
	wr := &mockrepo.MockWishlistRepo{}
	fs := &mockminio.MockFileStorage{}
	uc := newPresentUC(pr, wr, fs)

	id := uuid.New()
	pr.On("GetByID", mock.Anything, id).Return(entity.Present{ID: id, Type: "group", ParticipantsCount: 1}, nil)
	pr.On("Update", mock.Anything, mock.MatchedBy(func(p entity.Present) bool {
		return p.ParticipantsCount == 2
	})).Return(nil)

	require.NoError(t, uc.Join(context.Background(), id))
	pr.AssertExpectations(t)
}

func TestJoin_NonGroupErrors(t *testing.T) {
	pr := &mockrepo.MockPresentRepo{}
	wr := &mockrepo.MockWishlistRepo{}
	fs := &mockminio.MockFileStorage{}
	uc := newPresentUC(pr, wr, fs)

	id := uuid.New()
	pr.On("GetByID", mock.Anything, id).Return(entity.Present{ID: id, Type: "single"}, nil)

	err := uc.Join(context.Background(), id)
	require.Error(t, err)
}

func TestLeave_NotBelowZero(t *testing.T) {
	pr := &mockrepo.MockPresentRepo{}
	wr := &mockrepo.MockWishlistRepo{}
	fs := &mockminio.MockFileStorage{}
	uc := newPresentUC(pr, wr, fs)

	id := uuid.New()
	pr.On("GetByID", mock.Anything, id).Return(entity.Present{ID: id, Type: "group", ParticipantsCount: 0}, nil)
	pr.On("Update", mock.Anything, mock.MatchedBy(func(p entity.Present) bool {
		return p.ParticipantsCount == 0
	})).Return(nil)

	require.NoError(t, uc.Leave(context.Background(), id))
}
```

- [ ] **Step 2: Запустить — падает (компиляция: нет методов Join/Leave)**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/usecase/present/ -run 'TestJoin|TestLeave' -v`
Expected: FAIL — `uc.Join undefined` / `uc.Leave undefined`.

- [ ] **Step 3: Добавить методы в интерфейс**

В `internal/usecase/contracts.go` в интерфейс `PresentUseCase` после `Release(...)` добавить:

```go
	Join(ctx context.Context, id uuid.UUID) error
	Leave(ctx context.Context, id uuid.UUID) error
```

- [ ] **Step 4: Реализовать в usecase**

В `internal/usecase/present/present.go` после `Release` (строка ~182) добавить:

```go
func (uc *presentUseCase) Join(ctx context.Context, id uuid.UUID) error {
	p, err := uc.presentRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("present not found: %w", err)
	}
	if p.Type != "group" {
		return errors.New("подарок не является групповым")
	}
	p.ParticipantsCount++
	return uc.presentRepo.Update(ctx, p)
}

func (uc *presentUseCase) Leave(ctx context.Context, id uuid.UUID) error {
	p, err := uc.presentRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("present not found: %w", err)
	}
	if p.Type != "group" {
		return errors.New("подарок не является групповым")
	}
	if p.ParticipantsCount > 0 {
		p.ParticipantsCount--
	}
	return uc.presentRepo.Update(ctx, p)
}
```

- [ ] **Step 5: Запустить — проходит**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/usecase/present/ -v`
Expected: PASS.

- [ ] **Step 6: Проверить, что мок реализует интерфейс**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...`
Expected: успешно. Если `mock/usecase` содержит mock для `PresentUseCase` и он перестал реализовывать интерфейс — добавить методы `Join`/`Leave` в мок по образцу `Reserve`. (Проверить: `grep -rl "PresentUseCase" mock/`.)

- [ ] **Step 7: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/usecase/contracts.go internal/usecase/present/present.go internal/usecase/present/present_test.go mock/
git commit -m "feat: add Join/Leave for group present counter"
```

---

### Task A5: HTTP — парсинг новых полей + хендлеры join/leave + роуты

**Files:**
- Modify: `internal/controller/restapi/v1/present.go:144-184` (parsePresentInput) + новые хендлеры
- Modify: `internal/controller/restapi/v1/router.go:50-51` (роуты)
- Test: `internal/controller/restapi/v1/present_test.go`

- [ ] **Step 1: Парсинг type/images/links в parsePresentInput**

В `internal/controller/restapi/v1/present.go`, в начало `parsePresentInput`, в литерал `input := usecase.CreatePresentInput{...}` добавить поле:

```go
		Type:        c.FormValue("type"),
```

После блока с `source`/`originalURL` (перед чтением файла, ~строка 162) добавить парсинг JSON-массивов:

```go
	if raw := c.FormValue("images"); raw != "" {
		var imgs []string
		if err := json.Unmarshal([]byte(raw), &imgs); err != nil {
			return input, errors.New("invalid images: must be JSON array")
		}
		input.Images = imgs
	}
	if raw := c.FormValue("links"); raw != "" {
		var links []string
		if err := json.Unmarshal([]byte(raw), &links); err != nil {
			return input, errors.New("invalid links: must be JSON array")
		}
		input.Links = links
	}
```

Добавить `"encoding/json"` в импорты файла.

- [ ] **Step 2: Хендлеры join/leave**

В `internal/controller/restapi/v1/present.go` после `release` (строка ~125) добавить:

```go
func (h *presentHandler) join(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid present ID"))
	}
	if err := h.uc.Join(c.Context(), id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	return c.JSON(response.Data(true))
}

func (h *presentHandler) leave(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid present ID"))
	}
	if err := h.uc.Leave(c.Context(), id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	return c.JSON(response.Data(true))
}
```

- [ ] **Step 3: Зарегистрировать роуты**

В `internal/controller/restapi/v1/router.go` после строки `api.Put("/presents/:id/release", presentH.release)` (строка 51) добавить:

```go
	api.Put("/presents/:id/join", presentH.join)
	api.Put("/presents/:id/leave", presentH.leave)
```

- [ ] **Step 4: Тест хендлера (по образцу present_test.go)**

Открыть `internal/controller/restapi/v1/present_test.go`, найти как там собирается app + mock usecase для `reserve` (поиск по `reserve`). По тому же образцу добавить тест, который шлёт `PUT /presents/:id/join`, мок `Join` возвращает `nil`, и проверяет статус 200. Пример (адаптировать имена mock-конструктора под существующие в файле):

```go
func TestPresentHandler_Join(t *testing.T) {
	app, ucMock := newPresentTestApp(t) // использовать существующий helper из файла
	id := uuid.New()
	ucMock.On("Join", mock.Anything, id).Return(nil)

	req := httptest.NewRequest(http.MethodPut, "/api/presents/"+id.String()+"/join", nil)
	resp, _ := app.Test(req)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
}
```

Если helper'а нет — повторить паттерн соседнего теста для `reserve` дословно, заменив метод/путь на `join`.

- [ ] **Step 5: Запустить тесты пакета**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/controller/... -v`
Expected: PASS.

- [ ] **Step 6: Полная сборка + все тесты**

Run: `cd /Users/nvsmagin/GolandProjects/wishlist && go build ./... && go test ./...`
Expected: успешно, все тесты зелёные.

- [ ] **Step 7: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/controller/restapi/v1/present.go internal/controller/restapi/v1/router.go internal/controller/restapi/v1/present_test.go
git commit -m "feat: parse type/images/links and add join/leave routes"
```

---

## ЧАСТЬ B — Фронтенд

> На фронте тест-фреймворка нет. Каждая фронт-задача верифицируется: `pnpm lint` (без новых ошибок) + `pnpm build` (успешная сборка) + указанная ручная проверка. Все команды из `/Users/nvsmagin/WebstormProjects/wish-list-2-front`.

### Task B1: Типы Present + API-хуки join/leave

**Files:**
- Modify: `shared/types.ts:71-82`
- Modify: `api/present/index.ts`

- [ ] **Step 1: Расширить тип Present**

В `shared/types.ts` в `Present` добавить после `reserved: boolean;`:

```ts
  type: 'single' | 'group' | 'multi';
  participantsCount: number;
  images?: string[];
  links?: string[];
```

- [ ] **Step 2: Добавить хуки join/leave**

В `api/present/index.ts` после `useApiReservePresent` добавить:

```ts
export const useApiJoinGroupPresent = (wishlistId: string) => {
  const queryClient = useQueryClient()
  return useMutation<unknown, AxiosError, { presentId: string }>({
    mutationFn: async ({ presentId }) => {
      return api.put(`presents/${presentId}/join`, {})
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'presents', wishlistId ] })
    },
  })
}

export const useApiLeaveGroupPresent = (wishlistId: string) => {
  const queryClient = useQueryClient()
  return useMutation<unknown, AxiosError, { presentId: string }>({
    mutationFn: async ({ presentId }) => {
      return api.put(`presents/${presentId}/leave`, {})
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'presents', wishlistId ] })
    },
  })
}
```

- [ ] **Step 3: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: без ошибок (могут остаться предупреждения о неиспользуемых экспортах — это ок, используем их в B4/B5).

- [ ] **Step 4: Commit**

```bash
git add shared/types.ts api/present/index.ts
git commit -m "feat: add present type fields and group join/leave hooks"
```

---

### Task B2: Carousel-примитив (embla)

**Files:**
- Create: `components/ui/carousel.tsx`
- Modify: `package.json` (зависимость)

- [ ] **Step 1: Установить embla**

Run: `pnpm add embla-carousel-react`
Expected: пакет добавлен в `package.json`.

- [ ] **Step 2: Добавить shadcn carousel**

Run: `pnpm dlx shadcn@latest add carousel`
Expected: создан `components/ui/carousel.tsx`. Если CLI спросит про перезапись/конфиг — выбрать создание только `carousel`. Если CLI недоступен — создать файл вручную из официального исходника shadcn carousel (https://ui.shadcn.com/docs/components/carousel), он зависит только от `embla-carousel-react`, `@/components/ui/button` (есть) и `@/lib/utils` (есть).

- [ ] **Step 3: Проверить сборку**

Run: `pnpm build`
Expected: успешно (carousel компилируется).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml components/ui/carousel.tsx
git commit -m "chore: add embla carousel ui primitive"
```

---

### Task B3: Компонент MultiImageUpload

**Files:**
- Create: `components/multi-image-upload.tsx`

- [ ] **Step 1: Создать компонент**

Создать `components/multi-image-upload.tsx`:

```tsx
'use client'

import { uploadImage } from '@/api/upload'
import { Label } from '@/components/ui/label'
import { Loader2, UploadIcon, X } from 'lucide-react'
import React, { useRef, useState } from 'react'

type Props = {
  label?: string
  value: string[]
  onChange: (urls: string[]) => void
}

export function MultiImageUpload({ label = 'Картинки', value, onChange }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    setIsUploading(true)
    setError(null)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setError('Файл должен быть менее 10MB')
          continue
        }
        uploaded.push(await uploadImage(file))
      }
      onChange([...value, ...uploaded])
    } catch {
      setError('Ошибка загрузки. Попробуйте ещё раз.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative h-24 rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
                aria-label="Удалить"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isUploading ? 'border-border opacity-50 cursor-not-allowed' : 'border-border cursor-pointer hover:border-primary'
        }`}
        onClick={() => { if (!isUploading) inputRef.current?.click() }}
      >
        {isUploading
          ? <Loader2 className="mx-auto mb-2 text-muted-foreground animate-spin" size={24} />
          : <UploadIcon className="mx-auto mb-2 text-muted-foreground" size={24} />}
        <p className="text-sm text-muted-foreground">
          {isUploading ? 'Загружается...' : 'Перетащи или нажми — можно несколько'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG до 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: без ошибок (предупреждение о неиспользуемом компоненте допустимо — используется в B4).

- [ ] **Step 3: Commit**

```bash
git add components/multi-image-upload.tsx
git commit -m "feat: add MultiImageUpload component"
```

---

### Task B4: Форма — селектор типа и условные поля

**Files:**
- Modify: `app/wishlist/[id]/present/components/create-edit-form.tsx`

- [ ] **Step 1: Расширить zod-схему и дефолты**

В `create-edit-form.tsx` в `FormSchema` (строка ~31) добавить поля:

```ts
    type: z.enum(['single', 'group', 'multi']),
    images: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
```

В `defaultValues` (строка ~55) добавить:

```ts
      type: edit ? (present?.type ?? 'single') : 'single',
      images: edit ? (present?.images ?? []) : [],
      links: edit ? (present?.links ?? []) : [],
```

- [ ] **Step 2: Импорты**

В начало файла добавить:

```ts
import { MultiImageUpload } from '@/components/multi-image-upload'
import { useFieldArray } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
```

И внутри компонента после `const form = useForm(...)`:

```ts
  const presentType = form.watch('type')
  const { fields: linkFields, append: appendLink, remove: removeLink } =
    useFieldArray({ control: form.control, name: 'links' as never })
```

> Примечание: `useFieldArray` требует, чтобы `links` был массивом объектов либо использовать его как массив примитивов через `name`. Если возникнут проблемы типобезопасности с массивом строк — заменить динамический список ссылок на ручное управление через `form.watch('links')` + `form.setValue('links', ...)` (как сделано для images в Step 4). Приоритет — рабочий код, а не useFieldArray.

- [ ] **Step 3: Сабмит — отправка type/images/links**

В `onSubmit`, перед блоком `if (edit && present)`, добавить:

```ts
    formData.append('type', data.type)
    if (data.type === 'multi') {
      formData.append('images', JSON.stringify(data.images ?? []))
      formData.append('links', JSON.stringify((data.links ?? []).filter(Boolean)))
    }
```

(Существующие `link`/`cover_url` остаются — для single/group.)

- [ ] **Step 4: UI — селектор типа + условные блоки**

В JSX, сразу после `<form ...>` и до поля `title`, добавить сегментированный переключатель:

```tsx
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип подарка</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  {([
                    ['single', 'Обычный'],
                    ['group', 'Групповой'],
                    ['multi', 'Многосоставной'],
                  ] as const).map(([val, label]) => (
                    <Button
                      key={val}
                      type="button"
                      variant={field.value === val ? 'default' : 'outline'}
                      className="grow"
                      onClick={() => field.onChange(val)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />
```

Поле `coverUrl` (ImageUpload, строка ~157) обернуть так, чтобы оно показывалось только для `single`/`group`:

```tsx
        {presentType !== 'multi' && (
          <FormField control={form.control} name="coverUrl" render={({ field }) => (
            /* ...существующий ImageUpload без изменений... */
          )} />
        )}
```

Поле `link` (строка ~144) — показывать только для `single`/`group` (для multi ниже свой список):

```tsx
        {presentType !== 'multi' && (
          /* ...существующий FormField link... */
        )}
```

Для `group` добавить подсказку (после селектора типа):

```tsx
        {presentType === 'group' && (
          <p className="text-sm text-muted-foreground">
            Несколько человек смогут отметить, что хотят подарить.
          </p>
        )}
```

Для `multi` добавить галерею и список ссылок (после поля price):

```tsx
        {presentType === 'multi' && (
          <>
            <MultiImageUpload
              value={form.watch('images') ?? []}
              onChange={(urls) => form.setValue('images', urls)}
            />
            <div className="space-y-2">
              <FormLabel>Ссылки</FormLabel>
              {(form.watch('links') ?? []).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={form.watch('links')?.[i] ?? ''}
                    onChange={(e) => {
                      const next = [...(form.watch('links') ?? [])]
                      next[i] = e.target.value
                      form.setValue('links', next)
                    }}
                  />
                  <Button type="button" variant="outline" size="icon"
                    onClick={() => {
                      const next = (form.watch('links') ?? []).filter((_, idx) => idx !== i)
                      form.setValue('links', next)
                    }}>
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline"
                onClick={() => form.setValue('links', [...(form.watch('links') ?? []), ''])}>
                <Plus size={16} className="mr-1" /> Добавить ссылку
              </Button>
            </div>
          </>
        )}
```

> Если в Step 2 выбран вариант без `useFieldArray` — удалить его импорт и объявление, ссылки управляются через `form.watch`/`form.setValue`, как показано здесь.

- [ ] **Step 5: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: без ошибок.

- [ ] **Step 6: Ручная проверка**

Run: `pnpm dev`, открыть форму создания подарка. Проверить: переключение типа меняет поля; для multi грузятся несколько картинок и добавляются ссылки; обычный/групповой работают как раньше. Создать по одному подарку каждого типа и убедиться, что сохраняются (проверить через сеть/в списке).

- [ ] **Step 7: Commit**

```bash
git add app/wishlist/[id]/present/components/create-edit-form.tsx
git commit -m "feat: present type selector with group/multi fields in form"
```

---

### Task B5: Публичная карточка — слайдер, групповой счётчик, ссылки, фикс описания

**Files:**
- Modify: `app/s/[shortId]/components/present-item.tsx`

- [ ] **Step 1: Импорты и хуки**

В `present-item.tsx` добавить импорты:

```tsx
import { useApiReservePresent, useApiJoinGroupPresent, useApiLeaveGroupPresent } from '@/api/present'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { useEffect } from 'react'
import Image from 'next/image'
```

(Заменить существующий импорт `useApiReservePresent` на расширенный.)

- [ ] **Step 2: Фикс описания — убрать line-clamp**

Заменить блок описания (строка ~50):

```tsx
        <div className="line-clamp-3 text-foreground min-h-[72px]">{present.description}
        </div>
```

на:

```tsx
        <div className="text-foreground whitespace-pre-line break-words">{present.description}</div>
```

(Убраны `line-clamp-3` и фиксированная `min-h-[72px]` — текст виден полностью на всех экранах.)

- [ ] **Step 3: Слайдер обложки для multi**

Заменить блок обложки (строки ~39-44) на:

```tsx
        {present.type === 'multi' && present.images && present.images.length > 0 ? (
          present.images.length === 1
            ? <CardCover cover={present.images[0]} className="h-[300px]" />
            : (
              <Carousel className="w-full">
                <CarouselContent>
                  {present.images.map((img, i) => (
                    <CarouselItem key={img + i}>
                      <CardCover cover={img} className="h-[300px]" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            )
        ) : present.cover ? (
          <CardCover cover={present.cover} className="h-[300px]" />
        ) : (
          <div className="flex justify-center items-center bg-primary w-full h-[300px] rounded-t-2xl">
            <Heart size={50} />
          </div>
        )}
```

- [ ] **Step 4: Групповой счётчик (join/leave + localStorage)**

В компонент добавить хуки и локальное состояние участия (после существующего `useApiReservePresent`):

```tsx
  const { mutate: join, isPending: joinPending } = useApiJoinGroupPresent(wishlistId)
  const { mutate: leave, isPending: leavePending } = useApiLeaveGroupPresent(wishlistId)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoined(localStorage.getItem(`gift-joined-${present.id}`) === '1')
    }
  }, [present.id])

  const handleToggleJoin = () => {
    if (joined) {
      leave({ presentId: present.id }, { onSuccess: () => {
        localStorage.removeItem(`gift-joined-${present.id}`)
        setJoined(false)
      }})
    } else {
      join({ presentId: present.id }, { onSuccess: () => {
        localStorage.setItem(`gift-joined-${present.id}`, '1')
        setJoined(true)
        toast({ title: 'Вы отметили, что хотите подарить!', variant: 'success' })
      }})
    }
  }
```

Заменить блок кнопки действия (строки ~56-68) на разветвление по типу:

```tsx
        <div className="flex items-center justify-between flex-col sm:flex-row gap-3 mt-auto">
          {present.type === 'group' ? (
            !isHidden && (
              <div className="w-full flex flex-col gap-2">
                <Button className="grow" loading={joinPending || leavePending}
                  variant={joined ? 'destructive' : 'default'} onClick={handleToggleJoin}>
                  {joined ? 'Не хочу дарить' : 'Я хочу подарить'}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  {present.participantsCount} {pluralizePeople(present.participantsCount)} хотят подарить
                </p>
              </div>
            )
          ) : (
            !isHidden && (
              <ConfirmReserveModal theme={theme} disabled={reserved} onClick={handleReserve}>
                <Button className="grow" loading={isPending}
                  variant={reserved ? 'destructive' : 'default'} disabled={reserved}>
                  {reserved ? 'Забронирован' : 'Забронировать'}
                </Button>
              </ConfirmReserveModal>
            )
          )}

          {present.type === 'multi' && present.links && present.links.length > 0 ? (
            <div className="flex flex-col gap-1">
              {present.links.map((l, i) => (
                <a key={l + i} href={l} target="_blank" className="flex text-primary gap-2 hover:underline">
                  В магазин <ExternalLink />
                </a>
              ))}
            </div>
          ) : (
            present.link && (
              <a href={present.link} target="_blank" className="flex text-primary gap-2 hover:underline">
                В магазин <ExternalLink />
              </a>
            )
          )}
        </div>
```

Добавить helper в конец файла (вне компонента):

```tsx
function pluralizePeople(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'человек'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'человека'
  return 'человек'
}
```

> Примечание: при `joined`-варианте кнопка остаётся активной (это toggle), поэтому `disabled` не ставим.

- [ ] **Step 5: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: без ошибок.

- [ ] **Step 6: Ручная проверка (включая мобильную ширину)**

Run: `pnpm dev`, открыть публичную страницу вишлиста (`/s/<shortId>`). Проверить:
- длинное описание видно полностью, на узком экране (DevTools, 375px) не обрезается;
- multi-подарок с >1 картинкой показывает слайдер со стрелками;
- групповой: кнопка «Я хочу подарить» увеличивает счётчик, повторный клик («Не хочу дарить») уменьшает; после перезагрузки состояние сохраняется (localStorage);
- multi-подарок показывает все ссылки.

- [ ] **Step 7: Commit**

```bash
git add app/s/[shortId]/components/present-item.tsx
git commit -m "feat: group counter, multi slider/links, full description in public card"
```

---

### Task B6: Карточка владельца — обложка из images + бейдж типа

**Files:**
- Modify: `app/wishlist/[id]/present/components/present-card.tsx`

- [ ] **Step 1: Обложка из первой картинки multi + бейдж**

В `present-card.tsx` заменить блок обложки (строки ~21-27):

```tsx
        {(present.images?.[0] || present.cover) ? (
          <CardCover className="h-[180px]" cover={present.images?.[0] || present.cover} title={present.title} />
        ) : (
          <div className="flex justify-center items-center bg-primary w-full h-[180px] rounded-t-2xl">
            <Heart size={50} />
          </div>
        )}
```

После блока обложки (внутри `relative`-контейнера, до `<div className="p-4">`) добавить бейдж типа:

```tsx
        {present.type && present.type !== 'single' && (
          <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-background/80 text-foreground">
            {present.type === 'group' ? 'Групповой' : 'Набор'}
          </span>
        )}
```

(Описание с `truncate` оставить без изменений — компактный админский вид.)

- [ ] **Step 2: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: без ошибок.

- [ ] **Step 3: Ручная проверка**

Run: `pnpm dev`, открыть `/wishlist/<id>`. Проверить, что у multi-подарка показывается первая картинка как обложка и бейдж «Набор», у группового — «Групповой».

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/[id]/present/components/present-card.tsx
git commit -m "feat: owner card shows multi cover and type badge"
```

---

## Финальная проверка

- [ ] **Бэкенд:** `cd /Users/nvsmagin/GolandProjects/wishlist && go build ./... && go test ./...` — всё зелёное.
- [ ] **Фронт:** `pnpm lint && pnpm build` — без ошибок.
- [ ] **E2E вручную:** создать обычный / групповой / многосоставной подарок, открыть публичную страницу, проверить все три фичи + полное описание на мобильной ширине.

---

## Заметки по покрытию спеки

- Групповой счётчик (анонимный, localStorage): A4, A5, B1, B5.
- Многосоставной (галерея + ссылки, слайдер): A1–A3, A5, B2, B3, B4, B5, B6.
- Взаимоисключающие типы: B4 (селектор), `normalizeType` (A3).
- Фикс описания (`line-clamp-3` → полностью): B5 Step 2.
- Обложка multi = первая фотка: B5 Step 3, B6 Step 1.
