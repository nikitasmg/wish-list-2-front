# Template Likes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a like system to the public templates gallery with HN-style time-decay ranking, optimistic UI updates, and offset-based pagination.

**Architecture:** New `template_likes` join table + denormalized `likes_count` counter on `templates`. Public gallery endpoint sorts by decay score. Frontend shows heart button + count on each card with optimistic updates via React Query.

**Tech Stack:** Go/GORM/Fiber (backend at `/Users/nvsmagin/GolandProjects/wishlist`), Next.js 16/TanStack Query (frontend at `/Users/nvsmagin/WebstormProjects/wish-list-2-front`), PostgreSQL

---

## File Map

**Backend — modified:**
- `internal/entity/template.go` — add `LikesCount`, `LikedByMe` to `TemplateWithAuthor`
- `internal/repo/persistent/models.go` — add `LikesCount` to `TemplateModel`, add `TemplateLikeModel`
- `internal/repo/contracts.go` — update `TemplateRepo`: new `GetPublic` signature, add `Like`/`Unlike`
- `internal/repo/persistent/template_postgres.go` — implement updated `GetPublic`, `Like`, `Unlike`
- `internal/usecase/contracts.go` — update `TemplateUseCase`: new `GetPublic` signature, add `Like`/`Unlike`, add `LikeResult` type
- `internal/usecase/template/template.go` — implement updated `GetPublic`, `Like`, `Unlike`
- `internal/controller/restapi/v1/helpers.go` — add `getOptionalUserID`
- `internal/controller/restapi/middleware/jwt.go` — add `JWTOptional`
- `internal/controller/restapi/v1/template.go` — update `getPublic`, add `like`/`unlike` handlers
- `internal/controller/restapi/v1/router.go` — register new routes
- `internal/app/app.go` — add `TemplateLikeModel` to `AutoMigrate`

**Frontend — modified:**
- `shared/types.ts` — add `likesCount`, `likedByMe` to `Template`
- `api/template/index.ts` — update `useApiGetPublicTemplates` (page-based), add `useApiLikeTemplate`, `useApiUnlikeTemplate`
- `app/templates/page.tsx` — heart button + count on card, offset pagination

---

## Task 1: Backend — entity & DB models

**Files:**
- Modify: `internal/entity/template.go`
- Modify: `internal/repo/persistent/models.go`

- [ ] **Step 1: Add `LikesCount` and `LikedByMe` to `TemplateWithAuthor`**

Replace `internal/entity/template.go` with:

```go
package entity

import (
	"time"

	"github.com/google/uuid"
)

type Template struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Name      string    `json:"name"`
	Settings  Settings  `json:"settings"`
	Blocks    []Block   `json:"blocks"`
	IsPublic  bool      `json:"isPublic"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TemplateWithAuthor — template with author name and like data (for public gallery)
type TemplateWithAuthor struct {
	Template
	UserDisplayName string `json:"userDisplayName"`
	LikesCount      int    `json:"likesCount"`
	LikedByMe       bool   `json:"likedByMe"`
}
```

- [ ] **Step 2: Add `LikesCount` to `TemplateModel` and add `TemplateLikeModel`**

In `internal/repo/persistent/models.go`, replace the `TemplateModel` struct and add `TemplateLikeModel` after it:

```go
// TemplateModel — GORM model for "templates" table
type TemplateModel struct {
	ID         uuid.UUID    `gorm:"primaryKey"`
	UserID     uuid.UUID    `gorm:"not null;index"`
	Name       string       `gorm:"not null"`
	Settings   SettingsJSON `gorm:"type:json"`
	Blocks     BlocksJSON   `gorm:"type:jsonb"`
	IsPublic   bool         `gorm:"not null;default:false;index"`
	LikesCount int          `gorm:"not null;default:0"`
	CreatedAt  time.Time    `gorm:"autoCreateTime;index"`
	UpdatedAt  time.Time    `gorm:"autoUpdateTime"`
}

func (TemplateModel) TableName() string { return "templates" }

