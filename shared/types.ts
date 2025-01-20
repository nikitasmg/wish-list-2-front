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
  settings: {
    colorScheme: string
    showGiftAvailability: boolean
  }
  location: {
    name: string,
    link?: string,
    time?: Date
  }
}

export type Present = {
  id: string;
  title: string;
  description: string;
  cover: string;
  link: string;
}