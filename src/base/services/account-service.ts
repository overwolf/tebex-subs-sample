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
    overwolf.profile.onLoginStateChanged.addListener(() => {
      // There is a race condition here, it's a known bug, this is a TEMP fix
      setTimeout(() => {
        this.UpdateCurrentUser();
      }, 5000);
    });

    // Updates the current user
    this.UpdateCurrentUser();
  }

  private UpdateCurrentUser() {
    overwolf.profile.getCurrentUser(
      (result) => result.success && this.OnUserChanged(result.uuid ?? ''),
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

    return new Promise<string>((resolve, reject) => {
      resolveToken = resolve;
      failToken = reject;

      if (!this.currentUser) {
        failToken(`No current user available`);
        return;
      }

      overwolf.profile.generateUserSessionToken((result) => {
        console.log(`Token Generated: ${result.token}`);

        if (result.token) {
          resolveToken(result.token);
        } else {
          failToken(`Unable to generate token! ${result.error}`);
        }
      });
    });
  }
}