// TemplateLikeModel — GORM model for "template_likes" table
type TemplateLikeModel struct {
	UserID     uuid.UUID `gorm:"primaryKey;column:user_id"`
	TemplateID uuid.UUID `gorm:"primaryKey;column:template_id"`
	CreatedAt  time.Time `gorm:"not null;autoCreateTime"`
}

func (TemplateLikeModel) TableName() string { return "template_likes" }
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && git add internal/entity/template.go internal/repo/persistent/models.go && git commit -m "feat: add LikesCount/LikedByMe to entity, add TemplateLikeModel"
```

---

## Task 2: Backend — repo contract & implementation

**Files:**
- Modify: `internal/repo/contracts.go`
- Modify: `internal/repo/persistent/template_postgres.go`

- [ ] **Step 1: Update `TemplateRepo` interface in `internal/repo/contracts.go`**

Replace the `TemplateRepo` interface:

```go
type TemplateRepo interface {
	Create(ctx context.Context, template entity.Template) error
	GetByID(ctx context.Context, id uuid.UUID) (entity.Template, error)
	GetAllByUserID(ctx context.Context, userID uuid.UUID) ([]entity.Template, error)
	GetPublic(ctx context.Context, limit, offset int, userID uuid.UUID) ([]entity.TemplateWithAuthor, error)
	Update(ctx context.Context, template entity.Template) error
	Delete(ctx context.Context, id uuid.UUID) error
	CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
	Like(ctx context.Context, userID, templateID uuid.UUID) (int, error)
	Unlike(ctx context.Context, userID, templateID uuid.UUID) (int, error)
}
```

Note: the import of `"time"` can be removed from `contracts.go` since `GetPublic` no longer takes `time.Time`. Check if `time` is still used elsewhere in the file (it is, by `ParseRateLimitRepo.IncrementAndCheck`), so leave it.

- [ ] **Step 2: Implement new `GetPublic`, `Like`, `Unlike` in `internal/repo/persistent/template_postgres.go`**

Replace the entire file:

```go
package persistent

import (
	"context"
	"errors"
	"fmt"

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
	LikedByMe       bool   `gorm:"column:liked_by_me"`
}

func (r *templateRepo) GetPublic(ctx context.Context, limit, offset int, userID uuid.UUID) ([]entity.TemplateWithAuthor, error) {
	var rows []templateWithAuthorRow

	err := r.db.WithContext(ctx).Raw(`
		SELECT
			t.*,
			COALESCE(u.display_name, '') AS user_display_name,
			CASE WHEN tl.user_id IS NOT NULL THEN true ELSE false END AS liked_by_me
		FROM templates t
		LEFT JOIN users u ON u.id = t.user_id
		LEFT JOIN template_likes tl ON tl.template_id = t.id AND tl.user_id = ?
		WHERE t.is_public = true
		ORDER BY
			t.likes_count::float8 / POWER(EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600.0 + 2, 1.5) DESC,
			t.created_at DESC
		LIMIT ? OFFSET ?
	`, userID, limit, offset).Scan(&rows).Error

	if err != nil {
		return nil, fmt.Errorf("templateRepo.GetPublic: %w", err)
	}

	result := make([]entity.TemplateWithAuthor, len(rows))
	for i, row := range rows {
		result[i] = entity.TemplateWithAuthor{
			Template:        toTemplateEntity(row.TemplateModel),
			UserDisplayName: row.UserDisplayName,
			LikesCount:      row.LikesCount,
			LikedByMe:       row.LikedByMe,
		}
	}
	return result, nil
}

func (r *templateRepo) Like(ctx context.Context, userID, templateID uuid.UUID) (int, error) {
	var newCount int
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Exec(
			"INSERT INTO template_likes (user_id, template_id, created_at) VALUES (?, ?, NOW()) ON CONFLICT DO NOTHING",
			userID, templateID,
		)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errors.New("already liked")
		}
		return tx.Raw(
			"UPDATE templates SET likes_count = likes_count + 1 WHERE id = ? RETURNING likes_count",
			templateID,
		).Scan(&newCount).Error
	})
	return newCount, err
}

