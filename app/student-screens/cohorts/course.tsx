import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Back, Check, Close, Options, RedDoor } from '@/assets/icons';
import { router, useRouter } from 'expo-router';
import { BottomSheet } from '@/components/ui';

const Course = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const [isSheetVisible, setSheetVisible] = useState(false);
  return (
    <SafeAreaWrapper>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 24,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Back />
        </TouchableOpacity>
        <Text style={{ fontSize: 10, fontWeight: 'semibold' }}>
          Create High-Fidelity Designs and Prototypes in Figma
        </Text>
        <TouchableOpacity onPress={() => setSheetVisible(true)}>
          <Options />
        </TouchableOpacity>
      </View>
      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          Name of Cohort
        </Text>
        <Text>Name of Convener</Text>
      </View>
      <View style={{ flex: 1 }}>
        {/* Tab Bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('Home')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
          >
            <Text
              style={{
                borderBottomWidth: activeTab === 'Home' ? 3 : 0,
                borderColor: activeTab === 'Home' ? '#000' : '#ccc',
                paddingBottom: 6,
                fontWeight: activeTab === 'Home' ? 'bold' : 'normal',
              }}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Info')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
          >
            <Text
              style={{
                borderBottomWidth: activeTab === 'Info' ? 3 : 0,
                borderColor: activeTab === 'Info' ? '#000' : '#ccc',
                paddingBottom: 6,
                fontWeight: activeTab === 'Info' ? 'bold' : 'normal',
              }}
            >
              Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View>
          {activeTab === 'Home' ? (
            <View>
              <View>
                <Text>Modules</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {numbers.map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        borderWidth: 1,
                        borderColor: '#ECDCFF',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginRight: 8,
                        marginTop: 8,
                        minWidth: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10 }}>{num}</Text>
                      <Check />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ marginTop: 16 }}>
                  <Module />
                  <Module />
                  <Module />
                  <Module />
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={{ fontWeight: 'bold' }}>Course Description</Text>
              <Text style={{ marginTop: 8, fontSize: 12, letterSpacing: 1 }}>
                This course will teach you how to create high-fidelity designs
                and prototypes using Figma. You will learn the principles of
                design, how to use Figma's tools effectively, and how to create
                interactive prototypes.
              </Text>
            </View>
          )}
        </View>
      </View>
      <BottomSheet
        isVisible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 24,
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>Options</Text>
          <TouchableOpacity onPress={() => setSheetVisible(false)}>
            <Close />
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity
            style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
          >
            <RedDoor />
            <Text style={{ color: '#EE3D3E' }}>Unenroll from cohort</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{
            marginTop: 24,
            borderWidth: 1,
            borderColor: '#ECDCFF',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setSheetVisible(false)}
        >
          <Text style={{ fontWeight: 'bold', color: '#211E8A' }}>Close</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

const Module = () => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/student-screens/cohorts/module')}
      style={{
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ECDCFF',
        borderRadius: 8,
      }}
    >
      <Text style={{ fontWeight: 'semibold' }}>Module enteries</Text>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Text
          style={{
            borderWidth: 1,
            borderColor: '#ECDCFF',
            padding: 4,
            borderRadius: 4,
            fontSize: 10,
          }}
        >
          Video
        </Text>
        <Text
          style={{
            borderWidth: 1,
            borderColor: '#ECDCFF',
            padding: 4,
            borderRadius: 4,
            fontSize: 10,
          }}
        >
          2 min
        </Text>
      </View>
    </TouchableOpacity>
  );
};
export default Course;

const styles = StyleSheet.create({});
