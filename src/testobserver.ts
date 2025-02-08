import { Observable, Observer, Subscription } from 'rxjs';

/**
 * An extended Observer interface that allows for an optional onSubscribe and onSuccess.
 */
export interface DelegateObserver<T> extends Observer<T> {
  onSubscribe?(subscription: Subscription): void;
  onSuccess?(value: T): void;
}

/**
 * The RxJS version of TestObserver with integrated logging.
 *
 * This class implements the RxJS Observer interface, keeps track of the subscription,
 * and logs all significant events.
 */
export class TestObserver<T> implements Observer<T> {
  // Private fields to maintain state.
  private subscription: Subscription | null = null;
  private disposed: boolean = false;
  private delegate?: DelegateObserver<T>;

  // Logging array to record events.
  private logs: string[] = [];

  // Private constructor to support both non-forwarding and forwarding instances.
  private constructor(delegate?: DelegateObserver<T>) {
    this.delegate = delegate;
  }

  /**
   * Creates a TestObserver without a delegate.
   */
  static create<T>(): TestObserver<T>;
  /**
   * Creates a TestObserver that forwards notifications to the provided delegate.
   */
  static create<T>(delegate: DelegateObserver<T>): TestObserver<T>;
  static create<T>(delegate?: DelegateObserver<T>): TestObserver<T> {
    return new TestObserver<T>(delegate);
  }

  /**
   * Returns the array of logged event messages.
   */
  getLogs(): string[] {
    return this.logs;
  }

  /**
   * Internal helper to add a message to the log.
   */
  private logEvent(message: string): void {
    this.logs.push(message);
  }

  /**
   * Asserts that a subscription was set.
   * Throws an error if onSubscribe was not called exactly once.
   */
  assertSubscribed(): this {
    if (this.subscription === null) {
      throw new Error("onSubscribe was not called exactly once.");
    }
    return this;
  }

  /**
   * Disposes (unsubscribes) this TestObserver.
   */
  dispose(): void {
    this.disposed = true;
    this.logEvent("dispose called");
    if (this.subscription !== null) {
      this.subscription.unsubscribe();
      this.logEvent("subscription unsubscribed");
    }
  }

  /**
   * Returns true if a subscription has been received.
   */
  hasSubscription(): boolean {
    return this.subscription !== null;
  }

  /**
   * Returns true if this TestObserver was disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Receives the next value.
   */
  next(value: T): void {
    this.logEvent(`next: ${value}`);
    if (this.delegate && this.delegate.next) {
      this.delegate.next(value);
    }
  }

  /**
   * Receives an error.
   */
  error(err: any): void {
    this.logEvent(`error: ${err}`);
    if (this.delegate && this.delegate.error) {
      this.delegate.error(err);
    }
  }

  /**
   * Receives the complete notification.
   */
  complete(): void {
    this.logEvent("complete");
    if (this.delegate && this.delegate.complete) {
      this.delegate.complete();
    }
  }

  /**
   * Called when the subscription is set.
   * Ensures that multiple subscriptions are not allowed.
   */
  onSubscribe(subscription: Subscription): void {
    if (this.subscription !== null) {
      throw new Error("Subscription already set.");
    }
    this.subscription = subscription;
    this.logEvent("onSubscribe: subscription set");
    if (this.delegate && this.delegate.onSubscribe) {
      this.delegate.onSubscribe(subscription);
    }
  }

  /**
   * Optionally handles a "success" event.
   */
  onSuccess(value: T): void {
    this.logEvent(`onSuccess: ${value}`);
    if (this.delegate && this.delegate.onSuccess) {
      this.delegate.onSuccess(value);
    }
  }

  /**
   * Utility method to subscribe this TestObserver to an Observable.
   * It subscribes using the RxJS standard observer methods, then captures the subscription.
   *
   * @param observable - The Observable to subscribe to.
   * @returns The RxJS Subscription.
   */
  subscribeTo(observable: Observable<T>): Subscription {
    const subscription = observable.subscribe({
      next: (value: T) => this.next(value),
      error: (err: any) => this.error(err),
      complete: () => this.complete()
    });
    this.onSubscribe(subscription);
    return subscription;
  }
}
