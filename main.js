const { app, BrowserWindow} = require('electron')
const path = require('path')
const winston = require('winston')
const URL = require('url');

let mainWindow = null
const isWin = process.platform === "win32"
const log = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
    new winston.transports.File({ filename: 'info.log', level: 'info'})
    ]
})

const appLock = app.requestSingleInstanceLock()

if(!appLock) {
    app.quit()
} else {
    app.on('second-instance', (event, args, workingDirectory) => {
        console.log('second instance')
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            }

            if (!mainWindow.isVisible()) {
                mainWindow.show()
            }

            mainWindow.focus()
        }

        handleProtocolLauncherArgs(args)
    })
}

const createWindow = async () => {
    const win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
        width: 800,
        height: 600
    })

    await win.loadFile('index.html')
    return win
}

app.whenReady().then(async() => {
    mainWindow = await createWindow()
    handleProtocolLauncherArgs(process.argv)
})

function handleAppUrl(url) {
    //Handle your url here, in this case we will just display the app url in the page
    //this is communicated to the UI using an IPC channel to the mainWindow
    mainWindow.webContents.send("update-url", url)
}

const protocolLauncherArg = '--protocol-launcher'
const possibleProtocols = new Set(['custom-uri'])

function handleProtocolLauncherArgs(args) {
    // Received possible protocol arguments
    if (isWin) {
        // Desktop registers it's protocol handler callback on Windows as
        // `[executable path] --protocol-launcher "%1"`. Note that extra command
        // line arguments might be added by Chromium
        // (https://electronjs.org/docs/api/app#event-second-instance).
        // At launch Desktop checks for that exact scenario here before doing any
        // processing. If there's more than one matching url argument because of a
        // malformed or untrusted url then we bail out.

        const matchingUrls = args.filter(arg => {
            // sometimes `URL.parse` throws an error
            try {
                const url = URL.parse(arg)
                // i think this `slice` is just removing a trailing `:`
                return url.protocol && possibleProtocols.has(url.protocol.slice(0, -1))
            } catch (e) {
                log.error(`Unable to parse argument as URL: ${arg}`)
                return false
            }
        })

        if (args.includes(protocolLauncherArg) && matchingUrls.length === 1) {
            handleAppUrl(matchingUrls[0])
        } else {
            log.error(`Malformed launch arguments received: ${args}`)
        }
    } else if (args.length > 1) {
        handleAppUrl(args[1])
    }
}


