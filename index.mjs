/**
 * A NodeJS like environment agnostic EventEmitter.
 * For detailed documentation refer: https://nodejs.org/api/events.html
 */
export default class EventEmitter {
  /**
   * Setting EventEmitter.captureRejections = true will change the default for all new instances of EventEmitter.
   */
  static captureRejections = false;

  /**
   * Setting EventEmitter.captureRejectionSymbol = Symbol.for("new-value") will change the default for all new instances of EventEmitter.
   */
  static captureRejectionSymbol = Symbol.for("rejection");

  #listeners = {};
  #captureRejections;
  #capturePromiseError;
  #captureRejectionSymbol;

  /**
   *
   * @param {object} [options]
   * @param {boolean} [options.captureRejections=EventEmitter.captureRejections] - If true, EventEmitter will capture rejection of async listeners.
   * @param {Symbol} [options.captureRejectionSymbol=EventEmitter.captureRejectionSymbol] - An Symbol of event name for emitting async listener rejections.
   */
  constructor({
    captureRejections = EventEmitter.captureRejections,
    captureRejectionSymbol = EventEmitter.captureRejectionSymbol,
  } = {}) {
    this.#captureRejections = captureRejections;
    this.#captureRejectionSymbol = captureRejectionSymbol;
    this.#capturePromiseError = (error) => this.#emitPromiseError(error);
  }

