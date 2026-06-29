const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const isProduction = process.env.NODE_ENV === 'production';

// Always enabled to ensure consistent module resolution between dev and prod
config.resolver.unstable_enablePackageExports = true;

if (isProduction) {
  // Disable source maps in production to reduce bundle size
  config.serializer = config.serializer || {};
  config.serializer.options = config.serializer.options || {};
  config.serializer.options.sourceMaps = false;

  // Enable minification only in production
  config.transformer = config.transformer || {};
  config.transformer.minifierConfig = {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
    },
  };
}

// Custom resolver for event-target-shim (needed for react-native-webrtc)
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'event-target-shim' || moduleName.startsWith('event-target-shim/')) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    );
  }
  return originalResolveRequest?.(context, moduleName, platform) ??
         context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
