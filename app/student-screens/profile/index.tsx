import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useRef } from 'react';
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
import { Image, ActivityIndicator, Linking } from 'react-native';
import { useProfile } from '@/api/profile';
import useGetJoinedCommunities from '@/api/communities/getJoinedCommunities';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatJoinedDate } from '@/utils/date';
import { ScrollView } from 'react-native';

const Profile = () => {
  const [activeTab, setActiveTab] = React.useState<'Communities' | 'Social'>(
    'Communities',
  );

  // Use React Query instead of useState + useEffect
  const { data: profile, isLoading: isProfileLoading, error: profileError, refetch } = useProfile();
  const { data: communities, isLoading: isCommunitiesLoading } = useGetJoinedCommunities();

  const isLoading = isProfileLoading || isCommunitiesLoading;
  const error = profileError;
  const bottomSheetRef = useRef<BottomSheet>(null);

  const queryClient = useQueryClient();

  const logOut = async () => {
    try {
      // Clear ALL query data
      queryClient.clear();

      // Clear auth storage
      await AsyncStorage.removeItem('authToken');

      console.log('Logout successful - cache cleared');

      // Navigate to login (use replace to prevent going back)
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure cleanup happens even on error
      queryClient.clear();
      await AsyncStorage.removeItem('authToken');
      router.replace('/(auth)/login');
    }
  };
  const Community = (id: any, name: string) => {
    return (
      <View
        key={id}
        style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}
      >
        <View
          style={{
            backgroundColor: '#F2750D',
            width: 40,
            height: 40,
            borderRadius: 8,
          }}
        />
        <View>
          <Text
            style={{
              fontFamily: 'DMSansMedium',
              fontSize: 12,
              color: '#1F1F1F',
            }}
          >
            {name}
          </Text>
          <Text style={{ color: '#8D9091', fontSize: 10 }}>15.8K Members</Text>
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
    console.log(index);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#391D65" />
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Pressable onPress={openBottomSheet}>
          <Options />
        </Pressable>
      </View>

      {/* Profile Info */}
      <View style={styles.profileContainer}>
        {profile?.profile_image ? (
          <Image
            source={{ uri: profile.message.profile_image }}
            style={[styles.profileImage, { backgroundColor: 'transparent' }]}
          />
        ) : (
          <View style={styles.profileImage} />
        )}
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>
            {profile?.message.first_name} {profile?.message.last_name}
          </Text>

          <View style={styles.infoRow}>
            <Location />
            <Text style={styles.infoText}>
              {profile?.message.location || 'No location set'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              const url = profile?.message.socials || 'https://copywritingprompts.com';
              Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
            }}
          >
            <View style={styles.infoRow}>
              <Share />
              <Text
                style={[styles.infoText, { textDecorationLine: 'underline' }]}
              >
                {profile?.message.socials && 'Social Link'}
              </Text>
            </View>
          </Pressable>
          {profile?.message.bio && (
            <Text
              style={{
                fontFamily: 'DMSansRegular',
                fontSize: 13,
                textAlign: 'center',
                color: '#1F1F1F',
                marginTop: 8,
                paddingHorizontal: 20,
              }}
            >
              {profile?.message.bio}
            </Text>
          )}
          <View style={styles.infoRow}>
            <Calender />
            <Text style={styles.infoText}>
              Joined {formatJoinedDate(profile?.message.created_at)}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push('/student-screens/profile/edit-profile')
            }
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
          <ScrollView
            style={{ flex: 1, marginTop: 16 }}
            contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
          >
            {communities?.map((data: any) => (
              <React.Fragment key={data.id}>
                {Community(data.id, data.name)}
              </React.Fragment>
            ))}
            {communities?.length === 0 && (
              <Text style={{ textAlign: 'center', color: '#8D9091', marginTop: 20 }}>
                No communities joined yet
              </Text>
            )}
          </ScrollView>
        ) : (
          <View style={{ gap: 16, marginTop: 24, paddingHorizontal: 20 }}>
            {profile?.socials ? (
              <Pressable
                onPress={() => {
                  const url = profile.socials;
                  Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Share />
                <Text
                  style={{
                    color: '#391D65',
                    fontSize: 14,
                    fontFamily: 'DMSansMedium',
                    textDecorationLine: 'underline',
                  }}
                >
                  {profile.socials}
                </Text>
              </Pressable>
            ) : (
              <Text style={{ textAlign: 'center', color: '#8D9091' }}>
                No social links added
              </Text>
            )}
          </View>
        )}
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={[1, '30%', '30%']}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={{ marginTop: 24, flex: 1, gap: 16 }}>
            <Pressable
              onPress={() =>
                router.push('/student-screens/profile/edit-profile')
              }
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <Pencil />
              <Text style={{ color: '#1F1F1F', fontFamily: 'DMSansRegular' }}>
                Edit profile
              </Text>
            </Pressable>
            {/*<Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <Notifications />
              <Text style={{ color: '#1F1F1F', fontFamily: 'DMSansRegular' }}>
                Cohort notifications
              </Text>
            </Pressable>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <Lock />
              <Text style={{ color: '#1F1F1F', fontFamily: 'DMSansRegular' }}>
                Account authentication
              </Text>
            </Pressable> */}
            <Pressable
              onPress={logOut}
              style={{
                marginTop: 'auto',
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: '#EFEFEF',
              }}
            >
              <Text style={{ color: '#1F1F1F', fontFamily: 'DMSansRegular' }}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#D00000',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#391D65',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
  },
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
    borderRadius: 76,
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
