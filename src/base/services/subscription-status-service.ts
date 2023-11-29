import { injectable } from 'tsyringe';
import endpoints from '../config/endpoints';
import storeData from '../config/store-data';
import { RenderListServiceBase } from './render-list-service';
import { StorePackage } from './store-packages-service';

export type SubscriptionStatus = {
  userId: string;
  recurringPaymentId: string;
  packageId: number;
};

export const SubscriptionStatusToken = 'SubscriptionStatusBase';

@injectable()
export class SubscriptionStatusServiceBase {
  private readonly listView;

  public async getStatus(token: string): Promise<SubscriptionStatus[]> {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);

    const result = await fetch(
      `${endpoints.subscriptions}/${storeData.storePublicToken}`,
      { headers },
    );

    return result.json();
  }

  public constructor(renderListService: RenderListServiceBase) {
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

  public Rerender = (status: SubscriptionStatus[], packages: StorePackage[]) =>
    this.listView.RefreshList(status, packages);
}