func (r *templateRepo) Unlike(ctx context.Context, userID, templateID uuid.UUID) (int, error) {
	var newCount int
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Exec(
			"DELETE FROM template_likes WHERE user_id = ? AND template_id = ?",
			userID, templateID,
		)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errors.New("not liked")
		}
		return tx.Raw(
			"UPDATE templates SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ? RETURNING likes_count",
			templateID,
		).Scan(&newCount).Error
	})
	return newCount, err
}

func (r *templateRepo) Update(ctx context.Context, template entity.Template) error {
	m := toTemplateModel(template)
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

func (r *templateRepo) CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&TemplateModel{}).
		Where("user_id = ?", userID).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("templateRepo.CountByUserID: %w", err)
	}
	return count, nil
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && git add internal/repo/contracts.go internal/repo/persistent/template_postgres.go && git commit -m "feat: implement GetPublic with score sort, Like and Unlike in repo"
```

---

## Task 3: Backend — usecase contract & implementation

**Files:**
- Modify: `internal/usecase/contracts.go`
- Modify: `internal/usecase/template/template.go`

- [ ] **Step 1: Add `LikeResult` type and update `TemplateUseCase` in `internal/usecase/contracts.go`**

Add `LikeResult` near the other output types (after `UpdateProfileInput`, before `UserUseCase`):

```go
// LikeResult — returned by Like/Unlike operations
type LikeResult struct {
	LikesCount int  `json:"likesCount"`
	LikedByMe  bool `json:"likedByMe"`
}
```

Replace the `TemplateUseCase` interface:

```go
// TemplateUseCase — business logic for templates
type TemplateUseCase interface {
	Create(ctx context.Context, userID uuid.UUID, input CreateTemplateInput) (entity.Template, error)
	GetAllByUser(ctx context.Context, userID uuid.UUID) ([]entity.Template, error)
	GetPublic(ctx context.Context, limit, page int, userID *uuid.UUID) ([]entity.TemplateWithAuthor, bool, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input UpdateTemplateInput) (entity.Template, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	CreateWishlistFromTemplate(ctx context.Context, templateID uuid.UUID, userID uuid.UUID, title string) (entity.Wishlist, error)
	Like(ctx context.Context, userID, templateID uuid.UUID) (LikeResult, error)
	Unlike(ctx context.Context, userID, templateID uuid.UUID) (LikeResult, error)
}
```

- [ ] **Step 2: Replace `internal/usecase/template/template.go`**

```go
package template

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

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

	count, err := uc.templateRepo.CountByUserID(ctx, userID)
	if err != nil {
		return entity.Template{}, fmt.Errorf("count templates: %w", err)
	}
	if count >= maxTemplatesPerUser {
		return entity.Template{}, errors.New("достигнут лимит шаблонов (50)")
	}

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

func (uc *templateUseCase) GetPublic(ctx context.Context, limit, page int, userID *uuid.UUID) ([]entity.TemplateWithAuthor, bool, error) {
	if limit <= 0 || limit > publicPageSize {
		limit = publicPageSize
	}
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	uid := uuid.Nil
	if userID != nil {
		uid = *userID
	}

	// Fetch one extra to determine hasMore
	items, err := uc.templateRepo.GetPublic(ctx, limit+1, offset, uid)
	if err != nil {
		return nil, false, fmt.Errorf("get public templates: %w", err)
	}

	hasMore := len(items) > limit
	if hasMore {
		items = items[:limit]
	}

	return items, hasMore, nil
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

func (uc *templateUseCase) Like(ctx context.Context, userID, templateID uuid.UUID) (usecase.LikeResult, error) {
	t, err := uc.templateRepo.GetByID(ctx, templateID)
	if err != nil {
		return usecase.LikeResult{}, errors.New("template not found")
	}
	if !t.IsPublic && t.UserID != userID {
		return usecase.LikeResult{}, errors.New("forbidden")
	}
	count, err := uc.templateRepo.Like(ctx, userID, templateID)
	if err != nil {
		return usecase.LikeResult{}, err
	}
	return usecase.LikeResult{LikesCount: count, LikedByMe: true}, nil
}

func (uc *templateUseCase) Unlike(ctx context.Context, userID, templateID uuid.UUID) (usecase.LikeResult, error) {
	if _, err := uc.templateRepo.GetByID(ctx, templateID); err != nil {
		return usecase.LikeResult{}, errors.New("template not found")
	}
	count, err := uc.templateRepo.Unlike(ctx, userID, templateID)
	if err != nil {
		return usecase.LikeResult{}, err
	}
	return usecase.LikeResult{LikesCount: count, LikedByMe: false}, nil
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && git add internal/usecase/contracts.go internal/usecase/template/template.go && git commit -m "feat: add Like/Unlike to TemplateUseCase, switch GetPublic to offset pagination"
```

---

## Task 4: Backend — middleware, helpers, controller, router

**Files:**
- Modify: `internal/controller/restapi/middleware/jwt.go`
- Modify: `internal/controller/restapi/v1/helpers.go`
- Modify: `internal/controller/restapi/v1/template.go`
- Modify: `internal/controller/restapi/v1/router.go`

- [ ] **Step 1: Add `JWTOptional` to `internal/controller/restapi/middleware/jwt.go`**

Append to the file (after the existing `JWTProtected` function):

```go
// JWTOptional parses JWT if present but does not fail on missing/invalid tokens.
// Use for routes that have optional authentication (public + enriched for logged-in users).
func JWTOptional(secret string) fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey:  []byte(secret),
		ContextKey:  "user",
		ErrorHandler: func(c *fiber.Ctx, _ error) error {
			return c.Next()
		},
	})
}
```

- [ ] **Step 2: Add `getOptionalUserID` to `internal/controller/restapi/v1/helpers.go`**

Append to the file:

```go
func getOptionalUserID(c *fiber.Ctx) *uuid.UUID {
	id, err := getUserID(c)
	if err != nil {
		return nil
	}
	return &id
}
```

- [ ] **Step 3: Replace `internal/controller/restapi/v1/template.go`**

```go
package v1

