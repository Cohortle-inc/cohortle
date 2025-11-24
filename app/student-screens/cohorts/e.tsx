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
        {/* <Text style={{ fontSize: 10, fontWeight: 'semibold' }}>
          Create High-Fidelity Designs and Prototypes in Figma
        </Text> */}
        <TouchableOpacity onPress={() => setSheetVisible(true)}>
          <Options />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'column', gap: 5 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          Name of Cohort
        </Text>
        <View>
          <Text style={{ fontWeight: 300 }}>Offered By</Text>
          <Text style={{ fontSize: 16 }}>Abdulhamid Usman</Text>
        </View>
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
                <Text style={{ fontWeight: 600, fontSize: 16 }}>
                  About this course
                </Text>
                <Text style={{ marginVertical: 10 }}>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi
                  delectus sequi alias eligendi veritatis quis. Voluptates
                  voluptate nobis maxime odit alias? Ipsam maiores voluptatum
                  nesciunt voluptas facilis dolore temporibus cupiditate.
                </Text>
                {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                </ScrollView> */}
                <View style={{ marginVertical: 10 }}>
                  <Text style={{ fontWeight: 600 }}>
                    Syllabus: What you'll learn from the course
                  </Text>
                  <View style={{ marginTop: 16 }}>
                    <Module />
                    <Module />
                    <Module />
                    <Module />
                  </View>
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
        padding: 16,
        borderTopWidth: 1,
        borderColor: 'black',
        borderStyle: 'dashed',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontWeight: 300 }}>Module id</Text>
      <Text
        style={{
          marginLeft: 10,
          padding: 4,
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 'semibold',
        }}
      >
        Module Title
      </Text>
      {/* <Text
        style={{
          marginLeft: "auto",
          borderRadius: 4,
          fontSize: 10,
        }}
      >
        2 min
      </Text> */}
    </TouchableOpacity>
  );
};
export default Course;

const styles = StyleSheet.create({});
