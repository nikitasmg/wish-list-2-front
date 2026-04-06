export type User = {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

export type BlockType =
  | 'text'
  | 'text_image'
  | 'image'
  | 'date'
  | 'location'
  | 'color_scheme'
  | 'timing'
  | 'agenda'
  | 'gallery'
  | 'quote'
  | 'divider'
  | 'contact'
  | 'video'
  | 'checklist'

export type Block = {
  type: BlockType
  row: number
  col: 0 | 1
  colSpan: 1 | 2
  data: Record<string, unknown>
}

// Block data shapes per type:
// text:         { html: string }  (fallback: content: string for legacy)
// text_image:   { content: string; imageUrl: string }
// image:        { url: string }
// date:         { datetime: string; label?: string }
// location:     { name: string; link?: string }
// color_scheme: { colors: string[]; label?: string }
// timing:       { end: string }
// agenda:       { items: { time: string; text: string }[] }
// gallery:      { images: string[] }
// quote:        { text: string; author?: string }
// divider:      { style: 'line' | 'dots' | 'wave' }
// contact:      { name: string; role?: string; telegram?: string; phone?: string }
// video:        { url: string; title?: string }
// checklist:    { title?: string; items: string[] }

export type Wishlist = {
  id: string;
  title: string;
  description: string;
  cover: string;
  presentsCount: number;
  userId: string
  settings: {
    colorScheme: string
    showGiftAvailability: boolean
    presentsLayout?: 'list' | 'grid3' | 'grid2'
  }
  location: {
    name: string,
    link?: string,
    time?: string
  }
  shortId?: string
  blocks?: Block[]
  createdAt: string,
  updatedAt: string,
}

export type Present = {
  id: string;
  title: string;
  description: string;
  cover: string;
  link?: string;
  price?: number;
  reserved: boolean;
  createdAt: string,
  updatedAt: string,
  wishlistId: string
}

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

export type AuthProps = {
  id: number
  first_name: string
  last_name: string
  username: string
  auth_date: number
  photo_url: string
  hash: string
}
