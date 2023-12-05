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
  private currentUser = '';

  public constructor(
    @inject(StorePackagesToken)
    private readonly storePackages: StorePackagesServiceBase,
    @inject(SubscriptionStatusToken)
    private readonly subscriptionStatus: SubscriptionStatusServiceBase,
    @inject(DeeplinkToken)
    private readonly deeplink: DeeplinkServiceBase,
  ) {
    overwolf.profile.getCurrentUser((result) => {
      this.currentUser = result.username ?? '';
      this.init();
    });
  }

  /**
   * Initializes this app
   */
  private async init(): Promise<void> {
    // Setup Packages list
    this.renderPackages(await this.refreshPackages());

    // Setup success deeplink handling
    this.deeplink.on('success', (params) => {
      overwolf.profile.performOverwolfSessionLogin(
        params.token,
        async (result) => {
          console.log('Login attempt from temporary token:', result);
          if (result.success) {
            this.quickRefreshStatus(this.status);
          }
        },
      );
    });

    // handle user cancelled flow
    // this.deeplink.on('cancel', () => {});

    this.deeplink.init();

    // Setup HTML elements

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
    }

    const currentlyLoggedIn = document.getElementById('loggedIn');

    // Handle user change
    const onUserChanged = async (newUsername?: string) => {
      this.currentUser = newUsername ?? '';
      if (currentlyLoggedIn)
        currentlyLoggedIn.textContent = this.currentUser
          ? this.currentUser
          : 'False';
      getStatus?.toggleAttribute('disabled', !this.currentUser);
      this.renderStatus(this.currentUser ? await this.refreshStatus() : []);
    };

    // If the user login state changes, we update the active subscriptions
    overwolf.profile.onLoginStateChanged.addListener(async (loginState) => {
      onUserChanged(loginState.username);
    });

    // Get the current user
    overwolf.profile.getCurrentUser(
      (result) => result.success && onUserChanged(result.username),
    );
  }

  private renderPackages(packages: StorePackage[]) {
    this.storePackages.Rerender(packages);
    this.packages = packages;
  }

  private renderStatus(status: SubscriptionStatus[]) {
    if (!this.sameStatus(this.status, status)) {
      this.status = status;
      this.subscriptionStatus.Rerender(this.status, this.packages);
      return true;
    }

    return false;
  }

  private sameStatus(arr1: SubscriptionStatus[], arr2: SubscriptionStatus[]) {
    return (
      !arr1.filter((item) => !arr2.includes(item)).length &&
      !arr2.filter((item) => !arr1.includes(item)).length
    );
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

  private quickRefreshStatus(
    oldStatus: SubscriptionStatus[],
    retries: number = this._retryCount,
  ): void {
    setTimeout(async () => {
      // This is to make sure that nothing else potentially changed the status
      if (this.sameStatus(oldStatus, this.status)) {
        const changed = this.renderStatus(await this.refreshStatus());
        if (this.currentUser && !changed && retries)
          this.quickRefreshStatus(oldStatus, retries - 1);
      }
    }, this._retryDelay);
  }
}

container.resolve(IndexController);
