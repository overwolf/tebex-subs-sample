import { inject, injectable } from 'tsyringe';
import endpoints from '../config/endpoints';
import { RenderListServiceBase, RenderListToken } from './render-list-service';
import { CheckoutServiceBase, CheckoutToken } from './checkout-service';
import { EventEmitter } from 'events';
import ArraysIntersect from '../../utils/arrays-intersect';
import OverwolfCheckoutRequest from '../../utils/overwolf-checkout-request';

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

export type StorePackagesEvents = {
  updated: [StorePackage[]];
};

@injectable()
// eslint-disable-next-line prettier/prettier
export class StorePackagesServiceBase extends EventEmitter<
  StorePackagesEvents
> {
  private readonly listView;
  private currentPackages: StorePackage[] = [];

  public GetCurrentPackages() {
    return this.currentPackages;
  }

  public async RefreshPackages(): Promise<boolean> {
    return fetch(OverwolfCheckoutRequest(endpoints.packages)).then((result) => {
      if (result.status !== 200)
        throw new Error(
          `Request failed! ${result.status} ${result.statusText}`,
        );
      return result.json().then(
        (newPackages) => {
          const changed = !ArraysIntersect(newPackages, this.currentPackages);

          if (changed) {
            this.currentPackages = newPackages;
            console.log('Packages updated!', this.currentPackages);
            this.emit('updated', this.currentPackages);

            this.Rerender();
          }

          return changed;
        },
        (reason) => {
          throw new Error(`Request failed! ${reason}`);
        },
      );
    });
  }

  public constructor(
    @inject(RenderListToken)
    renderListService: RenderListServiceBase,
    @inject(CheckoutToken)
    checkoutService: CheckoutServiceBase,
  ) {
    super();
    this.listView = renderListService.CreateRenderer<StorePackage>((pack) => {
      const container = document.createElement('li');
      container.classList.add('vertical', 'item');

      container.appendChild(renderListService.CreateText(pack.name));
      container.appendChild(
        renderListService.CreateText(pack.total_price.toString()),
      );

      const select = document.createElement('button');
      select.textContent = 'checkout';
      select.addEventListener('click', () => {
        const discordId = document.getElementById(
          'discordId',
        ) as unknown as HTMLInputElement;
        checkoutService.RequestCheckout({
          packageId: pack.id,
          extra: {
            discordId: discordId.value ?? '',
          },
        });
      });
      container.appendChild(select);

      return container;
    }, document.getElementById('packages'));
  }

  public Rerender = () => this.listView.RefreshList(this.currentPackages);
}
