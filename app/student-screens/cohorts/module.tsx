import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Module = () => {
  const router = useRouter();
  const [title, setTitle] = useState('Untitled Lesson');
  const [media, setMedia] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    if (!showControls) return;
    const timer = setTimeout(() => setShowControls(false), 4000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const togglePlayPause = () => {
    if (status?.isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  };

  const skip = (seconds: number) => {
    if (status?.positionMillis) {
      videoRef.current?.setPositionAsync(
        status.positionMillis + seconds * 1000,
      );
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const duration = status?.durationMillis || 0;
  const position = status?.positionMillis || 0;

  useEffect(() => {
    const loadLessonData = async () => {
      try {
        setIsLoading(true);

        const [savedMedia, savedTitle] = await Promise.all([
          AsyncStorage.getItem('media'),
          AsyncStorage.getItem('name'),
        ]);

        const videoUrl =
          savedMedia ||
          'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';

        setMedia(videoUrl);
        setTitle(savedTitle || 'Untitled Lesson');
      } catch (error) {
        console.error('Failed to load lesson data:', error);
        setMedia('https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4');
        setTitle('Demo Lesson');
      } finally {
        setIsLoading(false);
      }
    };

    loadLessonData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B085EF" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoWrapper}>
        {media ? (
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: media }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              onPlaybackStatusUpdate={setStatus}
              onLoad={() => setShowControls(true)}
              onError={(e) => console.log('Video Error:', e)}
            />
          </View>
        ) : (
          <View style={styles.noVideo}>
            <Text>Video not available</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>{title}</Text>
        {/* <Text style={styles.description}>
          Create High-Fidelity Designs and Prototypes in Figma
        </Text> */}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Mark as Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.button, styles.nextButton]}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Module;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  videoWrapper: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    overflow: 'hidden', // This makes borderRadius work!
    elevation: 8, // Android shadow
    shadowColor: '#000',
  },
  noVideo: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F1F1F',
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#391D65',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'grey',
  },
  nextButtonText: {
    color: 'red',
  },
});
