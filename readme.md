# RxJS-TestSubscriber

![CI Status](https://github.com/hansschenker/rxjs-testsubscriber/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/hansschenker/rxjs-testsubscriber/actions/workflows/release.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![npm](https://img.shields.io/npm/v/rxjs-testsubscriber)

RxJS-TestSubscriber is a **powerful RxJS testing utility** designed to make **observables testing easier and more structured**. It provides **assertions, logging, and debugging capabilities**, making it simple to validate **RxJS streams**.

🚀 **Features**

- **Unit test RxJS streams** with powerful assertion methods.
- **Configurable logging** (`DEBUG`, `INFO`, `ERROR`, `NONE`).
- **Delegation support** (wraps another observer/subscriber).
- **Async test support** with `awaitTerminalEvent()`.
- **Fully TypeScript-ready**.



## 🌊 **TestSubscriber&lt;T&gt; Workflow**

```mermaid
graph LR
    subgraph TestSubscriber
        A["subscribe observer"] -->|onNext value| B["Store value"]
        B --> C["Push to onNextEvents"]
        B -->|Logging| L1["Log Debug Event"]

        A -->|onErro error| D["Error Handling"]
        D --> E["Push to errorEvents"]
        D -->|Logging| L2["Log Error Event"]
        D -->|Mark as terminal event| F["Set terminalEventReceived"]

        A -->|onCompleted| G["Completion Handling"]
        G --> H["Increment completions"]
        G -->|Logging| L3["Log Completion Event"]
        G -->|Mark as terminal event| F

        subgraph Assertions
            I["assertValues"] --> |Compare with stored events| J["Pass/Fail"]
            K["assertCompleted"] --> |Check completions| J
            M["assertNoErrors"] --> |Check errorEvents| J
        end

        subgraph Logging
            L1 --> L4["Log onNext"]
            L2 --> L5["Log onError"]
            L3 --> L6["Log onCompleted"]
        end

        subgraph Async Testing
            N["awaitTerminalEvent"] --> |Loop until terminalEventReceived| F
        end
    end

    subgraph Observable
        O["Emit Values"] --> P["Pass to TestSubscriber"]
    end

    P --> A
```

---

## **📌 Explanation of the Diagram**$

| **Component** | **Description** |
|--------------|----------------|
| 🟢 `onNext(value)` | Stores emitted values in `onNextEvents`. |
| 🔴 `onError(error)` | Logs and stores errors in `errorEvents`. |
| 🟡 `onCompleted()` | Marks the observable as completed and increments completion count. |
| ✅ `Assertions` | `assertValues`, `assertCompleted`, and `assertNoErrors` verify expected behavior. |
| 🔍 `Logging` | Logs each event (`onNext`, `onError`, `onCompleted`) based on logging level. |
| ⏳ `awaitTerminalEvent()` | Waits until the observable completes or errors out. |

---


## Rxjs TestObserver

```mermaid
flowchart LR
    A["Observable"] -- subscribe --> B["TestObserver.subscribeTo"]
    B -- calls subscribe() --> C["TestObserver.onSubscribe()"]
    C -- captures subscription --> D["Subscription"]
    C -- logs 'onSubscribe: subscription set' --> H["Log Events"]
    C -- forwards event --> I["Delegate Observer (optional)"]
    A -- emits next --> E["TestObserver.next(value)"]
    E -- logs 'next: value' --> H
    E -- forwards event --> I
    A -- emits error --> F["TestObserver.error(err)"]
    F -- logs 'error: err' --> H
    F -- forwards event --> I
    A -- emits complete --> G["TestObserver.complete()"]
    G -- logs 'complete' --> H
    G -- forwards event --> I
    K["TestObserver.onSuccess(value)"] -- logs 'onSuccess: value' --> H
    K -- forwards event --> I
    J["TestObserver.dispose()"] -- calls unsubscribe() on Subscription --> D
    J -- logs 'dispose called' & 'subscription unsubscribed' --> H

```
