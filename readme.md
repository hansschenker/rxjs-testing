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

---

## 📦 Installation

Install via npm:

```sh
npm install rxjs-testsubscriber

Mermaid diagram
``` mermaid

### 🌊 **TestSubscriber<T> Workflow**
```mermaid
graph TD;
    
    subgraph TestSubscriber<T>
        A[subscribe(observer)] -->|onNext(value)| B{Store value}
        B --> C[Push to onNextEvents]
        B -->|Logging| L1[Log Debug Event]

        A -->|onError(error)| D{Error Handling}
        D --> E[Push to errorEvents]
        D -->|Logging| L2[Log Error Event]
        D -->|Mark as terminal event| F[Set terminalEventReceived]

        A -->|onCompleted()| G{Completion Handling}
        G --> H[Increment completions]
        G -->|Logging| L3[Log Completion Event]
        G -->|Mark as terminal event| F

        subgraph Assertions
            I[assertValues] --> |Compare with stored events| J{Pass/Fail}
            K[assertCompleted] --> |Check completions| J
            M[assertNoErrors] --> |Check errorEvents| J
        end

        subgraph Logging
            L1 --> L4[Log onNext]
            L2 --> L5[Log onError]
            L3 --> L6[Log onCompleted]
        end

        subgraph Async Testing
            N[awaitTerminalEvent] --> |Loop until terminalEventReceived| F
        end
    end

    subgraph Observable
        O[Emit Values] --> P[Pass to TestSubscriber]
    end

    P --> A


---

## **📌 Explanation of the Diagram**
| **Component** | **Description** |
|--------------|----------------|
| 🟢 `onNext(value)` | Stores emitted values in `onNextEvents`. |
| 🔴 `onError(error)` | Logs and stores errors in `errorEvents`. |
| 🟡 `onCompleted()` | Marks the observable as completed and increments completion count. |
| ✅ `Assertions` | `assertValues`, `assertCompleted`, and `assertNoErrors` verify expected behavior. |
| 🔍 `Logging` | Logs each event (`onNext`, `onError`, `onCompleted`) based on logging level. |
| ⏳ `awaitTerminalEvent()` | Waits until the observable completes or errors out. |

---

## **📌 Adding the Diagram to `README.md`**
To include this **Mermaid diagram** in your **GitHub README**, add the following section:

```markdown
## 🌊 TestSubscriber<T> Workflow (Mermaid Diagram)
```mermaid
graph TD;
    
    subgraph TestSubscriber<T>
        A[subscribe(observer)] -->|onNext(value)| B{Store value}
        B --> C[Push to onNextEvents]
        B -->|Logging| L1[Log Debug Event]

        A -->|onError(error)| D{Error Handling}
        D --> E[Push to errorEvents]
        D -->|Logging| L2[Log Error Event]
        D -->|Mark as terminal event| F[Set terminalEventReceived]

        A -->|onCompleted()| G{Completion Handling}
        G --> H[Increment completions]
        G -->|Logging| L3[Log Completion Event]
        G -->|Mark as terminal event| F

        subgraph Assertions
            I[assertValues] --> |Compare with stored events| J{Pass/Fail}
            K[assertCompleted] --> |Check completions| J
            M[assertNoErrors] --> |Check errorEvents| J
        end

        subgraph Logging
            L1 --> L4[Log onNext]
            L2 --> L5[Log onError]
            L3 --> L6[Log onCompleted]
        end

        subgraph Async Testing
            N[awaitTerminalEvent] --> |Loop until terminalEventReceived| F
        end
    end

    subgraph Observable
        O[Emit Values] --> P[Pass to TestSubscriber]
    end

    P --> A
