import { EventEmitter } from 'events';

export const AccountToken = 'AccountBase';

export type AccountServiceEvents = {
  updated: [string];
};

export class AccountServiceBase extends EventEmitter<AccountServiceEvents> {
  private currentUser = '';

  public GetCurrentUser() {
    return this.currentUser;
  }

  public init(): void {
    // If the user login state changes, we update the active subscriptions
    overwolf.profile.onLoginStateChanged.addListener(async (loginState) => {
      this.OnUserChanged(loginState.username ?? '');
    });

    // Get the current user
    overwolf.profile.getCurrentUser(
      (result) => result.success && this.OnUserChanged(result.username ?? ''),
    );
  }

  private OnUserChanged(user: string) {
    this.currentUser = user;
    console.log('User changed!', this.currentUser);
    this.emit('updated', this.currentUser);
  }

  public GenerateToken(): Promise<string> {
    let resolveToken: (token: string) => void;
    let failToken: (error: string) => void;

    const promise = new Promise<string>((resolve, reject) => {
      resolveToken = resolve;
      failToken = reject;
    });

    if (this.currentUser) {
      overwolf.profile.generateUserSessionToken((result) => {
        if (result.success) resolveToken(result.token);
        else failToken(`Unable to generate token! ${result.error}`);
      });
    }

    return promise;
  }
}
