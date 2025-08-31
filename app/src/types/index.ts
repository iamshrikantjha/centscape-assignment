export interface WishlistItem {
  id: string;
  title: string;
  image?: string;
  price?: string;
  currency?: string;
  siteName: string;
  sourceUrl: string;
  normalizedUrl: string;
  createdAt: string;
}

export interface PreviewData {
  title: string;
  image?: string;
  price?: string;
  currency?: string;
  siteName: string;
  sourceUrl: string;
}

export interface AddWishlistItemData {
  title: string;
  image?: string;
  price?: string;
  currency?: string;
  siteName: string;
  sourceUrl: string;
  normalizedUrl: string;
}

export type RootStackParamList = {
  index: undefined;
  wishlist: undefined;
  add: { url?: string };
};