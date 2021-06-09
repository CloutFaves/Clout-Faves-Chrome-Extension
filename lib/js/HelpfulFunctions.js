/* 
    No module required
    permissions : "storage","tabs","notifications"
*/
const helpfulFunctions = {
  Functions: {
    getElementsByCheck: (searchText, check, doc = document) => {
      var aTags = doc.querySelectorAll("*");
      var found = [];

      for (var i = 0; i < aTags.length; i++) {
        if (check(aTags[i], searchText)) {
          found.push(aTags[i]);
        }
      }
      return found;
    },
    splitNumberWithCommas: (x) => {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
      return x;
    },
    getElementByCheck: (searchText, check, doc = document) => {
      var aTags = doc.querySelectorAll("*");
      var found = [];

      for (var i = 0; i < aTags.length; i++) {
        if (check(aTags[i], searchText)) {
          found.push(aTags[i]);
        }
      }
      return found[0] != undefined ? found[0] : null;
    },
    sleep: (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms)),
    generateText: (length, num = false) => {
      var result = [];
      var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      if (num == true) {
        characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      }
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result.push(
          characters.charAt(Math.floor(Math.random() * charactersLength))
        );
      }
      return result.join("");
    },
  },
  Chorme: {
    Notifications: {
      create: (notificationId, data, callback = function () { }) => {
        // data = {
        //    type: "basic",
        //    title : "User Update",
        //    message: "Dear User XYZ U have recieved an update",
        //    iconUrl: "outsourcing.png"
        // }
        if (notificationId == null) {
          notificationId = helpfulFunctions.Functions.generateText(15);
        }
        if (Notification.permission === "granted") {
          chrome.notifications.create(notificationId, data, callback);
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(() => {
            if (Notification.permission === "granted") {
              chrome.notifications.create(notificationId, data, callback);
            } else {
              alert("We have no permission to notify you");
            }
          });
        }
      },
      clear: (notificationId, callback) => {
        if (notificationId == null || notificationId == undefined) {
          return;
        }
        chrome.notifications.clear(notificationId, callback);
      },
    },
    Storage: {
      clearSyncStorage: () => {
        return new Promise((resolve) => {
          chrome.storage.sync.clear(() => {
            console.log("Storage cleared");
            resolve();
          });
        });
      },
      removeFromSyncStorage: (keys) => {
        return new Promise((resolve) => {
          chrome.storage.sync.remove(keys, () => {
            console.log("Removing from storage:", keys);
            resolve();
          });
        });
      },
      saveToSyncStorage: (data) => {
        return new Promise((resolve) => {
          chrome.storage.sync.set(data, () => {
            console.log("Storage is updated:", data);
            resolve(data);
          });
        });
      },
      readFromSyncStorage: (keys) => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(keys, (result) => {
            console.log("Reading storage:", result);
            resolve(result);
          });
        });
      },
      clearLocalStorage: () => {
        return new Promise((resolve) => {
          chrome.storage.local.clear(() => {
            console.log("Storage cleared");
            resolve();
          });
        });
      },
      removeFromLocalStorage: (keys) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove(keys, () => {
            console.log("Removing from storage:", keys);
            resolve();
          });
        });
      },
      saveToLocalStorage: (data) => {
        return new Promise((resolve) => {
          chrome.storage.local.set(data, () => {
            console.log("Storage is updated:", data);
            resolve(data);
          });
        });
      },
      readFromLocalStorage: (keys) => {
        return new Promise((resolve) => {
          chrome.storage.local.get(keys, (result) => {
            console.log("Reading storage:", result);
            resolve(result);
          });
        });
      },
    },
    Badge: {
      getText: function () {
        return new Promise((resolve, reject) => {
          chrome.browserAction.getBadgeText({}, function (result) {
            resolve(result);
          });
        });
      },
      setText: function (text) {
        return new Promise((resolve, reject) => {
          chrome.browserAction.setBadgeText({ text: text }, function () {
            resolve(text);
          });
        });
      },
      setColor: function (color) {
        return new Promise((resolve, reject) => {
          chrome.browserAction.setBadgeBackgroundColor(
            { color },
            async function () {
              helpfulFunctions.Chorme.Badge.getText().then((result) => {
                resolve(result);
              });
            }
          );
        });
      },
    },
    Tabs: {
      withCurrentTab: () => {
        return new Promise((resolve) =>
          chrome.tabs.getSelected(null, (tab) => resolve(tab))
        );
      },
    },
    ContentScript: {
      sendContentScript: (msg, callback) => {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
              callback(response);
            });
          }
        );
      },
      listenContentScript: (check, callback) => {
        chrome.runtime.onMessage.addListener(function (
          request,
          sender,
          sendResponse
        ) {
          if (check(request)) {
            callback(request, sendResponse);
          }
          return true;
        });
      },
    },
    Background: {
      listenBackground: (check, callback) => {
        chrome.runtime.onMessage.addListener(function (
          request,
          sender,
          sendResponse
        ) {
          if (check(request)) {
            callback(request, sendResponse);
          }
          return true;
        });
      },
      sendBackground: (msg, callback) => {
        chrome.runtime.sendMessage(msg, (response) => {
          callback(response);
        });
      },
    },
    Messages: {
      postRuntimeMessage: (name, message, responseHandler) => {
        return new Promise((resolve, reject) => {
          let port = chrome.runtime.connect({ name: name });
          port.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
              try {
                reject(chrome.runtime.lastError.message);
              } catch (e) {
                reject("Error handling runtime error: " + JSON.stringify(e));
              }
            } else {
              resolve("Disconnected port for: " + name);
            }
          });
          if (responseHandler) {
            port.onMessage.addListener((message) => responseHandler(message));
          }
          port.postMessage(message);
        });
      },
      postTabMessage: (tabId, name, message, responseHandler) => {
        return new Promise((resolve, reject) => {
          let port = chrome.tabs.connect(tabId, { name: name });
          port.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
              try {
                reject(chrome.runtime.lastError.message);
              } catch (e) {
                reject("Error handling runtime error: " + JSON.stringify(e));
              }
            } else {
              resolve("Disconnected port for: " + name);
            }
          });
          if (responseHandler) {
            port.onMessage.addListener((message) => responseHandler(message));
          }
          port.postMessage(message);
        });
      },
      onPortMessage: (name, listener) => {
        chrome.runtime.onConnect.addListener((port) => {
          if (port.name == name) {
            port.onMessage.addListener((message) => listener(message, port));
          }
        });
      },
    },
  },
  Fetchs: {
    postFetch: (link, body) => {
      return new Promise((resolve, reject) => {
        fetch(link, {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          referrerPolicy: "no-referrer-when-downgrade",
          method: "POST",
          body: JSON.stringify(body),
          mode: "cors",
          credentials: "omit",
        })
          .then(function (response) {
            resolve(response);
          })
          .catch(function (err) {
            reject(err);
          });
      });
    },
    getFetch: (link) => {
      return new Promise((resolve, reject) => {
        fetch(link)
          .then(function (response) {
            resolve(response);
          })
          .catch(function (err) {
            reject(err);
          });
      });
    },
  },
};
