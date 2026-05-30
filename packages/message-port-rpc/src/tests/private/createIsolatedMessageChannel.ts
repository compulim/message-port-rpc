import { workthru } from 'workthru';

function createIsolatedMessagePort(port: MessagePort): MessagePort {
  const messageChannel = new MessageChannel();

  pipe(port, messageChannel.port1);

  return messageChannel.port2;
}

function pipe(port1: MessagePort, port2: MessagePort): void {
  for (const [x, y] of [[port1, port2] as const, [port2, port1]]) {
    x.addEventListener('message', ({ data, ports }) => {
      const map = new Map<MessagePort, MessagePort>();

      const getIsolatedPort = (port: MessagePort): MessagePort => {
        const nextValue = map.get(port);

        if (nextValue) {
          return nextValue;
        }

        const nextPort = createIsolatedMessagePort(port);

        map.set(port, nextPort);

        return nextPort;
      };

      const nextData = workthru(data, value => {
        if (!(value instanceof MessagePort)) {
          return value;
        }

        return getIsolatedPort(value);
      });

      const nextPorts = ports.map(getIsolatedPort);

      y.postMessage(nextData, nextPorts);
    });
  }
}

function createIsolatedMessageChannel() {
  const channel1 = new MessageChannel();
  const channel2 = new MessageChannel();

  pipe(channel1.port2, channel2.port2);

  return { port1: channel1.port1, port2: channel2.port1 };
}

export default createIsolatedMessageChannel;
