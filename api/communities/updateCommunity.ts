const updateCommunity = async (id: string) => {
    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    const token = await AsyncStorage.getItem('authToken');
    try {
        const response = await axios.put(`${apiURL}/v1/api/communities/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating community:', error);
        throw error;
    }
}