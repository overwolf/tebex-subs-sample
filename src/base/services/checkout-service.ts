import endpoints from '../config/endpoints';
import storeData from '../config/store-data';

export const CheckoutToken = 'CheckoutBase';

export class CheckoutServiceBase {
  public Checkout(packageId: number) {
    overwolf.utils.openUrlInDefaultBrowser(
      `${endpoints.checkout}/${storeData.storePublicToken}/${packageId}`,
    );
  }
}
