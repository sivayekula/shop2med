import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import ProductDetailsScreen from '../screens/inventory/ProductDetailsScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import AddProductScreen from '../screens/inventory/AddProductScreen';
import EditProductScreen from '../screens/inventory/EditProductScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import CreateOrderScreen from '../screens/orders/CreateOrderScreen';
import EditOrderScreen from '../screens/orders/EditOrderScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import BiometricSettingsScreen from '../screens/profile/BiometricSettingsScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SalesScreen from '../screens/sales/SalesScreen';
import SaleDetailsScreen from '../screens/sales/SaleDetailsScreen';
import CreateSaleScreen from '../screens/sales/CreateSaleScreen';
import QRTestScreen from '../screens/test/QRTestScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  InventoryTab: undefined;
  OrdersTab: undefined;
  SalesTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  QRTest: undefined;
};

export type InventoryStackParamList = {
  Inventory: undefined;
  ProductDetails: { productId: string };
  AddProduct: undefined;
  EditProduct: { productId: string };
};

export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetails: { orderId: string };
  CreateOrder: undefined;
  EditOrder: { orderId: string };
};

export type SalesStackParamList = {
  Sales: undefined;
  SaleDetails: { saleId: string };
  CreateSale: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  BiometricSettings: undefined;
  Reports: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const InventoryStack = createStackNavigator<InventoryStackParamList>();
const OrdersStack = createStackNavigator<OrdersStackParamList>();
const SalesStack = createStackNavigator<SalesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <HomeStack.Screen
        name="QRTest"
        component={QRTestScreen}
        options={{ title: 'QR Test' }}
      />
    </HomeStack.Navigator>
  );
}

function InventoryStackScreen() {
  return (
    <InventoryStack.Navigator>
      <InventoryStack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
      <InventoryStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: 'Product Details' }}
      />
      <InventoryStack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Add Product' }}
      />
      <InventoryStack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ title: 'Edit Product' }}
      />
    </InventoryStack.Navigator>
  );
}

function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <OrdersStack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
      <OrdersStack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'Create Order' }}
      />
      <OrdersStack.Screen
        name="EditOrder"
        component={EditOrderScreen}
        options={{ title: 'Edit Order' }}
      />
    </OrdersStack.Navigator>
  );
}

function SalesStackScreen() {
  return (
    <SalesStack.Navigator>
      <SalesStack.Screen
        name="Sales"
        component={SalesScreen}
        options={{ title: 'Sales' }}
      />
      <SalesStack.Screen
        name="SaleDetails"
        component={SaleDetailsScreen}
        options={{ title: 'Sale Details' }}
      />
      <SalesStack.Screen
        name="CreateSale"
        component={CreateSaleScreen}
        options={{ title: 'Create Sale' }}
      />
    </SalesStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="BiometricSettings"
        component={BiometricSettingsScreen}
        options={{ title: 'Biometric Settings' }}
      />
      <ProfileStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </ProfileStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryStackScreen}
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SalesTab"
        component={SalesStackScreen}
        options={{
          tabBarLabel: 'Sales',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-register" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}