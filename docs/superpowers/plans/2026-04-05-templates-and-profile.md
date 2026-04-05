# Wishlist Templates + User Profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить сохранение вишлистов как шаблонов, публичную галерею шаблонов и личный кабинет с displayName/аватаркой.

**Architecture:** Отдельная таблица `templates` в PostgreSQL. Бэк на Go (Fiber + GORM), фронт на Next.js 16 App Router с TanStack Query. Шаблоны хранят структуру блоков (type/row/col/colSpan) без контента (data всегда `{}`).

**Tech Stack:** Go 1.21, Fiber v2, GORM, PostgreSQL, Next.js 16, TanStack Query v5, shadcn/ui, react-hook-form + zod.

---

## File Map

### Backend — новые файлы
- `internal/entity/template.go` — сущности Template, TemplateWithAuthor
- `internal/usecase/template/template.go` — TemplateUseCase impl
- `internal/repo/persistent/template_postgres.go` — TemplateModel + repo
- `internal/controller/restapi/v1/template.go` — templateHandler
- `internal/controller/restapi/v1/template_test.go` — тесты templateHandler

### Backend — изменённые файлы
- `internal/entity/user.go` — добавить DisplayName, Avatar
- `internal/repo/contracts.go` — добавить TemplateRepo, Update в UserRepo
- `internal/repo/persistent/models.go` — расширить UserModel, добавить TemplateModel
- `internal/repo/persistent/converters.go` — обновить user-конвертеры, добавить template-конвертеры
- `internal/repo/persistent/user_postgres.go` — добавить Update
- `internal/usecase/contracts.go` — добавить TemplateUseCase, UpdateProfile в UserUseCase
- `internal/usecase/user/user.go` — реализовать UpdateProfile
- `internal/controller/restapi/v1/router.go` — маршруты template и users/me
- `internal/controller/restapi/v1/user.go` — handlers getProfile, updateProfile; инъекция uploadUC
- `internal/controller/restapi/v1/testhelpers_test.go` — MockTemplateUC
- `internal/controller/restapi/router.go` — пробросить templateUC
- `internal/app/app.go` — wireup

### Frontend — новые файлы
- `api/template/index.ts` — TanStack Query хуки
- `app/wishlist/components/save-as-template-modal.tsx` — SaveAsTemplateModal
- `app/wishlist/create/components/from-user-template-dialog.tsx` — FromUserTemplateDialog
- `app/wishlist/settings/page.tsx` — личный кабинет
- `app/templates/page.tsx` — публичная галерея

### Frontend — изменённые файлы
- `shared/types.ts` — добавить Template, расширить User
- `api/user/index.ts` — добавить useApiGetMyProfile, useApiUpdateMe
- `app/wishlist/components/constructor/constructor-header.tsx` — кнопка "Сохранить как шаблон"
- `app/wishlist/[id]/components/wishlist-menu.tsx` — пункт меню "Сохранить как шаблон"
- `app/wishlist/create/page.tsx` — секция "Мои шаблоны"
- `app/wishlist/layout.tsx` — ссылка "Настройки"

---

## Task 1: Расширить User entity + репо + UserUseCase.UpdateProfile (Backend)

**Files:**
- Modify: `internal/entity/user.go`
- Modify: `internal/repo/contracts.go`
- Modify: `internal/repo/persistent/models.go`
- Modify: `internal/repo/persistent/converters.go`
- Modify: `internal/repo/persistent/user_postgres.go`
- Modify: `internal/usecase/contracts.go`
- Modify: `internal/usecase/user/user.go`

- [ ] **Step 1.1: Расширить entity.User**

В `internal/entity/user.go` заменить содержимое на:
```go
package entity

import "github.com/google/uuid"

type User struct {
	ID          uuid.UUID
	Username    string
	Password    string
	DisplayName string
	Avatar      string
}
```

- [ ] **Step 1.2: Расширить UserModel и добавить Update в UserRepo контракт**

В `internal/repo/contracts.go` добавить метод `Update` в интерфейс `UserRepo`:
```go
type UserRepo interface {
	Create(ctx context.Context, user entity.User) error
	GetByUsername(ctx context.Context, username string) (entity.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (entity.User, error)
	Update(ctx context.Context, user entity.User) error
}
```

- [ ] **Step 1.3: Обновить UserModel в `internal/repo/persistent/models.go`**

Заменить структуру `UserModel`:
```go
type UserModel struct {
	ID          uuid.UUID `gorm:"primaryKey"`
	Username    string    `gorm:"unique;not null"`
	Password    string    `gorm:"not null"`
	DisplayName string
	Avatar      string
}
```

- [ ] **Step 1.4: Обновить конвертеры user в `internal/repo/persistent/converters.go`**

Заменить `toUserEntity` и `toUserModel`:
```go
func toUserEntity(m UserModel) entity.User {
	return entity.User{
		ID:          m.ID,
		Username:    m.Username,
		Password:    m.Password,
		DisplayName: m.DisplayName,
		Avatar:      m.Avatar,
	}
}

func toUserModel(u entity.User) UserModel {
	return UserModel{
		ID:          u.ID,
		Username:    u.Username,
		Password:    u.Password,
		DisplayName: u.DisplayName,
		Avatar:      u.Avatar,
	}
}
```

- [ ] **Step 1.5: Добавить `Update` в `internal/repo/persistent/user_postgres.go`**

Добавить метод:
```go
func (r *userRepo) Update(ctx context.Context, user entity.User) error {
	m := toUserModel(user)
	if err := r.db.WithContext(ctx).Save(&m).Error; err != nil {
		return fmt.Errorf("userRepo.Update: %w", err)
	}
	return nil
}
```

- [ ] **Step 1.6: Добавить `UpdateProfile` и `GetProfile` в `usecase.UserUseCase` интерфейс**

В `internal/usecase/contracts.go` в интерфейс `UserUseCase` добавить:
```go
UpdateProfile(ctx context.Context, userID uuid.UUID, input UpdateProfileInput) (entity.User, error)
GetProfile(ctx context.Context, userID uuid.UUID) (entity.User, error)
```

В этом же файле добавить тип входных данных:
```go
// UpdateProfileInput — данные для обновления профиля
type UpdateProfileInput struct {
	DisplayName *string // nil = не менять
	Avatar      *string // nil = не менять
}
```

- [ ] **Step 1.7: Реализовать `UpdateProfile` и `GetProfile` в `internal/usecase/user/user.go`**

Добавить методы:
```go
func (uc *userUseCase) GetProfile(ctx context.Context, userID uuid.UUID) (entity.User, error) {
	return uc.userRepo.GetByID(ctx, userID)
}

func (uc *userUseCase) UpdateProfile(ctx context.Context, userID uuid.UUID, input usecase.UpdateProfileInput) (entity.User, error) {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return entity.User{}, fmt.Errorf("user not found: %w", err)
	}
	if input.DisplayName != nil {
		if len([]rune(*input.DisplayName)) > 100 {
			return entity.User{}, fmt.Errorf("display name exceeds 100 characters")
		}
		user.DisplayName = *input.DisplayName
	}
	if input.Avatar != nil {
		user.Avatar = *input.Avatar
	}
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return entity.User{}, fmt.Errorf("update user: %w", err)
	}
	return user, nil
}
```

- [ ] **Step 1.8: Обновить `MockUserUC` в `internal/controller/restapi/v1/testhelpers_test.go`**

