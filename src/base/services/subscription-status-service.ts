import { inject, injectable } from 'tsyringe';
import endpoints from '../config/endpoints';
import { RenderListServiceBase, RenderListToken } from './render-list-service';
import {
  StorePackage,
  StorePackagesServiceBase,
  StorePackagesToken,
} from './store-packages-service';
import { EventEmitter } from 'events';
import ArraysIntersect from '../../utils/arrays-intersect';
import OverwolfCheckoutRequest from '../../utils/overwolf-checkout-request';
import { AccountServiceBase, AccountToken } from './account-service';

export type SubscriptionStatus = {
  userId: string;
  recurringPaymentId: string;
  packageId: number;
};

export const SubscriptionStatusToken = 'SubscriptionStatusBase';

export type SubscriptionsStatusEvents = {
  updated: [SubscriptionStatus[]];
};

@injectable()
// eslint-disable-next-line prettier/prettier
export class SubscriptionStatusServiceBase extends EventEmitter<
  SubscriptionsStatusEvents
> {
  private readonly listView;
  private currentStatus: SubscriptionStatus[] = [];

  public GetCurrentStatus() {
    return this.currentStatus;
  }

  public async RefreshStatus(): Promise<boolean> {
    return this.accountService.GenerateToken().then(
      async (token: string) => {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);

        return fetch(OverwolfCheckoutRequest(endpoints.subscriptions), {
          headers,
        }).then((result) => {
          if (result.status !== 200)
            throw new Error(
              `Request failed! ${result.status} ${result.statusText}`,
            );
          return result.json().then(
            (newStatus) => {
              return this.HandleNewStatus(newStatus);
            },
            (reason) => {
              throw new Error(`Request failed! ${reason}`);
            },
          );
        });
      },
      (reason: string) => {
        console.log(`Unable to generate token: ${reason}`);
        return this.HandleNewStatus([]);
      },
    );
  }

  private HandleNewStatus(newStatus: SubscriptionStatus[]) {
    const changed = !ArraysIntersect(newStatus, this.currentStatus);

    if (changed) {
      this.currentStatus = newStatus;
      console.log('Subscription Status!', this.currentStatus);
      this.emit('updated', this.currentStatus);

      this.Rerender();
    }

    return changed;
  }

  public constructor(
    @inject(RenderListToken)
    renderListService: RenderListServiceBase,
    @inject(StorePackagesToken)
    private readonly storePackagesService: StorePackagesServiceBase,
    @inject(AccountToken)
    private readonly accountService: AccountServiceBase,
  ) {
    super();
    this.listView = renderListService.CreateRenderer<
      SubscriptionStatus,
      StorePackage[]
    >((status, packages) => {
      const container = document.createElement('li');
      container.classList.add('horizontal', 'item');

      container.appendChild(
        renderListService.CreateText(
          `Active plan: ${
            packages?.find((pack) => pack.id === status.packageId)?.name ??
            'Unknown plan'
          }`,
        ),
      );

      return container;
    }, document.getElementById('plans'));
  }

  public Rerender = () =>
    this.listView.RefreshList(
      this.currentStatus,
      this.storePackagesService.GetCurrentPackages(),
    );
}
