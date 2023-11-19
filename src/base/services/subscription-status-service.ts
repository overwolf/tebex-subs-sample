import endpoints from '../config/endpoints';
import storeData from '../config/store-data';

export type SubscriptionStatus = {
  userId: string;
  packageId: number;
};

export const SubscriptionStatusToken = 'SubscriptionStatusBase';

export class SubscriptionStatusServiceBase {
  public async getStatus(token: string): Promise<SubscriptionStatus[]> {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);

    const result = await fetch(
      `${endpoints.subscriptions}/${storeData.storePublicToken}`,
      { headers },
    );

    return result.json();
  }
}
