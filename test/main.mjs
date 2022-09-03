import EventEmitter, {
  NewListenerName,
  RemoveListenerName,
  ErrorListenerName,
} from "../index.mjs";

const emitter = new EventEmitter({ captureRejections: true });

emitter.on(NewListenerName, (eventName, listener) => {
  console.log(NewListenerName, eventName, listener);
});

emitter.on(RemoveListenerName, (eventName, listener) => {
  console.log(RemoveListenerName, eventName, listener);
});

emitter.on(ErrorListenerName, (error) => {
  console.log(ErrorListenerName, error.message);
});

emitter[EventEmitter.captureRejectionSymbol] = (error) => {
  console.error(EventEmitter.captureRejectionSymbol, error.message);
};

emitter.on("event-1", (...args) => console.log("event-1a", ...args));
emitter.on("event-1", async (...args) => console.log("event-1b", ...args));
emitter.once("event-1", async (...args) => console.log("event-1c", ...args));
emitter.prependListener("event-1", (...args) =>
  console.log("event-1d", ...args)
);
emitter.prependOnceListener("event-1", async (...args) =>
  console.log("event-1f", ...args)
);

const event2Listener = (...args) => console.log("event-2", ...args);
const event3Listener = (...args) => console.log("event-3", ...args);

emitter.on("event-2", event2Listener);
emitter.on("event-3", event3Listener);
emitter.once("event-3", event3Listener);

emitter.on("event-error", async () => {
  throw new Error("event-error");
});

emitter.emit("event-1", 1);

console.log(emitter.listeners("event-1"));
console.log(emitter.listenerCount("event-1"));
console.log(emitter.rawListeners("event-1"));

console.log(emitter.removeListener("event-2"));

emitter.emit("event-2", 2);
emitter.emit("event-3", 3);
emitter.emit("event-3", 4);

// emitter.emit("event-error");

console.log(emitter.eventNames());
console.log(emitter.removeAllListeners("event-error"));
console.log(emitter.eventNames());
console.log(emitter.removeAllListeners());
console.log(emitter.eventNames());
