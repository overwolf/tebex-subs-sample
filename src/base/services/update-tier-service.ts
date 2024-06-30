import { inject, injectable } from 'tsyringe';
import OverwolfCheckoutRequest from '../../utils/overwolf-checkout-request';
import endpoints from '../config/endpoints';
import { AccountServiceBase, AccountToken } from './account-service';
import {
  SubscriptionStatus,
  SubscriptionStatusServiceBase,
} from './subscription-status-service';
import OverwolfUpdateTierRequest from '../../utils/overwolf-update-tier-request';

export type TierParams = {
  tier_id: number;
  packageId: number;
  type: string;
  extra?: {
    discordId?: string;
  };
};

export const UpdateTierToken = 'UpdateTierBase';

@injectable()
export class UpdateTierServiceBase {
  private subscriptionStatusService?: SubscriptionStatusServiceBase;

  public init(subscriptionStatusService: SubscriptionStatusServiceBase) {
    this.subscriptionStatusService = subscriptionStatusService;
  }

  public RequestUpdateTier(tierParams: TierParams) {
    if (!this.accountService.GetCurrentUser())
      overwolf.profile.openLoginDialog();
    else {
      if (this.ValidateUpdateTierRequest(tierParams)) {
        this.UpdateTier(tierParams);
      } else {
        console.error('Cannot purchase the same package twice!');
      }
    }
  }

  private UpdateTier(tierParams: TierParams) {
    const url = OverwolfUpdateTierRequest(endpoints.subscriptions);

    // Add body to the request since this is a PUT request
    const body = JSON.stringify({
      packageId: tierParams.packageId, // the new one
      tierId: tierParams.tier_id, // the associated tier to the user's plan
      type: tierParams.type, // "upgrade" or "downgrade"
    });

    return this.accountService.GenerateToken().then(
      async (token: string) => {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        headers.append('Content-Type', 'application/json');

        return fetch(url, {
          method: 'PUT',
          headers: headers,
          body,
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
            (result) => {
              console.log('Upgrade/Downgrade: ', result);
              return;
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
        return;
      },
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
  private ValidateUpdateTierRequest(packageParams: TierParams): boolean {
    return !this.subscriptionStatusService
      ?.GetCurrentStatus()
      .some(
        (currentPlan: SubscriptionStatus) =>
          packageParams.packageId === currentPlan.packageId,
      );
  }
}
