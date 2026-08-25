import React from 'react';
import {
  StyleSheet,
  View,
  Text
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ghost } from 'lucide-react-native';
import { NotFound } from '../../components/NotFound';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';

export const Error404 = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  return (
    <ScreenContainer
      header={{ showBack: true }}
      scroll={false}
      bgVariant="screen"
    >
      <NotFound
        type="404"
        title="Oops! Page Not Found"
        subtitle="It seems you've wandered into an uncharted area of our learning portal. Let's get you back on track."
        icon={Ghost}
        buttonText="Return to Home"
        onButtonPress={() => navigation.navigate('Home')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>MyEduDocs • Sabko Padhao</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  }
});