import (
	"strconv"

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
	page, _ := strconv.Atoi(c.Query("page", "1"))
	userID := getOptionalUserID(c)

	templates, hasMore, err := h.uc.GetPublic(c.Context(), 0, page, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(response.Error(err.Error()))
	}
	return c.JSON(fiber.Map{
		"data":    templates,
		"hasMore": hasMore,
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

func (h *templateHandler) like(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	templateID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid template ID"))
	}

	result, err := h.uc.Like(c.Context(), userID, templateID)
	if err != nil {
		switch err.Error() {
		case "already liked":
			return c.Status(fiber.StatusConflict).JSON(response.Error(err.Error()))
		case "forbidden":
			return c.Status(fiber.StatusForbidden).JSON(response.Error(err.Error()))
		case "template not found":
			return c.Status(fiber.StatusNotFound).JSON(response.Error(err.Error()))
		}
		return c.Status(fiber.StatusInternalServerError).JSON(response.Error(err.Error()))
	}
	return c.JSON(response.Data(result))
}

func (h *templateHandler) unlike(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.Error(err.Error()))
	}
	templateID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.Error("invalid template ID"))
	}

	result, err := h.uc.Unlike(c.Context(), userID, templateID)
	if err != nil {
		switch err.Error() {
		case "not liked":
			return c.Status(fiber.StatusNotFound).JSON(response.Error(err.Error()))
		case "template not found":
			return c.Status(fiber.StatusNotFound).JSON(response.Error(err.Error()))
		}
		return c.Status(fiber.StatusInternalServerError).JSON(response.Error(err.Error()))
	}
	return c.JSON(response.Data(result))
}
```

- [ ] **Step 4: Update routes in `internal/controller/restapi/v1/router.go`**

Replace the public templates route and add like/unlike routes. Find and replace:

```go
	// Templates (public) — BEFORE protected group
	api.Get("/templates", templateH.getPublic)
```

with:

```go
	// Templates (public) — BEFORE protected group
	api.Get("/templates", middleware.JWTOptional(jwtSecret), templateH.getPublic)
```

And add to the protected templates section (after `protected.Post("/wishlists/from-template/:id", ...)`):

```go
	protected.Post("/templates/:id/like", templateH.like)
	protected.Delete("/templates/:id/like", templateH.unlike)