Добавить методы к `MockUserUC`:
```go
func (m *MockUserUC) GetProfile(ctx context.Context, userID uuid.UUID) (entity.User, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).(entity.User), args.Error(1)
}

func (m *MockUserUC) UpdateProfile(ctx context.Context, userID uuid.UUID, input usecase.UpdateProfileInput) (entity.User, error) {
	args := m.Called(ctx, userID, input)
	return args.Get(0).(entity.User), args.Error(1)
}
```

- [ ] **Step 1.9: Скомпилировать бэкенд**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...
```
Ожидание: успешная компиляция без ошибок.

- [ ] **Step 1.10: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/entity/user.go internal/repo/contracts.go \
  internal/repo/persistent/models.go internal/repo/persistent/converters.go \
  internal/repo/persistent/user_postgres.go internal/usecase/contracts.go \
  internal/usecase/user/user.go internal/controller/restapi/v1/testhelpers_test.go
git commit -m "feat: extend user entity with displayName and avatar, add UpdateProfile"
```

---

## Task 2: Template entity, model, repo (Backend)

**Files:**
- Create: `internal/entity/template.go`
- Modify: `internal/repo/contracts.go`
- Modify: `internal/repo/persistent/models.go`
- Modify: `internal/repo/persistent/converters.go`
- Create: `internal/repo/persistent/template_postgres.go`

- [ ] **Step 2.1: Создать `internal/entity/template.go`**

```go
package entity

import (
	"time"

	"github.com/google/uuid"
)

type Template struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Name      string
	Settings  Settings // переиспользуем существующий тип
	Blocks    []Block  // data каждого блока = "{}" (stripped)
	IsPublic  bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TemplateWithAuthor — шаблон с именем автора (для публичной галереи)
type TemplateWithAuthor struct {
	Template
	UserDisplayName string
}
```

- [ ] **Step 2.2: Добавить `TemplateRepo` в `internal/repo/contracts.go`**

Добавить интерфейс:
```go
type TemplateRepo interface {
	Create(ctx context.Context, template entity.Template) error
	GetByID(ctx context.Context, id uuid.UUID) (entity.Template, error)
	GetAllByUserID(ctx context.Context, userID uuid.UUID) ([]entity.Template, error)
	GetPublic(ctx context.Context, limit int, cursor time.Time) ([]entity.TemplateWithAuthor, error)
	Update(ctx context.Context, template entity.Template) error
	Delete(ctx context.Context, id uuid.UUID) error
}
```

Добавить импорт `"time"` если не был добавлен.

- [ ] **Step 2.3: Добавить `TemplateModel` в `internal/repo/persistent/models.go`**

Добавить в конец файла (после `PresentMetaModel`):
```go
// TemplateModel — GORM-модель для таблицы "templates"
type TemplateModel struct {
	ID        uuid.UUID    `gorm:"primaryKey"`
	UserID    uuid.UUID    `gorm:"not null;index"`
	Name      string       `gorm:"not null"`
	Settings  SettingsJSON `gorm:"type:json"`
	Blocks    BlocksJSON   `gorm:"type:jsonb"`
	IsPublic  bool         `gorm:"not null;default:false;index"`
	CreatedAt time.Time    `gorm:"autoCreateTime;index"`
	UpdatedAt time.Time    `gorm:"autoUpdateTime"`
}

func (TemplateModel) TableName() string { return "templates" }
```

- [ ] **Step 2.4: Добавить template-конвертеры в `internal/repo/persistent/converters.go`**

Добавить в конец файла:
```go
// Template

func toTemplateEntity(m TemplateModel) entity.Template {
	blocks := make([]entity.Block, 0, len(m.Blocks))
	for _, b := range m.Blocks {
		colSpan := b.ColSpan
		if colSpan < 1 {
			colSpan = 1
		}
		blocks = append(blocks, entity.Block{
			Type:    b.Type,
			Row:     b.Row,
			Col:     b.Col,
			ColSpan: colSpan,
			Data:    b.Data,
		})
	}
	return entity.Template{
		ID:    m.ID,
		UserID: m.UserID,
		Name:   m.Name,
		Settings: entity.Settings{
			ColorScheme:          m.Settings.ColorScheme,
			ShowGiftAvailability: m.Settings.ShowGiftAvailability,
			PresentsLayout:       m.Settings.PresentsLayout,
		},
		Blocks:    blocks,
		IsPublic:  m.IsPublic,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

func toTemplateModel(t entity.Template) TemplateModel {
	blocks := make(BlocksJSON, 0, len(t.Blocks))
	for _, b := range t.Blocks {
		blocks = append(blocks, blockJSON{
			Type:    b.Type,
			Row:     b.Row,
			Col:     b.Col,
			ColSpan: b.ColSpan,
			Data:    json.RawMessage("{}"),
		})
	}
	return TemplateModel{
		ID:     t.ID,
		UserID: t.UserID,
		Name:   t.Name,
		Settings: SettingsJSON{
			ColorScheme:          t.Settings.ColorScheme,
			ShowGiftAvailability: t.Settings.ShowGiftAvailability,
			PresentsLayout:       t.Settings.PresentsLayout,
		},
		Blocks:   blocks,
		IsPublic: t.IsPublic,
	}
}
```

- [ ] **Step 2.5: Создать `internal/repo/persistent/template_postgres.go`**

```go
package persistent

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"main/internal/entity"
)

type templateRepo struct {
	db *gorm.DB
}

func NewTemplateRepo(db *gorm.DB) *templateRepo {
	return &templateRepo{db: db}
}

func (r *templateRepo) Create(ctx context.Context, template entity.Template) error {
	m := toTemplateModel(template)
	if err := r.db.WithContext(ctx).Create(&m).Error; err != nil {
		return fmt.Errorf("templateRepo.Create: %w", err)
	}
	return nil
}

func (r *templateRepo) GetByID(ctx context.Context, id uuid.UUID) (entity.Template, error) {
	var m TemplateModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return entity.Template{}, fmt.Errorf("templateRepo.GetByID: %w", err)
	}
	return toTemplateEntity(m), nil
}

func (r *templateRepo) GetAllByUserID(ctx context.Context, userID uuid.UUID) ([]entity.Template, error) {
	var models []TemplateModel
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&models).Error; err != nil {
		return nil, fmt.Errorf("templateRepo.GetAllByUserID: %w", err)
	}
	result := make([]entity.Template, len(models))
	for i, m := range models {
		result[i] = toTemplateEntity(m)
	}
	return result, nil
}

type templateWithAuthorRow struct {
	TemplateModel
	UserDisplayName string `gorm:"column:user_display_name"`
}

func (r *templateRepo) GetPublic(ctx context.Context, limit int, cursor time.Time) ([]entity.TemplateWithAuthor, error) {
	var rows []templateWithAuthorRow

	q := r.db.WithContext(ctx).
		Table("templates").
		Select("templates.*, users.display_name AS user_display_name").
		Joins("LEFT JOIN users ON users.id = templates.user_id").
		Where("templates.is_public = ?", true).
		Order("templates.created_at DESC").
		Limit(limit)

	if !cursor.IsZero() {
		q = q.Where("templates.created_at < ?", cursor)
	}

	if err := q.Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("templateRepo.GetPublic: %w", err)
	}

	result := make([]entity.TemplateWithAuthor, len(rows))
	for i, row := range rows {
		result[i] = entity.TemplateWithAuthor{
			Template:        toTemplateEntity(row.TemplateModel),
			UserDisplayName: row.UserDisplayName,
		}
	}
	return result, nil
}

func (r *templateRepo) Update(ctx context.Context, template entity.Template) error {
	m := toTemplateModel(template)
	m.ID = template.ID
	if err := r.db.WithContext(ctx).Save(&m).Error; err != nil {
		return fmt.Errorf("templateRepo.Update: %w", err)
	}
	return nil
}

func (r *templateRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&TemplateModel{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("templateRepo.Delete: %w", err)
	}
	return nil
}
```

