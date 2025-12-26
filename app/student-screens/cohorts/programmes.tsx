import {
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView
} from "react-native";
import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGetProgrammes } from "@/api/programmes/getProgrammes";
import { SafeAreaWrapper } from "@/HOC";
import { Text } from "@/theme/theme";
import { Back } from "@/assets/icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ProgrammeType {
  id: string;
  name: string;
  description: string;
  type: string;
  community: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
}
const Programmes = () => {
  const router = useRouter();
  const { communityID } = useLocalSearchParams<{ communityID: string }>();
  const [communityName, setCommunityName] = useState("");

  useEffect(() => {
    const getCommunityName = async () => {
      const name = await AsyncStorage.getItem("communityName");
      if (name) {
        setCommunityName(name);
      }
    };
    getCommunityName();
  }, []);

  if (!communityID) {
    return (
      <SafeAreaWrapper>
        <View style={styles.center}>
          <Text>Community not found.</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const {
    data: programmes,
    isLoading,
    isError,
  } = useGetProgrammes(communityID);

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#391D65" />
          <Text style={styles.loadingText}>Loading programmes...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (isError) {
    return (
      <SafeAreaWrapper>
        <View style={styles.center}>
          <Text>Error fetching programmes.</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const renderItem = ({ item }: { item: ProgrammeType }) => (
    <ProgrammeItem {...item} />
  );

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Back />
          </Pressable>
          <Text style={styles.headerText}>{communityName}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView>

          <FlatList
            data={programmes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<Text variant="headerTwo" style={{ marginBottom: 16 }}>Programmes</Text>}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text>No programmes in this community yet.</Text>
              </View>
            }
          />
        </ScrollView>

      </View>
    </SafeAreaWrapper>
  );
};

const ProgrammeItem = (programme: ProgrammeType) => {
  const router = useRouter();
  const handlePress = () => {
    router.push({
      pathname: '/student-screens/cohorts/course',
      params: { programmeID: programme.id, title: programme.name, description: programme.description, type: programme.type },
    });
  };
  const progress = 30; // example progress

  return (
    <TouchableOpacity onPress={handlePress} style={styles.itemContainer}>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{programme.name}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>{programme.type}</Text>
        {/* <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%`}]} />
            </View>
            <Text style={styles.progressText}>{progress}% complete</Text> */}
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
    fontFamily: "DMSansMedium",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  headerText: {
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#F3F0F9',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E3DDF9'
  },
  itemImage: {
    width: '100%',
    height: 150,
  },
  itemContent: {
    padding: 16,
  },
  itemName: {
    fontSize: 20,
    fontFamily: 'DMSansSemiBold',
    color: '#1F1F1F',
    marginBottom: 8,
  },
  itemDescription: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'DMSansRegular',
    marginBottom: 12,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E3DDF9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5A2EA0',
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'DMSansRegular',
    color: '#5A2EA0',
    textAlign: 'right'
  }
});

export default Programmes;
