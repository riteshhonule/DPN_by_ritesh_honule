/**
 * eventsWatcher.js
 * Small helper to manage event listeners and re-subscribe after disconnects.
 */

module.exports = function (contract, eventName, handler) {
    let attached = false;

    function start() {
        if (attached) return;
        contract.on(eventName, handler);
        attached = true;
        console.log(`Watching ${eventName} on ${contract.address}`);
    }

    function stop() {
        if (!attached) return;
        contract.removeAllListeners(eventName);
        attached = false;
    }

    return { start, stop };
};
