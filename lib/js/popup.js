function getCreatorCoinPrice(responseFromFetch) {
    return new Promise((resolve, reject) => {
        helpfulFunctions.Fetchs.getFetch("https://bitclout.com/api/v0/get-exchange-rate")
            .then(response => response.json())
            .then((rsp1) => {
                helpfulFunctions.Fetchs.getFetch("https://blockchain.info/ticker").then(response => response.json())
                    .then((rsp2) => {
                        var bitcloutCoinPrice = 1000000000 / (1e9 / rsp1.SatoshisPerBitCloutExchangeRate / rsp2.USD.last * 1e8)
                        resolve(responseFromFetch / 1000000000 * bitcloutCoinPrice)
                    })
            })
    })

}
var app = new Vue({
    el: '#app',
    data: {
        usersToTrackData: [],
    },
    updated() {
        helpfulFunctions.Chorme.Storage.readFromLocalStorage(["usersToTrack"]).then(resilts => {
            var usersToTrack = resilts.usersToTrack || []
            if (usersToTrack.length == app.usersToTrackData.length) {
                document.querySelector("#loading").style.display = "none"
                document.querySelector("#loaded").style.display = "block"
            }
        })

    },
})
onPopupOpen()
function onPopupOpen() {
    helpfulFunctions.Chorme.Badge.setText("")
    helpfulFunctions.Chorme.Badge.setColor("red")
    helpfulFunctions.Chorme.Storage.readFromLocalStorage(["usersToTrack", "percentageCalc"])
        .then(async (result) => {
            var usersToTrack = result.usersToTrack || []
            var percentageCalc = result.percentageCalc || []
            helpfulFunctions.Chorme.Storage.saveToLocalStorage({ percentageCalcPrevNotReady: percentageCalc })
            if (usersToTrack.length == 0) {
                document.querySelector("#loading").style.display = "none"
                document.querySelector("#loaded").style.display = "block"

            }
            helpfulFunctions.Chorme.Storage.readFromLocalStorage([...usersToTrack]).then(result => {
                for (let i = 0; i < usersToTrack.length; i++) {
                    var username = usersToTrack[i]
                    if (result[username] == undefined) {
                        continue
                    }
                    var user = result[username]
                    user = [user[0], user[0]]
                    helpfulFunctions.Chorme.Storage.saveToLocalStorage({ [username]: user })
                }
                document.querySelector("select").innerHTML = ""
                $("#usersSelected").tagsInput({
                    'interactive': true,
                    'defaultText': 'Add a creator',
                    'onAddTag': addSaveUsersToTrack,
                    'onRemoveTag': removeSaveUsersToTrack,
                    'removeWithBackspace': false,
                    'minChars': 0,
                    'placeholderColor': '#666666'
                });
                for (let i = 0; i < usersToTrack.length; i++) {
                    var element = usersToTrack[i];
                    $('#usersSelected').addTag(element);
                }

                document.querySelector("#usersSelected_tag").addEventListener("input", function (e) {
                    if (document.querySelector("select").options.length > 9) {
                        e.target.value = ""
                        alert("You reached the maximum number of users")
                    }
                })

            })



        })
}
function getUserData(userToTrack, percentageCalc, percentageCalcPrev) {
    return new Promise((resolve, reject) => {
        helpfulFunctions.Fetchs.postFetch("https://bitclout.com/api/v0/get-single-profile", {
            PublicKeyBase58Check: "",
            Username: userToTrack.trim()
        })
            .then((response1) => response1.json())
            .then(rsp1 => {

                helpfulFunctions.Fetchs.getFetch("https://bitcloutlistback.azurewebsites.net/index/getusdrate")
                    .then((response1) => response1.json())
                    .then(async (rsp2) => {
                        if (rsp1.Profile != null) {
                            resolve({
                                coinPrice: rsp1.Profile.CoinPriceBitCloutNanos,
                                coinPriceText: helpfulFunctions.Functions.splitNumberWithCommas((await getCreatorCoinPrice(rsp1.Profile.CoinPriceBitCloutNanos)).toFixed(2)),
                                image: rsp1.Profile.ProfilePic,
                                link: `https://bitclout.com/u/${rsp1.Profile.Username}`,
                                username: rsp1.Profile.Username,
                                percentageCalc: ((percentageCalc != undefined && percentageCalc.filter(e => e.username == rsp1.Profile.Username).length > 0) ? percentageCalc.filter(e => e.username == rsp1.Profile.Username)[0].percentage : {
                                    text: `0.0%`,
                                    val: 0,
                                    color: "#3e4676"
                                }),
                                percentageCalcPrev: ((percentageCalcPrev != undefined && (percentageCalcPrev.filter(e => e.username == rsp1.Profile.Username).length > 0) ? percentageCalcPrev.filter(e => e.username == rsp1.Profile.Username)[0].percentage : {
                                    text: `0.0%`,
                                    val: 0,
                                    color: "#3e4676"
                                })),
                            })
                        } else {
                            resolve("User Not Found")
                        }

                    }).catch((err) => {
                        reject(err)
                    })
            })
    })

}
function addTag(value) {
    var span = document.createElement("span")
    span.className = "tag"
    span.setAttribute("data-value", value)
    var span1 = document.createElement("span")
    span1.innerHTML = `${value}&nbsp;&nbsp;`
    var a = document.createElement("a")
    a.href = "#"
    a.title = "Removing tag"
    a.innerHTML = "x"
    a.addEventListener("click", function (e) {
        e.target.parentElement.remove()
        removeSaveUsersToTrack(e.target.parentElement.getAttribute("data-value"))
    })
}
async function addSaveUsersToTrack(e) {
    console.log(`added ${e}`);
    var option = document.createElement("option")
    option.value = e
    option.innerHTML = e
    document.querySelector("select").appendChild(option)
    saveUsersToTrack()
    var result = await helpfulFunctions.Chorme.Storage.readFromLocalStorage(["percentageCalc", "percentageCalcPrev"])
    var percentageCalc = result.percentageCalc || []
    var percentageCalcPrev = result.percentageCalcPrev || []
    var userData = await getUserData(e, percentageCalc, percentageCalcPrev)
    if (userData != "User Not Found") {
        app.usersToTrackData.push(userData)
    }
}
function removeSaveUsersToTrack(e) {
    console.log(`removed ${e}`);
    for (let i = 0; i < document.querySelector("select").length; i++) {
        var option = document.querySelector("select")[i];
        if (option.value == e) {
            option.remove()
        }
    }
    saveUsersToTrack()
    app.usersToTrackData = app.usersToTrackData.filter(userToTrackData => userToTrackData.username.toLowerCase() != e.toLowerCase())
    helpfulFunctions.Chorme.Storage.readFromLocalStorage(["percentageCalc", "percentageCalcPrev"]).then(result => {
        var percentageCalc = result.percentageCalc || []
        var percentageCalcPrev = result.percentageCalcPrev || []
        helpfulFunctions.Chorme.Storage.saveToLocalStorage({ percentageCalc: percentageCalc.filter(el => el.username != e), percentageCalcPrev: percentageCalcPrev.filter(el => el.username != e) })
    })
}
function saveUsersToTrack() {
    var usersToTrack = []
    for (let i = 0; i < document.querySelector("select").options.length; i++) {
        usersToTrack.push(document.querySelector("select").options[i].innerText)
    }
    helpfulFunctions.Chorme.Storage.saveToLocalStorage({ usersToTrack })
}
