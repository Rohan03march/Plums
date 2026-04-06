const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Force-removes the MEDIA_PROJECTION permission and any service types
 * associated with it to prevent Google Play Store rejections.
 */
module.exports = function withRemovePermissions(config) {
  return withAndroidManifest(config, (config) => {
    const mainManifest = config.modResults.manifest;

    // 1. Remove the permission completely
    if (mainManifest["uses-permission"]) {
      mainManifest["uses-permission"] = mainManifest["uses-permission"].filter(
        (perm) => perm.$["android:name"] !== "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION"
      );
    }

    // 2. Remove 'mediaProjection' type from any <service> tags
    const application = mainManifest.application?.[0];
    if (application && application.service) {
      application.service.forEach((service) => {
        if (service.$?.["android:foregroundServiceType"]) {
          const types = service.$["android:foregroundServiceType"].split("|");
          const filteredTypes = types.filter((t) => t.trim() !== "mediaProjection");
          
          if (filteredTypes.length > 0) {
            service.$["android:foregroundServiceType"] = filteredTypes.join("|");
          } else {
            // If it was ONLY mediaProjection, remove the attribute entirely
            delete service.$["android:foregroundServiceType"];
          }
        }
      });
    }

    return config;
  });
};
