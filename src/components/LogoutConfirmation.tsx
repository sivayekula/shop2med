import React from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

interface LogoutConfirmationProps {
  onConfirm: () => void;
}

export const useLogoutConfirmation = () => {
  const { logout } = useAuthStore();

  const showLogoutConfirmation = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return { showLogoutConfirmation };
};
