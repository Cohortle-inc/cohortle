import { SafeAreaWrapper } from '@/HOC';
import { useRouter } from 'expo-router';
import { Text, TextInput, View } from 'react-native';

const DeleteCourse = () => {
  const router = useRouter();
  return (
    <SafeAreaWrapper>
      {/*/ header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: 'white',
          borderBottomWidth: 1,
        }}
      >
        <Text>Delete course</Text>
      </View>
      <View style={{ padding: 16, gap: 16, paddingTop: 32 }}>
        <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
          Delete this course?
        </Text>
        <Text style={{ fontSize: 14, color: '#555' }}>
          If you proceed, you will permanently lose ALL the data associated with
          this cohort group. This includes:
        </Text>

        <View style={{ paddingLeft: 16, gap: 8 }}>
          <Text
            style={{
              fontWeight: 600,
              fontSize: 18,
              color: '#555',
              marginBottom: 10,
            }}
          >
            Course name
          </Text>
          <Text style={{ fontSize: 14, color: '#555' }}>
            Modules and lessons
          </Text>
          <Text style={{ fontSize: 14, color: '#555' }}>
            All learners completion progress
          </Text>
          <Text style={{ fontSize: 14, color: '#555' }}>Videos and files</Text>
          <Text style={{ fontSize: 14, color: '#555' }}>Comments</Text>
          <Text style={{ fontSize: 14, color: '#555' }}>Cohorts learners</Text>
          <Text style={{ fontSize: 14, color: '#555' }}>
            Course Customization
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, color: '#555' }}>
            To confirm, please type{' '}
            <Text style={{ fontWeight: 700 }}>Delete</Text> into the textbox
            below
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View
            style={{
              flex: 1,
              borderRadius: 50,
              borderWidth: 1,
              borderColor: '#ccc',
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text
              onPress={() => router.back()}
              style={{ color: '#555', fontSize: 16 }}
            >
              Cancel
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              borderRadius: 50,
              backgroundColor: 'red',
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Delete
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

export default DeleteCourse;
