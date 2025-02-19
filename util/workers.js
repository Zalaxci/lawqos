// License: GPL3.0 or later
// This function allows you to create a worker, send messages to it and asynchronously receive the response safely,
// by sending a unique message ID before any data or parameters to ensure the message received matches (is the response to) the message posted

export function createAsyncWorker(src) {
    const worker = new Worker(src, { type: "module" });
    let messagesSent = 0;
    function cancelMsgReceiver(reason) {
        return;
    }
    return function(...msgData) {
        cancelMsgReceiver("a new request to the worker has been made, so it's impossible to receive the response from all previous ones");
        const messageId = messagesSent++;
        const responsePromise = new Promise((res, rej) => {
            worker.onmessage = ({ data }) => {
                const [ resultId, responseCode, responseData ] = data;
                if (resultId !== messageId) return;
                if (responseCode === 0) res(responseData);
                rej(responseData);
            }
        });
        worker.postMessage([messageId, ...msgData]);
        return responsePromise;
    }
}