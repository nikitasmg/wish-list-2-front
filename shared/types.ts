export type User = {
  id: string;
  username: string;
}

export type BlockType =
  | 'text'
  | 'text_image'
  | 'image'
  | 'date'
  | 'location'
  | 'color_scheme'
  | 'timing'

export type Block = {
  type: BlockType
  position: number
  mobilePosition?: number
  colSpan?: 1 | 2         // grid columns occupied, default 1
  rowSpan?: 1 | 2 | 3    // grid rows occupied, default 1
  data: Record<string, unknown>
}

// Block data shapes per type:
// text:         { content: string }
// text_image:   { content: string; imageUrl: string }
// image:        { url: string }
// date:         { datetime: string; label?: string }
// location:     { name: string; link?: string }
// color_scheme: { scheme: string }
// timing:       { start: string; end?: string }

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

export type AuthProps = {
  id: number
  first_name: string
  last_name: string
  username: string
  auth_date: number
  photo_url: string
  hash: string
}
