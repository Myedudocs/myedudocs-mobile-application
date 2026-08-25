module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@react-native|@react-navigation|react-native|@react-native-community|expo(nent)?|@expo|@expo/*|@react-native-community|native-base|react-native-svg)/',
  ],
};
