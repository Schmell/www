function saveResults() {
  // check for race sailed
  const sailed = document.getElementById("raceInfo").getAttribute("sailed");
  if (+sailed) {
    // I want to change the save button to update button when race is sailed
    console.log("race already marked sailed");
    return null;
  }

  // Mark race as sailed
  const races = getStore("races", "readwrite");
  const race = races.get(parseInt(raceSelected));
  race.onsuccess = (e) => {
    race.result.sailed = "1";
    races.put(race.result);
  };

  // Get currentFile from localstorage
  const file = localStorage.getItem("currentFile");
  const parsed = Papa.parse(file);
  const data = parsed.data;

  // Get results
  const store = getStore("results").index("raceid").getAll(raceSelected);
  store.onsuccess = () => {
    store.result.forEach((result) => {
      // Filter rdisc for index
      // Insert rele, rft, rst, rcod in to CSV
      const lineNum = data.findIndex((item, index, array) => {
        if (
          item[0] == "rdisc" &&
          item[2] == result.compid &&
          item[3] == raceSelected &&
          index
        ) {
          return index;
        }
      });

      if (lineNum) {
        // Set rrestyp to 4
        // I think this is result type? and 4 is for recording finish times
        data[lineNum + 1][1] = result.rrestyp; // Should set this value when setting result
        if (result.finish) {
          data.splice(lineNum, 0, [
            "rft",
            result.finish,
            result.compid,
            result.raceid,
          ]);
          data.splice(lineNum, 0, [
            "rst",
            result.start,
            result.compid,
            result.raceid,
          ]);
          data.splice(lineNum, 0, [
            // Might not matter if just finish times
            "rele",
            result.elapsed,
            result.compid,
            result.raceid,
          ]);
        } else {
          data.splice(lineNum, 0, [
            "rcod",
            result.code,
            result.compid,
            result.raceid,
          ]);
        }
      }
      let unparsed = Papa.unparse(data, {
        quotes: true,
        skipEmptyLines: true,
      });
      localStorage.setItem("savedFile", unparsed);
    });
    let saveButton = document.querySelector("#save");
    saveButton.removeEventListener("click", saveResults);
    saveButton.addEventListener("click", downloadFile);
    saveButton.textContent = "download";
  };
}

function downloadURL(url, name) {
  var link = document.createElement("a");
  link.download = name;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
}

function downloadFile() {
  var data = localStorage.getItem("savedFile");
  var blob = new Blob([data], { type: "text/txt" });
  var url = window.URL.createObjectURL(blob);
  var using = JSON.parse(localStorage.getItem("using"));
  downloadURL(url, using.name);
}

function downloadExport(data, raceName) {
  var blob = new Blob([data], { type: "text/txt" });
  var url = window.URL.createObjectURL(blob);
  downloadURL(url, raceName);
}

function exportResults() {
  // get raceId / name
  // const raceId = document.querySelector("#raceInfo").getAttribute("raceid");
  let raceName = document.querySelector("#raceInfo h3").textContent;
  const columns = [["RaceNo", "Boat", "Finish", "Code"]];
  const tx = db.transaction(["comps", "results"]);
  const results = tx.objectStore("results").index("raceid").openCursor();

  results.onsuccess = () => {
    const item = results.result;
    if (item) {
      const comps = tx.objectStore("comps").get(parseInt(item.value.compid));
      comps.onsuccess = () => {
        columns.push([
          raceName,
          comps.result.boat,
          item.value.finish ? item.value.finish : null,
          item.value.code ? item.value.code : null,
        ]);
        item.continue();
      };
    } else {
      const unparsed = Papa.unparse(columns, { quotes: true });
      raceName = raceName.replace(/\s/g, "");
      downloadExport(unparsed, raceName + ".result.csv");
    }
  };
}
