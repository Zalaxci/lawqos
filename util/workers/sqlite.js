// License: GPL3.0 or later
const MAX_SQLITE_RESULTS = 30;
let poolUtil, db, dbName = '';
onmessage = async ({ data }) => {
    // Message data contains a unique number ID (data[0]), the action to perform (data[1]) and optionally parameter(s) (data[2]: string or array)
    const id = data[0];
    try {
        switch (data[1]) {
            case "l": // List files
                if (!(poolUtil instanceof Object)) {
                    console.log("initializing sqlite");
                    const { default: sqlite3InitModule } = await import("https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.49.0-build3/sqlite-wasm/jswasm/sqlite3.mjs");
                    const sqlite3 = await sqlite3InitModule({
                        print: console.log,
                        printErr: (...err) => {
                            throw new Error(`when initializing sqlite: ${err.join(" ")}`);
                        },
                    });
                    if (!(sqlite3 instanceof Object))
                        throw new Error("failed to load sqlite module");
                    if (!(sqlite3.installOpfsSAHPoolVfs instanceof Function))
                        throw new Error("sqlite module has been loaded, but the required method to access the virtual file system is not present or is corrupt");
                    poolUtil = await sqlite3.installOpfsSAHPoolVfs({ directory: data[2] });
                    if (!(poolUtil instanceof Object))
                        throw new Error("failed to load virtual file system");
                }
                console.log("listing all files");
                postMessage([id, 0, poolUtil.getFileNames()]);
                return;
            case "s": // Save file
                if (!(poolUtil instanceof Object)) throw new Error("attempted to download database file while sqlite has not been initialized");
                console.log("downloaded file, saving to virtual filesystem: ", data[2]);
                postMessage([id, 0, poolUtil.importDb(...data[2])]);
                return;
            case "o": // Open database file
                if (!(poolUtil instanceof Object)) throw new Error("attempted to open database file while sqlite has not been initialized");
                if (dbName !== data[2]) {
                    console.log("opening file", data[2]);
                    db = new poolUtil.OpfsSAHPoolDb(data[2]);
                    dbName = data[2];
                }
                postMessage([id, 0]);
                return;
            case "q": // Query open database
                const [ queryString, ...boundArguments ] = data[2];
                const statement = db.prepare(queryString);
                console.log("querying db:", queryString, boundArguments);
                let results = [];
                statement.bind(boundArguments);
                for (let i = 0; i < MAX_SQLITE_RESULTS && statement.step(); i++)
                    results.push(statement.get({}));
                console.log("succesfully retrieved db results, finalizing statement: ", results);
                statement.finalize();
                postMessage([id, 0, results]);
                return;
            default:
                throw new Error("received none or invalid worker action: available actions are list, download, open & query");
        }
    } catch (err) {
        postMessage([id, -1, err]);
    }
};