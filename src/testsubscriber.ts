export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    ERROR = "ERROR",
    NONE = "NONE", // Disables logging
}

export class TestSubscriber<T> extends Subscriber<T> {
    private delegate?: Observer<T> | Subscriber<T>;
    private readonly initialRequest: number;
    private readonly onNextEvents: T[] = [];
    private readonly errorEvents: any[] = [];
    private completions = 0;
    private terminalEventReceived = false;
    private lastOperationId = ""; // Changed from lastSeenThread to lastOperationId

    private logLevel: LogLevel = LogLevel.INFO; // Default log level
    private loggingEnabled = true; // Allow users to enable/disable logging

    /**
     * @param delegate - An optional observer or subscriber to delegate events to.
     * @param initialRequest - Number of items to request initially from the Observable.
     */
    private constructor(
        delegate?: Observer<T> | Subscriber<T>,
        initialRequest: number = Number.POSITIVE_INFINITY
    ) {
        super();
        this.delegate = delegate;
        this.initialRequest = initialRequest;
        this.request(initialRequest);
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

    /**
     * Logs messages if logging is enabled and matches the current log level.
     * @param level - The log level for this message.
     * @param message - The message to log.
     * @param args - Additional arguments for the log message.
     */
    private log(level: LogLevel, message: string, ...args: any[]): void {
        if (!this.loggingEnabled || level === LogLevel.NONE) return;
        if (this.logLevel === LogLevel.DEBUG || this.logLevel === level) {
            console.log(`[${new Date().toISOString()}] [${level}] ${message}`, ...args);
        }
    }

    public setLoggingEnabled(enabled: boolean): void {
        this.loggingEnabled = enabled;
    }

    public setLogLevel(level: LogLevel): void {
        if (!Object.values(LogLevel).includes(level)) {
            throw new Error(`Invalid log level: ${level}`);
        }
        this.logLevel = level;
    }

    /* Observer Implementation */
    public onNext(value: T): void {
        this.onNextEvents.push(value);
        this.lastOperationId = `Operation-${Date.now()}`;
        this.log(LogLevel.DEBUG, `onNext called with value: ${value}`);
        this.delegate?.onNext(value);
    }

    public onError(error: any): void {
        this.errorEvents.push(error);
        this.terminalEventReceived = true;
        this.lastOperationId = `Operation-${Date.now()}`;
        this.log(LogLevel.ERROR, `onError called with error:`, error);
        this.delegate?.onError(error);
    }

    public onCompleted(): void {
        this.completions++;
        this.terminalEventReceived = true;
        this.lastOperationId = `Operation-${Date.now()}`;
        this.log(LogLevel.INFO, `onCompleted called`);
        this.delegate?.onCompleted();
    }

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
            if (this.onNextEvents[index] !== value) {
                this.fail(`Value mismatch at index ${index}: expected ${value}, but received ${this.onNextEvents[index]}`);
            }
        });
    }

    public async awaitTerminalEvent(timeoutMs: number = 5000): Promise<void> {
        const start = Date.now();
        while (!this.terminalEventReceived) {
            if (Date.now() - start > timeoutMs) {
                this.fail("Timeout waiting for terminal event");
            }
            await this.sleep(10);
        }
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    public getLastOperationId(): string {
        return this.lastOperationId;
    }
}
