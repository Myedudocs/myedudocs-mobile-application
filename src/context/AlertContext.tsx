import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Alert, AlertButton as RNAlertButton } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  type?: 'success' | 'error' | 'info' | 'warning';
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[], type?: AlertState['type']) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback(
    (title: string, message: string = '', buttons: AlertButton[] = [{ text: 'OK' }], type: AlertState['type'] = 'info') => {
      setAlertState({
        visible: true,
        title,
        message,
        buttons: buttons.length > 0 ? buttons : [{ text: 'OK' }],
        type,
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  // Hijack React Native's global Alert.alert
  useEffect(() => {
    const originalAlert = Alert.alert;
    
    // Override standard alert behavior
    Alert.alert = (
      title: string,
      message?: string,
      buttons?: RNAlertButton[],
      options?: any
    ) => {
      // Map React Native buttons -> CustomAlert buttons
      let mappedButtons: AlertButton[] = [];
      if (buttons && buttons.length > 0) {
        mappedButtons = buttons.map(b => ({
          text: b.text || 'OK',
          onPress: b.onPress,
          style: b.style === 'cancel' ? 'cancel' : b.style === 'destructive' ? 'destructive' : 'default',
        }));
      } else {
        mappedButtons = [{ text: 'OK' }];
      }
      
      // Determine type dynamically based on title for a better default experience
      let type: AlertState['type'] = 'info';
      const lowercaseTitle = title.toLowerCase();
      if (lowercaseTitle.includes('error') || lowercaseTitle.includes('fail')) type = 'error';
      else if (lowercaseTitle.includes('success')) type = 'success';
      else if (lowercaseTitle.includes('warning') || lowercaseTitle.includes('delete')) type = 'warning';

      // Call our beautiful CustomAlert!
      showAlert(title, message || '', mappedButtons, type);
    };

    // Cleanup when provider unmounts
    return () => {
      Alert.alert = originalAlert;
    };
  }, [showAlert]);

  const alertContextValue = useMemo(() => ({ showAlert, hideAlert }), [showAlert, hideAlert]);
  
  return (
    <AlertContext.Provider value={alertContextValue}>
      {children}
      {/* The Actual UI Component will be rendered here via a separate component */}
      <AlertPortal state={alertState} onHide={hideAlert} />
    </AlertContext.Provider>
  );
};

// Internal component to handle rendering the UI
import { CustomAlert } from '../components/CustomAlert';

const AlertPortal: React.FC<{ state: AlertState; onHide: () => void }> = ({ state, onHide }) => {
  return <CustomAlert {...state} onHide={onHide} />;
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