- [ ] **Step 2.6: Скомпилировать**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...
```
Ожидание: успешная компиляция.

- [ ] **Step 2.7: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/entity/template.go internal/repo/contracts.go \
  internal/repo/persistent/models.go internal/repo/persistent/converters.go \
  internal/repo/persistent/template_postgres.go
git commit -m "feat: add Template entity, model and repo"
```

---

## Task 3: Template usecase (Backend)

**Files:**
- Modify: `internal/usecase/contracts.go`
- Create: `internal/usecase/template/template.go`

- [ ] **Step 3.1: Добавить `TemplateUseCase` в `internal/usecase/contracts.go`**

Добавить входные типы и интерфейс:
```go
// CreateTemplateInput — данные для создания шаблона из вишлиста
type CreateTemplateInput struct {
	WishlistID uuid.UUID
	Name       string
	IsPublic   bool
}

// UpdateTemplateInput — данные для обновления шаблона
type UpdateTemplateInput struct {
	Name     string
	IsPublic bool
}

// TemplateUseCase — бизнес-логика шаблонов
type TemplateUseCase interface {
	Create(ctx context.Context, userID uuid.UUID, input CreateTemplateInput) (entity.Template, error)
	GetAllByUser(ctx context.Context, userID uuid.UUID) ([]entity.Template, error)
	GetPublic(ctx context.Context, limit int, cursorStr string) ([]entity.TemplateWithAuthor, string, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input UpdateTemplateInput) (entity.Template, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	CreateWishlistFromTemplate(ctx context.Context, templateID uuid.UUID, userID uuid.UUID, title string) (entity.Wishlist, error)
}
```

Добавить импорт `"time"` если нужен (для cursorStr parsing внутри usecase).

- [ ] **Step 3.2: Создать `internal/usecase/template/template.go`**

```go
package template

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"main/internal/entity"
	"main/internal/repo"
	"main/internal/usecase"
	"main/pkg/shortid"
)

const maxTemplatesPerUser = 50
const publicPageSize = 20

type templateUseCase struct {
	templateRepo repo.TemplateRepo
	wishlistRepo repo.WishlistRepo
}

func New(templateRepo repo.TemplateRepo, wishlistRepo repo.WishlistRepo) usecase.TemplateUseCase {
	return &templateUseCase{
		templateRepo: templateRepo,
		wishlistRepo: wishlistRepo,
	}
}

func (uc *templateUseCase) Create(ctx context.Context, userID uuid.UUID, input usecase.CreateTemplateInput) (entity.Template, error) {
	if input.Name == "" {
		return entity.Template{}, errors.New("name is required")
	}
	if len([]rune(input.Name)) > 200 {
		return entity.Template{}, errors.New("name exceeds 200 characters")
	}

	wishlist, err := uc.wishlistRepo.GetByID(ctx, input.WishlistID)
	if err != nil {
		return entity.Template{}, fmt.Errorf("wishlist not found: %w", err)
	}
	if wishlist.UserID != userID {
		return entity.Template{}, errors.New("forbidden")
	}

	// Strip block content — keep structure only
	strippedBlocks := make([]entity.Block, len(wishlist.Blocks))
	for i, b := range wishlist.Blocks {
		strippedBlocks[i] = entity.Block{
			Type:    b.Type,
			Row:     b.Row,
			Col:     b.Col,
			ColSpan: b.ColSpan,
			Data:    json.RawMessage("{}"),
		}
	}

	t := entity.Template{
		ID:       uuid.New(),
		UserID:   userID,
		Name:     input.Name,
		Settings: wishlist.Settings,
		Blocks:   strippedBlocks,
		IsPublic: input.IsPublic,
	}

	if err := uc.templateRepo.Create(ctx, t); err != nil {
		return entity.Template{}, fmt.Errorf("create template: %w", err)
	}
	return t, nil
}

func (uc *templateUseCase) GetAllByUser(ctx context.Context, userID uuid.UUID) ([]entity.Template, error) {
	return uc.templateRepo.GetAllByUserID(ctx, userID)
}

func (uc *templateUseCase) GetPublic(ctx context.Context, limit int, cursorStr string) ([]entity.TemplateWithAuthor, string, error) {
	if limit <= 0 || limit > publicPageSize {
		limit = publicPageSize
	}

	var cursor time.Time
	if cursorStr != "" {
		parsed, err := time.Parse(time.RFC3339, cursorStr)
		if err == nil {
			cursor = parsed
		}
	}

	items, err := uc.templateRepo.GetPublic(ctx, limit, cursor)
	if err != nil {
		return nil, "", fmt.Errorf("get public templates: %w", err)
	}

	var nextCursor string
	if len(items) == limit {
		nextCursor = items[len(items)-1].CreatedAt.UTC().Format(time.RFC3339)
	}

	return items, nextCursor, nil
}

func (uc *templateUseCase) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input usecase.UpdateTemplateInput) (entity.Template, error) {
	t, err := uc.templateRepo.GetByID(ctx, id)
	if err != nil {
		return entity.Template{}, fmt.Errorf("template not found: %w", err)
	}
	if t.UserID != userID {
		return entity.Template{}, errors.New("forbidden")
	}
	if input.Name == "" {
		return entity.Template{}, errors.New("name is required")
	}
	if len([]rune(input.Name)) > 200 {
		return entity.Template{}, errors.New("name exceeds 200 characters")
	}

	t.Name = input.Name
	t.IsPublic = input.IsPublic

	if err := uc.templateRepo.Update(ctx, t); err != nil {
		return entity.Template{}, fmt.Errorf("update template: %w", err)
	}
	return t, nil
}

func (uc *templateUseCase) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	t, err := uc.templateRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("template not found: %w", err)
	}
	if t.UserID != userID {
		return errors.New("forbidden")
	}
	return uc.templateRepo.Delete(ctx, id)
}

func (uc *templateUseCase) CreateWishlistFromTemplate(ctx context.Context, templateID uuid.UUID, userID uuid.UUID, title string) (entity.Wishlist, error) {
	if title == "" {
		return entity.Wishlist{}, errors.New("title is required")
	}

	t, err := uc.templateRepo.GetByID(ctx, templateID)
	if err != nil {
		return entity.Wishlist{}, fmt.Errorf("template not found: %w", err)
	}
	// Allow only public templates or user's own templates
	if !t.IsPublic && t.UserID != userID {
		return entity.Wishlist{}, errors.New("forbidden")
	}

	count, err := uc.wishlistRepo.CountByUserID(ctx, userID)
	if err != nil {
		return entity.Wishlist{}, fmt.Errorf("count wishlists: %w", err)
	}
	if count >= usecase.MaxWishlistsPerUser {
		return entity.Wishlist{}, errors.New("достигнут лимит вишлистов (20)")
	}

	// Generate unique shortID — retry up to 5 times
	var sid string
	for i := 0; i < 5; i++ {
		s, err := shortid.Generate()
		if err != nil {
			return entity.Wishlist{}, fmt.Errorf("generate short id: %w", err)
		}
		if _, err := uc.wishlistRepo.GetByShortID(ctx, s); err != nil {
			sid = s
			break
		}
	}
	if sid == "" {
		return entity.Wishlist{}, errors.New("failed to generate unique short id")
	}

	// Copy blocks from template — they already have empty data
	blocks := make([]entity.Block, len(t.Blocks))
	copy(blocks, t.Blocks)

	w := entity.Wishlist{
		ID:       uuid.New(),
		UserID:   userID,
		ShortID:  sid,
		Title:    title,
		Settings: t.Settings,
		Blocks:   blocks,
	}

	if err := uc.wishlistRepo.Create(ctx, w); err != nil {
		return entity.Wishlist{}, fmt.Errorf("create wishlist from template: %w", err)
	}
	return w, nil
}
```

