import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
    ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaWrapper } from '@/HOC';
import { NavHead } from '@/components/HeadRoute';
import { Text } from '@/theme/theme';
import { PlusSmall } from '@/assets/icons';
import { useGetCohort } from '@/api/cohorts/getCohort';
import { useGetCohortMembers } from '@/api/cohorts/getCohortMembers';
import { useAddCohortMember } from '@/api/cohorts/addCohortMember';
import { useRemoveCohortMember } from '@/api/cohorts/removeCohortMember';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';
import { colors } from '@/utils/color';
import { Ionicons } from '@expo/vector-icons';
import { SlideModal } from '@/components/Modal';
import { DiscussionSection } from '@/components/cohorts/DiscussionSection';

const CohortDetails = () => {
    const router = useRouter()
    const { id, name: cohortName } = useLocalSearchParams<{ id: string; name: string }>();
    const cohortId = Number(id);

    const [isModalVisible, setModalVisible] = useState(false);
    const [newMember, setNewMember] = useState({ email: '', role: 'learner' as const });

    const { data: cohort, isLoading: cohortLoading } = useGetCohort(id);
    const { data: membersResponse, isLoading: membersLoading } = useGetCohortMembers(cohortId);
    const members = membersResponse?.members || [];

    const { mutate: addMember, isPending: addingMember } = useAddCohortMember(cohortId);
    const { mutate: removeMember } = useRemoveCohortMember();

    const [discussionModalVisible, setDiscussionModalVisible] = useState(false);

    const handleAddMember = () => {
        if (!newMember.email.trim()) {
            Alert.alert('Error', 'Please enter an email');
            return;
        }

        addMember(newMember, {
            onSuccess: () => {
                setModalVisible(false);
                setNewMember({ email: '', role: 'learner' });
            },
        });
    };

    const handleRemoveMember = (memberId: number, memberName: string) => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${memberName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeMember({ cohortId, memberId }),
                },
            ]
        );
    };

    const renderMemberItem = ({ item }: { item: any }) => (
        <View style={styles.memberItem}>
            <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>{item.user?.name ? item.user.name[0].toUpperCase() : 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{item.user?.name || 'Unknown User'}</Text>
                <Text style={styles.memberEmail}>{item.user?.email || item.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#FFE5E5' : '#E5F1FF' }]}>
                    <Text style={[styles.roleText, { color: item.role === 'admin' ? '#FF4D4D' : '#007AFF' }]}>
                        {item.role}
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleRemoveMember(item.id, item.user?.name || item.email)}>
                <Ionicons name="trash-outline" size={22} color="#FF4D4D" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaWrapper>
            <NavHead text={cohortName || 'Cohort Details'} />

            <View style={styles.container}>
                {cohortLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <View style={styles.cohortInfo}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

                            <Text style={styles.sectionTitle}>Details</Text>
                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    backgroundColor: colors.primary,
                                    alignSelf: 'flex-start',
                                    borderRadius: 8,
                                    marginBottom: 16
                                }}
                                onPress={() => {
                                    router.push({
                                        pathname: '/convener-screens/(cohorts)/community/dashboard',
                                        params: { id: cohortId, name: cohortName }
                                    });
                                }}>
                                <Text style={{ color: colors.white, fontWeight: '600' }}>
                                    Dashboard
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Description:</Text>
                                <Text style={styles.infoValue}>{cohort?.description}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Start Date:</Text>
                                <Text style={styles.infoValue}>{cohort?.start_date}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>End Date:</Text>
                                <Text style={styles.infoValue}>{cohort?.end_date}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Max Members:</Text>
                                <Text style={styles.infoValue}>{cohort?.max_members}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <SlideModal
                    isVisible={discussionModalVisible}
                    onBackdropPress={() => setDiscussionModalVisible(false)}
                >
                    <View style={{ backgroundColor: 'white', borderRadius: 20, marginHorizontal: 10, maxHeight: '80%', overflow: 'hidden' }}>
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: '700' }}>Lesson Discussions</Text>
                            <TouchableOpacity onPress={() => setDiscussionModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ height: '100%' }}>
                            <DiscussionSection
                                cohortId={cohortId}
                            />
                        </ScrollView>
                    </View>
                </SlideModal>

                <View style={styles.membersSection}>
                    <View style={styles.header}>
                        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setDiscussionModalVisible(true)}
                        >
                            <PlusSmall color="#fff" />
                            <Text style={styles.addButtonText}>Add Member</Text>
                        </TouchableOpacity>
                    </View>

                    {membersLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : members.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No members in this cohort yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={members}
                            renderItem={renderMemberItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>
            </View>

            <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Add Cohort Member</Text>
                    <Input
                        label="Email Address"
                        value={newMember.email}
                        onChangeText={(text: string) => setNewMember({ ...newMember, email: text })}
                        placeholder="member@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Role</Text>
                    <View style={styles.roleSelection}>
                        <TouchableOpacity
                            style={[styles.roleOption, newMember.role === 'learner' && styles.roleOptionActive]}
                            onPress={() => setNewMember({ ...newMember, role: 'learner' })}
                        >
                            <Text style={[styles.roleOptionText, newMember.role === 'learner' && styles.roleOptionTextActive]}>Learner</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                        // style={[styles.roleOption, newMember.role === 'facilitator' && styles.roleOptionActive]}
                        // onPress={() => setNewMember({ ...newMember, role: 'facilitator' })}
                        >
                            {/* <Text style={[styles.roleOptionText, newMember.role === 'facilitator' && styles.roleOptionTextActive]}>Facilitator</Text> */}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, addingMember && { opacity: 0.7 }]}
                        onPress={handleAddMember}
                        disabled={addingMember}
                    >
                        <Text style={styles.submitButtonText}>
                            {addingMember ? 'Adding...' : 'Add Member'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    cohortInfo: { marginBottom: 24, },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F1F1F', marginBottom: 12 },
    infoCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    infoRow: { flexDirection: 'row', marginBottom: 8 },
    infoLabel: { width: 100, fontWeight: '600', color: '#666' },
    infoValue: { flex: 1, color: '#1F1F1F' },
    membersSection: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 2,
    },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    listContent: { paddingBottom: 20 },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.purpleShade,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
    memberName: { fontSize: 15, fontWeight: '600', color: '#1F1F1F' },
    memberEmail: { fontSize: 13, color: '#666' },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
    },
    roleText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#888', fontSize: 14 },
    modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, gap: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: -8 },
    roleSelection: { flexDirection: 'row', gap: 12 },
    roleOption: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        alignItems: 'center',
    },
    roleOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleOptionText: { color: '#666', fontWeight: '600' },
    roleOptionTextActive: { color: '#fff' },
    submitButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 32,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default CohortDetails;
