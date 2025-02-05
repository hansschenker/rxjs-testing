import { Observer, Subscriber } from "rxjs";

export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    ERROR = "ERROR",
    NONE = "NONE",
}

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

export class TestSubscriber<T> extends Subscriber<T> {
    private delegate?: Observer<T> | Subscriber<T>;
    private onNextEvents: T[] = [];
    private initialRequest: number;
    private errorEvents: any[] = [];
    private completions = 0;
    private terminalEventReceived = false;
    private lastEventTimestamp: string = "";

    private logLevel: LogLevel = LogLevel.INFO; // Default log level
    private loggingEnabled = true; // Allow users to enable/disable logging

    // Terminal event promise and resolver for efficient waiting
    private terminalEventPromise: Promise<void>;
    private terminalEventResolver!: () => void;

    // Logging level hierarchy for filtering log messages
    private static readonly LOG_LEVEL_HIERARCHY: Record<LogLevel, number> = {
        [LogLevel.DEBUG]: 1,
        [LogLevel.INFO]: 2,
        [LogLevel.ERROR]: 3,
        [LogLevel.NONE]: 4,
    };

    /* Constructor */
    public constructor(
        delegate?: Observer<T> | Subscriber<T>,
        initialRequest: number = Number.POSITIVE_INFINITY
    ) {
        super();
        this.delegate = delegate;
        this.initialRequest = initialRequest;
        this.initializeTerminalEventPromise();
    }

    // Initialize the terminal event promise and its resolver.
    private initializeTerminalEventPromise(): void {
        this.terminalEventPromise = new Promise<void>((resolve) => {
            this.terminalEventResolver = resolve;
        });
    }

    /* Factory Methods */
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

    /* Logging Utility */
    private log(level: LogLevel, message: string, ...args: any[]): void {
        if (!this.loggingEnabled || this.logLevel === LogLevel.NONE) return;
        if (TestSubscriber.LOG_LEVEL_HIERARCHY[level] >= TestSubscriber.LOG_LEVEL_HIERARCHY[this.logLevel]) {
            console.log(`[${new Date().toISOString()}] [${level}] ${message}`, ...args);
        }
    }

    /* Enable/Disable Logging */
    public setLoggingEnabled(enabled: boolean): void {
        this.loggingEnabled = enabled;
    }

    /* Set Logging Level */
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /* Observer Overrides */
    public next(value: T): void {
        if (this.onNextEvents.length < this.initialRequest) {
            this.onNext(value);
        } else {
            this.log(LogLevel.DEBUG, `Ignoring event as initial request limit of ${this.initialRequest} reached`);
        }
    }

    public error(err: any): void {
        this.onError(err);
    }

    public complete(): void {
        this.onCompleted();
    }

    /* Internal Event Handlers */
    public onNext(value: T): void {
        this.onNextEvents.push(value);
        this.lastEventTimestamp = `Timestamp-${Date.now()}`;
        this.log(LogLevel.DEBUG, `onNext called with value: ${value}`);
        try {
            this.delegate?.next(value);
        } catch (e) {
            this.log(LogLevel.ERROR, "Delegate next error:", e);
        }
    }

    public onError(error: any): void {
        this.errorEvents.push(error);
        this.terminalEventReceived = true;
        this.lastEventTimestamp = `Timestamp-${Date.now()}`;
        this.log(LogLevel.ERROR, `onError called with error:`, error);
        try {
            this.delegate?.error(error);
        } catch (e) {
            this.log(LogLevel.ERROR, "Delegate error callback threw an exception:", e);
        }
        // Resolve the terminal event promise
        if (this.terminalEventResolver) {
            this.terminalEventResolver();
            this.terminalEventResolver = () => {}; // Prevent multiple calls
        }
    }

    public onCompleted(): void {
        this.completions++;
        this.terminalEventReceived = true;
        this.lastEventTimestamp = `Timestamp-${Date.now()}`;
        this.log(LogLevel.INFO, `onCompleted called`);
        try {
            this.delegate?.complete();
        } catch (e) {
            this.log(LogLevel.ERROR, "Delegate complete callback threw an exception:", e);
        }
        // Resolve the terminal event promise
        if (this.terminalEventResolver) {
            this.terminalEventResolver();
            this.terminalEventResolver = () => {}; // Prevent multiple calls
        }
    }

    /* Deep equality check for assertions */
    private isEqual(a: any, b: any): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    /* Assertions */
    private fail(message: string): never {
        this.log(LogLevel.ERROR, message);
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
            this.fail(`Expected ${expected.length} values, but received ${this.onNextEvents.length}: ${this.onNextEvents}`);
        }
        expected.forEach((value, index) => {
            if (!this.isEqual(this.onNextEvents[index], value)) {
                this.fail(
                    `Value mismatch at index ${index}: expected ${JSON.stringify(value)}, but received ${JSON.stringify(
                        this.onNextEvents[index]
                    )}`
                );
            }
        });
    }

    /* Await Methods */
    public async awaitTerminalEvent(timeoutMs: number = 5000): Promise<void> {
        await Promise.race([
            this.terminalEventPromise,
            sleep(timeoutMs).then(() => {
                this.fail("Timeout waiting for terminal event");
            }),
        ]);
    }

    /* State Reset Capability */
    /**
     * Resets the internal state of the TestSubscriber, clearing recorded events,
     * errors, completions, and reinitializing the terminal event promise.
     */
    public reset(): void {
        this.onNextEvents = [];
        this.errorEvents = [];
        this.completions = 0;
        this.terminalEventReceived = false;
        this.lastEventTimestamp = "";
        this.initializeTerminalEventPromise();
        this.log(LogLevel.DEBUG, "TestSubscriber state has been reset.");
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

    public getLastEventTimestamp(): string {
        return this.lastEventTimestamp;
    }

    /* Enhanced Unsubscription Cleanup */
    public unsubscribe(): void {
        super.unsubscribe();
        // Enhanced cleanup logic: Reset state and clear any lingering references
        this.reset();
        this.log(LogLevel.DEBUG, "TestSubscriber has been unsubscribed and cleaned up.");
    }
}
