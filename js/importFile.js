const Csv = {
  // Might not need to use this namespace moving forward

  // Use file from file input button
  fromInput: (e) => {
    // Accepts file input and puts it in local storage
    // Also this adds some versioning info in localstorage
    let file;
    let fileName;
    let url;
    if (e.target.files) {
      file = e.target.files[0];
    } else {
      url = e.target.urlSelect.value;
      fileName = url.substr(url.lastIndexOf("/") + 1);
      // Keep this log
      console.log("target file: ", url);
      e.preventDefault();
      // Return some file info
      file = {
        name: fileName,
        url: url,
      };
    }

    // Organize localstorage so we can tell if file is current
    let last = JSON.parse(localStorage.getItem("using"));
    if (!last) {
      // Keep ths log
      console.log("no last");
      last = {};
      last.name = "nofile";
      last.lastModified = Date.now();
    }

    if (
      file.name != last.name ||
      (file.lastModified != last.lastModified && last)
    ) {
      // Keep this warning
      console.warn("File has been changed, using new file");
      // Back up old file and remove current so we can store new file
      const oldFile = localStorage.getItem("currentFile");
      const notUsing = localStorage.getItem("using");
      localStorage.setItem("oldFile", oldFile);
      localStorage.setItem("notUsing", notUsing);
      localStorage.removeItem("currentFile");
      localStorage.removeItem("using");

      // If there is url then it is fromUrl file
      if (file.url) {
        file = file.url;
      }
      Papa.parse(file, {
        download: true, // This is for fromUrl
        complete: (results) => {
          const unParsed = Papa.unparse(results.data, {
            quotes: true,
            quoteChar: '"',
          });

          // Cant seem to figure out how to get File info
          // so just make so me dummy stuff
          if (!file.name) {
            file = {
              name: fileName,
              url: url,
              lastModified: "?",
              lastModifiedDate: "?",
              size: "?",
            };
          }

          const fileArr = {
            name: file.name,
            lastModified: file.lastModified,
            lastModifiedDate: file.lastModifiedDate,
            size: file.size,
          };
          localStorage.setItem("using", JSON.stringify(fileArr));
          localStorage.setItem("currentFile", unParsed);
        },
      });
    } else {
      // Keep this log
      console.log("File not changed, using file from storage");
      console.log("using:", JSON.parse(localStorage.getItem("using")));
    }
  }, // fromInput

  fromUrl: (e) => {
    // NOT USED
    // This is implemented in fromInput,
    // but probably makes more sense to move it here
    const url = document.querySelector("#urlSelect").value;
  },

  backUpCurrent: () => {
    // NOT WORKING
    const file = localStorage.getItem("currentFile");
    console.log("file: ", file);
    const myBlob = URL.createObjectURL(new Blob([file]));
    console.log("myBlob: ", myBlob);
    return myBlob;
  },

  downloadURL: (url, name) => {
    // NOT USED
    const link = document.createElement("a");
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
  },

  downloadFile: (localStoreFile) => {
    // NOT USED
    const data = localStorage.getItem("savedFile");
    const blob = new Blob([data], { type: "text/txt" });
    const url = window.URL.createObjectURL(blob);
    const using = JSON.parse(localStorage.getItem("using"));
    // console.log(using)
    downloadURL(url, using.name);
  },

  /*
   * All the getters
   */

  getCurrentFile: () => {
    // Util to get localStorage the file we are using
    const file = localStorage.getItem("currentFile");
    const parsed = Papa.parse(file);
    const data = parsed.data;
    return data;
  },

  getComps: () => {
    // Get comps
    const data = Csv.getCurrentFile();

    let compData = [];
    // Filter for property to create index
    // comptotal is always first in .blw
    const compBoats = data.filter((item) => {
      return item[0] == "comptotal";
    });

    compBoats.sort().forEach((compBoat) => {
      let competitor = {};
      // Create id's
      competitor.id = +compBoat[2]; // Int
      competitor.compid = compBoat[2];
      // Filter using prefix and compid
      const compRows = data.filter((item) => {
        const regex = new RegExp(`^comp`, "g");
        return item[0].match(regex) && item[2] == compBoat[2];
      });
      // Remove prefix and add property
      compRows.forEach((item) => {
        const newName = item[0].replace("comp", "");
        competitor[newName] = item[1];
      });

      compData.push(competitor);
    }); //each compBoats

    compData.sort((a, b) => {
      return a.boat - b.boat;
    });

    return compData;
  }, // getComps

  getResults: () => {
    // Get results
    const data = Csv.getCurrentFile();

    let resultsArr = [];
    // Filter for property to create index
    // rdisc is always first in .blw
    const results = data.filter((item) => {
      return item[0] == "rdisc";
    });

    results.forEach((result) => {
      // Have to map this manually as there is no usable prefix
      const resultRow = {
        id: parseInt(result[3] + result[2]),
        compid: result[2],
        raceid: result[3],
        finish: Csv.resultHelp("rft", data, result),
        start: Csv.resultHelp("rst", data, result),
        points: Csv.resultHelp("rpts", data, result),
        position: Csv.resultHelp("rpos", data, result),
        discard: Csv.resultHelp("rdisc", data, result),
        corrected: Csv.resultHelp("rcor", data, result),
        rrestyp: Csv.resultHelp("rrestyp", data, result),
        elapsed: Csv.resultHelp("rele", data, result),
        srat: Csv.resultHelp("srat", data, result),
        rewin: Csv.resultHelp("rewin", data, result),
        rrwin: Csv.resultHelp("rrwin", data, result),
        rrset: Csv.resultHelp("rrset", data, result),
      };

      resultsArr.push(resultRow);
    }); // forEach

    return resultsArr;
  }, // getResults

  resultHelp: (resultTag, data, result) => {
    // Util for mapping result items
    const res = data.filter((item) => {
      return (
        item[0] == resultTag && item[2] == result[2] && item[3] == result[3]
      );
    });
    if (res[0]) {
      return res[0][1];
    }
  }, // resultsHelp

  getFleets: () => {
    // May not be needed
    // Fleets and starts are added to individual races
    const data = Csv.getCurrentFile();

    const fleetsRaw = data.filter((item) => {
      return item[0] == "serpubgroupvalues";
    });
    const fleets = fleetsRaw[0][1].match(/[^|]+/g);
    //console.log(fleets);
    return fleets;
  }, // getFleets

  getRaces: () => {
    // Get races from CSV
    const data = Csv.getCurrentFile();

    let raceData = [];
    // Filter for property to create index
    // racerank is always first in .blw
    const races = data.filter((item) => {
      return item[0] == "racerank";
    });
    races.forEach((race) => {
      //console.log('race',race)
      let raceObj = {};

      raceObj.id = +race[3]; // Int
      raceObj.raceid = race[3];
      // Search for 'race' prefix
      const resultRows = data.filter((item) => {
        const regex = new RegExp(`^race`, "g");
        return item[0].match(regex) && item[3] == race[3];
      });

      let raceStarts = [];

      resultRows.forEach((item) => {
        if (item[0] == "racestart") {
          // Get fleets and starts and add to array
          const stringToSplit = item[1].split("|");
          const fleetStart = stringToSplit[1];
          const fleetName = stringToSplit[0].split("^")[1];
          raceStarts.push({ fleet: fleetName, start: fleetStart });
        } else {
          // Remove prefix and add property
          const newName = item[0].replace("race", "");
          raceObj[newName] = item[1];
        }
      });

      // Add fleets and starts to race
      raceStarts.forEach((start) => {
        raceObj.starts = raceStarts;
      });

      raceData.push(raceObj);
    });

    return raceData;
  }, // getRaces

  getSeries: () => {
    // Get series
    const data = Csv.getCurrentFile();

    let seriesData = [];
    // Find props with prefix
    const seriesRows = data.filter((item) => {
      const regex = new RegExp(`^ser`, "g");
      return item[0].match(regex);
    });

    let seriesObj = {};
    // Remove prefix and add property
    seriesRows.forEach((item) => {
      const newName = item[0].replace("ser", "");
      seriesObj[newName] = item[1];
    });

    seriesData.push(seriesObj);
    return seriesData;
  }, // getSeries
}; // Csv namespace
