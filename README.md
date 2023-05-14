# `message-port-rpc`

Turns a [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) into an remote procedure call (RPC) stub.

## Background

Modern web apps often need to deal with multiple JavaScript workers or VMs. The communication channel is often [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort).

By converting a dedicated `MessagePort` into an RPC stub, we can easily offload a Promise function to a different thread.

## How to use

Make sure the pair of `MessagePort` used for RPC is dedicated and not started. No other RPC, listeners, or posters should be using the same pair.

It is highly recommended to create a new [`MessageChannel`](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel) and convert them into RPC stub.

### Server stub

```ts
import { messagePortRPC } from 'message-port-rpc';

messagePortRPC(port1, (x, y) => x + y);
```

### Client stub

```ts
import { messagePortRPC } from 'message-port-rpc';

const rpc = messagePortRPC(port2);

await rpc(1, 2); // 3.
```

## Full Web Worker example

One of the advantage of Web Worker is to offload computation-intensive functions.

### On main thread (client stub)

Creates a new pair of `MessagePort`, pass one of the port to the worker thread, then create a RPC stub on another port.

```ts
import { messagePortRPC } from 'message-port-rpc';

// TypeScript: define the function type.
type Fn = (x: number, y: number) => Promise<number>;

// Loads a Web Worker.
const worker = new Worker('./static/worker/js/main.js');

// Creates a new pair of `MessagePort` dedicated for RPC.
const { port1, port2 } = new MessageChannel();

// Sends the dedicated port to the worker.
worker.postMessage(undefined, [port2]);

// Creates a function stub.
const callFunction = messagePortRPC<Fn>(port1);

// Calls the function stub.
const result: number = await callFunction(1, 2);
```

### On worker thread (server stub)

Receives the `MessagePort` and registers an RPC function on the port.

```ts
import { messagePortRPC } from 'message-port-rpc';

// TypeScript: define the function type.
type Fn = (x: number, y: number) => Promise<number>;

// Receives the port dedicated for RPC.
addEventListener('message', ({ ports }) => {
  // Registers an RPC function on the received `MessagePort`.
  messagePortRPC<Fn>(ports[0], (x, y) => Promise.resolve(x + y));
});
```

If the worker takes time to start, it is okay, no invocations would be lost. Thanks to `MessagePort`, all messages will be queued internally until the other side signals ready to receive.

## Aborting the call

Client can abort an invocation sooner by passing an `AbortSignal` via the `withOptions` function. An `AbortSignal` will be passed to the remote function inside `this` context.

In the following example, we assume the client is remotely invoking a `fetch()` function, which supports `AbortSignal` natively.

### Server stub

The following code snippet will use the `AbortSignal` to abort the `fetch()` call.

```ts
messagePortRPC(ports[0], async url => {
  // During an RPC call, the `AbortSignal` is passed in the `this` context.
  const res = await fetch(url, { signal: this.signal });

  // ...
});
```

### Client stub

The following code snippet will call the stub with additional options to pass an `AbortSignal`.

```ts
const abortController = new AbortController();
const remoteFetch = messagePortRPC(port);

// Calls the stub with arguments in array, and options.
const fetchPromise = remoteFetch.withOptions({ signal: abortController.signal })('https://github.com');

// Aborts the ongoing call.
abortController.abort();

// The promise will reject locally.
fetchPromise.catch(error => {});
```

Notes: despite the `AbortSignal` is passed to `fetch()`, when aborted, the rejection will be done locally regardless of the result of the `fetch()` call.

## API

The following is simplified version of the API. Please refer to our published typings for the full version.

```ts
function messagePortRPC<T extends (...args: any[]) => Promise<unknown>>(
  port: MessagePort,
  fn?: (this: { signal: AbortSignal }, ...args: Parameters<T>) => ReturnType<T>
): {
  (...args: Parameters<T>): ReturnType<T>;

  withOptions: (
    init: {
      signal?: AbortSignal;
      transfer?: Transferable[];
    }
  ) => T;
};
```

## Behaviors

### Why use a dedicated `MessagePort`?

Instead of multiplexing multiple calls into a single `MessagePort`, a dedicated `MessagePort` simplifies the code, easier to secure and audit the channel, and eliminates crosstalk.

Internally, for every RPC call, we create a new pair of `MessagePort`. The result of the call is passed through the `MessagePort`. After the call is resolved/rejected/aborted, the `MessagePort` will be shutdown.

With a new pair of `MessagePort`, messages are queued until the event listener call [`MessagePort.start()`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort/start). In other words, with dedicated `MessagePort`, calls are less likely to get lost due to false-start.

### What can be passed as arguments and return value?

All arguments and return value will be send over the `MessagePort`. The values must be transferable using the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) by the underlying `MessagePort`.

In other words, you cannot pass `function` or `class` as an argument or return value.

