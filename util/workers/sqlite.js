// License: GPL3.0 or later
let poolUtil = null;
let db = null;
let dbName = '';
let statement = null;
self.onmessage = async ({ data }) => {
    // A worker message contains a unique number ID, the action to perform and a parameter
    const [ id, action, parameter ] = data;
    switch (action) {
        case "list":
            try {
                const { default: sqlite3InitModule } = await import("https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.49.0-build3/sqlite-wasm/jswasm/sqlite3.mjs");
                if (poolUtil === null) {
                    const sqlite3 = await sqlite3InitModule({
                        print: console.log,
                        printErr: (...err) => self.postMessage([id, -1, `SQLite error(s): ${err.join(" ")}`]),
                    });
                    if (!(sqlite3 instanceof Object)) {
                        self.postMessage([id, -1, "failed to load sqlite module"]);
                        return;
                    }
                    if (!(sqlite3.installOpfsSAHPoolVfs instanceof Function)) {
                        self.postMessage([id, -1, "sqlite module has been loaded, but the required method to access the virtual file system is not present or is corrupt"]);
                        return;
                    };
                    poolUtil = await sqlite3.installOpfsSAHPoolVfs({
                        directory: parameter,
                    });
                    if (!(poolUtil instanceof Object)) {
                        self.postMessage([id, -1, "failed to load virtual file system"]);
                        return;
                    }
                }
                console.log("listing all files");
                self.postMessage([id, 0, poolUtil.getFileNames()]);
            } catch (err) {
                self.postMessage([id, -1, err]);
            }
            return;
        case "download":
            if (poolUtil === null) {
                self.postMessage([id, -1, "attempted to download database file while sqlite has not been initialized"]);
                return;
            }
            try {
                console.log("downloading file", parameter);
                self.postMessage([id, 0, poolUtil.importDb(...parameter)]);
            } catch (err) {
                self.postMessage([id, -1, err]);
            }
            return;
        case "open":
            if (poolUtil === null) {
                self.postMessage([id, -1, "attempted to open database file while sqlite has not been initialized"]);
                return;
            }
            if (dbName === parameter) {
                self.postMessage([id, 0, ""]);
                return;
            }
            try {
                console.log("available files", poolUtil.getFileNames());
                console.log("opening file", parameter);
                db = new poolUtil.OpfsSAHPoolDb(parameter);
                dbName = parameter;
                console.log("opened file", parameter, id);
                self.postMessage([id, 0, ""]);
            } catch (err) {
                self.postMessage([id, -1, err]);
            }
            return;
        case "prepare":
            if (db === null) {
                self.postMessage([id, -1, "attempted to prepare a statement while no database file has been loaded"]);
                return;
            }
            try {
                console.log("preparing statement", parameter);
                statement = db.prepare(parameter);
                self.postMessage([id, 0, ""]);
            } catch (err) {
                self.postMessage([id, -1, err]);
            }
            return;
        case "query":
            if (statement === null) {
                self.postMessage([id, -1, "attempted to query the database while no statement has been prepared"]);
                return;
            }
            try {
                console.log("querying db", parameter);
                let results = [];
                statement.bind(parameter);
                while (statement.step()) results.push(statement.get({}));
                console.log(results);
                statement.finalize();
                self.postMessage([id, 0, results]);
            } catch (err) {
                self.postMessage([id, -1, err]);
            }
            return;
    }
};