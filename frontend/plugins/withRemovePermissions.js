const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withRemovePermissions(config) {
  return withAndroidManifest(config, (config) => {
    const mainManifest = config.modResults.manifest;

    // 1. Ensure the 'tools' namespace exists so we can use tools:node="remove"
    mainManifest.$ = {
      ...mainManifest.$,
      "xmlns:tools": "http://schemas.android.com/tools",
    };

    // 2. Add the permission with a "remove" instruction
    // This tells the Android Merger to strip it out even if an SDK adds it
    if (!mainManifest["uses-permission"]) {
      mainManifest["uses-permission"] = [];
    }

    // First, filter out any existing instances to avoid duplicates
    mainManifest["uses-permission"] = mainManifest["uses-permission"].filter(
      (perm) => perm.$["android:name"] !== "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION"
    );

    // Now add it back with the 'remove' command
    mainManifest["uses-permission"].push({
      $: {
        "android:name": "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
        "tools:node": "remove",
      },
    });

    // 3. Deep clean services (remove the type 'mediaProjection' from any service)
    const application = mainManifest.application?.[0];
    if (application && application.service) {
      application.service.forEach((service) => {
        if (service.$?.["android:foregroundServiceType"]) {
          const types = service.$["android:foregroundServiceType"].split("|");
          const filteredTypes = types.filter((t) => t.trim() !== "mediaProjection");
          
          if (filteredTypes.length > 0) {
            service.$["android:foregroundServiceType"] = filteredTypes.join("|");
          } else {
            delete service.$["android:foregroundServiceType"];
          }
        }
      });
    }

    return config;
  });
};