  /**
   * Returns an existing array of listeners or undefined for the event named eventName.
   * @param {String|Symbol} eventName - The name of the event.
   * @returns {Function[]|undefined}
   */
  #get(eventName) {
    return this.#listeners[eventName];
  }

  /**
   * Returns an existing or new array of listeners for the event named eventName.
   * @param {String|Symbol} eventName - The name of the event.
   * @returns {Function[]}
   */
  #getOrCreate(eventName) {
    let listeners = this.#listeners[eventName];
    if (listeners === undefined) {
      this.#listeners[eventName] = listeners = [];
    }
    return listeners;
  }

  /**
   * Returns a one-time listener function for the event named eventName. The next time eventName is triggered, this listener is removed and then invoked.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {Function}
   */
  #createOnceListener(eventName, listener) {
    const onceListener = (...args) => {
      this.off(eventName, onceListener);
      listener(...args);
    };
    return onceListener;
  }

  /**
   * Synchronously calls each of the listeners registered for the event named eventName, in the order they were registered, passing the supplied arguments to each.
   * Returns true if the event had listeners, false otherwise.
   * Routes the exception from synchronous callbacks to 'error' event handler or throws exception if there is none. 
   * Routes the rejection from asynchronous callbacks to the captureRejectionSymbol method if there is one, or to 'error' event handler if there is none or throws exception if neither exists. 
   * @param {String|Symbol} eventName - The name of the event.
   * @param  {...any} [args] - The arguments for the callback functions.
   * @returns {boolean}
   * @throws {any} 
   */
  #emitEvent(eventName, ...args) {
    const listeners = this.listeners(eventName);
    for (let index = 0; index < listeners.length; index++) {
      const promise = listeners[index](...args);
      if (this.#captureRejections && promise instanceof Promise) {
        promise.catch(this.#capturePromiseError);
      }
    }
    return listeners.length > 0;
  }

  /**
   * Routes the exception from synchronous callbacks to 'error' event handler or throws exception if there is none.
   * @param {any} error - The error to emit.
   * @returns {boolean}
   * @throws {any}
   */
  #emitError(error) {
    const hasListeners = this.#emitEvent("error", error);
    if (hasListeners) return true;
    throw error;
  }

  /**
   * Routes the rejection from asynchronous callbacks to the captureRejectionSymbol method if there is one, or to 'error' event handler if there is none or throws exception if neither exists. 
   * @param {any} error - The error to emit.
   * @throws {any}
   * @returns {undefined}
   */
  #emitPromiseError(error) {
    const rejectionListener = this[this.#captureRejectionSymbol];
    if (rejectionListener) {
      rejectionListener(error);
    } else {
      this.#emitError(error);
    }
  }

  /**
   * Returns an array listing the events for which the emitter has registered listeners. The values in the array are strings or Symbols.
   * @returns {Array}
   */
  eventNames() {
    return Object.keys(this.#listeners);
  }

  /**
   * Returns a copy of the array of listeners for the event named eventName.
   * @param {String|Symbol} eventName - The name of the event.
   * @returns {Function[]}
   */
  listeners(eventName) {
    const listeners = this.#get(eventName);
    return listeners ? [...listeners] : [];
  }

  /**
   * Returns the number of listeners listening to the event named eventName.
   * @param {String} eventName - The name of the event.
   * @returns {number}
   */
  listenerCount(eventName) {
    const listeners = this.#get(eventName);
    return listeners ? listeners.length : 0;
  }

  /**
   * Synchronously calls each of the listeners registered for the event named eventName, in the order they were registered, passing the supplied arguments to each.
   * Returns true if the event had listeners, false otherwise.
   * Routes the exception from synchronous callbacks to 'error' event handler or throws exception if there is none. 
   * Routes the rejection from asynchronous callbacks to the captureRejectionSymbol method if there is one, or to 'error' event handler if there is none or throws exception if neither exists. 
   * @param {String|Symbol} eventName - The name of the event.
   * @param  {...any} args - The arguments for the callback functions.
   * @returns {boolean}
   * @throws {any} 
   */
   emit(eventName, ...args) {
    try {
      return this.#emitEvent(eventName, ...args);
    } catch (error) {
      return this.#emitError(error);
    }
  }

  /**
   * Adds the listener function to the end of the listeners array for the event named eventName. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  on(eventName, listener) {
    this.emit("newListener", eventName, listener);
    this.#getOrCreate(eventName).push(listener);
    return this;
  }

  /**
   * Adds the listener function to the end of the listeners array for the event named eventName. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @alias emitter.on(eventName, listener)
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  addListener(eventName, listener) {
    return this.on(eventName, listener);
  }

  /**
   * Adds a one-time listener function for the event named eventName. The next time eventName is triggered, this listener is removed and then invoked.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  once(eventName, listener) {
    const onceListener = this.#createOnceListener(eventName, listener);
    return this.on(eventName, onceListener);
  }

  /**
   * Adds the listener function to the beginning of the listeners array for the event named eventName. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  prependListener(eventName, listener) {
    this.emit("newListener", eventName, listener);
    this.#getOrCreate(eventName).unshift(listener);
    return this;
  }

  /**
   * Adds a one-time listener function for the event named eventName to the beginning of the listeners array. The next time eventName is triggered, this listener is removed, and then invoked.
   * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  prependOnceListener(eventName, listener) {
    const onceListener = this.#createOnceListener(eventName, listener);
    return this.prependListener(eventName, onceListener);
  }

  /**
   * Removes the specified listener from the listener array for the event named eventName. off() will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified eventName, then off() must be called multiple times to remove each instance.
   * The 'removeListener' event is emitted after the listener is removed.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  off(eventName, listener) {
    const listeners = this.#get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        this.emit("removeListener", eventName, listener);
      }
      if (listeners.length == 0) delete this.#listeners[eventName];
    }
    return this;
  }

  /**
   * Removes the specified listener from the listener array for the event named eventName. removeListener() will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified eventName, then removeListener() must be called multiple times to remove each instance.
   * The 'removeListener' event is emitted after the listener is removed.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @alias emitter.off(eventName, listener)
   * @param {String|Symbol} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @returns {EventEmitter}
   */
  removeListener(eventName, listener) {
    return this.off(eventName, listener);
  }

  /**
   * Removes all listeners, or those of the specified eventName.
   * The 'removeListener' event is emitted after the listeners are removed.
   * Returns a reference to the EventEmitter, so that calls can be chained.
   * @param {String|Symbol} [eventName] - The name of the event.
   * @returns {EventEmitter}
   */
  removeAllListeners(eventName = null) {
    const eventNames = eventName ? [eventName] : this.eventNames();
    for (let eindex = 0; eindex < eventNames.length; eindex++) {
      const listeners = this.listeners(eventNames[eindex]);
      for (let lindex = 0; lindex < listeners.length; lindex++) {
        this.off(eventNames[eindex], listeners[lindex]);
      }
    }
    return this;
  }
}
