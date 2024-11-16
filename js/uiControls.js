async function finishButton() {
  const finish = new Date()
    .toTimeString()
    .replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
  const compPanel = document.querySelector(`[id="${cue[0]}"]`);

  // take comp out of selected cue and add to finished
  removeFromCue(cue[0], compPanel);
  compPanel.classList.remove("selected");
  compPanel.classList.add("finished");

  // put current time in dom
  compPanel.querySelector(".timeDisplay").textContent = finish;

  // Get current raceid / compid
  const raceid = raceSelected;
  const compid = compPanel.getAttribute("id");

  // Get the comp start
  const start = await getCompStart(compPanel, raceid);

  // Dom changes to be made
  compPanel.querySelector(".start").textContent = start;
  compPanel.querySelector(".date").textContent = start.date;

  // Make result object
  const currentResult = {
    id: parseInt(raceid + compid),
    compid,
    raceid,
    finish,
    start: start.start,
    date: start.date,
    rrestyp: "4", // race result type - 4 is for finishtime
  };

  // Write to idb
  updateResult(currentResult);
} // finishButton

async function codeBtn() {
  // Get current code selected
  const code = document.querySelector("#codeSelect select").value;

  // Get comp from cue
  const compPanel = this.closest("#main").querySelector(`[id="${cue[0]}"]`);

  // Get current raceid / compid
  const raceid = raceSelected;
  const compid = compPanel.getAttribute("id");

  // Get the comp start
  const start = await getCompStart(compPanel, raceid);

  // Dom changes to be made
  compPanel.querySelector(".timeDisplay").textContent = code;
  compPanel.classList.remove("selected");
  compPanel.removeAttribute("style");
  compPanel.classList.add("finished");
  compPanel.querySelector(".cueNo").textContent = "";
  compPanel.querySelector(".adj li").removeAttribute("style");
  compPanel.querySelectorAll(".button").forEach((item) => {
    item.removeEventListener("click", adjustButton);
  });
  cue.shift();
  formatRows();
  updateResult({ compid, raceid, code, start });
} // codeBtn

function changeCode() {
  document.querySelector("#codeLabel").textContent = this.value;
}

// I like this method I think there are more situations i can use it
function getCompStart(compPanel, raceId) {
  return new Promise((resolve, reject) => {
    let currentStart;
    const currentFleet = compPanel.querySelector(".fleet").textContent;
    const races = getStore("races");
    const race = races.get(parseInt(raceId));
    race.onsuccess = () => {
      const result = race.result;
      result.starts.forEach((item) => {
        if (currentFleet == item.fleet) {
          // Also return race date
          item.date = result.date;
          resolve(item);
        }
      });
    };
  }); // Promise
} // getCompStart

function updateResult(event) {
  // event can be code or finish
  const store = getStore("results").get(parseInt(event.raceid + event.compid));
  store.onsuccess = () => {
    const result = store.result;
    if (event.code) {
      event.elapsed = "";
      event.rrestyp = "3";
    }

    if (event.finish) {
      const elapsed = getElapsedTime(event.start, event.date, event.finish);
      event.elapsed = elapsed;
      event.code = "";
    }

    event.id = parseInt(event.raceid + event.compid);
    const merged = { ...result, ...event };

    const write = getStore("results", "readwrite").put(merged);
    updateFinishPane();
  };
} // updateResult

function getElapsedTime(start, date, finish) {
  // console.log('start: ', start);
  // When set-start is pressed it needs to chage the start time (per fleet) on the race
  // Set start will also need to determine what fleet its for or else the subsequent starts will be off
  const startTimeInput = document.getElementById("startTimeInput").value;
  console.info("startTimeInput: ", startTimeInput);
  const startDate = new Date(date + " " + startTimeInput);
  console.info("startDate: ", startDate);
  const finishDate = new Date(date + " " + finish);
  console.info("finishDate: ", finishDate);
  const elapsed = convertHMS((finishDate - startDate) / 1000);
  console.info("elapsed: ", elapsed);
  return elapsed;
}

function convertHMS(value) {
  // Maybe use Temporal here
  const sec = parseInt(value, 10);
  let hours = Math.floor(sec / 3600);
  let minutes = Math.floor((sec - hours * 3600) / 60);
  let seconds = sec - hours * 3600 - minutes * 60;
  // Add mising 0s
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return `${hours}:${minutes}:${seconds}`;
}

function removeFromCue(compId, compPanel) {
  compPanel.removeAttribute("style");
  compPanel.querySelector(".cueNo").textContent = "";
  compPanel.querySelectorAll(".adj li").forEach((adj) => {
    adj.removeAttribute("style");
  });
  for (var i = cue.length - 1; i >= 0; i--) {
    if (cue[i] === compId) {
      cue.splice(i, 1);
    }
  }
} // removeFromCue
