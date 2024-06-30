import { inject, injectable } from 'tsyringe';
import endpoints from '../config/endpoints';
import { RenderListServiceBase, RenderListToken } from './render-list-service';
import { CheckoutServiceBase, CheckoutToken } from './checkout-service';
import { EventEmitter } from 'events';
import ArraysIntersect from '../../utils/arrays-intersect';
import OverwolfCategoriesRequest from '../../utils/overwolf-categories-request';
import { AccountServiceBase, AccountToken } from './account-service';
import {
  RenderCategoryServiceBase,
  RenderCategoryToken,
} from './render-category-service';
import { StorePackage } from '../../types/store-package';
import { StoreCategory } from '../../types/store-category';

export const StorePackagesToken = 'StorePackagesBase';

export type StorePackagesEvents = {
  updated: [StorePackage[]];
  updatedCategory: [StoreCategory[]];
};

@injectable()
// eslint-disable-next-line prettier/prettier
export class StorePackagesServiceBase extends EventEmitter<StorePackagesEvents> {
  private readonly categoryView;
  private currentPackages: StorePackage[] = [];
  private currentCategories: StoreCategory[] = [];

  public GetCurrentPackages() {
    return this.currentPackages;
  }

  public GetCurrentCategories() {
    return this.currentCategories;
  }

  public async RefreshPackages(): Promise<boolean> {
    return this.accountService.GenerateToken().then(
      async (token: string) => {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        const requestUrl = OverwolfCategoriesRequest(endpoints.subscriptions);

        return fetch(requestUrl, {
          headers,
        }).then((result) => {
          if (result.status !== 200) {
            console.error(
              `Request failed! ${result.status} ${result.statusText}`,
            );
            throw new Error(
              `Request failed! ${result.status} ${result.statusText}`,
            );
          }

          return result.json().then(
            (newPackages) => {
              console.log('new packages: ', newPackages);
              return this.HandleNewPackages(newPackages);
            },
            (reason) => {
              console.error('JSON parse error: ', reason);
              throw new Error(`Request failed! ${reason}`);
            },
          );
        });
      },
      (reason: string) => {
        console.log(`Unable to generate token: ${reason}`);
        return this.HandleNewPackages([]);
      },
    );
  }

  public async RefreshCategories(): Promise<boolean> {
    return this.accountService.GenerateToken().then(
      async (token: string) => {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        const requestUrl = OverwolfCategoriesRequest(endpoints.subscriptions);

        return fetch(requestUrl, {
          headers,
        }).then((result) => {
          if (result.status !== 200) {
            console.error(
              `Request failed! ${result.status} ${result.statusText}`,
            );
            throw new Error(
              `Request failed! ${result.status} ${result.statusText}`,
            );
          }

          return result.json().then(
            (newCategories: StoreCategory[]) => {
              console.log('new categories: ', newCategories);
              return this.HandleNewCategories(newCategories);
            },
            (reason) => {
              console.error('JSON parse error: ', reason);
              throw new Error(`Request failed! ${reason}`);
            },
          );
        });
      },
      (reason: string) => {
        console.log(`Unable to generate token: ${reason}`);
        return this.HandleNewCategories([]);
      },
    );
  }

  private HandleNewPackages(newPackages: StorePackage[]) {
    const changed = !ArraysIntersect(newPackages, this.currentPackages);

    if (changed) {
      this.currentPackages = newPackages;
      console.log('Packages Status!', this.currentPackages);
      this.emit('updated', this.currentPackages);

      this.Rerender();
    }

    return changed;
  }

  private HandleNewCategories(newCategories: StoreCategory[]) {
    const changed = !ArraysIntersect(newCategories, this.currentCategories);

    if (changed) {
      this.currentCategories = newCategories;
      this.HandleNewPackages(
        newCategories.flatMap((category) => category.packages),
      );
      console.log('Categories Status!', this.currentCategories);
      this.emit('updatedCategory', this.currentCategories);

      this.Rerender();
    }

    return changed;
  }

  public constructor(
    @inject(RenderListToken)
    renderListService: RenderListServiceBase,
    @inject(CheckoutToken)
    checkoutService: CheckoutServiceBase,
    @inject(AccountToken)
    private readonly accountService: AccountServiceBase,
    @inject(RenderCategoryToken)
    renderCategoryService: RenderCategoryServiceBase,
  ) {
    super();

    this.categoryView = renderCategoryService.CreateRenderer<StoreCategory>(
      (category) => {
        const container = document.createElement('li');
        container.classList.add('vertical', 'item');

        const categoryTitle = renderCategoryService.CreateText(category.name);
        categoryTitle.classList.add('category-title');

        container.appendChild(categoryTitle);

        if (category.active_tier) {
          const activeTierPending = renderCategoryService.CreateText(
            `Active tier pending: ${category.active_tier?.status.description}` ??
              'Unknown status',
          );
          container.appendChild(activeTierPending);
        }

        const categoryList = document.createElement('ul');
        categoryList.classList.add('horizontal', 'category-list');

        category.packages.forEach((pack) => {
          const categoryItem = document.createElement('li');
          categoryItem.classList.add('vertical', 'item');

          categoryItem.appendChild(renderCategoryService.CreateText(pack.name));

          categoryItem.appendChild(
            renderCategoryService.CreateText(
              'Price: ' + pack.total_price.toString() + ` ${pack.currency}`,
            ),
          );

          if (category.active_tier?.package.id === pack.id) {
            categoryItem.appendChild(
              renderCategoryService.CreateText(
                `Active tier: ${category.active_tier?.active ?? 'false'}`,
              ),
            );
          }

          if (
            category.active_tier &&
            category.active_tier.package.id != pack.id
          ) {
            categoryItem.appendChild(
              renderCategoryService.CreateText(
                `Price to change: ${
                  pack.prorate_price?.toString() + ` ${pack.currency}` ??
                  'Unknown delta price'
                }`,
              ),
            );
          }

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
          categoryItem.appendChild(select);

          categoryList.appendChild(categoryItem);

          container.appendChild(categoryList);
        });
        const hr = document.createElement('hr');
        container.appendChild(hr);

        return container;
      },
      document.getElementById('categories-container'),
    );
  }

  public Rerender = () => {
    this.categoryView.RefreshList(this.currentCategories);
  };
}
