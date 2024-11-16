// Globals
let db;
let dbPromise;
const dbVersion = 17;

function openDatabase(name) {
  if (!window.indexedDB) {
    console.log("Your browser doesn't support IndexedDB.");
  }

  dbPromise = indexedDB.open(name, 15);

  dbPromise.onupgradeneeded = function (e) {
    console.log("onupgradeneeded");
    db = e.target.result;

    if (!db.objectStoreNames.contains("races")) {
      const store = db.createObjectStore("races", { keyPath: "id" });
      store.createIndex("name", "name", { unique: false });
      store.createIndex("date", "date", { unique: false });
      store.createIndex("time", "time", { unique: false });
      store.createIndex("sailed", "sailed", { unique: false });
    }

    if (!db.objectStoreNames.contains("comps")) {
      const store = db.createObjectStore("comps", { keyPath: "id" });
      store.createIndex("id", "id", { unique: true });
      store.createIndex("compid", "compid", { unique: false });
      store.createIndex("boat", "boat", { unique: false });
      store.createIndex("fleet", "fleet", { unique: false });
      store.createIndex("helm", "helm", { unique: true });
    }

    if (!db.objectStoreNames.contains("fleets")) {
      const store = db.createObjectStore("fleets", { keyPath: "id" });
      store.createIndex("name", "name", { unique: false });
    }

    if (!db.objectStoreNames.contains("results")) {
      const store = db.createObjectStore("results", {
        keyPath: "id",
      });
      store.createIndex("raceid", "raceid", { unique: false });
      store.createIndex("compid", "compid", { unique: false });
      store.createIndex("start", "start", { unique: false });
      store.createIndex("elapsed", "elapsed", { unique: false });
      store.createIndex("finish", "finish", { unique: false });
    }
    if (!db.objectStoreNames.contains("series")) {
      const store = db.createObjectStore("series", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("using")) {
      const store = db.createObjectStore("using", { keyPath: "id" });
    }

    return db;
  }; // onupgradeneeded

  dbPromise.onerror = (e) => {
    console.error("Error", e.target.error);
  };
  dbPromise.onblocked = (e) => {
    console.error("onblocked", e.target.result);
  };
  dbPromise.onsuccess = (e) => {
    db = e.target.result;
    writeAllDB(db);
    return db;
  };
} // openDatabase

const dbw = openDatabase("store");

function writeCompsDB() {
  const comps = Csv.getComps();
  const compsData = getStore("comps", "readwrite");
  // console.log('comps: ',comps )
  comps.forEach((comp) => {
    compsData.add(comp);
  });
}

function writeFleetsDB() {
  const fleets = Csv.getFleets();
  const fleetData = getStore("fleets", "readwrite");
  // console.log('fleets: ',fleets )
  fleets.forEach((fleet, idx) => {
    // let add = { name: fleet, id: idx };
    fleetData.add({ name: fleet, id: idx });
  });
}

function writeRacesDB(db) {
  const races = Csv.getRaces();
  const racesData = getStore("races", "readwrite");
  // console.log("races: ", races);
  races.forEach((race) => {
    racesData.add(race);
  });
}

function writeResultsDB(db) {
  const results = Csv.getResults();
  const resultsData = getStore("results", "readwrite");
  // console.log("results: ", results);
  results.forEach((result) => {
    console.log("result: ", result);
    resultsData.add(result);
  });
}

function writeSeriesDB(db) {
  const series = Csv.getSeries();
  const seriesData = getStore("series", "readwrite");
  // console.log("series: ", series);
  series.forEach((ser) => {
    ser.id = 1;
    seriesData.put(ser);
  });
}

function writeUsingDB(db) {
  const using = localStorage.getItem("using");
  // console.log("using: ", using);
  const jsoned = JSON.parse(using);
  jsoned.id = 1;
  const store = getStore("using", "readwrite");
  store.add(jsoned);
}

function writeAllDB() {
  const using = JSON.parse(localStorage.getItem("using"));
  const store = getStore("using", "readwrite").get(1);
  store.onsuccess = (e) => {
    const dbv = e.target.result;
    if (dbv && using.lastModified === dbv.lastModified) {
      console.log("Same File - no update required");
      return;
    } else {
      console.log("File does not match DB, updating");
      // This will delete the db on refresh ???
      // Need to be able to clear the database before writing new data

      // var request = indexedDB.deleteDatabase("store");
      // request.onsucess = () => {
      //   db = openDatabase("store");
      // };
      writeCompsDB();
      writeRacesDB();
      writeFleetsDB();
      writeResultsDB();
      writeSeriesDB();
      writeUsingDB();
    } // else
  };
} // writeAllDB

function makeTX(storeName, mode) {
  const tx = db.transaction(storeName, mode);
  tx.onerror = (err) => {
    console.error("makeTX onerror", err.target);
  };
  return tx;
}

function getStore(storeName, mode) {
  if (mode == "undefined") {
    mode = "readwrite";
  }
  let tx = makeTX(storeName, mode).objectStore(storeName);
  tx.onerror = (err) => {
    console.error("getStore onerror", err.target);
  };

  return tx;
}

function getStoreAll(storeName, mode) {
  let store = getStore(storeName, mode).getAll();
  return store;
}
