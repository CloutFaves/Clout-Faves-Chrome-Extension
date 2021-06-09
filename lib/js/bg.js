var intervalFunction = () => {
    helpfulFunctions.Chorme.Storage.readFromLocalStorage(["usersToTrack", "lastDateSeenByUser", "percentageCalcPrevNotReady", "lastNotificationText"])
        .then(async (rsp) => {
            var percentageCalcPrevNotReady = rsp.percentageCalcPrevNotReady || []
            var lastNotificationText = rsp.lastNotificationText || ""
            var usersToTrack = rsp.usersToTrack || []
            var date = new Date().getTime()
            var percentagesOfUsers = []
            for (let i = 0; i < usersToTrack.length; i++) {
                var user = usersToTrack[i];
                var percentageCalculated = await getAndSaveUserData(user, date)
                percentagesOfUsers.push(percentageCalculated)
            }
            var text = ""
            for (let i = 0; i < percentagesOfUsers.length; i++) {
                var element = percentagesOfUsers[i];
                if (element.notificationText != null) {
                    text += `${(i == 0 ? "" : "\n")}${element.notificationText}`
                }
            }
            if (text != "" && lastNotificationText != text) {
                helpfulFunctions.Chorme.Storage.saveToLocalStorage({ lastNotificationText: text })
                helpfulFunctions.Chorme.Notifications.create(null, {
                    title: `coin changes`,
                    message: text,
                    type: "basic",
                    iconUrl: "lib/images/logo-192.png"
                })
                helpfulFunctions.Chorme.Badge.setText("!")
                helpfulFunctions.Chorme.Badge.setColor("red")
            }
            if (percentageCalcPrevNotReady != undefined && percentageCalcPrevNotReady.length != 0) {
                await helpfulFunctions.Chorme.Storage.saveToLocalStorage({ percentageCalcPrev: percentageCalcPrevNotReady })
                await helpfulFunctions.Chorme.Storage.removeFromLocalStorage(["percentageCalcPrevNotReady"])
            }
            await helpfulFunctions.Chorme.Storage.saveToLocalStorage({ percentageCalc: percentagesOfUsers })

        })
}
helpfulFunctions.Chorme.Storage.clearLocalStorage().then(() => {
    intervalFunction()
})

setInterval(intervalFunction, 1000 * 60 * 1);
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
function getAndSaveUserData(user, date) {
    return new Promise((resolve, reject) => {
        helpfulFunctions.Fetchs.postFetch("https://bitclout.com/api/v0/get-single-profile", {
            PublicKeyBase58Check: "",
            Username: user.trim()
        })
            .then(response => response.json())
            .then((rsp1) => {
                helpfulFunctions.Fetchs.getFetch("https://bitcloutlistback.azurewebsites.net/index/getusdrate")
                    .then((response1) => response1.json())
                    .then(async (rsp2) => {
                        if (rsp1.Profile == null) {
                            return reject("User Not Found")
                        }
                        var obj = {
                            coinPrice: rsp1.Profile.CoinPriceBitCloutNanos,
                            coinPriceText: await getCreatorCoinPrice(rsp1.Profile.CoinPriceBitCloutNanos),
                            date,
                            username: rsp1.Profile.Username
                        }
                        helpfulFunctions.Chorme.Storage.readFromLocalStorage([obj.username, "percentageCalc"]).then((results) => {
                            var lastDateSeenByUser = results.lastDateSeenByUser || 0
                            var userDetails = results[obj.username] || [obj, obj]
                            var percentageCalc = results.percentageCalc || []
                            userDetails = [obj, userDetails[1]]
                            helpfulFunctions.Chorme.Storage.saveToLocalStorage({ [obj.username]: userDetails }).then(async () => {
                                var calculatedPercentage = percentageCalculation(userDetails[0].coinPriceText, userDetails[1].coinPriceText)
                                var notificationText = null
                                if (calculatedPercentage.val > 0) {
                                    notificationText = `${obj.username} coin just increased by ${calculatedPercentage.text}`
                                } else if (calculatedPercentage.val < 0) {
                                    notificationText = `${obj.username} coin just decreased by ${calculatedPercentage.text}`
                                }
                                resolve({
                                    username: rsp1.Profile.Username,
                                    date,
                                    notificationText,
                                    percentage: calculatedPercentage
                                })
                            })
                        })
                    })

            })
    })

}
function percentageCalculation(newVal, oldVal) {
    var percentage = (((newVal - oldVal) / oldVal) * 100).toFixed(2)
    var text = {
        text: `0.0%`,
        val: 0,
        color: "#3e4676"
    }
    if (percentage > 0) {
        text = {
            text: `+${percentage}%`,
            val: (percentage / 100).toFixed(4),
            color: "rgb(0, 204, 153)"
        }

    } else if (percentage < 0) {
        text = {
            text: `-${Math.abs(percentage)}%`,
            val: (percentage / 100).toFixed(4),
            color: "rgb(242, 84, 91)"
        }
    }
    return text
}

