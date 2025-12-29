import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaWrapper } from '@/HOC';
import { NavHead } from '@/components/HeadRoute';
import { Text } from '@/theme/theme';
import { PlusSmall } from '@/assets/icons';
import { useGetCohortsByProgramme } from '@/api/cohorts/getCohortsByProgramme';
import { useCreateCohort } from '@/api/cohorts/postCohort';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';
import { showMessage } from 'react-native-flash-message';
import { colors } from '@/utils/color';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';

interface FormData {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    max_members: string;
}

const CohortList = () => {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const programmeId = Number(id);
    const router = useRouter();

    const [isModalVisible, setModalVisible] = useState(false);

    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            name: '',
            description: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            max_members: '5',
        }
    });

    const formatDate = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;
        if (cleaned.length > 4) formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
        if (cleaned.length > 6) formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
        return formatted.slice(0, 10);
    };

    const validateDate = (dateString: string) => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    };

    const { data: cohortsResponse, isLoading } = useGetCohortsByProgramme(programmeId);
    const cohorts = cohortsResponse?.cohorts || [];

    const { mutate: createCohort, isPending } = useCreateCohort(programmeId);

    const onSubmit = (data: FormData) => {
        if (new Date(data.start_date) > new Date(data.end_date)) {
            showMessage({
                message: 'Validation Error',
                description: 'End date must be after start date',
                type: 'danger',
            });
            return;
        }

        createCohort(
            {
                ...data,
                max_members: Number(data.max_members),
            },
            {
                onSuccess: () => {
                    setModalVisible(false);
                    reset();
                },
            }
        );
    };

    const renderCohortItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.cohortItem}
            onPress={() =>
                router.push({
                    pathname: '/convener-screens/(cohorts)/community/(course)/cohorts/details/[id]',
                    params: { id: item.id, name: item.name },
                })
            }
        >
            <View style={styles.cohortIcon}>
                <Ionicons name="people-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cohortName}>{item.name}</Text>
                <Text style={styles.cohortDates}>
                    {item.start_date} - {item.end_date}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaWrapper>
            <NavHead text={`Cohorts - ${name}`} />

            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>All Cohorts</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <PlusSmall style={{ color: '#fff' }} />
                        <Text style={styles.addButtonText}>New Cohort</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : cohorts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No cohorts found for this programme.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={cohorts}
                        renderItem={renderCohortItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>

            <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create New Cohort</Text>

                    <Controller
                        control={control}
                        name="name"
                        rules={{ required: 'Cohort name is required' }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Cohort Name"
                                value={value}
                                onChangeText={onChange}
                                placeholder="e.g. Winter 2024"
                                error={errors.name?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="description"
                        rules={{ required: 'Description is required' }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Description"
                                value={value}
                                onChangeText={onChange}
                                placeholder="Brief description"
                                error={errors.description?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="start_date"
                        rules={{
                            required: 'Start date is required',
                            validate: value => validateDate(value) || 'Invalid date format (YYYY-MM-DD)'
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Start Date (YYYY-MM-DD)"
                                value={value}
                                onChangeText={(text: string) => onChange(formatDate(text))}
                                placeholder="YYYY-MM-DD"
                                keyboardType="numeric"
                                error={errors.start_date?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="end_date"
                        rules={{
                            required: 'End date is required',
                            validate: value => validateDate(value) || 'Invalid date format (YYYY-MM-DD)'
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="End Date (YYYY-MM-DD)"
                                value={value}
                                onChangeText={(text: string) => onChange(formatDate(text))}
                                placeholder="YYYY-MM-DD"
                                keyboardType="numeric"
                                error={errors.end_date?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="max_members"
                        rules={{
                            required: 'Max members is required',
                            validate: value => (Number(value) >= 1) || 'Must be at least 1 member'
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Max Members"
                                value={value}
                                onChangeText={(text: string) => onChange(text.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                                error={errors.max_members?.message}
                            />
                        )}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, isPending && { opacity: 0.7 }]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isPending}
                    >
                        <Text style={styles.submitButtonText}>
                            {isPending ? 'Creating...' : 'Create Cohort'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: { fontSize: 20, fontWeight: '700', color: '#1F1F1F' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    listContent: { paddingBottom: 20 },
    cohortItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
    },
    cohortIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.purpleShade,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cohortName: { fontSize: 16, fontWeight: '700', color: '#1F1F1F' },
    cohortDates: { fontSize: 12, color: '#666', marginTop: 4 },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#888', fontSize: 16 },
    modalContent: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        gap: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 32,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default CohortList;
