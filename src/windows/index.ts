import 'reflect-metadata';
import { container, inject, injectable } from 'tsyringe';
import {
  StorePackage,
  StorePackagesServiceBase,
  StorePackagesToken,
} from '../base/services/store-packages-service';
import storeData from '../base/config/store-data';
import endpoints from '../base/config/endpoints';
import {
  SubscriptionStatus,
  SubscriptionStatusServiceBase,
  SubscriptionStatusToken,
} from '../base/services/subscription-status-service';
import {
  DeeplinkServiceBase,
  DeeplinkToken,
} from '../base/services/deeplink-service';

container.registerSingleton(StorePackagesToken, StorePackagesServiceBase);
container.registerSingleton(
  SubscriptionStatusToken,
  SubscriptionStatusServiceBase,
);
container.registerSingleton(DeeplinkToken, DeeplinkServiceBase);

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
    await this.refreshPackages();
    this.refreshStatus();
    this.deeplink.init();

    this.deeplink.on('success', (params) => {
      // params.token
      // do login from temp token here
    });

    // handle user cancelled flow
    // this.deeplink.on('cancel', () => {});

    const getPackages = document.getElementById('getPackages');
    if (getPackages) {
      getPackages.onclick = () => this.refreshPackages();
      getPackages.toggleAttribute('disabled', false);
    }

    const getStatus = document.getElementById('getStatus');
    if (getStatus) {
      getStatus.onclick = () => this.refreshStatus();
      getStatus.toggleAttribute('disabled', false);
    }
  }

  private async refreshPackages() {
    this.packages = await this.storePackages.getPackages();
    console.log(this.packages);
    document.getElementById('packages')?.replaceChildren(
      ...this.packages.map((pack) => {
        const container = document.createElement('li');
        container.classList.add('vertical', 'item');

        container.appendChild(this.createText(pack.name));
        container.appendChild(this.createText(pack.total_price.toString()));

        const select = document.createElement('button');
        select.textContent = 'checkout';
        select.addEventListener('click', () => this.checkoutPackage(pack.id));
        container.appendChild(select);

        return container;
      }),
    );
  }

  private async refreshStatus() {
    overwolf.profile.generateUserSessionToken(async (result) => {
      if (!result.success)
        return alert('You must be logged in to utilize subscriptions!');

      this.status = await this.subscriptionStatus.getStatus(result.token);

      console.log(this.status);
      document.getElementById('plans')?.replaceChildren(
        ...this.status.map((status) => {
          const container = document.createElement('li');
          container.classList.add('horizontal', 'item');

          container.appendChild(
            this.createText(
              `Active plan: ${
                this.packages.find((pack) => pack.id === status.packageId)
                  ?.name ?? 'Unknown plan'
              }`,
            ),
          );

          return container;
        }),
      );
    });
  }

  private createText(text: string) {
    const element = document.createElement('div');
    element.textContent = text;
    return element;
  }

  private checkoutPackage(packageId: number) {
    overwolf.utils.openUrlInDefaultBrowser(
      `${endpoints.checkout}/${storeData.storePublicToken}/${packageId}`,
    );
  }
}

container.resolve(IndexController);