```

The import `"main/internal/controller/restapi/middleware"` is already present.

- [ ] **Step 5: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && git add internal/controller/restapi/middleware/jwt.go internal/controller/restapi/v1/helpers.go internal/controller/restapi/v1/template.go internal/controller/restapi/v1/router.go && git commit -m "feat: add like/unlike handlers, optional JWT for public templates"
```

---

## Task 5: Backend — AutoMigrate wiring & build check

**Files:**
- Modify: `internal/app/app.go`

- [ ] **Step 1: Add `TemplateLikeModel` to AutoMigrate in `internal/app/app.go`**

Replace:

```go
	if err := db.AutoMigrate(
		&persistent.UserModel{},
		&persistent.WishlistModel{},
		&persistent.PresentModel{},
		&persistent.ParseRateLimitModel{},
		&persistent.PresentMetaModel{},
		&persistent.TemplateModel{},
	); err != nil {
```

with:

```go
	if err := db.AutoMigrate(
		&persistent.UserModel{},
		&persistent.WishlistModel{},
		&persistent.PresentModel{},
		&persistent.ParseRateLimitModel{},
		&persistent.PresentMetaModel{},
		&persistent.TemplateModel{},
		&persistent.TemplateLikeModel{},
	); err != nil {
```

- [ ] **Step 2: Build check**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && go build ./...
```

Expected: no output (clean build).

- [ ] **Step 3: Commit**

```bash
cd /Users/nvsmagin/GolandProjects/wishlist && git add internal/app/app.go && git commit -m "feat: register TemplateLikeModel in AutoMigrate"
```

---

## Task 6: Frontend — types & API hooks

**Files:**
- Modify: `shared/types.ts`
- Modify: `api/template/index.ts`

- [ ] **Step 1: Add `likesCount` and `likedByMe` to `Template` in `shared/types.ts`**

Replace the `Template` type:

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
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Update `api/template/index.ts`**

Replace the entire file:

```ts
import api from '@/lib/api'
import { Template, Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

type PublicTemplatesResponse = { data: Template[]; hasMore: boolean }

export const useApiGetPublicTemplates = (page: number) => {
  return useQuery({
    queryKey: ['templates-public', page],
    queryFn: async () =>
      api.get<PublicTemplatesResponse>(`templates?page=${page}`),
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

export const useApiLikeTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: { likesCount: number; likedByMe: boolean } },
    AxiosError,
    string
  >({
    mutationFn: async (templateId) => api.post(`templates/${templateId}/like`),
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: ['templates-public'] })
      const previousData = queryClient.getQueriesData<PublicTemplatesResponse>({
        queryKey: ['templates-public'],
      })
      queryClient.setQueriesData<PublicTemplatesResponse>(
        { queryKey: ['templates-public'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === templateId
                ? { ...t, likesCount: t.likesCount + 1, likedByMe: true }
                : t,
            ),
          }
        },
      )
      return { previousData }
    },
    onError: (_err, _id, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
  })
}

export const useApiUnlikeTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: { likesCount: number; likedByMe: boolean } },
    AxiosError,
    string
  >({
    mutationFn: async (templateId) => api.delete(`templates/${templateId}/like`),
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: ['templates-public'] })
      const previousData = queryClient.getQueriesData<PublicTemplatesResponse>({
        queryKey: ['templates-public'],
      })
      queryClient.setQueriesData<PublicTemplatesResponse>(
        { queryKey: ['templates-public'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === templateId
                ? { ...t, likesCount: Math.max(0, t.likesCount - 1), likedByMe: false }
                : t,
            ),
          }
        },
      )
      return { previousData }
    },
    onError: (_err, _id, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
  })
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && git add shared/types.ts api/template/index.ts && git commit -m "feat: add likesCount/likedByMe to Template type, add like/unlike hooks"
```

---

## Task 7: Frontend — templates page UI

**Files:**
- Modify: `app/templates/page.tsx`

- [ ] **Step 1: Replace `app/templates/page.tsx`**

```tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LayoutTemplate, Heart } from 'lucide-react'
import {
  useApiGetPublicTemplates,
  useApiCreateWishlistFromTemplate,
  useApiLikeTemplate,
  useApiUnlikeTemplate,
} from '@/api/template'
import { useApiGetMe } from '@/api/user'
import { Template } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { FromUserTemplateDialog } from '@/app/wishlist/create/components/from-user-template-dialog'
import { TemplatePreviewSheet } from './components/template-preview-sheet'

