import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '@/HOC';
import { Back, Close, Options, Plus, PlusSmall } from '@/assets/icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Eclipse, X } from 'lucide-react-native';
import { NavHead } from '@/components/HeadRoute';
import { colors } from '@/utils/color';

export default function Dashboard() {
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);
  const [courseType, setCourseType] = useState('self-paced');
  const [setting, openSetting] = useState(true);
  const [visible, setVisible] = useState(false);

  const handleVisible = () => setVisible(!visible);
  const menuItems = [
    {
      icon: <Ionicons name="lock-closed-outline" size={22} color="#4B0082" />,
      label: 'Access',
      right: 'Draft',
    },
    {
      icon: <Ionicons name="link-outline" size={22} color="#4B0082" />,
      label: 'Copy URL',
    },
    {
      icon: <Ionicons name="book-outline" size={22} color="#4B0082" />,
      label: 'Lessons',
    },
    {
      icon: <Ionicons name="card-outline" size={22} color="#4B0082" />,
      label: 'Paywall',
    },
    {
      icon: <Ionicons name="options-outline" size={22} color="#4B0082" />,
      label: 'Customise',
    },
    {
      icon: <Ionicons name="people-outline" size={22} color="#4B0082" />,
      label: 'Learners',
    },
  ];

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const courseOptions = [
    {
      key: 'self-paced',
      title: 'Self-paced',
      description: 'Learners can start immediately and learn at their own pace',
    },
    {
      key: 'structured',
      title: 'Structured',
      description: 'Learning follows a structured, guided path with milestones',
    },
    {
      key: 'scheduled',
      title: 'Scheduled',
      description: 'Courses run on a set schedule with live sessions',
    },
  ];
  const getButtonStyle = (isActive: any) => ({
    width: 270, // fallback for string percentage, but better to use number below
    marginTop: 20,
    borderWidth: 1,
    backgroundColor: isActive ? '#EDE9FE' : 'white',
    padding: 12,
    borderRadius: 8,
    borderColor: isActive ? '#391D65' : 'black',
  });

  // Recommended: use flex or number for width
  // const getButtonStyle = (isActive: any) => ({
  //   alignSelf: "center",
  //   width: "85%" as any, // or use width: 0.85 if parent uses flex
  //   marginTop: 20,
  //   borderWidth: 1,
  //   backgroundColor: isActive ? "#EDE9FE" : "white",
  //   padding: 12,
  //   borderRadius: 8,
  //   borderColor: isActive ? "#391D65" : "black",
  // });

  // Or, for strict type safety:
  // const getButtonStyle = (isActive: any) => ({
  //   alignSelf: "center",
  //   width: 0.85 * Dimensions.get("window").width, // import Dimensions from 'react-native'
  //   marginTop: 20,
  //   borderWidth: 1,
  //   backgroundColor: isActive ? "#EDE9FE" : "white",
  //   padding: 12,
  //   borderRadius: 8,
  //   borderColor: isActive ? "#391D65" : "black",
  // });
  return (
    <SafeAreaWrapper>
      <NavHead text="Branding & Design" icon={<Eclipse />} />
      {/* Header */}
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Course Dashboard</Text>
          <TouchableOpacity onPress={toggleModal}>
            <MaterialIcons name="edit" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Status & Type */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Status: Draft</Text>
          </View>
          <MaterialIcons name="menu-book" size={16} color="#6B7280" />
          <Link
            style={{
              marginLeft: 10,
              textDecorationLine: 'underline',
              color: colors.primary,
            }}
            href={'/convener-screens/(cohorts)/community/create-module'}
          >
            View Courses
          </Link>
        </View>

        {/* Waitlist */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Waitlist</Text>
          <Text style={styles.cardValue}>0</Text>
        </View>

        {/* Completion Rate */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Average completion rate</Text>
          <Text style={styles.cardValue}>0%</Text>
        </View>

        {/* Draft Notice */}
        <View style={styles.draftNotice}>
          <Text style={styles.draftTitle}>This course is in draft mode.</Text>
          <Text style={styles.draftDescription}>
            Engagement data will show up here once you publish your course.
          </Text>
        </View>
      </ScrollView>
      {isModalVisible && (
        <View style={styles.backdrop}>
          <View
            style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 12,
            }}
          >
            <TouchableOpacity
              onPress={toggleModal}
              style={{
                alignSelf: 'flex-end',
                borderWidth: 2,
                borderRadius: 50,
                padding: 2,
                borderColor: 'black',
              }}
            >
              <X size={16} color="black" />
            </TouchableOpacity>
            <Text
              style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}
            >
              Choose course type
            </Text>

            {courseOptions.map((option) => {
              const isActive = courseType === option.title;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setCourseType(option.title)}
                  style={getButtonStyle(isActive)}
                >
                  <Text style={{ fontSize: 18 }}>{option.title}</Text>
                  <Text style={{ color: '#6B7280', marginTop: 5 }}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Ionicons name="close-outline" size={26} color="#4B0082" />
            </TouchableOpacity>

            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Menu items */}
            {menuItems.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.menuRow}>
                <View style={styles.rowLeft}>
                  {item.icon}
                  <Text style={styles.label}>{item.label}</Text>
                </View>
                {item.right && (
                  <Text style={styles.rightText}>{item.right}</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Delete */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                router.push('/convener-screens/(cohorts)/lesson/create-module');
              }}
            >
              <MaterialIcons name="delete-outline" size={22} color="red" />
              <Text style={styles.deleteText}>Delete community</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  settingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    marginTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F1F1F',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
  },
  courseType: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  courseTypeUnderline: {
    textDecorationLine: 'underline',
    color: '#1F1F1F',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F1F1F',
  },
  draftNotice: {
    marginTop: 32,
    alignItems: 'center',
  },
  draftTitle: {
    fontSize: 16,
    color: '#1F1F1F',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  draftDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 50,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 16,
  },
  openBtn: {
    padding: 12,
    backgroundColor: '#4B0082',
    borderRadius: 8,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  label: { marginLeft: 12, fontSize: 16, color: '#111' },
  rightText: { fontSize: 14, color: '#555' },
  deleteText: { marginLeft: 12, fontSize: 16, color: 'red' },
});
