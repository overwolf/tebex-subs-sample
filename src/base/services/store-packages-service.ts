import { injectable } from 'tsyringe';
import endpoints from '../config/endpoints';
import storeData from '../config/store-data';
import { RenderListServiceBase } from './render-list-service';
import { CheckoutServiceBase } from './checkout-service';

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

@injectable()
export class StorePackagesServiceBase {
  private readonly listView;

  public async getPackages(): Promise<StorePackage[]> {
    const result = await fetch(
      `${endpoints.packages}/${storeData.storePublicToken}`,
    );

    return result.json();
  }

  public constructor(
    renderListService: RenderListServiceBase,
    checkoutService: CheckoutServiceBase,
  ) {
    this.listView = renderListService.CreateRenderer<StorePackage>((pack) => {
      const container = document.createElement('li');
      container.classList.add('vertical', 'item');

      container.appendChild(renderListService.CreateText(pack.name));
      container.appendChild(
        renderListService.CreateText(pack.total_price.toString()),
      );

      const select = document.createElement('button');
      select.textContent = 'checkout';
      select.addEventListener('click', () => checkoutService.Checkout(pack.id));
      container.appendChild(select);

      return container;
    }, document.getElementById('packages'));
  }

  public Rerender = (packages: StorePackage[]) =>
    this.listView.RefreshList(packages);
}
