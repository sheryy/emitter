/**
 * A NodeJS like environment agnostic EventEmitter.
 * For detailed documentation refer: https://nodejs.org/api/events.html
 */
export default class EventEmitter {
    /**
     * Setting EventEmitter.captureRejections = true will change the default for all new instances of EventEmitter.
     */
    static captureRejections: boolean;
    /**
     * Setting EventEmitter.captureRejectionSymbol = Symbol.for("new-value") will change the default for all new instances of EventEmitter.
     */
    static captureRejectionSymbol: symbol;
    /**
     *
     * @param {object} [options]
     * @param {boolean} [options.captureRejections=EventEmitter.captureRejections] - If true, EventEmitter will capture rejection of async listeners.
     * @param {Symbol} [options.captureRejectionSymbol=EventEmitter.captureRejectionSymbol] - An Symbol of event name for emitting async listener rejections.
     */
    constructor({ captureRejections, captureRejectionSymbol, }?: {
        captureRejections?: boolean;
        captureRejectionSymbol?: Symbol;
    });
    /**
     * Returns an array listing the events for which the emitter has registered listeners. The values in the array are strings or Symbols.
     * @returns {Array}
     */
    eventNames(): any[];
    /**
     * Returns a copy of the array of listeners for the event named eventName.
     * @param {String|Symbol} eventName - The name of the event.
     * @returns {Function[]}
     */
    listeners(eventName: string | Symbol): Function[];
    /**
     * Returns the number of listeners listening to the event named eventName.
     * @param {String} eventName - The name of the event.
     * @returns {number}
     */
    listenerCount(eventName: string): number;
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
    emit(eventName: string | Symbol, ...args: any[]): boolean;
    /**
     * Adds the listener function to the end of the listeners array for the event named eventName. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
     * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @param {String|Symbol} eventName - The name of the event.
     * @param {Function} listener - The callback function.
     * @returns {EventEmitter}
     */
    on(eventName: string | Symbol, listener: Function): EventEmitter;
    /**
     * Adds the listener function to the end of the listeners array for the event named eventName. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
     * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @alias emitter.on(eventName, listener)
     * @param {String|Symbol} eventName - The name of the event.
     * @param {Function} listener - The callback function.
     * @returns {EventEmitter}
     */
    addListener(eventName: string | Symbol, listener: Function): EventEmitter;
    /**
     * Adds a one-time listener function for the event named eventName. The next time eventName is triggered, this listener is removed and then invoked.
     * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @param {String|Symbol} eventName - The name of the event.
     * @param {Function} listener - The callback function.
     * @returns {EventEmitter}
     */
    once(eventName: string | Symbol, listener: Function): EventEmitter;
    /**
     * Adds the listener function to the beginning of the listeners array for the event named eventName. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
     * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @param {String|Symbol} eventName - The name of the event.
     * @param {Function} listener - The callback function.
     * @returns {EventEmitter}
     */
    prependListener(eventName: string | Symbol, listener: Function): EventEmitter;
    /**
     * Adds a one-time listener function for the event named eventName to the beginning of the listeners array. The next time eventName is triggered, this listener is removed, and then invoked.
     * The 'newListener' event is emitted before a listener is added to the internal array of listeners.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @param {String|Symbol} eventName - The name of the event.
     * @param {Function} listener - The callback function.
     * @returns {EventEmitter}
     */
    prependOnceListener(eventName: string | Symbol, listener: Function): EventEmitter;
    /**
     * Removes the specified listener from the listener array for the event named eventName. off() will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified eventName, then off() must be called multiple times to remove each instance.
     * The 'removeListener' event is emitted after the listener is removed.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @param {String|Symbol} eventName - The name of the event.
     * @param {Function} listener - The callback function.
     * @returns {EventEmitter}
     */
    off(eventName: string | Symbol, listener: Function): EventEmitter;
    /**
     * Removes the specified listener from the listener array for the event named eventName. removeListener() will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified eventName, then removeListener() must be called multiple times to remove each instance.
     * The 'removeListener' event is emitted after the listener is removed.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @alias emitter.off(eventName, listener)
     * @param {String|Symbol} eventName - The name of the event.
     * @param {Function} listener - The callback function.
     * @returns {EventEmitter}
     */
    removeListener(eventName: string | Symbol, listener: Function): EventEmitter;
    /**
     * Removes all listeners, or those of the specified eventName.
     * The 'removeListener' event is emitted after the listeners are removed.
     * Returns a reference to the EventEmitter, so that calls can be chained.
     * @param {String|Symbol} [eventName] - The name of the event.
     * @returns {EventEmitter}
     */
    removeAllListeners(eventName?: string | Symbol): EventEmitter;
    #private;
}
//# sourceMappingURL=index.d.mts.map