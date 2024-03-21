import 'reflect-metadata';
import { container, inject, injectable } from 'tsyringe';
import {
  StorePackagesServiceBase,
  StorePackagesToken,
} from '../base/services/store-packages-service';
import {
  SubscriptionStatus,
  SubscriptionStatusServiceBase,
  SubscriptionStatusToken,
} from '../base/services/subscription-status-service';
import {
  DeeplinkServiceBase,
  DeeplinkToken,
} from '../base/services/deeplink-service';
import {
  AccountServiceBase,
  AccountToken,
} from '../base/services/account-service';
import {
  CheckoutServiceBase,
  CheckoutToken,
} from '../base/services/checkout-service';
import {
  RenderListServiceBase,
  RenderListToken,
} from '../base/services/render-list-service';

container.registerSingleton(CheckoutToken, CheckoutServiceBase);
container.registerSingleton(StorePackagesToken, StorePackagesServiceBase);
container.registerSingleton(
  SubscriptionStatusToken,
  SubscriptionStatusServiceBase,
);
container.register(RenderListToken, RenderListServiceBase);
container.registerSingleton(DeeplinkToken, DeeplinkServiceBase);
container.registerSingleton(AccountToken, AccountServiceBase);

// -----------------------------------------------------------------------------
@injectable()
export class IndexController {
  private minOverwolfVersion = '0.240.0.5';

  private ensureClientVersion = () => {
    const currentVersion = overwolf.version.split('.');
    const minVersion = this.minOverwolfVersion.split('.');

    // Basically - ensure none of the fragments of the version is below the min
    return (
      overwolf.version === this.minOverwolfVersion ||
      currentVersion.some(
        (fragment, index) => Number(fragment) > Number(minVersion[index]),
      )
    );
  };

  public constructor(
    @inject(StorePackagesToken)
    private readonly storePackages: StorePackagesServiceBase,
    @inject(SubscriptionStatusToken)
    private readonly subscriptionStatus: SubscriptionStatusServiceBase,
    @inject(DeeplinkToken)
    private readonly deeplink: DeeplinkServiceBase,
    @inject(AccountToken)
    private readonly account: AccountServiceBase,
    @inject(CheckoutToken)
    private readonly checkout: CheckoutServiceBase,
  ) {
    if (!this.ensureClientVersion())
      alert(
        // eslint-disable-next-line max-len
        'Overwolf client does not meet minimum version (this can only happen when loading as unpacked',
      );
    else this.init();
  }

  /**
   * Initializes this app
   */
  private async init(): Promise<void> {
    // Setup Packages list
    await this.storePackages.RefreshPackages();

    // Setup success deeplink handling
    this.deeplink.on('success', () => {
      console.log('Deeplink received for subscription flow success!');
    });

    // handle user cancelled flow
    this.deeplink.on('cancel', () => {
      console.log('Deeplink received for subscription flow cancellation!');
    });

    this.deeplink.init();

    // Setup HTML elements

    const getPackages = document.getElementById('getPackages');
    if (getPackages) {
      getPackages.onclick = async () => this.storePackages.RefreshPackages();

      getPackages.toggleAttribute('disabled', false);
    }

    const getStatus = document.getElementById('getStatus');
    if (getStatus) {
      getStatus.onclick = async () => this.subscriptionStatus.RefreshStatus();
    }

    const currentlyLoggedIn = document.getElementById('loggedIn');

    // Handle user change
    this.account.on('updated', (newUsername) => {
      if (currentlyLoggedIn)
        currentlyLoggedIn.textContent = newUsername || 'False';
      getStatus?.toggleAttribute('disabled', !newUsername);
      this.subscriptionStatus.RefreshStatus();
    });

    this.account.init();

    this.checkout.init(this.subscriptionStatus);
  }

  private readonly _retryDelay = 30000;
  private readonly _retryCount = 10;

  private quickRefreshStatus(
    oldStatus: SubscriptionStatus[],
    retries: number = this._retryCount,
  ): void {
    setTimeout(async () => {
      console.log('Re-checking subscription status');
      const finished = await this.subscriptionStatus.RefreshStatus();
      if (!finished && retries) this.quickRefreshStatus(oldStatus, retries - 1);
    }, this._retryDelay);
  }
}

container.resolve(IndexController);