- [ ] **Step 3.3: Скомпилировать**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...
```
Ожидание: успешная компиляция.

- [ ] **Step 3.4: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/usecase/contracts.go internal/usecase/template/
git commit -m "feat: add TemplateUseCase implementation"
```

---

## Task 4: Template HTTP handler + User profile handlers + Router + App wire (Backend)

**Files:**
- Create: `internal/controller/restapi/v1/template.go`
- Modify: `internal/controller/restapi/v1/user.go`
- Modify: `internal/controller/restapi/v1/router.go`
- Modify: `internal/controller/restapi/router.go`
- Modify: `internal/app/app.go`

- [ ] **Step 4.1: Создать `internal/controller/restapi/v1/template.go`**

```go
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"main/internal/controller/restapi/v1/response"
	"main/internal/usecase"
)

type templateHandler struct {
	uc usecase.TemplateUseCase
}

func newTemplateHandler(uc usecase.TemplateUseCase) *templateHandler {
	return &templateHandler{uc: uc}
}

func (h *templateHandler) getPublic(c *fiber.Ctx) error {
	cursor := c.Query("cursor", "")
	templates, nextCursor, err := h.uc.GetPublic(c.Context(), 0, cursor)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(response.Error(err.Error()))
	}
	return c.JSON(fiber.Map{
		"data":       templates,
		"nextCursor": nextCursor,
	})
}

func (h *templateHandler) getMy(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	templates, err := h.uc.GetAllByUser(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(response.Error(err.Error()))
	}
	return c.JSON(response.Data(templates))
}

func (h *templateHandler) create(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}

	var body struct {
		WishlistID string `json:"wishlistId"`
		Name       string `json:"name"`
		IsPublic   bool   `json:"isPublic"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	wishlistID, err := uuid.Parse(body.WishlistID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid wishlistId"))
	}
	if body.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("name is required"))
	}

	t, err := h.uc.Create(c.Context(), userID, usecase.CreateTemplateInput{
		WishlistID: wishlistID,
		Name:       body.Name,
		IsPublic:   body.IsPublic,
	})
	if err != nil {
		if err.Error() == "forbidden" {
			return c.Status(fiber.StatusForbidden).JSON(response.Error(err.Error()))
		}
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(response.Data(t))
}

func (h *templateHandler) update(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid template ID"))
	}

	var body struct {
		Name     string `json:"name"`
		IsPublic bool   `json:"isPublic"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}

	t, err := h.uc.Update(c.Context(), id, userID, usecase.UpdateTemplateInput{
		Name:     body.Name,
		IsPublic: body.IsPublic,
	})
	if err != nil {
		if err.Error() == "forbidden" {
			return c.Status(fiber.StatusForbidden).JSON(response.Error(err.Error()))
		}
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	return c.JSON(response.Data(t))
}

func (h *templateHandler) delete(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid template ID"))
	}

	if err := h.uc.Delete(c.Context(), id, userID); err != nil {
		if err.Error() == "forbidden" {
			return c.Status(fiber.StatusForbidden).JSON(response.Error(err.Error()))
		}
		return c.Status(fiber.StatusInternalServerError).JSON(response.Error(err.Error()))
	}
	return c.JSON(response.Data(true))
}

func (h *templateHandler) createWishlistFromTemplate(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	templateID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid template ID"))
	}

	var body struct {
		Title string `json:"title"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid input"))
	}
	if body.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("title is required"))
	}

	wishlist, err := h.uc.CreateWishlistFromTemplate(c.Context(), templateID, userID, body.Title)
	if err != nil {
		if err.Error() == "forbidden" {
			return c.Status(fiber.StatusForbidden).JSON(response.Error(err.Error()))
		}
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(response.Data(wishlist))
}
```

- [ ] **Step 4.2: Добавить profile handlers в `internal/controller/restapi/v1/user.go`**

Заменить сигнатуру `userHandler` и `newUserHandler`, добавить handlers. В начало файла добавить импорт `"io"`. Полная замена структуры `userHandler`:

```go
type userHandler struct {
	uc           usecase.UserUseCase
	uploadUC     usecase.UploadUseCase
	cookieDomain string
	secureCookie bool
}

func newUserHandler(uc usecase.UserUseCase, uploadUC usecase.UploadUseCase, cookieDomain string, secureCookie bool) *userHandler {
	return &userHandler{uc: uc, uploadUC: uploadUC, cookieDomain: cookieDomain, secureCookie: secureCookie}
}
```

Добавить методы `getProfile` и `updateProfile` в конец файла:
```go
func (h *userHandler) getProfile(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	user, err := h.uc.GetProfile(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(response.Error(err.Error()))
	}
	return c.JSON(fiber.Map{
		"user": fiber.Map{
			"id":          user.ID,
			"username":    user.Username,
			"displayName": user.DisplayName,
			"avatar":      user.Avatar,
		},
	})
}

func (h *userHandler) updateProfile(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}

	input := usecase.UpdateProfileInput{}

	if dn := c.FormValue("display_name"); dn != "" {
		input.DisplayName = &dn
	}

	file, err := c.FormFile("avatar")
	if err == nil && file != nil {
		f, err := file.Open()
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(response.Error("failed to open avatar file"))
		}
		defer f.Close()
		data, err := io.ReadAll(f)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(response.Error("failed to read avatar file"))
		}
		if len(data) > usecase.MaxFileSize {
			return c.Status(fiber.StatusBadRequest).JSON(response.Error("avatar too large: max 10MB"))
		}
		uploaded, err := h.uploadUC.Upload(c.Context(), file.Filename, data)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(response.Error("failed to upload avatar"))
		}
		input.Avatar = &uploaded.URL
	}

	user, err := h.uc.UpdateProfile(c.Context(), userID, input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error(err.Error()))
	}
	return c.JSON(fiber.Map{
		"user": fiber.Map{
			"id":          user.ID,
			"username":    user.Username,
			"displayName": user.DisplayName,
			"avatar":      user.Avatar,
		},
	})
}
```

Добавить импорт `"io"` в список импортов файла.

- [ ] **Step 4.3: Обновить `internal/controller/restapi/v1/router.go`**

Полная замена файла:
```go
package v1

import (
	"github.com/gofiber/fiber/v2"

	"main/internal/controller/restapi/middleware"
	"main/internal/usecase"
)

