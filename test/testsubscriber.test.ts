export interface Observer<T> {
    onNext(value: T): void;
    onError(error: any): void;
    onCompleted(): void;
}

export interface Subscription {
    unsubscribe(): void;
    isUnsubscribed(): boolean;
}

/* Base Subscriber */
export class Subscriber<T> implements Observer<T>, Subscription {
    private _isUnsubscribed = false;

    public onNext(value: T): void {}
    public onError(error: any): void {}
    public onCompleted(): void {}

    public unsubscribe(): void {
        this._isUnsubscribed = true;
    }

    public isUnsubscribed(): boolean {
        return this._isUnsubscribed;
    }

    protected request(_n: number): void {}
}

/* Notification Class */
export class Notification<T> {
    constructor(
        public kind: "N" | "E" | "C",
        public value?: T,
        public error?: any
    ) {}
}

/* TimeUnit Enum */
export enum TimeUnit {
    MILLISECONDS,
    SECONDS,
    MINUTES,
    HOURS,
}

/* Convert TimeUnit to Milliseconds */
export function convertToMilliseconds(timeout: number, unit: TimeUnit): number {
    const timeMultipliers = {
        [TimeUnit.MILLISECONDS]: 1,
        [TimeUnit.SECONDS]: 1000,
        [TimeUnit.MINUTES]: 60000,
        [TimeUnit.HOURS]: 3600000,
    };
    return timeout * (timeMultipliers[unit] || 1);
}

/* Async Sleep Helper */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/* TestSubscriber */
export class TestSubscriber<T> extends Subscriber<T> {
    private delegate?: Observer<T> | Subscriber<T>;
    private readonly initialRequest: number;
    private readonly onNextEvents: T[] = [];
    private readonly errorEvents: any[] = [];
    private completions = 0;
    private terminalEventReceived = false;
    private lastSeenThread = "";

    /* Constructor Overloads Managed by Factory Methods */
    private constructor(
        delegate?: Observer<T> | Subscriber<T>,
        initialRequest: number = Number.POSITIVE_INFINITY
    ) {
        super();
        this.delegate = delegate;
        this.initialRequest = initialRequest;
        this.request(initialRequest);
    }

    /* Factory Methods for Clearer Instantiation */
    public static create<T>(): TestSubscriber<T> {
        return new TestSubscriber<T>();
    }

    public static withInitialRequest<T>(initialRequest: number): TestSubscriber<T> {
        return new TestSubscriber<T>(undefined, initialRequest);
    }

    public static withDelegate<T>(delegate: Observer<T>): TestSubscriber<T> {
        return new TestSubscriber<T>(delegate);
    }

    public static withDelegateAndRequest<T>(delegate: Observer<T>, initialRequest: number): TestSubscriber<T> {
        return new TestSubscriber<T>(delegate, initialRequest);
    }

    /* Observer Implementation */
    public onNext(value: T): void {
        this.onNextEvents.push(value);
        this.lastSeenThread = `Thread-${Date.now()}`;
        this.delegate?.onNext(value);
    }

    public onError(error: any): void {
        this.errorEvents.push(error);
        this.terminalEventReceived = true;
        this.lastSeenThread = `Thread-${Date.now()}`;
        this.delegate?.onError(error);
    }

    public onCompleted(): void {
        this.completions++;
        this.terminalEventReceived = true;
        this.lastSeenThread = `Thread-${Date.now()}`;
        this.delegate?.onCompleted();
    }

    /* Assertions */
    private fail(message: string): never {
        throw new Error(message);
    }

    public assertCompleted(): void {
        if (this.completions !== 1) {
            this.fail(`Expected exactly 1 completion event, but received ${this.completions}`);
        }
    }

    public assertNoErrors(): void {
        if (this.errorEvents.length > 0) {
            this.fail(`Expected no errors, but received ${this.errorEvents.length}: ${this.errorEvents}`);
        }
    }

    public assertValues(...expected: T[]): void {
        if (this.onNextEvents.length !== expected.length) {
            this.fail(
                `Expected ${expected.length} values, but received ${this.onNextEvents.length}: ${this.onNextEvents}`
            );
        }
        expected.forEach((value, index) => {
            if (this.onNextEvents[index] !== value) {
                this.fail(
                    `Value mismatch at index ${index}: expected ${value}, but received ${this.onNextEvents[index]}`
                );
            }
        });
    }

    /* Await Methods */
    public async awaitTerminalEvent(timeoutMs: number = 5000): Promise<void> {
        const start = Date.now();
        while (!this.terminalEventReceived) {
            if (Date.now() - start > timeoutMs) {
                this.fail("Timeout waiting for terminal event");
            }
            await sleep(10);
        }
    }

    /* Getters */
    public getOnNextEvents(): ReadonlyArray<T> {
        return this.onNextEvents;
    }

    public getErrorEvents(): ReadonlyArray<any> {
        return this.errorEvents;
    }

    public getCompletions(): number {
        return this.completions;
    }

    public getLastSeenThread(): string {
        return this.lastSeenThread;
    }
}
