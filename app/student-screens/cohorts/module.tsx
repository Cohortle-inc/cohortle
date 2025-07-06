import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { SafeAreaView } from 'react-native-safe-area-context';

const Module = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.videoContainer}>
        <TouchableOpacity style={styles.playButton}>
          <Text style={styles.playText}>▶</Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
          Introduction to Course 5: Create High-Fidelity Designs and Prototypes
          in Figma
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Create High-Fidelity Designs and Prototypes in Figma
        </Text>
      </View>
      <View
        style={{
          marginTop: 'auto',
          flexDirection: 'row',
          gap: 8,
          padding: 16,
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: '#B085EF',
            padding: 10,
            borderRadius: 10,
          }}
          onPress={() => console.log('Start Module Pressed')}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 10 }}>
            Mark as complete
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#B085EF',
            padding: 10,
            borderRadius: 10,
          }}
          onPress={() => console.log('Start Module Pressed')}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 10 }}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Module;

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#B0B0B0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playButton: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 30,
  },
});