func NewRouter(
	router fiber.Router,
	jwtSecret string,
	cookieDomain string,
	secureCookie bool,
	userUC usecase.UserUseCase,
	wishlistUC usecase.WishlistUseCase,
	presentUC usecase.PresentUseCase,
	uploadUC usecase.UploadUseCase,
	parseUC usecase.ParseUseCase,
	templateUC usecase.TemplateUseCase,
) {
	api := router.Group("/api/v1")

	userH := newUserHandler(userUC, uploadUC, cookieDomain, secureCookie)
	wishlistH := newWishlistHandler(wishlistUC)
	presentH := newPresentHandler(presentUC)
	uploadH := newUploadHandler(uploadUC)
	parseH := newParseHandler(parseUC)
	templateH := newTemplateHandler(templateUC)

	// Auth (public)
	auth := api.Group("/auth")
	auth.Post("/register", userH.register)
	auth.Post("/login", userH.login)
	auth.Post("/telegram", userH.authTelegram)

	// Auth (protected)
	authProtected := api.Group("/auth")
	authProtected.Use(middleware.JWTProtected(jwtSecret))
	authProtected.Get("/me", userH.me)
	authProtected.Post("/logout", userH.logout)

	// Templates (public) — BEFORE protected group
	api.Get("/templates", templateH.getPublic)

	// Wishlists (public) — статичные маршруты ПЕРЕД параметрическими
	api.Get("/wishlists/s/:shortId", wishlistH.getByShortID)
	api.Get("/wishlists/:id", wishlistH.getOne)
	api.Get("/wishlists/:wishlistId/presents", presentH.getAll)
	api.Put("/presents/:id/reserve", presentH.reserve)
	api.Put("/presents/:id/release", presentH.release)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.JWTProtected(jwtSecret))

	// User profile
	protected.Get("/users/me", userH.getProfile)
	protected.Patch("/users/me", userH.updateProfile)

	// Parse
	protected.Get("/parse", parseH.parse)

	// Upload
	protected.Post("/upload", uploadH.upload)
	protected.Post("/upload/bulk", uploadH.bulkUpload)

	// Wishlists (protected)
	protected.Get("/wishlists", wishlistH.getAll)
	protected.Post("/wishlists", wishlistH.create)
	protected.Post("/wishlists/constructor", wishlistH.createConstructor)
	protected.Put("/wishlists/:id", wishlistH.update)
	protected.Put("/wishlists/:id/blocks", wishlistH.updateBlocks)
	protected.Delete("/wishlists/:id", wishlistH.delete)

	// Presents (protected)
	protected.Post("/wishlists/:wishlistId/presents", presentH.create)
	protected.Get("/presents/:id", presentH.getOne)
	protected.Put("/presents/:id", presentH.update)
	protected.Delete("/wishlists/:wishlistId/presents/:id", presentH.delete)

	// Templates (protected)
	protected.Get("/templates/my", templateH.getMy)
	protected.Post("/templates", templateH.create)
	protected.Patch("/templates/:id", templateH.update)
	protected.Delete("/templates/:id", templateH.delete)
	protected.Post("/wishlists/from-template/:id", templateH.createWishlistFromTemplate)
}
```

- [ ] **Step 4.4: Обновить `internal/controller/restapi/router.go`**

Добавить `templateUC usecase.TemplateUseCase` в параметры `NewRouter` и передать в `v1.NewRouter`:
```go
func NewRouter(
	app *fiber.App,
	cfg *config.Config,
	userUC usecase.UserUseCase,
	wishlistUC usecase.WishlistUseCase,
	presentUC usecase.PresentUseCase,
	uploadUC usecase.UploadUseCase,
	parseUC usecase.ParseUseCase,
	templateUC usecase.TemplateUseCase,
) {
	// ... все middleware остаются без изменений ...
	v1.NewRouter(app, cfg.Auth.JWTSecret, cfg.Auth.CookieDomain, cfg.App.Env == "production", userUC, wishlistUC, presentUC, uploadUC, parseUC, templateUC)
}
```

- [ ] **Step 4.5: Обновить `internal/app/app.go`**

Добавить импорт `templateUC "main/internal/usecase/template"`. В секцию AutoMigrate добавить `&persistent.TemplateModel{}`. В секцию репозиториев добавить `templateRepo := persistent.NewTemplateRepo(db)`. В секцию Use Cases добавить `templateUseCase := templateUC.New(templateRepo, wishlistRepo)`. В вызов `restapi.NewRouter` добавить `templateUseCase` последним аргументом.

- [ ] **Step 4.6: Скомпилировать**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...
```
Ожидание: успешная компиляция.

- [ ] **Step 4.7: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/controller/ internal/app/app.go
git commit -m "feat: add template and user profile HTTP handlers, wire everything"
```

---

## Task 5: Backend tests (Backend)

**Files:**
- Modify: `internal/controller/restapi/v1/testhelpers_test.go`
- Create: `internal/controller/restapi/v1/template_test.go`

- [ ] **Step 5.1: Добавить `MockTemplateUC` в `internal/controller/restapi/v1/testhelpers_test.go`**

Добавить в конец файла:
```go
// MockTemplateUC

type MockTemplateUC struct{ mock.Mock }

func (m *MockTemplateUC) Create(ctx context.Context, userID uuid.UUID, input usecase.CreateTemplateInput) (entity.Template, error) {
	args := m.Called(ctx, userID, input)
	return args.Get(0).(entity.Template), args.Error(1)
}

func (m *MockTemplateUC) GetAllByUser(ctx context.Context, userID uuid.UUID) ([]entity.Template, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]entity.Template), args.Error(1)
}

func (m *MockTemplateUC) GetPublic(ctx context.Context, limit int, cursor string) ([]entity.TemplateWithAuthor, string, error) {
	args := m.Called(ctx, limit, cursor)
	return args.Get(0).([]entity.TemplateWithAuthor), args.Get(1).(string), args.Error(2)
}

func (m *MockTemplateUC) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input usecase.UpdateTemplateInput) (entity.Template, error) {
	args := m.Called(ctx, id, userID, input)
	return args.Get(0).(entity.Template), args.Error(1)
}

func (m *MockTemplateUC) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	args := m.Called(ctx, id, userID)
	return args.Error(0)
}

func (m *MockTemplateUC) CreateWishlistFromTemplate(ctx context.Context, templateID uuid.UUID, userID uuid.UUID, title string) (entity.Wishlist, error) {
	args := m.Called(ctx, templateID, userID, title)
	return args.Get(0).(entity.Wishlist), args.Error(1)
}
```

Обновить все `setupXxxApp` функции в тестах, добавив `&MockTemplateUC{}` в вызов `v1.NewRouter` (последним аргументом).

- [ ] **Step 5.2: Обновить `setupUserApp` и другие setup-функции**

В `user_test.go`, `wishlist_test.go`, `present_test.go` и `parse_test.go` найти все вызовы `v1.NewRouter(...)` и добавить `&MockTemplateUC{}` последним аргументом.

- [ ] **Step 5.3: Запустить существующие тесты — убедиться что компилируются и проходят**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/controller/restapi/v1/... -v -count=1
```
Ожидание: все существующие тесты проходят.

- [ ] **Step 5.4: Создать `internal/controller/restapi/v1/template_test.go`**

