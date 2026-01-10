import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Theme } from '@/theme/theme';
import { useTheme } from '@shopify/restyle';

interface RadioButtonProps {
    label: string;
    selected: boolean;
    onSelect: () => void;
}

export const RadioButton = ({ label, selected, onSelect }: RadioButtonProps) => {
    const theme = useTheme<Theme>();

    return (
        <TouchableOpacity
            onPress={onSelect}
            style={styles.container}
            activeOpacity={0.7}
        >
            <View style={[styles.radio, { borderColor: theme.colors.primary }]}>
                {selected && (
                    <View
                        style={[styles.selectedInner, { backgroundColor: theme.colors.primary }]}
                    />
                )}
            </View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    selectedInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    label: {
        fontSize: 16,
        fontFamily: 'DMSansRegular',
        color: '#333',
    },
});
