/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProfile();
  }, []);
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={profile?.name?.substring(0, 2).toUpperCase() || 'U'}
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {profile?.name}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {profile?.email}
          </Text>
          <Text variant="titleMedium" style={styles.shopName}>
            {profile?.shopName}
          </Text>
        </Card.Content>
      </Card>
      {/* Shop Details */}
      <Card style={styles.card}>
        <Card.Title title="Shop Information" />
        <Card.Content>
          {profile?.shopAddress && (
            <View style={styles.infoRow}>
              <Icon name="map-marker" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.infoText}>
                {profile.shopAddress}
              </Text>
            </View>
          )}
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.infoText}>
                {profile.phone}
              </Text>
            </View>
          )}
          {profile?.gstNumber && (
            <View style={styles.infoRow}>
              <Icon name="file-document" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.infoText}>
                GST: {profile.gstNumber}
              </Text>
            </View>
          )}
          {profile?.drugLicenseNumber && (
            <View style={styles.infoRow}>
              <Icon name="license" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.infoText}>
                License: {profile.drugLicenseNumber}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Menu Options */}
      <Card style={styles.card}>
        <List.Section>
          <List.Item
            title="Edit Profile"
            left={props => <List.Icon {...props} icon="account-edit" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Settings"
            left={props => <List.Icon {...props} icon="cog" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <List.Item
            title="Activity Log"
            left={props => <List.Icon {...props} icon="history" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Subscription"
            description={`Current Plan: ${profile?.subscriptionPlan || 'Free'}`}
            left={props => <List.Icon {...props} icon="crown" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Help & Support"
            left={props => <List.Icon {...props} icon="help-circle" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="About"
            left={props => <List.Icon {...props} icon="information" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Logout"
            titleStyle={{ color: '#F44336' }}
            left={props => (
              <List.Icon {...props} icon="logout" color="#F44336" />
            )}
            onPress={handleLogout}
          />
        </List.Section>
      </Card>

      <Text variant="bodySmall" style={styles.version}>
        Version 1.0.0
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 10,
    elevation: 2,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  name: {
    marginTop: 15,
    fontWeight: 'bold',
  },
  email: {
    marginTop: 5,
    color: '#666',
  },
  shopName: {
    marginTop: 10,
    color: '#2196F3',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});
