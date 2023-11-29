import 'reflect-metadata';
import { container, inject, injectable } from 'tsyringe';
import {
  StorePackage,
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
  RenderListServiceBase,
  RenderListToken,
} from '../base/services/render-list-service';

container.registerSingleton(StorePackagesToken, StorePackagesServiceBase);
container.registerSingleton(
  SubscriptionStatusToken,
  SubscriptionStatusServiceBase,
);
container.registerSingleton(DeeplinkToken, DeeplinkServiceBase);
container.registerSingleton(RenderListToken, RenderListServiceBase);

// -----------------------------------------------------------------------------
@injectable()
export class IndexController {
  private packages: StorePackage[] = [];
  private status: SubscriptionStatus[] = [];

  public constructor(
    @inject(StorePackagesToken)
    private readonly storePackages: StorePackagesServiceBase,
    @inject(SubscriptionStatusToken)
    private readonly subscriptionStatus: SubscriptionStatusServiceBase,
    @inject(DeeplinkToken)
    private readonly deeplink: DeeplinkServiceBase,
  ) {
    this.init();
  }

  /**
   * Initializes this app
   */
  public async init(): Promise<void> {
    // Setup Packages list
    this.renderPackages(await this.refreshPackages());

    // Setup Status list
    this.renderStatus(await this.refreshStatus());

    this.deeplink.init();

    this.deeplink.on('success', (params) => {
      overwolf.profile.performOverwolfSessionLogin(params.token, (result) => {
        console.log('Login attempt from temporary token:', result);
        overwolf.profile.getCurrentUser((result) => {
          if (result.username) {
            this.refreshStatus();
          }
        });
      });
    });

    // handle user cancelled flow
    // this.deeplink.on('cancel', () => {});

    const getPackages = document.getElementById('getPackages');
    if (getPackages) {
      getPackages.onclick = async () =>
        this.renderPackages(await this.refreshPackages());

      getPackages.toggleAttribute('disabled', false);
    }

    const getStatus = document.getElementById('getStatus');
    if (getStatus) {
      getStatus.onclick = async () =>
        this.renderStatus(await this.refreshStatus());
      getStatus.toggleAttribute('disabled', false);
    }
  }

  private renderPackages(packages: StorePackage[]) {
    this.storePackages.Rerender(packages);
    this.packages = packages;
  }

  private renderStatus(status: SubscriptionStatus[]) {
    if (status.filter((item) => !this.status.includes(item)).length) {
      this.subscriptionStatus.Rerender(status, this.packages);
      this.status = status;
      return true;
    }

    return false;
  }

  private async refreshPackages() {
    this.packages = await this.storePackages.getPackages();
    console.log(this.packages);
    return this.packages;
  }

  private async refreshStatus(): Promise<SubscriptionStatus[]> {
    let resolveStatus: (status: SubscriptionStatus[]) => void;
    const promise = new Promise<SubscriptionStatus[]>((resolve) => {
      resolveStatus = resolve;
    });
    overwolf.profile.generateUserSessionToken(async (result) => {
      if (!result.success)
        return alert(
          'You must be logged in to check your subscription status!',
        );

      const status = await this.subscriptionStatus.getStatus(result.token);

      console.log(status);

      resolveStatus(status);
    });
    return promise;
  }

  private readonly _retryDelay = 60000;
  private readonly _retryCount = 5;

  private quickRefreshStatus(retries: number = this._retryCount): void {
    setTimeout(async () => {
      const changed = this.renderStatus(await this.refreshStatus());
      if (!changed && retries) this.quickRefreshStatus(retries - 1);
    }, this._retryDelay);
  }
}

container.resolve(IndexController);
