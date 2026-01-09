import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    expiryDate: string;
    category: string;
  };
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onEdit,
  onDelete,
}) => {
  const isLowStock = product.stock < 10;
  const isExpiringSoon = new Date(product.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.name}>
            {product.name}
          </Text>
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={onEdit}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete"
                size={20}
                onPress={onDelete}
              />
            )}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#666" />
            <Text variant="bodyMedium" style={styles.price}>
              ₹{product.price.toFixed(2)}
            </Text>
          </View>

          <View style={styles.row}>
            <MaterialCommunityIcons name="cube-outline" size={16} color="#666" />
            <Text variant="bodyMedium" style={styles.stock}>
              Stock: {product.stock}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Chip
            icon="shape"
            compact
            style={styles.categoryChip}
            textStyle={styles.chipText}
          >
            {product.category}
          </Chip>

          {isLowStock && (
            <Chip
              icon="alert-circle"
              compact
              style={styles.warningChip}
              textStyle={styles.chipText}
            >
              Low Stock
            </Chip>
          )}

          {isExpiringSoon && (
            <Chip
              icon="clock-alert-outline"
              compact
              style={styles.expiryChip}
              textStyle={styles.chipText}
            >
              Expiring Soon
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    marginLeft: 4,
    fontWeight: '500',
  },
  stock: {
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#E3F2FD',
  },
  warningChip: {
    backgroundColor: '#FFF3E0',
  },
  expiryChip: {
    backgroundColor: '#FFEBEE',
  },
  chipText: {
    fontSize: 12,
  },
});