/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initI18n } from './src/i18n';

initI18n();

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('UtilityApp', () => App);
