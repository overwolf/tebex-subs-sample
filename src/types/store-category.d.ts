export type StoreCategory = {
  name: string;
  description: string;
  active_tier?: ActiveTier;
  packages: NewStorePackage[];
};

export type ActiveTier = {
  tierId: number;
  package: NewStorePackage;
  active: boolean;
  created_at: string;
  next_payment_date: string;
  status: TierStatus;
};

export type TierStatus = {
  id: string;
  description: string;
};

export type NewStorePackage = {
  base_price: number;
  category: { id: number; name: string };
  created_at: string;
  description: string;
  disable_gifting: boolean;
  disable_quantity: boolean;
  discount: number;
  expiration_date?: string;
  id: number;
  image?: string;
  name: string;
  sales_tax: number;
  total_price: number;
  type: 'subscription' | 'single';
  updated_at: string;
  prorate_price?: number;
  currency: string;
};