```go
package v1_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	v1 "main/internal/controller/restapi/v1"
	"main/internal/entity"
	"main/internal/usecase"
)

func setupTemplateApp(tm *MockTemplateUC) *fiber.App {
	app := fiber.New()
	v1.NewRouter(app, testSecret, "", false,
		&MockUserUC{}, &MockWishlistUC{}, &MockPresentUC{}, &MockUploadUC{}, &MockParseUC{},
		tm,
	)
	return app
}

func TestGetPublicTemplates_Success(t *testing.T) {
	tm := &MockTemplateUC{}
	app := setupTemplateApp(tm)

	templates := []entity.TemplateWithAuthor{
		{
			Template: entity.Template{
				ID:        uuid.New(),
				Name:      "Birthday template",
				IsPublic:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			UserDisplayName: "Никита",
		},
	}
	tm.On("GetPublic", mock.Anything, 0, "").Return(templates, "", nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates", nil)
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	data := result["data"].([]interface{})
	assert.Len(t, data, 1)
}

func TestCreateTemplate_Success(t *testing.T) {
	tm := &MockTemplateUC{}
	app := setupTemplateApp(tm)

	userID := uuid.New()
	token := makeTestToken(userID)
	wishlistID := uuid.New()

	created := entity.Template{
		ID:       uuid.New(),
		UserID:   userID,
		Name:     "Мой шаблон",
		IsPublic: false,
	}
	tm.On("Create", mock.Anything, userID, usecase.CreateTemplateInput{
		WishlistID: wishlistID,
		Name:       "Мой шаблон",
		IsPublic:   false,
	}).Return(created, nil)

	body := bytes.NewBufferString(`{"wishlistId":"` + wishlistID.String() + `","name":"Мой шаблон","isPublic":false}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/templates", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusCreated, resp.StatusCode)
}

func TestCreateTemplate_Unauthorized(t *testing.T) {
	tm := &MockTemplateUC{}
	app := setupTemplateApp(tm)

	body := bytes.NewBufferString(`{"wishlistId":"` + uuid.New().String() + `","name":"test","isPublic":false}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/templates", body)
	req.Header.Set("Content-Type", "application/json")
	// No auth token

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
}

func TestDeleteTemplate_Forbidden(t *testing.T) {
	tm := &MockTemplateUC{}
	app := setupTemplateApp(tm)

	userID := uuid.New()
	token := makeTestToken(userID)
	templateID := uuid.New()

	tm.On("Delete", mock.Anything, templateID, userID).Return(errors.New("forbidden"))

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/templates/"+templateID.String(), nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusForbidden, resp.StatusCode)
}

func TestCreateWishlistFromTemplate_Success(t *testing.T) {
	tm := &MockTemplateUC{}
	app := setupTemplateApp(tm)

	userID := uuid.New()
	token := makeTestToken(userID)
	templateID := uuid.New()

	wishlist := entity.Wishlist{ID: uuid.New(), Title: "Мой день рождения"}
	tm.On("CreateWishlistFromTemplate", mock.Anything, templateID, userID, "Мой день рождения").
		Return(wishlist, nil)

	body := bytes.NewBufferString(`{"title":"Мой день рождения"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/wishlists/from-template/"+templateID.String(), body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusCreated, resp.StatusCode)
}
```

- [ ] **Step 5.5: Запустить тесты**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go test ./internal/controller/restapi/v1/... -v -run TestGetPublicTemplates -run TestCreateTemplate -run TestDeleteTemplate -run TestCreateWishlistFromTemplate -count=1
```
Ожидание: 4 теста проходят.

- [ ] **Step 5.6: Запустить все тесты**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go test ./... -count=1
```
Ожидание: все тесты проходят.

- [ ] **Step 5.7: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist
git add internal/controller/restapi/v1/template_test.go internal/controller/restapi/v1/testhelpers_test.go
git commit -m "test: add template handler tests"
```

---

## Task 6: Расширить типы и API хуки (Frontend)

**Files:**
- Modify: `shared/types.ts`
- Create: `api/template/index.ts`
- Modify: `api/user/index.ts`

- [ ] **Step 6.1: Расширить `shared/types.ts`**

Заменить тип `User`:
```ts
export type User = {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}
```

Добавить тип `Template` после `Present`:
```ts
export type Template = {
  id: string;
  userId: string;
  userDisplayName?: string;
  name: string;
  settings: {
    colorScheme: string;
    showGiftAvailability: boolean;
    presentsLayout?: 'list' | 'grid3' | 'grid2';
  };
  blocks: Block[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 6.2: Создать `api/template/index.ts`**

```ts
import api from '@/lib/api'
import { Template, Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const useApiGetPublicTemplates = (cursor?: string) => {
  return useQuery({
    queryKey: ['templates-public', cursor ?? ''],
    queryFn: async () =>
      api.get<{ data: Template[]; nextCursor: string | null }>(
        `templates${cursor ? `?cursor=${cursor}` : ''}`,
      ),
  })
}

export const useApiGetMyTemplates = () => {
  return useQuery({
    queryKey: ['templates-my'],
    queryFn: async () => api.get<{ data: Template[] }>('templates/my'),
  })
}

export const useApiCreateTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: Template },
    AxiosError,
    { wishlistId: string; name: string; isPublic: boolean }
  >({
    mutationFn: async (body) => api.post('templates', body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates-my'] })
    },
  })
}

export const useApiUpdateTemplate = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: Template },
    AxiosError,
    { name: string; isPublic: boolean }
  >({
    mutationFn: async (body) => api.patch(`templates/${id}`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates-my'] })
    },
  })
}

