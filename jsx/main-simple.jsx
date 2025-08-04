// ExtendScript simple pour test
function testFunction() {
    return "Hello from After Effects! App: " + app.appName + " Version: " + app.version;
}

function getAppInfo() {
    try {
        return JSON.stringify({
            appName: app.appName,
            version: app.version,
            buildNumber: app.buildNumber
        });
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}