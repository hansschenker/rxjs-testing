import { Observable, defer, tap } from 'rxjs';
import { pickTextColor } from './utils/colors';
// ✅ Global tracking for active subscriptions & unique subscriber IDs
let activeSubscriptions = 0;
let subscriberIdCounter = 0;
const subscriberRegistry = new Map<number, { startTime: number, subscriberFn?: Function }>(); // Stores metadata per subscriber



export enum TapCallback {
  All,
  Next,
  Complete,
  Error,
  Subscribe,
  Unsubscribe,
  Finalize,
    None,
  }
 
export function log(
  label = 'CUSTOM-LOG', 
  callbacks: TapCallback = TapCallback.Next, 
  bgColor?: string,  
  verbose = false, 
  styles = {}
) {
  const defaultStyle = {
    bgColor: bgColor || 'transparent',
    color: bgColor ? pickTextColor(bgColor, '#FFFFFF', '#000000') : 'inherit',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: bgColor ? '3px' : '0px',
    borderRadius: bgColor ? '2px' : '0px',
    ...styles
  };

  return function<T>(source: Observable<T>): Observable<T> {
    
    return defer(() => {
      return new Observable<T>((subscriber) => {
        const subscriberId = ++subscriberIdCounter; // Assign a unique ID
        const startTime = Date.now();

        // ✅ Extract and store the subscriber function ONLY if it is a function
        let subscriberFn: Function | undefined = undefined;
        
        if (typeof subscriber === 'function') {
          subscriberFn = subscriber;
        } else if (subscriber && typeof subscriber.next === 'function') {
          subscriberFn = subscriber.next;
        }

        subscriberRegistry.set(subscriberId, { startTime, subscriberFn });

        if (callbacks === TapCallback.Subscribe || callbacks === TapCallback.All) {
          activeSubscriptions++;
          console.log(`%c${label} [SUBSCRIBE] - ID: ${subscriberId}, Active: ${activeSubscriptions}`, `color: ${defaultStyle.color}; font-weight: bold;`);
          
          if (verbose && subscriberFn) {
            console.log(`📌 Subscriber ${subscriberId} started at: ${new Date(startTime).toISOString()}`);
            console.log(`🔍 Subscriber function: ${subscriberFn.name || '[Anonymous Function]'} (${subscriberFn.toString().slice(0, 50)}...)`);
          }
        }

        const subscription = source.subscribe({
          next: (value) => {
            if (subscriberFn) subscriberFn(value);
            subscriber.next(value);
          },
          error: (err) => {
            subscriber.error(err);
          },
          complete: () => {
            subscriber.complete();
          }
        });

        subscription.add(() => {
          const duration = Date.now() - startTime;
          subscriberRegistry.delete(subscriberId); // Remove from registry
          activeSubscriptions--;

          if (callbacks === TapCallback.Unsubscribe || callbacks === TapCallback.All) {
            console.log(`%c${label} [UNSUBSCRIBE] - ID: ${subscriberId}, Active: ${activeSubscriptions}`, `color: ${defaultStyle.color}; font-weight: bold;`);
            if (verbose && subscriberFn) {
              console.log(`🕒 Subscriber ${subscriberId} lasted: ${duration} ms`);
              console.log(`🔍 Unsubscribed function: ${subscriberFn.name || '[Anonymous Function]'} (${subscriberFn.toString().slice(0, 50)}...)`);
            }
          }
        });

        return subscription;
      }).pipe(
        tap({
          next: (result: T) => {
            if (callbacks === TapCallback.Next || callbacks === TapCallback.All) {
              console.log(`%c${label} [NEXT] - ID: ${subscriberIdCounter}:`, `color: ${defaultStyle.color}; font-weight: bold;`, result);
              if (verbose) console.trace(`🔍 Value emitted for Subscriber ${subscriberIdCounter}`);
            }
          },
          complete: () => {
            if (callbacks === TapCallback.Complete || callbacks === TapCallback.All) {
              console.log(`%c${label} [COMPLETE] - ID: ${subscriberIdCounter}`, `color: ${defaultStyle.color}; font-weight: bold;`);
            }
          },
          error: (err: any) => {
            if (callbacks === TapCallback.Error || callbacks === TapCallback.All) {
              console.error(`%c${label} [ERROR] - ID: ${subscriberIdCounter}`, `color: ${defaultStyle.color}; font-weight: bold;`, err);
              if (verbose) console.trace(`🔍 Error trace for Subscriber ${subscriberIdCounter}`);
            }
          },
          finalize: () => {
            if (callbacks === TapCallback.Finalize || callbacks === TapCallback.All) {
              console.log(`%c${label} [FINALIZE] - ID: ${subscriberIdCounter}`, `color: ${defaultStyle.color}; font-weight: bold;`);
            }
          }
        })
      );
    });
  };
}
