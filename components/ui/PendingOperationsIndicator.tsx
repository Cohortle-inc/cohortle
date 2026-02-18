// Pending Operations Indicator
// Shows when there are operations queued for sync

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

const PendingOperationsIndicator: React.FC = () => {
  const { isProcessing, pendingCount } = useOfflineQueue();

  if (pendingCount === 0 && !isProcessing) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.text}>Syncing...</Text>
        </>
      ) : (
        <>
          <Ionicons name="cloud-upload-outline" size={16} color="#3B82F6" />
          <Text style={styles.text}>
            {pendingCount} pending operation{pendingCount !== 1 ? 's' : ''}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 8,
  },
  text: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PendingOperationsIndicator;
