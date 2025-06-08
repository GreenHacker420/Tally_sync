import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph, Button } from 'react-native-paper';
import Header from '../components/common/Header';
import { MainStackScreenProps } from '../types/navigation';

type Props = MainStackScreenProps<'ItemDetail'>;

const ItemDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId } = route.params;
  
  return (
    <View style={styles.container}>
      <Header
        title="Item Details"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Title>Item Details</Title>
        <Paragraph>Item ID: {itemId}</Paragraph>
        <Paragraph>This screen will show detailed item information.</Paragraph>
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

export default ItemDetailScreen;
