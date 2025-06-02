// C:/Users/yunus/KitapligimApp/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // Bu satır Expo projeleri için standarttır
    plugins: [
      // react-native-reanimated/plugin en sonda olmalı
      [
        'module-resolver',
        {
          root: ['.'], // Proje kök dizini
          extensions: [
            '.ios.js',
            '.android.js',
            '.js',
            '.ts',
            '.tsx',
            '.json',
          ],
          alias: {
            '@': './src', // @/* ifadesi ./src/* anlamına gelecek
          },
        },
      ],
      // ... varsa diğer pluginleriniz ...
      'react-native-reanimated/plugin', // Bu plugin genellikle sonda olmalıdır
    ],
  };
};