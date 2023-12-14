import { inject, injectable } from 'tsyringe';
import OverwolfCheckoutRequest from '../../utils/overwolf-checkout-request';
import endpoints from '../config/endpoints';
import { AccountServiceBase, AccountToken } from './account-service';
import {
  SubscriptionStatus,
  SubscriptionStatusServiceBase,
} from './subscription-status-service';

export type PackageParameters = {
  packageId: number;
  extra?: {
    discordId?: string;
  };
};

export const CheckoutToken = 'CheckoutBase';

@injectable()
export class CheckoutServiceBase {
  private subscriptionStatusService?: SubscriptionStatusServiceBase;

  public init(subscriptionStatusService: SubscriptionStatusServiceBase) {
    this.subscriptionStatusService = subscriptionStatusService;
  }

  public RequestCheckout(packageParams: PackageParameters) {
    if (!this.accountService.GetCurrentUser())
      overwolf.profile.openLoginDialog();
    else {
      if (this.ValidatecheckoutRequest(packageParams))
        this.Checkout(packageParams);
    }
  }

  private Checkout(packageParams: PackageParameters) {
    overwolf.utils.openUrlInDefaultBrowser(
      OverwolfCheckoutRequest(
        endpoints.checkout,
        {
          userId: this.accountService.GetCurrentUser(),
          discordId: packageParams.extra?.discordId?.toString(),
        },
        `/${packageParams.packageId}`,
      ),
    );
  }

  constructor(
    @inject(AccountToken)
    private readonly accountService: AccountServiceBase,
  ) {}

  /**
   * Validates that a requested checkout request is valid.
   *
   * **Important! Make sure this validates ALL constraints you have set up
   * for your packages!**
   *
   * @param {PackageParameters} packageParams - The package to be purchased
   * @returns {boolean} Whether or not the request is valid
   */
  private ValidatecheckoutRequest(packageParams: PackageParameters): boolean {
    return !this.subscriptionStatusService
      ?.GetCurrentStatus()
      .some(
        (currentPlan: SubscriptionStatus) =>
          packageParams.packageId === currentPlan.packageId,
      );
  }
}
