const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const mainManifest = config.modResults.manifest;
    mainManifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    const application = mainManifest.application[0];

    if (!application.service) {
      application.service = [];
    }

    // Add or Update Notifee Foreground Service
    const serviceName = "app.notifee.core.ForegroundService";
    let service = application.service.find((s) => s.$["android:name"] === serviceName);

    if (!service) {
      service = {
        $: {
          "android:name": serviceName,
          "android:enabled": "true",
          "android:exported": "false",
          "android:foregroundServiceType": "camera|microphone|phoneCall|specialUse",
          "tools:replace": "android:foregroundServiceType",
        },
      };
      application.service.push(service);
    } else {
      service.$["android:foregroundServiceType"] = "camera|microphone|phoneCall|specialUse";
      service.$["tools:replace"] = "android:foregroundServiceType";
    }

    return config;
  });
};
