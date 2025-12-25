import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useGetSchedule, useCreateSchedule, SchedulePayload } from '@/api/cohorts/schedule';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';

interface CohortScheduleManagerProps {
  cohortId: number;
} 

export const CohortScheduleManager: React.FC<CohortScheduleManagerProps> = ({ cohortId }) => {
  const { data: scheduleData = [], isLoading } = useGetSchedule(cohortId.toString());
  console.log('scheduleData: ', scheduleData);
  const createScheduleMutation = useCreateSchedule(cohortId.toString());

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [link, setLink] = useState('');
  const [duration, setDuration] = useState('');
  const [isFormVisible, setFormVisible] = useState(false);

  const handleCreateSchedule = () => {
    if (!title || !date) {
      Alert.alert('Validation', 'Title and Date are required.');
      return;
    }

    const durationInt = parseInt(duration, 10);

    const payload: SchedulePayload = {
      title,
      scheduled_date: date,
      meeting_link: link,
      scheduled_time: time || undefined,
      duration_minutes: !isNaN(durationInt) ? durationInt : undefined,
    };

    createScheduleMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Success', 'Schedule created successfully');
        setTitle('');
        setDate('');
        setTime('');
        setLink('');
        setDuration('');
        setFormVisible(false);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to create schedule');
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.scheduleItem}>
      <View style={styles.scheduleHeader}>
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{new Date(item.scheduled_date).toLocaleString('default', { month: 'short' })}</Text>
          <Text style={styles.dateDay}>{new Date(item.scheduled_date).getDate()}</Text>
        </View>
        <View style={styles.detailsBox}>
          <Text style={styles.scheduleTitle} numberOfLines={1}>{item.title}</Text>
          {item.meeting_link ? <Text style={styles.scheduleLink} numberOfLines={1}>{item.meeting_link}</Text> : null}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.scheduleTime}>{item.scheduled_time || 'TBD'}</Text>
            {!!item.duration_minutes && (
              <Text style={styles.duration}>• {item.duration_minutes} mins</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Live Sessions</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setFormVisible(!isFormVisible)}
        >
          <Ionicons name={isFormVisible ? "close" : "add"} size={20} color="#fff" />
          <Text style={styles.addButtonText}>{isFormVisible ? "Cancel" : "Add Session"}</Text>
        </TouchableOpacity>
      </View>
      
      {isFormVisible && (
      <View style={styles.form}>
        <Text style={styles.formTitle}>New Session Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Session Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Time (HH:MM)"
          value={time}
          onChangeText={setTime}
        />
        <TextInput
          style={styles.input}
          placeholder="Meeting Link"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Duration (minutes)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateSchedule}
          disabled={createScheduleMutation.isPending}
        >
          {createScheduleMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Schedule</Text>
          )}
        </TouchableOpacity>
      </View>
      )}

      <Text style={styles.subHeader}>Upcoming</Text>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        scheduleData.length === 0 ? (
          <Text style={styles.emptyText}>No scheduled sessions.</Text>
        ) : (
          <FlatList
            data={scheduleData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1F1F1F' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary || '#4B0082', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 4 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  subHeader: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1 },
  
  form: { 
    backgroundColor: '#F8F9FA', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  formTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#333' },
  input: { 
    borderWidth: 1, 
    borderColor: '#dee2e6', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12, 
    backgroundColor: '#fff',
    fontSize: 14
  },
  button: { backgroundColor: colors.primary || '#4B0082', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  listContent: { paddingBottom: 20 },
  scheduleItem: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center'
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateBox: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60
  },
  dateMonth: {
    fontSize: 12,
    color: colors.primary || '#4B0082',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F1F1F'
  },
  detailsBox: {
    flex: 1,
    justifyContent: 'center'
  },
  scheduleTitle: {
    color: '#1F1F1F',
    fontWeight: '600', 
    fontSize: 16,
    marginBottom: 4 
  },
  scheduleLink: { 
    color: colors.primary || '#4B0082', 
    fontSize: 14,
    marginBottom: 4 
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  scheduleTime: { 
    color: '#666', 
    fontSize: 14 
  },
  duration: { 
    color: '#666', 
    fontSize: 14 
  },
  emptyText: { fontStyle: 'italic', color: '#adb5bd', textAlign: 'center', marginTop: 20 },
});
