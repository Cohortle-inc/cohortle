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
import { usePostPartnerContext } from '@/api/onboarding/postPartnerContext';
import { Back } from '@/assets/icons';
import { colors } from '@/utils/color';

const LEARNER_TYPES = [
    'Students',
    'Early-career professionals',
    'Founders',
    'Career switchers',
];

const CHALLENGES = [
    'Managing participants',
    'Communication',
    'Engagement',
    'Tracking progress',
    'Certificates / reporting',
];

const PartnerContext = () => {
    const { token } = useLocalSearchParams<{ token: string }>();
    const [learnerTypes, setLearnerTypes] = useState<string[]>([]);
    const [challenges, setChallenges] = useState<string[]>([]);

    const { mutate: postContext, isPending } = usePostPartnerContext();

    const toggleSelection = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleContinue = () => {
        postContext(
            { learner_types: learnerTypes, biggest_challenges: challenges },
            {
                onSuccess: () => {
                    router.push({
                        pathname: '/(auth)/(convener)/welcome',
                        params: { token },
                    });
                },
                onError: () => {
                    // Fallback
                    router.push({
                        pathname: '/(auth)/(convener)/welcome',
                        params: { token },
                    });
                },
            }
        );
    };

    const handleSkip = () => {
        router.push({
            pathname: '/(auth)/(convener)/welcome',
            params: { token },
        });
    };

    const renderChip = (item: string, isSelected: boolean, onToggle: () => void) => (
        <TouchableOpacity
            key={item}
            onPress={onToggle}
            style={[styles.chip, isSelected && styles.activeChip]}
        >
            <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <Header number={3} total={3} />

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Help us support you better</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Who are your learners?</Text>
                        <View style={styles.chipContainer}>
                            {LEARNER_TYPES.map((type) =>
                                renderChip(type, learnerTypes.includes(type), () => toggleSelection(learnerTypes, setLearnerTypes, type))
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Biggest challenge today:</Text>
                        <View style={styles.chipContainer}>
                            {CHALLENGES.map((challenge) =>
                                renderChip(challenge, challenges.includes(challenge), () => toggleSelection(challenges, setChallenges, challenge))
                            )}
                        </View>
                    </View>

                    <Pressable
                        onPress={handleContinue}
                        disabled={isPending}
                        style={[styles.submitBtn, isPending && styles.disabledBtn]}
                    >
                        {isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Continue</Text>
                        )}
                    </Pressable>

                    <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                        <Text style={styles.skipText}>Skip for now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Back />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaWrapper>
    );
};

export default PartnerContext;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    headerTitleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginVertical: 32,
    },
    title: {
        fontSize: 22,
        fontFamily: 'DMSansBold',
        color: colors.primary,
        textAlign: 'center',
    },
    optionalBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    optionalText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'DMSansMedium',
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
    skipBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    skipText: {
        color: '#6B7280',
        fontSize: 14,
        fontFamily: 'DMSansMedium',
        textDecorationLine: 'underline',
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
