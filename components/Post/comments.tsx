import { backgroundColor } from "@shopify/restyle"
import { View, StyleSheet, Text } from "react-native"

export const Comment = () => {
    return (
        <View style={styles.container}>
            <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
                <View style={{width: 30, height: 30, borderRadius: 20, backgroundColor: '#40135B', marginBottom: 10}}></View>
                <Text style={{marginBottom: 6}}>John Doe</Text>
            </View>
            <Text>This is a comment.</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderColor: '#f0f0f0',
        borderTopWidth: 1
    }
})