import { Text, TextInput, View } from "react-native"
import { Button } from "../ui"

export const CommentInput = () => {
    return (
        <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 20,
            paddingHorizontal: 5
        }}>
            <TextInput 
                style={{
                    borderWidth: 1,
                    borderRadius: 5,
                    borderColor: "black",
                    width: 260
                }}
            />
            <Text style={{
                padding: 10,
                backgroundColor: "#40135B",
                color: "white",
                borderRadius: 10
            }}>Se   nd</Text>

        </View>
    )
}