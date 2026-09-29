# Template Likes Design

**Date:** 2026-04-06
**Feature:** Likes for user templates with time-decay ranking

## Overview

Add a like system to the public templates gallery (`/templates`). New templates appear near the top by default; liked templates maintain visibility as they age through a time-decay scoring formula. Only authenticated users can like templates. Authors can like their own templates.

## Backend

### Database Schema

New table:
```sql
CREATE TABLE template_likes (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);
```

New column on `templates`:
```sql
ALTER TABLE templates ADD COLUMN likes_count INT NOT NULL DEFAULT 0;
```

`likes_count` is a denormalized counter — incremented/decremented on like/unlike to avoid expensive COUNT queries on every page load.

### Entity

`TemplateWithAuthor` in `internal/entity/template.go` gains two fields:
```go
type TemplateWithAuthor struct {
    Template
    UserDisplayName string `json:"userDisplayName"`
    LikesCount      int    `json:"likesCount"`
    LikedByMe       bool   `json:"likedByMe"`
}
```

`LikedByMe` is always `false` for unauthenticated requests.

### Sorting

`GET /templates` sorts by a Hacker News-style decay score computed in SQL:

```sql
likes_count / POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0 + 2, 1.5) DESC
```

A brand-new template (age ≈ 0) with 0 likes scores roughly `0 / 2^1.5 ≈ 0`, but since all new templates share a similarly small denominator they cluster near the top. As time passes the denominator grows, pushing older low-liked templates down.

Pagination switches from cursor-based to **offset-based** (`?page=1&limit=20`). The time-decay score changes every second, making keyset cursor pagination unreliable — a cursor taken from page 1 would point to a different position by the time page 2 is requested. Offset pagination is simple and appropriate for the scale of this dataset.

### New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/templates/:id/like` | required | Like a template. 409 if already liked. |
| DELETE | `/templates/:id/like` | required | Unlike a template. 404 if not liked. |

Both endpoints:
1. Insert/delete a row in `template_likes`
2. Atomically increment/decrement `templates.likes_count`
3. Return `{ data: { likesCount: int, likedByMe: bool } }`

## Frontend

### Type changes (`shared/types.ts`)

```ts
export type Template = {
  // ...existing fields
  likesCount: number;
  likedByMe: boolean;
}
```

### New API hooks (`api/template/index.ts`)

`useApiLikeTemplate(id: string)` — `POST /templates/:id/like`
`useApiUnlikeTemplate(id: string)` — `DELETE /templates/:id/like`

Both use **optimistic updates**:
- On mutate: `queryClient.setQueryData` to flip `likedByMe` and adjust `likesCount` ±1 in the local cache
- On error: rollback to previous cache snapshot

### Template card UI (`app/templates/page.tsx`)

The card footer changes from a single full-width button to a two-part row:

```
[♡ 12]                    [Использовать]
```

- Like button: `Heart` icon from lucide-react, filled (`fill-current`) when `likedByMe`, outline otherwise
- Click on like button for unauthenticated user → `router.push('/login')`
- `e.stopPropagation()` on both the like button and the "Использовать" button to prevent opening the preview sheet
- Like count shown as plain number next to the icon; hidden if 0 (cleaner for new templates)

### Pagination

Switch from cursor-based to offset-based. The frontend replaces the `cursor` state with a `page` number. The "Загрузить ещё" button increments the page. The API response drops `nextCursor` in favour of `hasMore: boolean`.

## Out of Scope

- Like notifications
- Showing who liked a template
- Like counts on the "my templates" management page
- Rate limiting likes (handled implicitly by the UNIQUE constraint)