### Will it pass the `this` context?

No, because the `this` context is commonly a class object or [`globalThis`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis). [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) probably will not work for most `this`.

If you need to pass `this`, please pass it as an argument.

### Can I use it with `<iframe>`?

Yes, you can use it with `<iframe>`.

However, despite the communication channel in `<iframe>` is very similar to `MessagePort` and supports [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), it is not `MessagePort`.

You will need to create a new `MessageChannel` and use [`HTMLIFrameElement.contentWindow.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) to send one of the `MessagePort` to the `<iframe>` content window. Then, you can convert the `MessagePort` into RPC with this package.

### Why hosting a single function vs. multiple functions?

We think a single function is much simpler, less responsibility, and more flexible approach.

To create a pool of stubs, you should create multiple `MessagePort`, one for each stub. Then, send it through an initializer stub. The receiver side receiving these ports should set up stubs for each of the port, registering their respective subroutine.

### Can I call from the other side too?

Yes, our implementation supports bidirectional and asymmetrical calls over a single pair of `MessagePort`.

You can register different functions on both sides and call from the other side.

```ts
// On main thread:
// - a power function is hosted on the port;
// - the return value is the stub of the worker, which is a sum function.
const sum = messagePortRPC(port1, (x ** y) => x ** y);

await sum(1, 2); // 1 + 2 = 3
```

```ts
// On worker thread:
// - a sum function is hosted on the port;
// - the return value is the stub of the main thread, which is a power function.
addEventListener('message', ({ ports }) => {
  const power = messagePortRPC(ports[0], (x + y) => x + y);

  await power(3, 4); // 3 ** 4 = 81
});
```

### Do I need to sequence the calls myself?

No, you do not need to wait for a call to return before making another call.

Internally, all calls are isolated by their own pair of `MessagePort` and processed asynchronously.

### Can I send `Error` object?

Yes, thanks to the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), you can send objects of `Error` class.

However, there are slight differences in the error object received.

```ts
const obj = await stub();

obj instanceof Error; // False. Error object from SCA has a different prototype.
Object.prototype.toString.call(obj) === '[object Error]'; // True.
```

Alternatively, you can recreate the error object.

### Can I provide my own marshalling function?

No, we do not support marshalling function.

Alternatively, you can channel `MessagePort` to a pair of marshal and unmarshal functions. Make sure you implement both marshal and unmarshal functions on both sides of the port.

### Can I offload a Redux store or `useReducer` to a Web Worker?

Yes, you can offload them to a Web Worker. Some notes to take:

- action and state must be serializable through [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
  - no classes, functions, DOM elements, no thunk, etc.
- middleware must not contains code that does not work in worker
  - no DOM access, etc.

You can look at sample [`useBindReducer`](https://github.com/compulim/message-port-rpc/tree/main/packages/pages/src/app/useBindReducer.ts) and [`useReducerSource`](https://github.com/compulim/message-port-rpc/tree/main/packages/pages/src/iframe/useReducerSource.ts) to see how it work.

We will eventually made these React hooks available. Stay tuned.

### How could I stop the stub from listening to a port?

To stop the stub, you should close the port by calling [`MessagePort.close()`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort/close).

The port for the stub must be dedicated and not to be reused. When you want to stop the stub from listening to a port, you should simply close the port.

### Why don't you create `MessagePort` for me?

We understood there are hassles to create `MessagePort` yourself.

We spent a lot of time experimenting with different options and landed on this design for several reasons:

- you own the resources and control the lifetime of the resources, less likely to resources leak
- you do not need to create the stub before sending the port to the other side
- you can control which side creates the ports and do not need to pipe them yourself
- you can build marshal/unmarshal function without too much piping
- you can build a `MessagePort`-like custom channel without extra piping

There are downsides:

- you forget to dedicate the `MessagePort` to a stub
- you need to write one more line of code

At the end of the day, we think channel customization outweighted the disadvantages and made a bet on this design.

### Can I use `BroadcastChannel` to listen to many client stubs at once?

No, you cannot use [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel).

`BroadcastChannel` does not support sending `MessagePort` and other [transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects), which is critical to the operation of the stub.

### Why should I use this implementation of RPC?

We are professional developers. Our philosophy makes this package easy to use.

- Standards: we use [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) and [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) as-is
- Airtight: we wrap everything in their own `MessagePort`, no multiplexing = no crosstalks
- Small scope: one `MessagePort` host one function only, more flexibility on building style
- Simple: you almost know how to write this package
- Maintainability: we relies heavily on tooling and automation to maintain this package

## Contributions

Like us? [Star](https://github.com/compulim/message-port-rpc/stargazers) us.

Want to make it better? [File](https://github.com/compulim/message-port-rpc/issues) us an issue.

Don't like something you see? [Submit](https://github.com/compulim/message-port-rpc/pulls) a pull request.
