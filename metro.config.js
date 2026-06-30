const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Disable experimental package exports to fix expo module resolution
    unstable_enablePackageExports: false,
    assetExts: [...defaultConfig.resolver.assetExts, 'bin'],
    sourceExts: [...defaultConfig.resolver.sourceExts],
  },
};

module.exports = mergeConfig(defaultConfig, config);
