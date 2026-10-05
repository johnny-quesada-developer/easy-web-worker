import { createStaticEasyWebWorker } from 'easy-web-worker/createStaticEasyWebWorker';

// the callback handles the messages sent with send()
const { onMessage } = createStaticEasyWebWorker<number, number>((message) => {
  message.resolve(message.payload * 2);
});

// named handlers are reached with sendToMethod()
onMessage<string, string>('uppercase', (message) => {
  message.resolve(message.payload.toUpperCase());
});
