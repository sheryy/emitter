export const isSymbol = (value) => typeof value === "symbol";
export const isFunction = (value) => value instanceof Function;
export const isString = (value) => {
  return typeof value === "string" || value instanceof String;
};

export const RejectionSymbolName = "rejection";
export const ErrorListenerEventName = "error";
export const NewListenerEventName = "newListener";
export const RemoveListenerEventName = "removeListener";

/**
 * A NodeJS like environment agnostic EventEmitter.
 * For detailed documentation refer: https://nodejs.org/api/events.html
 */
export default class EventEmitter {
  /**
   * Setting EventEmitter.captureRejections will change the default for all new instances of EventEmitter.
   */
  static captureRejections = false;

  /**
   * Setting EventEmitter.captureRejectionSymbol will change the default for all new instances of EventEmitter.
   */
  static captureRejectionSymbol = Symbol.for(RejectionSymbolName);

  /**
   * Setting EventEmitter.defaultMaxListeners will change the default for all new instances of EventEmitter.
   */
  static defaultMaxListeners = 10;

  #map;
  #warnings;
  #maxListeners;
  #captureRejections;
  #captureRejectionSymbol;

  /**
   * @param {object} [options]
   * @param {number} [options.maxListeners] - If Infinity, EventEmitter won't put any limit on the number of listeners per event, otherwise gives warning on limit exceed.
   * @param {boolean} [options.captureRejections] - If true, EventEmitter will capture rejection of async listeners.
   * @param {Symbol} [options.captureRejectionSymbol] - A Symbol of event name for emitting async listener rejections.
   */
  constructor({
    maxListeners = EventEmitter.defaultMaxListeners,
    captureRejections = EventEmitter.captureRejections,
    captureRejectionSymbol = EventEmitter.captureRejectionSymbol,
  } = {}) {
    this.#map = {};
    this.#warnings = {};
    this.#maxListeners = maxListeners;
    this.#captureRejections = captureRejections;
    this.#captureRejectionSymbol = captureRejectionSymbol;
  }

