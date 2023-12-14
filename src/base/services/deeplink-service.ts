import { EventEmitter } from 'events';

export type DeeplinkSearchParams = DeeplinkSuccess | DeeplinkCancel;

type DeeplinkSuccess = {
  result: 'success';
};

type DeeplinkCancel = {
  result: 'cancel';
};

export const DeeplinkToken = 'DeeplinkBase';

type TypedSearchParams<Mapping extends { [key: string]: string }> = Omit<
  URLSearchParams,
  'get'
> & {
  get: <Key extends keyof Mapping>(key: Key) => Mapping[Key];
};

export type DeeplinkEvents = {
  cancel: [Omit<DeeplinkCancel, 'result'>];
  success: [Omit<DeeplinkSuccess, 'result'>];
};

export class DeeplinkServiceBase extends EventEmitter<DeeplinkEvents> {
  public init(): void {
    overwolf.extensions.onAppLaunchTriggered.addListener((result) => {
      this.handleDeeplink(result.parameter);
    });
  }

  private handleDeeplink(deeplink: string): void {
    const url = new URL(decodeURIComponent(deeplink));
    const params = url.searchParams as TypedSearchParams<DeeplinkSearchParams>;

    console.log(`Deeplink triggered: ${url}`);
    switch (params.get('result')) {
      case 'success':
        this.emit('success', {});
        break;
      case 'cancel':
        this.emit('cancel', {});
        break;
      default:
        console.error(
          `Deeplink triggered with incorrect parameters! ${params}`,
        );
        break;
    }
  }
}
