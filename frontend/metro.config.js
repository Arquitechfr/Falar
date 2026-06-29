const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable package exports for better tree-shaking
config.resolver.unstable_enablePackageExports = true;

// Disable package exports for event-target-shim to avoid react-native-webrtc warnings
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

// Disable source maps in production to reduce bundle size
if (process.env.NODE_ENV === 'production') {
  config.serializer.options.sourceMaps = false;
}

// Enable minification
config.transformer.minifierConfig = {
  keep_classnames: false,
  keep_fnames: false,
  mangle: {
    keep_classnames: false,
    keep_fnames: false,
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