export const useApiDeleteTemplate = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: boolean }, AxiosError>({
    mutationFn: async () => api.delete(`templates/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates-my'] })
    },
  })
}

export const useApiCreateWishlistFromTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, { templateId: string; title: string }>({
    mutationFn: async ({ templateId, title }) =>
      api.post(`wishlists/from-template/${templateId}`, { title }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlists'] })
    },
  })
}
```

- [ ] **Step 6.3: Добавить `useApiGetMyProfile` и `useApiUpdateMe` в `api/user/index.ts`**

```ts
import { User } from '@/shared/types'

export const useApiGetMyProfile = () => {
  return useQuery<{ user: User }>({
    queryKey: ['my-profile'],
    queryFn: async () => api.get<{ user: User }>('users/me'),
  })
}

export const useApiUpdateMe = () => {
  const queryClient = useQueryClient()
  return useMutation<{ user: User }, AxiosError, FormData>({
    mutationFn: async (data) =>
      api.patch('users/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })
}
```

Добавить нужные импорты (`useQueryClient`, `useMutation`, `User`).

- [ ] **Step 6.4: Проверить сборку**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && pnpm build 2>&1 | tail -20
```
Ожидание: компиляция без ошибок типов.

- [ ] **Step 6.5: Commit**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front
git add shared/types.ts api/template/index.ts api/user/index.ts
git commit -m "feat: add Template type, template API hooks, profile hooks"
```

---

## Task 7: SaveAsTemplateModal (Frontend)

**Files:**
- Create: `app/wishlist/components/save-as-template-modal.tsx`
- Modify: `app/wishlist/components/constructor/constructor-header.tsx`
- Modify: `app/wishlist/[id]/components/wishlist-menu.tsx`

- [ ] **Step 7.1: Создать `app/wishlist/components/save-as-template-modal.tsx`**

```tsx
'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useApiCreateTemplate } from '@/api/template'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

const schema = z.object({
  name: z.string().min(1, { message: 'Название обязательно' }).max(200),
})
type FormData = z.infer<typeof schema>

type Props = {
  wishlistId: string
  wishlistTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveAsTemplateModal({ wishlistId, wishlistTitle, open, onOpenChange }: Props) {
  const [isPublic, setIsPublic] = React.useState(false)
  const { mutate, isPending } = useApiCreateTemplate()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: wishlistTitle },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({ name: wishlistTitle })
      setIsPublic(false)
    }
  }, [open, wishlistTitle, form])

  const handleSubmit = (data: FormData) => {
    mutate(
      { wishlistId, name: data.name, isPublic },
      {
        onSuccess: () => {
          onOpenChange(false)
          toast({
            title: 'Шаблон сохранён',
            description: (
              <button
                className="underline text-sm"
                onClick={() => router.push('/templates')}
              >
                Посмотреть в пользовательских шаблонах →
              </button>
            ),
          })
        },
        onError: () => {
          toast({ title: 'Ошибка сохранения шаблона', variant: 'destructive' })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Сохранить как шаблон</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название шаблона</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой шаблон" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <Label htmlFor="is-public">Сделать публичным</Label>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button type="submit" className="flex-[2]" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить шаблон
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 7.2: Добавить кнопку "Сохранить как шаблон" в `ConstructorHeader`**

В `app/wishlist/components/constructor/constructor-header.tsx`:

1. Добавить импорт в начало:
```tsx
import { BookmarkPlus } from 'lucide-react'
import { SaveAsTemplateModal } from '@/app/wishlist/components/save-as-template-modal'
```

2. Добавить состояние после существующих `useState`:
```tsx
const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false)
```

3. Добавить кнопку перед `<p className="text-xs text-muted-foreground">Сохраняется автоматически</p>`:
```tsx
<button
  type="button"
  onClick={() => setSaveTemplateOpen(true)}
  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
>
  <BookmarkPlus size={14} />
  Сохранить как шаблон
</button>
```

4. Добавить в конец JSX (перед закрывающим `</div>`):
```tsx
<SaveAsTemplateModal
  wishlistId={wishlist.id}
  wishlistTitle={title}
  open={saveTemplateOpen}
  onOpenChange={setSaveTemplateOpen}
/>
```

- [ ] **Step 7.3: Добавить пункт меню в `WishlistMenu`**

В `app/wishlist/[id]/components/wishlist-menu.tsx`:

1. Добавить импорты:
```tsx
import { SaveAsTemplateModal } from '@/app/wishlist/components/save-as-template-modal'
import * as React from 'react'
```

2. Добавить состояние:
```tsx
const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false)
```

3. Добавить пункт меню:
```tsx
<DropdownMenuItem onClick={() => setSaveTemplateOpen(true)}>
  Сохранить как шаблон
</DropdownMenuItem>
```

4. Добавить модал после `</DropdownMenu>`:
```tsx
<SaveAsTemplateModal
  wishlistId={wishlist.id}
  wishlistTitle={wishlist.title}
  open={saveTemplateOpen}
  onOpenChange={setSaveTemplateOpen}
/>
```

- [ ] **Step 7.4: Проверить lint**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && pnpm lint
```
Ожидание: нет ошибок.

- [ ] **Step 7.5: Commit**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front
git add app/wishlist/components/save-as-template-modal.tsx \
  app/wishlist/components/constructor/constructor-header.tsx \
  app/wishlist/[id]/components/wishlist-menu.tsx
git commit -m "feat: add SaveAsTemplateModal, wire into ConstructorHeader and WishlistMenu"
```

---

## Task 8: Личный кабинет `/wishlist/settings` (Frontend)

**Files:**
- Create: `app/wishlist/settings/page.tsx`
- Modify: `app/wishlist/layout.tsx`

- [ ] **Step 8.1: Создать `app/wishlist/settings/page.tsx`**

```tsx
'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useApiGetMyProfile, useApiUpdateMe } from '@/api/user'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  displayName: z.string().max(100, 'Не более 100 символов'),
})
type FormData = z.infer<typeof schema>

export default function Page() {
  const { data, isLoading } = useApiGetMyProfile()
  const { mutate, isPending } = useApiUpdateMe()
  const { toast } = useToast()
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const user = data?.user

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '' },
  })

  React.useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName ?? '' })
    }
  }, [user, form])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = (data: FormData) => {
    const fd = new FormData()
    fd.append('display_name', data.displayName)
    if (avatarFile) {
      fd.append('avatar', avatarFile)
    }
    mutate(fd, {
      onSuccess: () => {
        toast({ title: 'Профиль обновлён' })
        setAvatarFile(null)
      },
      onError: () => {
        toast({ title: 'Ошибка сохранения', variant: 'destructive' })
      },
    })
  }

  if (isLoading) return null

  const currentAvatar = avatarPreview ?? user?.avatar

  return (
    <div className="max-w-md">
      <h2 className="text-4xl mb-6">Настройки профиля</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium">Аватар</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary transition-colors group"
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-muted-foreground">👤</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Display Name */}
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Отображаемое имя</FormLabel>
                <FormControl>
                  <Input placeholder="Как тебя показывать в галерее" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Username (read-only) */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Логин</p>
            <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
              {user?.username}
            </p>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </form>
      </Form>
    </div>
  )
}
```

- [ ] **Step 8.2: Добавить ссылку "Настройки" в `app/wishlist/layout.tsx`**

Заменить layout на:
```tsx
import { Header } from '@/components/header'
import Link from 'next/link'
import * as React from 'react'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      <div className="p-5 max-w-[90rem] mx-auto">
        <nav className="flex gap-4 mb-6 border-b border-border pb-3">
          <Link
            href="/wishlist"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Мои вишлисты
          </Link>
          <Link
            href="/wishlist/settings"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Настройки
          </Link>
        </nav>
        {children}
      </div>
    </>
  )
}
```

- [ ] **Step 8.3: Проверить lint**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && pnpm lint
```

- [ ] **Step 8.4: Commit**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front
git add app/wishlist/settings/page.tsx app/wishlist/layout.tsx
git commit -m "feat: add personal cabinet settings page and nav link"
```

---

## Task 9: Обновить страницу создания `/wishlist/create` (Frontend)

**Files:**
- Modify: `app/wishlist/create/page.tsx`

- [ ] **Step 9.1: Обновить `app/wishlist/create/page.tsx`**

Полная замена файла:
```tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, LayoutTemplate } from 'lucide-react'
import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { useApiGetMyTemplates, useApiCreateWishlistFromTemplate } from '@/api/template'
import { templates, WishlistTemplate } from '@/content/templates'
import { Template } from '@/shared/types'
import { TemplateCard } from './components/template-card'
import { TemplateDialog } from './components/template-dialog'
import { FromUserTemplateDialog } from './components/from-user-template-dialog'
import { Button } from '@/components/ui/button'

