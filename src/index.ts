export { TestSubscriber } from "./testsubscriber";
// export { Observer, Subscription } from "./Observer";
// export { Notification } from "./Notification";
// export { TimeUnit, sleep } from "./TimeUnit";

// import { of, throwError } from 'rxjs';
import { TestObserver } from './testobserver';
import './sample-usage';
import { of } from "rxjs";

// A simple demonstration using the TestObserver in main.ts.
const testObserver = TestObserver.create<number>();

// Subscribe to an observable that emits 1, 2, 3.
testObserver.subscribeTo(of(1, 2, 3));
console.log("Main: Logs after of(1, 2, 3):", testObserver.getLogs());

// Dispose the subscription.
testObserver.dispose();
console.log("Main: Is disposed:", testObserver.isDisposed());
