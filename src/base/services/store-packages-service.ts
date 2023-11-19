import endpoints from '../config/endpoints';
import storeData from '../config/store-data';

export type StorePackage = {
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
};

export const StorePackagesToken = 'StorePackagesBase';

export class StorePackagesServiceBase {
  public async getPackages(): Promise<StorePackage[]> {
    const result = await fetch(
      `${endpoints.packages}/${storeData.storePublicToken}`,
    );

    return result.json();
  }
}
