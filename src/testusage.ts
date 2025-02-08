import { of, throwError } from 'rxjs';
import { TestObserver } from './testobserver';

// Create a TestObserver instance for number values.
const testObserver = TestObserver.create<number>();

// Example 1: Observable emitting 1, 2, 3.
testObserver.subscribeTo(of(1, 2, 3));
console.log("Sample Usage - Logs after of(1, 2, 3):", testObserver.getLogs());

// Resetting logs by creating a new instance for clarity.
const testObserverError = TestObserver.create<number>();

// Example 2: Observable that immediately errors.
testObserverError.subscribeTo(throwError(() => new Error("Test error")));
console.log("Sample Usage - Logs after error observable:", testObserverError.getLogs());

// Dispose to see disposal logging.
testObserver.dispose();
console.log("Sample Usage - Logs after disposal:", testObserver.getLogs());
