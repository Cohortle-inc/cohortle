import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '@/HOC';
import { Back, Close, Options, Plus, PlusSmall } from '@/assets/icons';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import CohortProgressCard from './(course)/cohorts/CohortProgressCard';
import { useGetSchedule } from '@/api/cohorts/schedule';
import { Eclipse, X } from 'lucide-react-native';
import { NavHead } from '@/components/HeadRoute';
import { colors } from '@/utils/color';
import { useGetCohortAnnouncements, usePostCohortAnnouncement } from '@/api/announcements';
import { Input } from '@/components/Form';
import { showMessage } from 'react-native-flash-message';

export default function Dashboard() {
  const name = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);
  const [courseType, setCourseType] = useState('self-paced');
  const [setting, openSetting] = useState(true);
  const [visible, setVisible] = useState(false);
  const [isAnnounceModalVisible, setAnnounceModalVisible] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announcePriority, setAnnouncePriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleVisible = () => setVisible(!visible);
  const menuItems = [
    {
      icon: <Ionicons name="lock-closed-outline" size={22} color="#4B0082" />,
      label: 'Access',
      right: 'Draft',
    },
    {
      icon: <Ionicons name="link-outline" size={22} color="#4B0082" />,
      label: 'Invite Link',
    },
    {
      icon: <Ionicons name="megaphone-outline" size={22} color="#4B0082" />,
      label: 'Announcements',
    },
    {
      icon: <Ionicons name="chatbubbles-outline" size={22} color="#4B0082" />,
      label: 'Discussions',
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
    {
      icon: <Ionicons name="list-outline" size={22} color="#4B0082" />,
      label: 'Activity Log',
    },
  ];

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  // determine cohort id from route params
  const params = useLocalSearchParams<{ id?: string; cohort_id?: string }>();
  const cohortId = Number(params.id || params.cohort_id || 0);

  const { data: scheduleResponse, refetch: refetchSchedule } = useGetSchedule(cohortId.toString());
  const schedules = scheduleResponse?.schedule || scheduleResponse || [];

  const { data: announcements, isLoading: isAnnouncementsLoading } = useGetCohortAnnouncements(cohortId);
  const { mutate: createAnnouncement, isPending: isCreatingAnnouncement } = usePostCohortAnnouncement(cohortId);

  const handleCreateAnnouncement = () => {
    if (!announceTitle || !announceContent) {
      showMessage({ message: 'Error', description: 'Please fill in all fields', type: 'danger' });
      return;
    }
    createAnnouncement(
      { title: announceTitle, content: announceContent, priority: announcePriority },
      {
        onSuccess: () => {
          console.log("dd")
          setAnnounceModalVisible(false);
          setAnnounceTitle('');
          setAnnounceContent('');
        },
      }
    );
  };

  const courseOptions = [
    {
      key: 'self-paced',
      title: 'Self-paced',
      description: 'Courses starts when a member enrolls. All Content is available immediately.',
    },
    {
      key: 'structured',
      title: 'Structured',
      description: 'Courses starts when a member enrolls. Sections are dripped relative to their enrollment date.',
    },
    {
      key: 'scheduled',
      title: 'Scheduled',
      description: 'Courses starts on a specific date. Sections are dripped relative to that date.',
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
      <NavHead text={name.name} icon={<Eclipse />} />
      {/* Header */}
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Cohort Dashboard</Text>
          {/* <TouchableOpacity onPress={toggleModal}>
            <MaterialIcons name="edit" size={22} color="#6B7280" />
          </TouchableOpacity> */}
        </View>

        {/* Status & Type */}
        {/* <View style={[styles.statusRow, { justifyContent: 'space-between' }]}>
          <MaterialIcons name="menu-book" size={16} color="#6B7280" />
          <Link
            style={{
              marginLeft: 10,
              textDecorationLine: 'underline',
              color: colors.primary,
            }}
            href={'/convener-screens/(cohorts)/community/create-module'}
          >
            View contents
          </Link>
        </View> */}

        {/* New Progress Card */}
        <CohortProgressCard cohortId={cohortId} />

        {/* Schedule / Completion Rate */}
        <View style={styles.card}>
          <View style={{ marginTop: 0 }}>
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/convener-screens/(cohorts)/community/(course)/cohorts/manage-schedule',
                params: { id: cohortId }
              })}
              style={{ padding: 12, backgroundColor: '#EDE9FE', borderRadius: 8, alignItems: 'center' }}
            >
              <Text>Manage schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule list */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Upcoming sessions</Text>
          {schedules && schedules.length > 0 ? (
            schedules.map((s: any) => (
              <View key={s.id} style={{ paddingVertical: 8 }}>
                <Text style={{ fontWeight: '600' }}>{s.lesson_title || 'Session'}</Text>
                <Text style={{ color: '#666' }}>{s.scheduled_date} {s.scheduled_time || ''}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#666', marginTop: 8 }}>No scheduled sessions</Text>
          )}
        </View>

        {/* Announcements section */}
        {/* <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Recent Announcements</Text>
            <TouchableOpacity onPress={() => setAnnounceModalVisible(true)}>
              <PlusSmall style={{ color: colors.primary }} />
            </TouchableOpacity>
          </View>
          {isAnnouncementsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : announcements && announcements.length > 0 ? (
            announcements.slice(0, 3).map((a) => (
              <View key={a.id} style={styles.announcementItem}>
                <View style={[styles.priorityBadge, { backgroundColor: a.priority === 'high' ? '#FEE2E2' : a.priority === 'medium' ? '#FEF3C7' : '#DCFCE7' }]}>
                  <Text style={[styles.priorityText, { color: a.priority === 'high' ? '#991B1B' : a.priority === 'medium' ? '#92400E' : '#166534' }]}>
                    {a.priority.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.announcementTitle}>{a.title}</Text>
                <Text style={styles.announcementDate}>{new Date(a.created_at).toLocaleDateString()}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#666', marginTop: 8 }}>No announcements yet</Text>
          )}
        </View> */}
        {/* <View style={styles.draftNotice}>
          <Text style={styles.draftTitle}>This programme is in draft mode.</Text>
          <Text style={styles.draftDescription}>
            Engagement data will show up here once you publish your programme.
          </Text>
        </View> */}
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
              Choose programme type
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
      {/* Create Announcement Modal */}
      <Modal visible={isAnnounceModalVisible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setAnnounceModalVisible(false)}>
                <Close style={{ color: '#000' }} />
              </TouchableOpacity>
            </View>

            <Input
              label="Title"
              placeholder="Announcement Title"
              value={announceTitle}
              onChangeText={setAnnounceTitle}
            />

            <Input
              label="Content"
              placeholder="What do you want to announce?"
              value={announceContent}
              onChangeText={setAnnounceContent}
              multiline
              numberOfLines={4}
            />

            <View style={styles.prioritySelector}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityOptions}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setAnnouncePriority(p)}
                    style={[
                      styles.priorityOption,
                      announcePriority === p && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.priorityOptionText, announcePriority === p && { color: '#fff' }]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isCreatingAnnouncement && { opacity: 0.7 }]}
              onPress={handleCreateAnnouncement}
              disabled={isCreatingAnnouncement}
            >
              <Text style={styles.submitButtonText}>
                {isCreatingAnnouncement ? 'Publishing...' : 'Publish Announcement'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  announcementDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    alignSelf: 'center',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  prioritySelector: {
    marginTop: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  priorityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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
  rightText: { fontSize: 14, color: '#555' },
  deleteText: { marginLeft: 12, fontSize: 16, color: 'red' },
});