export default function Page() {
  const router = useRouter()
  const { mutate: createWishlist, isPending: isCreatingSystem } = useApiCreateConstructorWishlist()
  const { mutate: createFromTemplate, isPending: isCreatingFromTemplate } = useApiCreateWishlistFromTemplate()
  const { data: myTemplatesData } = useApiGetMyTemplates()

  const myTemplates = myTemplatesData?.data ?? []
  const isPending = isCreatingSystem || isCreatingFromTemplate

  const [selectedTemplate, setSelectedTemplate] = React.useState<WishlistTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const [selectedUserTemplate, setSelectedUserTemplate] = React.useState<Template | null>(null)
  const [userDialogOpen, setUserDialogOpen] = React.useState(false)

  const handleTemplateClick = (template: WishlistTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleTemplateSubmit = (template: WishlistTemplate, title: string, date?: Date) => {
    createWishlist(
      {
        title,
        colorScheme: template.colorScheme,
        blocks: template.buildBlocks(title, date),
      },
      {
        onSuccess: (res) => {
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
        },
      },
    )
  }

  const handleUserTemplateClick = (template: Template) => {
    setSelectedUserTemplate(template)
    setUserDialogOpen(true)
  }

  const handleUserTemplateSubmit = (title: string) => {
    if (!selectedUserTemplate) return
    createFromTemplate(
      { templateId: selectedUserTemplate.id, title },
      {
        onSuccess: (res) => {
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
        },
      },
    )
  }

  const handleEmpty = () => {
    createWishlist(
      { title: 'Новый вишлист', blocks: [] },
      {
        onSuccess: (res) => {
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
        },
      },
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} />
        Назад
      </button>

      <h2 className="text-4xl mb-2">Создать вишлист</h2>
      <p className="text-muted-foreground mb-8">
        Начни с шаблона — мы уже собрали структуру за тебя.
      </p>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Выбери шаблон
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onClick={handleTemplateClick} />
        ))}
        <div className="rounded-2xl overflow-hidden opacity-60 cursor-default flex flex-col h-full">
          <div className="bg-gradient-to-br from-muted to-muted/60 px-4 pt-5 pb-3.5 text-center">
            <div className="text-4xl mb-1 opacity-40">✨</div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Скоро
            </div>
          </div>
          <div className="bg-muted/30 px-3.5 py-3 border-t-2 border-muted flex-1">
            <div className="font-bold text-sm mb-0.5 text-muted-foreground">Больше шаблонов</div>
            <div className="text-xs text-muted-foreground/60">Новый год, юбилей…</div>
          </div>
        </div>
      </div>

      {myTemplates.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">или</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Мои шаблоны
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/templates')}
              className="text-xs gap-1.5"
            >
              <LayoutTemplate size={14} />
              Пользовательские шаблоны
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {myTemplates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => handleUserTemplateClick(template)}
                disabled={isPending}
                className="rounded-2xl overflow-hidden border border-border hover:border-primary transition-colors text-left"
              >
                <div
                  className="px-4 pt-4 pb-3 text-sm font-semibold"
                  style={{ background: `var(--${template.settings.colorScheme}-background, var(--muted))` }}
                >
                  {template.name}
                </div>
                <div className="px-3.5 py-2 text-xs text-muted-foreground">
                  {template.blocks.length} блоков
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">или</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={handleEmpty}
        disabled={isPending}
        className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        ) : (
          <span className="text-2xl">📋</span>
        )}
        <div>
          <div className="font-semibold text-sm">Пустой вишлист</div>
          <div className="text-xs text-muted-foreground">Начни с чистого листа, добавь блоки сам</div>
        </div>
      </button>

      <TemplateDialog
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleTemplateSubmit}
        isPending={isPending}
      />

      <FromUserTemplateDialog
        template={selectedUserTemplate}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSubmit={handleUserTemplateSubmit}
        isPending={isPending}
      />
    </div>
  )
}
```

- [ ] **Step 9.2: Создать `app/wishlist/create/components/from-user-template-dialog.tsx`**

```tsx
'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Template } from '@/shared/types'

const schema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
})
type FormData = z.infer<typeof schema>

type Props = {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (title: string) => void
  isPending: boolean
}

export function FromUserTemplateDialog({ template, open, onOpenChange, onSubmit, isPending }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  })

  React.useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  const handleSubmit = (data: FormData) => onSubmit(data.title)

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название вишлиста</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой вишлист" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button type="submit" className="flex-[2]" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать вишлист
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 9.3: Проверить lint**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && pnpm lint
```

- [ ] **Step 9.4: Commit**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front
git add app/wishlist/create/page.tsx app/wishlist/create/components/from-user-template-dialog.tsx
git commit -m "feat: add My Templates section on create page, FromUserTemplateDialog"
```

---

## Task 10: Публичная галерея `/templates` (Frontend)

**Files:**
- Create: `app/templates/page.tsx`

- [ ] **Step 10.1: Создать `app/templates/page.tsx`**

```tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LayoutTemplate } from 'lucide-react'
import { useApiGetPublicTemplates, useApiCreateWishlistFromTemplate } from '@/api/template'
import { Template } from '@/shared/types'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/button'
import { FromUserTemplateDialog } from '@/app/wishlist/create/components/from-user-template-dialog'

export default function Page() {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const [cursor, setCursor] = React.useState<string | undefined>(undefined)
  const [allTemplates, setAllTemplates] = React.useState<Template[]>([])

  const { data, isFetching } = useApiGetPublicTemplates(cursor)
  const { mutate: createFromTemplate, isPending: isCreating } = useApiCreateWishlistFromTemplate()

  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (data?.data) {
      setAllTemplates((prev) => {
        const ids = new Set(prev.map((t) => t.id))
        return [...prev, ...data.data.filter((t) => !ids.has(t.id))]
      })
    }
  }, [data])

  const handleUse = (template: Template) => {
    if (!user) {
      router.push('/login')
      return
    }
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleSubmit = (title: string) => {
    if (!selectedTemplate) return
    createFromTemplate(
      { templateId: selectedTemplate.id, title },
      {
        onSuccess: (res) => {
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
        },
      },
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-5">
      <div className="flex items-center gap-3 mb-2">
        <LayoutTemplate size={28} />
        <h1 className="text-4xl">Пользовательские шаблоны</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Шаблоны от сообщества — бери готовую структуру и создавай свой вишлист
      </p>

      {allTemplates.length === 0 && !isFetching && (
        <div className="text-center py-24 text-muted-foreground">
          Пока нет публичных шаблонов
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {allTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl border border-border overflow-hidden flex flex-col"
          >
            <div className="px-4 pt-5 pb-4 bg-muted/40 flex-1">
              <p className="font-semibold text-base mb-1">{template.name}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {template.blocks.length} блоков · {template.settings.colorScheme}
              </p>
              {template.userDisplayName && (
                <p className="text-xs text-muted-foreground">
                  от {template.userDisplayName}
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleUse(template)}
                disabled={isCreating}
              >
                Использовать
              </Button>
            </div>
          </div>
        ))}
      </div>

      {data?.nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCursor(data.nextCursor!)}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Загрузить ещё'}
          </Button>
        </div>
      )}

      <FromUserTemplateDialog
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isPending={isCreating}
      />
    </div>
  )
}
```

- [ ] **Step 10.2: Проверить lint**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && pnpm lint
```

- [ ] **Step 10.3: Проверить сборку**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && pnpm build 2>&1 | tail -20
```
Ожидание: успешная сборка.

- [ ] **Step 10.4: Commit**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front
git add app/templates/page.tsx
git commit -m "feat: add public templates gallery page"
```

---

## Checklist: Соответствие спеку

- [x] Шаблоны хранятся в отдельной таблице `templates` (Task 2)
- [x] Блоки стриппятся при сохранении (data → `{}`) (Task 3)
- [x] User расширен displayName + avatar (Task 1)
- [x] `GET /templates` публичный, остальные за auth (Task 4 Router)
- [x] Проверка ownership на PATCH/DELETE template (Task 3 usecase)
- [x] `POST /wishlists/from-template/:id` — публичные или свои шаблоны (Task 3)
- [x] Личный кабинет `/wishlist/settings` с аватаркой и displayName (Task 8)
- [x] SaveAsTemplateModal из ConstructorHeader и WishlistMenu (Task 7)
- [x] Секция "Мои шаблоны" на странице создания (Task 9)
- [x] Кнопка "Пользовательские шаблоны" → `/templates` (Task 9)
- [x] Публичная галерея `/templates` с пагинацией (Task 10)
- [x] FromUserTemplateDialog без datepicker (Task 9, 10)
- [x] Toast со ссылкой на шаблоны после сохранения (Task 7)
