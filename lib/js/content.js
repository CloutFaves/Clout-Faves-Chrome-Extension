var si = setInterval(() => {
    var parentToAppend = document.querySelector("a[href*='/buy'][href*='u/']")
    if (parentToAppend != null && document.querySelector("a[href*='/buy'][href*='u/']").parentElement.querySelectorAll("a").length == 1) {
        var button = document.createElement("a")
        parentToAppend = parentToAppend.parentElement
        helpfulFunctions.Chorme.Storage.readFromLocalStorage(["usersToTrack"]).then((results => {
            var usersToTrack = results.usersToTrack || []
            if (usersToTrack.filter(e => e == window.location.href.split("/")[window.location.href.split("/").length - 1]).length > 0) {
                button.innerHTML = "Remove from Clout Faves List"
                button.className = "btn font-weight-bold ml-15px fs-14px"
                button.style.cssText = "height: 36px;border: 1px solid black;"
                button.addEventListener("click", function (e) {
                    helpfulFunctions.Chorme.Storage.readFromLocalStorage(["usersToTrack"]).then((results => {
                        var usersToTrack = results.usersToTrack || []
                        helpfulFunctions.Chorme.Storage.saveToLocalStorage({ usersToTrack: usersToTrack.filter(e => e != window.location.href.split("/")[window.location.href.split("/").length - 1]) })
                        alert("User removed")
                        e.target.remove()
                    }))
                })
            } else {
                button.innerHTML = "Add to Clout Faves List"
                button.className = "btn btn-primary font-weight-bold ml-15px fs-14px"
                button.style.cssText = "height: 36px;"
                button.addEventListener("click", function (e) {
                    helpfulFunctions.Chorme.Storage.readFromLocalStorage(["usersToTrack"]).then((results => {
                        var usersToTrack = results.usersToTrack || []
                        if (usersToTrack.filter(e => e == window.location.href.split("/")[window.location.href.split("/").length - 1]).length > 0) {
                            alert("User already added")
                        } else {
                            helpfulFunctions.Chorme.Storage.saveToLocalStorage({ usersToTrack: [...usersToTrack, window.location.href.split("/")[window.location.href.split("/").length - 1]] })
                            alert("User added")
                        }
                        e.target.remove()
                    }))
                })
            }
            parentToAppend.prepend(button)
        }))

    }
}, 1000);