module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/utils': './src/utils',
          '@/types': './src/types',
          '@/store': './src/store',
          '@/hooks': './src/hooks',
          '@/config': './src/config',
          '@/navigation': './src/navigation',
          '@/i18n': './src/i18n',
        },
      },
    ],
  ],
};