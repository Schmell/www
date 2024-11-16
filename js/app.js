const APP = {
    SW: null,
    DB: null, 
    init() {
      APP.registerSW();
      APP.openDB();
    },

    registerSW() {
      if ('serviceWorker' in navigator) {
        // Register a service worker hosted at the root of the site
        navigator.serviceWorker.register('/www/sw.js').then(
          (registration) => {
            APP.SW = registration.installing ||  registration.waiting || registration.active;
          },
          (error) => {
            console.log('Service worker registration failed:', error);
          }
        );
        //listen for the latest sw
        navigator.serviceWorker.addEventListener('controllerchange', async () => {
          APP.SW = navigator.serviceWorker.controller;
        });
        //listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', APP.onMessage);
      } else {
        console.log('Service workers are not supported.');
      }
    },



    sendMessage(msg) {
      //send some structured-cloneable data from the webpage to the sw
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(msg);
      }
    },

    onMessage({ data }) {
      //got a message from the service worker
      console.log('Web page receiving', data);
      //TODO: check for savedPerson and build the list and clear the form
      // if ('savedPerson' in data) {
      //   APP.showPeople();
      //   document.getElementById('name').value = '';
      // }
    },
    
    openDB() {
      let req = indexedDB.open('colorDB');
      req.onsuccess = (ev) => {
        APP.DB = ev.target.result;
        // APP.showPeople();
      };
      req.onerror = (err) => {
        console.warn(err);
        //NOT calling showPeople()
      };
    },
  };
  
  document.addEventListener('DOMContentLoaded', APP.init);
  //export default APP;