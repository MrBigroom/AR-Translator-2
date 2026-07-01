module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required by react-native-worklets-core so the OCR frame processor can
      // run on the camera thread. Must be listed last.
      'react-native-worklets-core/plugin',
    ],
  };
};
