import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import {
  Calender,
  Facebook,
  Instagram,
  Linkedin,
  Location,
  Lock,
  Notifications,
  Options,
  Pencil,
  Share,
  X,
} from '@/assets/icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { router } from 'expo-router';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<'Communities' | 'Social'>(
    'Communities',
  );
  const bottomSheetRef = useRef<BottomSheet>(null);

  const Community = () => {
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: '#F2750D',
            width: 40,
            height: 40,
            borderRadius: 8,
          }}
        ></View>
        <View>
          <Text
            style={{
              fontFamily: 'DMSansMedium',
              fontSize: 12,
              color: '#1F1F1F',
            }}
          >
            Branding & Brand Design
          </Text>
          <Text
            style={{
              color: '#8D9091',
              fontSize: 10,
            }}
          >
            15.8K Members
          </Text>
        </View>
      </View>
    );
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };
  const renderBackdrop = useCallback(
    (
      props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
    ) => <BottomSheetBackdrop {...props} opacity={0.7} />,
    [],
  );

  const handleSheetChanges = useCallback((index: number) => {
    // Update state based on the index value
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);

  return (
    <SafeAreaWrapper>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Sadiq's Cohort</Text>
        <Pressable onPress={openBottomSheet}>
          <Options />
        </Pressable>
      </View>

      {/* Profile Info */}
      <View style={styles.profileContainer}>
        <View style={styles.profileImage} />
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>Mohammed Umar</Text>

          <View style={styles.infoRow}>
            <Location />
            <Text style={styles.infoText}>Abuja, Nigeria</Text>
          </View>

          <View style={styles.infoRow}>
            <Share />
            <Text style={styles.infoText}>copywritingprompts.com</Text>
          </View>

          <View style={styles.infoRow}>
            <Calender />
            <Text style={styles.infoText}>Joined August 2011</Text>
          </View>

          <Pressable
            onPress={() => router.push('/student-screens/profile/edit-profile')}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['Communities', 'Social'].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab as 'Communities' | 'Social')}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeTabUnderline} />}
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <View>
        {activeTab === 'Communities' ? (
          <View style={{ gap: 16 }}>
            <Community />
            <Community />
            <Community />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <X />
              <Text
                style={{
                  color: '#1F1F1F',
                  fontSize: 10,
                  fontFamily: 'DMSansRegular',
                }}
              >
                copywritingprompts.com
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Facebook />
              <Text
                style={{
                  color: '#1F1F1F',
                  fontSize: 10,
                  fontFamily: 'DMSansRegular',
                }}
              >
                copywritingprompts.com
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Instagram />
              <Text
                style={{
                  color: '#1F1F1F',
                  fontSize: 10,
                  fontFamily: 'DMSansRegular',
                }}
              >
                copywritingprompts.com
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Linkedin />
              <Text
                style={{
                  color: '#1F1F1F',
                  fontSize: 10,
                  fontFamily: 'DMSansRegular',
                }}
              >
                copywritingprompts.com
              </Text>
            </View>
          </View>
        )}
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start fully collapsed
        snapPoints={[1, '30%', '30%']} // Adjust snap points
        onChange={handleSheetChanges}
        enablePanDownToClose // Allows swipe down to close
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View
            style={{
              marginTop: 24,
              flex: 1,
              gap: 16,
            }}
          >
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <Pencil />
              <Text
                style={{
                  color: '#1F1F1F',
                  fontFamily: 'DMSansRegular',
                }}
              >
                Edit profile
              </Text>
            </Pressable>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <Notifications />
              <Text
                style={{
                  color: '#1F1F1F',
                  fontFamily: 'DMSansRegular',
                }}
              >
                Cohort notifications
              </Text>
            </Pressable>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <Lock />
              <Text
                style={{
                  color: '#1F1F1F',
                  fontFamily: 'DMSansRegular',
                }}
              >
                Account authentication
              </Text>
            </Pressable>
            <Pressable
              style={{
                marginTop: 'auto',
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: '#EFEFEF',
              }}
            >
              <Text
                style={{
                  color: '#1F1F1F',
                  fontFamily: 'DMSansRegular',
                }}
              >
                Sign out
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

export default Profile;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  headerTitle: {
    color: '#391D65',
    fontFamily: 'DMSansRegular',
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 26,
  },
  profileImage: {
    height: 152,
    width: 152,
    backgroundColor: '#F2750D',
    borderRadius: 8,
  },
  profileDetails: {
    marginTop: 24,
    alignItems: 'center',
  },
  profileName: {
    color: '#1F1F1F',
    fontFamily: 'DMSansBold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    gap: 2,
  },
  infoText: {
    color: '#1F1F1F',
    fontSize: 10,
  },
  editButton: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#391D65',
    paddingHorizontal: 16,
    paddingVertical: 2.5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  tabButton: {
    marginHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    color: '#DABCFF',
  },
  activeTabText: {
    color: '#391D65',
    fontFamily: 'DMSansBold',
  },
  activeTabUnderline: {
    width: '100%',
    height: 3,
    backgroundColor: '#391D65',
    marginTop: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
});
