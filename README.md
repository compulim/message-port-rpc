# `message-port-rpc`

Turns a [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) into an remote procedure call (RPC) stub.

## Background

Modern web apps often need to deal with multiple JavaScript workers or VMs. The communication channel is often [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort).

By converting a `MessagePort` into an RPC stub, we can easily offload a Promise function to a different thread.

## How to use

### On main thread

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

### On worker thread

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

## API

```ts
function messagePortRPC<T extends (...args: any[]) => Promise<unknown>>(
  port: MessagePort,
  fn?: T
): {
  (...args: Parameters<T>): ReturnType<T>;

  withOptions: (
    args: Parameters<T>,
    init: {
      signal?: AbortSignal;
      tranfer?: Transferable[];
    }
  ) => ReturnType<T>;
};
```

## Behaviors

### Why use a dedicated `MessagePort`?

Instead of multiplexing multiple messages into a single `MessagePort`, a dedicated `MessagePort` simplifies the code, and easier to secure the channel.

Internally, for every RPC call, we create a new pair of `MessagePort`. The result of the call is passed through the `MessagePort`. After the call is resolved/rejected/aborted, the `MessagePort` will be shutdown.

Also, with a new pair of `MessagePort`, messages are queued until the event listener call [`MessagePort.start()`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort/start). In other words, with dedicated `MessagePort`, calls are less likely to get lost due to false-start.

### What can be passed as arguments and return value?

All arguments and return value will be send over the `MessagePort`. The values must be transferable using the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) by the underlying `MessagePort`.

In other words, you cannot pass `function` or `class` as an argument or return value.

### Why hosting a single function vs. multiple functions?

We think a single function is much simpler, less responsibility, and more flexible.

To create a pool of RPC stubs, you should create multiple `MessagePort` and send it through an initializer RPC stub. The receiver side receiving these ports should set up RPC stubs for each of the port, registering their respective subroutine.

### Can I call from the other side too?

Yes, our implementation supports bidirectional calls over a pair of `MessagePort`. You can register a different function on both sides and call from the other side.

```ts
// On main thread:
// - a power function is hosted on the port;
// - the return value is the stub of the worker, which is a sum function.
const sum = messagePortRPC<Fn>(port1, (x ** y) => x ** y);

await sum(1, 2); // 3
```

```ts
// On worker thread:
// - a sum function is hosted on the port;
// - the return value is the stub of the main thread, which is a power function.
addEventListener('message', ({ ports }) => {
  const power = messagePortRPC<Fn>(ports[0], (x + y) => x + y);

  await power(3, 4); // 81
});
```

### Do I need to sequence the calls myself?

No, you don't need to wait for the call to return before making another call. Internally, all calls are isolated by their own pair of `MessagePort`.

### Can I send `Error` object?

Yes, thanks to the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), you can send objects of `Error` class.

However, there are slight difference in the error object received.

```ts
const obj = await stub();

obj instanceof Error; // False. Error object from SCA has a different prototype.
Object.prototype.toString.call(obj) === '[object Error]'; // True.
```

Alternatively, you can recreate the error object.

### Can I provide my own marshal/unmarshal function?

No, we do not support custom marshal/unmarshal function.

Alternatively, you can wrap `MessagePort` and add your own marshal and unmarshal functions. Make sure you implement both marshal and unmarshal functions on both sides of the port.

### Why should I use this implementation of RPC?

We are professional developers. Our philosophy makes this package easy to use.

- Standards: we use [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) and [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) as-is
- Airtight: we wrap everything in their own `MessagePort`, no multiplexing = no leaking
- Small scope: one `MessagePort` host one function only, more flexibility on building style
- Simple: you know how to write it
- Maintainability: we relies heavily on tooling and automation to maintain this package

## Contributions

Like us? [Star](https://github.com/compulim/message-port-rpc/stargazers) us.

Want to make it better? [File](https://github.com/compulim/message-port-rpc/issues) us an issue.

Don't like something you see? [Submit](https://github.com/compulim/message-port-rpc/pulls) a pull request.
