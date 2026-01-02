import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';
import { Placeholder } from '@/assets/images';
import { useRouter } from 'expo-router';
import { Posts } from '@/types/postTypes';
import { formatPostDate } from '@/utils/date';

interface PostMessageProps {
  withImg?: boolean;
  postMessage: Posts;
}

const Message: React.FC<PostMessageProps> = ({ withImg, postMessage }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={{
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ECDCFF',
        borderRadius: 8,
      }}
      key={postMessage.id}
      onPress={() =>
        router.push({
          pathname: `/convener-screens/upload/postView`,
          params: { id: postMessage.id.toString() },
        })
      }
    >
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#40135B',
          }}
        ></View>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Text>
            {postMessage.posted_by?.first_name}{' '}
            {postMessage.posted_by?.last_name}
          </Text>
          <Text
            style={{
              color: '#fff',
              backgroundColor: '#391D65',
              borderRadius: 999,
              padding: 4,
              fontSize: 6,
              // height: 12,
            }}
          >
            {postMessage.posted_by?.role}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 14, marginTop: 16 }}>
  Communities: {postMessage.community_names?.join(', ') || 'None'}
</Text>
        <Text style={{ fontSize: 14, marginTop: 16 }}>{postMessage.text}</Text>
        <View
          style={{
            marginTop: 16,
            alignItems: 'center',
          }}
        >
          {/* <Image source={Placeholder} /> */}
        </View>
        <Text style={{ fontSize: 10, marginTop: 16 }}>
          {formatPostDate(postMessage.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Message;
