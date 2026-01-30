import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useGetSchedule, useCreateSchedule, SchedulePayload } from '@/api/cohorts/schedule';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/Form';
import { showMessage } from 'react-native-flash-message';

interface FormData {
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  meeting_link: string;
  duration_minutes: string;
}

interface CohortScheduleManagerProps {
  cohortId: number;
}

const CohortScheduleManager: React.FC<CohortScheduleManagerProps> = ({ cohortId }) => {
  const { data: scheduleData = [], isLoading } = useGetSchedule(cohortId.toString());
  const createScheduleMutation = useCreateSchedule(cohortId.toString());

  const [isFormVisible, setFormVisible] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      meeting_link: '',
      duration_minutes: '60',
    }
  });

  const formatDate = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    if (cleaned.length > 6) formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    return formatted.slice(0, 10);
  };

  const formatTime = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    return formatted.slice(0, 5);
  };

  const validateDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const validateTime = (timeString: string) => {
    const regex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
    return regex.test(timeString);
  };

  const onSubmit = (data: FormData) => {
    const durationInt = parseInt(data.duration_minutes, 10);

    const payload: SchedulePayload = {
      title: data.title,
      scheduled_date: data.scheduled_date,
      meeting_link: data.meeting_link,
      scheduled_time: data.scheduled_time || undefined,
      duration_minutes: !isNaN(durationInt) ? durationInt : undefined,
    };

    createScheduleMutation.mutate(payload, {
      onSuccess: () => {
        showMessage({
          message: 'Success',
          description: 'Schedule created successfully',
          type: 'success',
        });
        reset();
        setFormVisible(false);
      },
      onError: (error: any) => {
        showMessage({
          message: 'Error',
          description: error.message || 'Failed to create schedule',
          type: 'danger',
        });
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
    <ScrollView showsVerticalScrollIndicator={false}>

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
            <View style={{ gap: 6 }}>

              <Controller
                control={control}
                name="title"
                rules={{ required: 'Session title is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Session Title"
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g. Weekly Workshop"
                    error={errors.title?.message}
                  />
                )}
              />

              <View style={styles.row}>
                <View style={{ flex: 1.2 }}>
                  <Controller
                    control={control}
                    name="scheduled_date"
                    rules={{
                      required: 'Date is required',
                      validate: value => validateDate(value) || 'Invalid format'
                    }}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Date"
                        value={value}
                        onChangeText={(text: string) => onChange(formatDate(text))}
                        placeholder="YYYY-MM-DD"
                        keyboardType="numeric"
                        error={errors.scheduled_date?.message}
                      />
                    )}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="scheduled_time"
                    rules={{
                      required: 'Time is required',
                      validate: value => validateTime(value) || 'Invalid format'
                    }}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Time"
                        value={value}
                        onChangeText={(text: string) => onChange(formatTime(text))}
                        placeholder="HH:MM"
                        keyboardType="numeric"
                        error={errors.scheduled_time?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="meeting_link"
                rules={{
                  required: 'Meeting link is required',
                  pattern: {
                    value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                    message: 'Enter a valid URL'
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Meeting Link"
                    value={value}
                    onChangeText={onChange}
                    placeholder="https://meet.google.com/j/..."
                    autoCapitalize="none"
                    error={errors.meeting_link?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="duration_minutes"
                rules={{
                  required: 'Duration is required',
                  validate: value => Number(value) >= 1 || 'Min 1 min'
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Duration (minutes)"
                    value={value}
                    onChangeText={(text: string) => onChange(text.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 60"
                    keyboardType="numeric"
                    error={errors.duration_minutes?.message}
                  />
                )}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, createScheduleMutation.isPending && { opacity: 0.7 }]}
              onPress={handleSubmit(onSubmit)}
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
    </ScrollView>
  );
};

export default CohortScheduleManager;

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
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
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
