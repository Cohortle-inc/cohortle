import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';
import { RichEditor } from 'react-native-pell-rich-editor';

const { width } = Dimensions.get('window');

// ✅ Define RichEditor ref interface
interface RichEditorRef {
  setContentHTML: (html: string) => void;
}

const Module = () => {
  const router = useRouter();
  const [title, setTitle] = useState('Untitled Lesson');
  const [media, setMedia] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<Video>(null);
  const richEditorRef = useRef<RichEditorRef>(null); // ✅ Proper ref for RichEditor
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

  console.log('media: ', media);

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

        const [savedMedia, savedTitle, savedText] = await Promise.all([
          AsyncStorage.getItem('media'),
          AsyncStorage.getItem('name'),
          AsyncStorage.getItem('text'),
        ]);

        console.log('📥 Loaded from storage:', {
          media: savedMedia?.substring(0, 50),
          title: savedTitle,
          textLength: savedText?.length
        });

        // ✅ Handle media URL properly
        const videoUrl = savedMedia || null;
        setMedia(videoUrl);
        setTitle(savedTitle || 'Untitled Lesson');
        setText(savedText || '<p>No content available</p>');
        
        // ✅ Update RichEditor content after a short delay
        setTimeout(() => {
          if (richEditorRef.current && savedText) {
            richEditorRef.current.setContentHTML(savedText);
          }
        }, 100);

      } catch (error) {
        console.error('Failed to load lesson data:', error);
        setMedia(null);
        setTitle('Untitled Lesson');
        setText('<p>Failed to load content</p>');
      } finally {
        setIsLoading(false);
      }
    };

    loadLessonData();
  }, []);

  // ✅ Safe RichEditor ref handler
  const handleEditorRef = (ref: RichEditorRef | null) => {
    if (ref) {
      richEditorRef.current = ref;
      // ✅ Set content if text is already loaded
      if (text && text !== '<p>No content available</p>') {
        setTimeout(() => {
          ref.setContentHTML(text);
        }, 50);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B085EF" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Player */}
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
              onLoad={() => {
                console.log('✅ Video loaded successfully');
                setShowControls(true);
              }}
              onError={(e) => {
                console.log('❌ Video Error:', e);
                setMedia(null); // Fallback to no video state
              }}
            />
          </View>
        ) : (
          <View>
          </View>
        )}

      {/* Content */}
      <ScrollView 
        style={styles.contentSection}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>{title}</Text>
        
        {/* ✅ Fixed RichEditor with proper ref handling */}
        <View style={styles.editorContainer}>
          <RichEditor
            ref={handleEditorRef}
            initialContentHTML={text || '<p>No content available</p>'}
            disabled={true}
            style={styles.richEditor}
            useContainer={true}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Mark as Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.button, styles.nextButton]}
        >
          <Text style={styles.nextButtonText}>
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
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
  },
  noVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: '#fff',
    fontSize: 16,
  },
  contentSection: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for buttons
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F1F1F',
    marginBottom: 16,
  },
  editorContainer: {
    minHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  richEditor: {
    minHeight: 200,
    backgroundColor: '#fff',
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});