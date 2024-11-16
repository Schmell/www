// Document ready
// Set listeners
document.addEventListener("DOMContentLoaded", () => {
  // Move this to an init function
  addListeners();
  function addListeners() {
    document
      .querySelector("#finishBtn")
      .addEventListener("click", finishButton);
    document.querySelector("#startSetBtn").addEventListener("click", setStart);
    document.querySelector("#codeBtn").addEventListener("click", codeBtn);
    document
      .querySelector("#codeSelect select")
      .addEventListener("change", changeCode);
    document.querySelector("#save").addEventListener("click", saveResults);
    document.querySelector("#export").addEventListener("click", exportResults);
  }
}); // dom ready

function showClock() {
  var digital = new Date();
  var hours = digital.getHours();
  var minutes = digital.getMinutes();
  var seconds = digital.getSeconds();
  if (minutes <= 9) {
    minutes = "0" + minutes;
  }
  if (seconds <= 9) {
    seconds = "0" + seconds;
  }
  document.querySelector(
    "#clock"
  ).textContent = `${hours}:${minutes}:${seconds}`;
  setTimeout(showClock, 1000);
} // showClock
showClock();
