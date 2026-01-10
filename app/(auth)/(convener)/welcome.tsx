import React from 'react';
import {
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { router } from 'expo-router';

const Welcome = () => {
    const handleGoToDashboard = () => {
        router.replace('/convener-screens/(cohorts)');
    };

    return (
        <SafeAreaWrapper>
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome to Cohortle 🎉</Text>

                    <View style={styles.bulletContainer}>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bulletText}>• You’re set up as a Convener.</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bulletText}>• Let’s create your first programme.</Text>
                        </View>
                    </View>
                </View>

                <Pressable
                    onPress={handleGoToDashboard}
                    style={styles.ctaBtn}
                >
                    <Text style={styles.ctaText}>Continue</Text>
                </Pressable>
            </View>
        </SafeAreaWrapper>
    );
};

export default Welcome;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        marginBottom: 60,
    },
    title: {
        fontSize: 24,
        fontFamily: 'DMSansBold',
        color: '#1F1F1F',
        marginBottom: 32,
        textAlign: 'center',
    },
    bulletContainer: {
        alignSelf: 'stretch',
        paddingHorizontal: 10,
    },
    bulletItem: {
        marginBottom: 12,
    },
    bulletText: {
        fontSize: 18,
        fontFamily: 'DMSansMedium',
        color: '#4B5563',
        lineHeight: 28,
    },
    ctaBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 32,
        backgroundColor: '#391D65',
    },
    ctaText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'DMSansSemiBold',
    },
});
