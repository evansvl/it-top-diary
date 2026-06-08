// Babel: пресет Expo + поддержка NativeWind v4 и Reanimated.
// Reanimated 4 вынес babel-плагин в react-native-worklets.
// ВАЖНО: этот плагин должен идти ПОСЛЕДНИМ.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
