import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

const LICENSE_URL = 'https://jenniamondo.app/files/licenses.html';

const LicensesScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <WebView source={{ uri: LICENSE_URL }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LicensesScreen;
