import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import SimpleQRScanner from '../../components/SimpleQRScanner';

export default function QRTestScreen() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');

  const handleScanSuccess = (data: string) => {
    setScannedData(data);
    setShowScanner(false);
    Alert.alert('QR Code Scanned', `Data: ${data}`);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  if (showScanner) {
    return <SimpleQRScanner onScanSuccess={handleScanSuccess} onClose={handleCloseScanner} />;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="QR Code Scanner Test" titleVariant="titleLarge" />
        <Card.Content>
          <Text style={styles.description}>
            This is a test screen for QR code scanning. Tap the button below to open the QR scanner.
          </Text>
          
          <Button
            mode="contained"
            onPress={() => setShowScanner(true)}
            style={styles.scanButton}
            icon="qrcode-scan"
          >
            Open QR Scanner
          </Button>

          {scannedData ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Last Scanned Data:</Text>
              <Text style={styles.resultData}>{scannedData}</Text>
            </View>
          ) : null}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  scanButton: {
    marginBottom: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  resultData: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
});
