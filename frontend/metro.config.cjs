const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  'react-native-audio-session': path.resolve(__dirname, 'stubs/react-native-audio-session.cjs'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-audio-session') {
      return {
        filePath: path.resolve(__dirname, 'stubs/react-native-audio-session.cjs'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'react-native-bluetooth-classic') {
      return {
        filePath: path.resolve(__dirname, 'stubs/react-native-bluetooth-classic.cjs'),
        type: 'sourceFile',
      };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

// const { getDefaultConfig } = require('expo/metro-config');
// const path = require('path');

// const config = getDefaultConfig(__dirname);

// config.resolver.extraNodeModules = {
//   'react-native-bluetooth-classic': path.resolve(__dirname, 'stubs/react-native-bluetooth-classic.cjs'),
//   'react-native-audio-session': path.resolve(__dirname, 'stubs/react-native-audio-session.cjs'),
// };

// module.exports = config;