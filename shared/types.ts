export type User = {
  id: string;
  username: string;
}

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
  }
  location: {
    name: string,
    link?: string,
    time?: string
  }
  createdAt: string,
  updatedAt: string,
}

export type Present = {
  id: string;
  title: string;
  description: string;
  cover: string;
  link: string;
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