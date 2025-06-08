import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph, Button } from 'react-native-paper';
import Header from '../components/common/Header';
import { MainStackScreenProps } from '../types/navigation';

type Props = MainStackScreenProps<'CompanySelection'>;

const CompanySelectionScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header
        title="Company Selection"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Title>Company Selection</Title>
        <Paragraph>This screen will allow switching between companies.</Paragraph>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' },
});

export default CompanySelectionScreen;
