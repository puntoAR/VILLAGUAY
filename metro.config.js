const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Soportar módulos WebAssembly para expo-sqlite en Web
config.resolver.assetExts.push('wasm');

module.exports = config;