export default function Page() {
  const router = useRouter()
  const { data: meData } = useApiGetMe()
  const user = meData?.user
  const [page, setPage] = React.useState(1)
  const [allTemplates, setAllTemplates] = React.useState<Template[]>([])

  const { data, isFetching } = useApiGetPublicTemplates(page)
  const { mutate: createFromTemplate, isPending: isCreating } = useApiCreateWishlistFromTemplate()
  const { mutate: likeTemplate } = useApiLikeTemplate()
  const { mutate: unlikeTemplate } = useApiUnlikeTemplate()

  const [previewTemplate, setPreviewTemplate] = React.useState<Template | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)

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

  const openPreview = (template: Template) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
  }

  const handleUse = (template: Template) => {
    if (!user) {
      router.push('/login')
      return
    }
    setPreviewOpen(false)
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

  const handleLike = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation()
    if (!user) {
      router.push('/login')
      return
    }
    if (template.likedByMe) {
      unlikeTemplate(template.id)
      setAllTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id
            ? { ...t, likesCount: Math.max(0, t.likesCount - 1), likedByMe: false }
            : t,
        ),
      )
    } else {
      likeTemplate(template.id)
      setAllTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id
            ? { ...t, likesCount: t.likesCount + 1, likedByMe: true }
            : t,
        ),
      )
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-5">
      <div className="mb-8">
        <LayoutTemplate size={24} className="mb-3 text-muted-foreground" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Пользовательские шаблоны</h1>
        <p className="text-muted-foreground">
          Шаблоны от сообщества — бери готовую структуру и создавай свой вишлист
        </p>
      </div>

      {allTemplates.length === 0 && !isFetching && (
        <div className="text-center py-24 text-muted-foreground">
          Пока нет публичных шаблонов
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {allTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl border border-border overflow-hidden flex flex-col cursor-pointer hover:border-primary transition-colors"
            onClick={() => openPreview(template)}
          >
            <div className="px-4 pt-5 pb-4 bg-muted/40 flex-1">
              <p className="font-semibold text-base mb-1">{template.name}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {template.blocks?.length ?? 0} блоков · {template.settings?.colorScheme ?? ''}
              </p>
              {template.userDisplayName && (
                <p className="text-xs text-muted-foreground">
                  от {template.userDisplayName}
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center gap-2">
              <button
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => handleLike(e, template)}
                aria-label={template.likedByMe ? 'Убрать лайк' : 'Поставить лайк'}
              >
                <Heart
                  size={16}
                  className={template.likedByMe ? 'fill-current text-rose-500' : ''}
                />
                {template.likesCount > 0 && (
                  <span>{template.likesCount}</span>
                )}
              </button>
              <div className="flex-1" />
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUse(template)
                }}
                disabled={isCreating}
              >
                Использовать
              </Button>
            </div>
          </div>
        ))}
      </div>

      {data?.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Загрузить ещё'}
          </Button>
        </div>
      )}

      <TemplatePreviewSheet
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUse={handleUse}
        isPending={isCreating}
      />

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

- [ ] **Step 2: Lint check**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/nvsmagin/WebstormProjects/wish-list-2-front && git add app/templates/page.tsx && git commit -m "feat: add like button to template cards, switch to offset pagination"
```

---

## Self-Review Notes

- Spec requires `LikedByMe` always `false` for unauthenticated → handled via `uuid.Nil` in LEFT JOIN (no user has id `00000000-0000-0000-0000-000000000000`)
- Spec requires 409 on double-like → `ON CONFLICT DO NOTHING` + `RowsAffected == 0` check returns `"already liked"` → controller maps to 409
- Spec requires 404 on unlike-without-like → `DELETE` + `RowsAffected == 0` returns `"not liked"` → controller maps to 404
- Pagination: `hasMore` computed by fetching `limit+1` items in usecase
- Local state (`allTemplates`) updated optimistically in `handleLike` in addition to React Query cache update, so the UI reflects changes immediately without waiting for a cache invalidation re-render
