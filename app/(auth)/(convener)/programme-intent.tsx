import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { usePostProgrammeIntent } from '@/api/programmes/postProgrammeIntent';
import { Back } from '@/assets/icons';
import { colors } from '@/utils/color';

const PROGRAMME_CATEGORIES = [
    'Fellowship',
    'Bootcamp',
    'Mentorship',
    'Community learning',
    'Other',
];

const COHORT_SIZES = ['1–20', '21–50', '51–100', '100+'];

const DURATION_UNITS = ['Weeks', 'Months'];

const DELIVERY_MODES = ['Online', 'Hybrid', 'Physical'];

const ProgrammeIntent = () => {
    const { token } = useLocalSearchParams<{ token: string }>();
    const [formData, setFormData] = useState({
        programme_type: '',
        expected_cohort_size: '',
        programme_duration: '',
        mode: '',
    });

    const { mutate: postIntent, isPending } = usePostProgrammeIntent();

    const handleSelect = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const isFormValid =
        formData.programme_type &&
        formData.expected_cohort_size &&
        formData.programme_duration &&
        formData.mode;

    const handleContinue = () => {
        if (!isFormValid) return;

        postIntent(formData, {
            onSuccess: () => {
                router.push({
                    pathname: '/(auth)/(convener)/community-info',
                    params: { token },
                });
            },
            onError: (error: any) => {
                console.error('Error submitting intent:', error);
                // Fallback navigation if API fails but we want to continue onboarding
                router.push({
                    pathname: '/(auth)/(convener)/about',
                    params: { token },
                });
            }
        });
    };

    const renderChip = (field: string, value: string) => {
        const isActive = formData[field as keyof typeof formData] === value;
        return (
            <TouchableOpacity
                key={value}
                onPress={() => handleSelect(field, value)}
                style={[styles.chip, isActive && styles.activeChip]}
            >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                    {value}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <Header number={1} total={3} />
                    <Text style={styles.title}>Tell us about the programme you want to run</Text>

                    <View style={styles.section}>
                        <Text style={styles.label}>Programme type</Text>
                        <View style={styles.chipContainer}>
                            {PROGRAMME_CATEGORIES.map((cat) => renderChip('programme_type', cat))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Expected cohort size</Text>
                        <View style={styles.chipContainer}>
                            {COHORT_SIZES.map((size) => renderChip('expected_cohort_size', size))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Programme duration</Text>
                        <View style={styles.chipContainer}>
                            {DURATION_UNITS.map((unit) => renderChip('programme_duration', unit))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Mode</Text>
                        <View style={styles.chipContainer}>
                            {DELIVERY_MODES.map((m) => renderChip('mode', m))}
                        </View>
                    </View>

                    <Pressable
                        onPress={handleContinue}
                        disabled={!isFormValid || isPending}
                        style={[styles.submitBtn, (!isFormValid || isPending) && styles.disabledBtn]}
                    >
                        {isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Continue</Text>
                        )}
                    </Pressable>

                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Back />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaWrapper>
    );
};

export default ProgrammeIntent;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontFamily: 'DMSansBold',
        color: colors.primary,
        textAlign: 'center',
        marginVertical: 32,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 18,
        fontFamily: 'DMSansMedium',
        color: '#4B5563',
        marginBottom: 12,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    activeChip: {
        borderColor: '#391D65',
        backgroundColor: '#F3E8FF',
    },
    chipText: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'DMSansMedium',
    },
    activeChipText: {
        color: '#391D65',
    },
    submitBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 32,
        marginTop: 32,
        backgroundColor: '#391D65',
    },
    disabledBtn: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'DMSansSemiBold',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
        paddingVertical: 10,
    },
    backText: {
        color: '#391D65',
        fontSize: 14,
        fontFamily: 'DMSansMedium',
    },
});