  #assertEventName(eventName, nullable = false) {
    if (nullable && eventName === null) return;
    if (!isString(eventName) && !isSymbol(eventName)) {
      throw new TypeError(
        `The "eventName" argument must be of type string. Received type ${typeof eventName} (${eventName})`
      );
    }
  }

  #assertListener(listener, nullable = false) {
    if (nullable && listener === null) return;
    if (listener && !isFunction(listener)) {
      throw new TypeError(
        `The "listener" argument must be of type function. Received type ${typeof listener} (${listener})`
      );
    }
  }

  #assertMaxListener(maxListener) {
    if (
      maxListener === Number.POSITIVE_INFINITY ||
      (Number.isInteger(maxListener) && maxListener >= 0)
    ) {
      return;
    }
    throw new TypeError("Max listener must be a positive number or Infinity");
  }

  #events(eventName = null) {
    if (eventName) {
      return this.#map[eventName] != undefined ? [eventName] : [];
    }
    return Object.keys(this.#map);
  }

  #listeners(eventName) {
    return this.#map[eventName] ?? [];
  }

  #addListener({ eventName, listener, once = false, prepend = false } = {}) {
    this.#assertEventName(eventName);
    this.#assertListener(listener);
    this.emit(NewListenerEventName, eventName, listener);

    let handler;
    let onceWrapper;
    const listeners = this.#map[eventName] || (this.#map[eventName] = []);

    if (once) {
      onceWrapper = (...args) => {
        this.off(eventName, onceWrapper);
        return listener(...args);
      };
      onceWrapper.listener = listener;
    }

    handler = onceWrapper ?? listener;

    if (prepend) {
      listeners.unshift(handler);
    } else {
      listeners.push(handler);
    }

    if (
      this.#maxListeners != Infinity &&
      this.#maxListeners != 0 &&
      listeners.length > this.#maxListeners &&
      this.#warnings[eventName] != true
    ) {
      this.#warnings[eventName] = true;
      const warning = `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${eventName} listeners added to [EventEmitter]. Use emitter.setMaxListeners() to increase limit`;
      Promise.resolve().then(() => console.warn(warning));
    }

    return this;
  }

  #removeListener({ eventName = null, listener = null } = {}) {
    this.#assertEventName(eventName, true);
    this.#assertListener(listener, true);
    for (const event of this.#events(eventName)) {
      const listeners = this.#listeners(event);
      if (listener == null) {
        while (listeners.length) {
          const handler = listeners.shift();
          this.emit(
            RemoveListenerEventName,
            event,
            handler.listener ?? handler
          );
        }
      } else {
        for (let index = 0; index < listeners.length; index++) {
          const handler = listeners[index];
          if (handler == listener || handler.listener == listener) {
            listeners.splice(index, 1);
            this.emit(
              RemoveListenerEventName,
              event,
              handler.listener ?? handler
            );
            break;
          }
        }
      }
      if (listeners.length == 0) delete this.#map[event];
      if (listeners.length < this.#maxListeners) delete this.#warnings[event];
    }
    return this;
  }

  #emit(eventName, args, capturePromises) {
    const promises = [];
    const listeners = [...this.#listeners(eventName)];
    for (let index = 0; index < listeners.length; index++) {
      const promise = listeners[index](...args);
      if (capturePromises && promise instanceof Promise) {
        promises.push(promise);
      }
    }
    return { promises, listeners };
  }

  #routeRejections(promises) {
    const rejectionMethod = this[this.#captureRejectionSymbol];
    for (let index = 0; index < promises.length; index++) {
      promises[index].then(undefined, (error) => {
        if (rejectionMethod) {
          rejectionMethod(error);
        } else {
          const { listeners } = this.#emit(
            ErrorListenerEventName,
            [error],
            false
          );
          if (listeners.length == 0) {
            throw error;
          }
        }
      });
    }
  }

  /**
   * Returns an array listing the events for which the emitter has registered listeners. The values in the
   * array are strings or Symbols.
   * @returns {Array}
   */
  eventNames() {
    return this.#events();
  }

  /**
   * Returns a copy of the array of listeners for the event named eventName.
   * @param {String|Symbol} eventName - The name of the event.
   * @returns {Function[]}
   */
  listeners(eventName) {
    this.#assertEventName(eventName);
    return this.#listeners(eventName).map((func) => func.listener ?? func);
  }

  /**
   * Returns the number of listeners listening to the event named eventName.
   * @param {String} eventName - The name of the event.
   * @returns {number}
   */
  listenerCount(eventName) {
    this.#assertEventName(eventName);
    return this.#listeners(eventName).length;
  }

  /**
   * Returns a copy of the array of listeners for the event named eventName, including any wrappers (such as those created by .once()).
   * @param {String|Symbol} eventName - The name of the event.
   * @returns {Function[]}
   */
  rawListeners(eventName) {
    this.#assertEventName(eventName);
    return this.#listeners(eventName).map((func) => func);
  }

  /**
   * Returns the current max listener value for the EventEmitter which is either set by emitter.setMaxListeners(n) or defaults to EventEmitter.defaultMaxListeners.
   * @returns {number}
   */
  getMaxListeners() {
    return this.#maxListeners;
  }

  /**
   * By default EventEmitters will print a warning if more than 10 listeners are added for a particular event. 
   * This is a useful default that helps finding memory leaks. The emitter.setMaxListeners() method allows the 
   * limit to be modified for this specific EventEmitter instance. The value can be set to Infinity (or 0) to 
   * indicate an unlimited number of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {number} maxListener - The number of listeners per event 
   * @returns {EventEmitter} 
   */
  setMaxListeners(maxListener) {
    this.#assertMaxListener(maxListener);
    if (maxListener > this.#maxListeners) {
      this.#warnings = {};
    }
    this.#maxListeners = maxListener;
    return this;
  }

  /**
   * Synchronously calls each of the listeners registered for the event named eventName, in the order they were 
   * registered, passing the supplied arguments to each.
   * Routes the rejection from asynchronous callbacks to the captureRejectionSymbol method, or to 'error' event 
   * handler if there is none, or throws exception if neither exists.
   * Returns true if the event had listeners, otherwise false.
   * @param {String|Symbol} eventName - The name of the event.
   * @param  {...any} args - The arguments for the callback functions.
   * @returns {boolean}
   * @throws {any}
   */
  emit(eventName, ...args) {
    this.#assertEventName(eventName);
    const { promises, listeners } = this.#emit(
      eventName,
      args,
      this.#captureRejections
    );
    if (promises.length > 0) this.#routeRejections(promises);
    return listeners.length > 0;
  }

  /**
   * Adds the listener function to the end of the listeners array for the event named eventName.
   * No checks are made to see if the listener has already been added. Multiple calls passing the same
   * combination of eventName and listener will result in the listener being added, and called, multiple times.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  on(eventName, listener) {
    return this.#addListener({ eventName, listener });
  }

  /**
   * Adds the listener function to the end of the listeners array for the event named eventName.
   * No checks are made to see if the listener has already been added. Multiple calls passing the same
   * combination of eventName and listener will result in the listener being added, and called, multiple times.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @alias emitter.on(eventName, listener)
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  addListener(eventName, listener) {
    return this.#addListener({ eventName, listener });
  }

  /**
   * Adds a one-time listener function for the event named eventName. The next time eventName is triggered, this
   * listener is removed and then invoked.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  once(eventName, listener) {
    return this.#addListener({ eventName, listener, once: true });
  }

  /**
   * Adds the listener function to the beginning of the listeners array for the event named eventName.
   * No checks are made to see if the listener has already been added. Multiple calls passing the same
   * combination of eventName and listener will result in the listener being added, and called, multiple times.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  prependListener(eventName, listener) {
    return this.#addListener({ eventName, listener, prepend: true });
  }

  /**
   * Adds a one-time listener function for the event named eventName to the beginning of the listeners array.
   * The next time eventName is triggered, this listener is removed, and then invoked.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  prependOnceListener(eventName, listener) {
    return this.#addListener({
      eventName,
      listener,
      once: true,
      prepend: true,
    });
  }

  /**
   * Removes the specified listener from the listener array for the event named eventName. off() will remove,
   * at most, one instance of a listener from the listener array. If any single listener has been added
   * multiple times to the listener array for the specified eventName, then off() must be called multiple
   * times to remove each instance.
   * The 'removeListener' event is emitted after the listener is removed.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  off(eventName, listener) {
    return this.#removeListener({ eventName, listener });
  }

  /**
   * Removes the specified listener from the listener array for the event named eventName. off() will remove,
   * at most, one instance of a listener from the listener array. If any single listener has been added
   * multiple times to the listener array for the specified eventName, then off() must be called multiple
   * times to remove each instance.
   * The 'removeListener' event is emitted after the listener is removed.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @alias emitter.off(eventName, listener)
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  removeListener(eventName, listener) {
    return this.#removeListener({ eventName, listener });
  }

  /**
   * Removes all listeners, or those of the specified eventName.
   * The 'removeListener' event is emitted after the listeners are removed.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} [eventName] - The name of the event.
   * @returns {EventEmitter}
   */
  removeAllListeners(eventName = null) {
    let hasRemoveListener = false;
    for (const event of this.#events(eventName)) {
      if (event == RemoveListenerEventName) {
        hasRemoveListener = true;
        continue;
      }
      this.#removeListener({ eventName: event });
    }
    if (hasRemoveListener) {
      this.#removeListener({ eventName: RemoveListenerEventName });
    }
    return this;
  }
}
