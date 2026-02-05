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
import { WebView } from 'react-native-webview';
import LessonCompletionButton from '@/components/cohorts/LessonCompletionButton';
import { useLocalSearchParams } from 'expo-router';
import { LessonComments } from '@/components/cohorts/LessonComments';
import { useGetLessonCompletion } from '@/api/lessons/getLessonCompletion';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { useCompleteLesson } from '@/api/lessons/completeLesson';
import { useGetPublishedLessons } from '@/api/communities/lessons/publishedLessons';
import { useGetProfile } from '@/api/getProfile';

const { width } = Dimensions.get('window');

// ✅ Define RichEditor ref interface
interface RichEditorRef {
  setContentHTML: (html: string) => void;
}

const Module = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonId?: string; cohortId?: string }>();
  const [lessonId, setLessonId] = useState<number | null>(params.lessonId ? Number(params.lessonId) : null);
  const [cohortId, setCohortId] = useState<number | null>(params.cohortId ? Number(params.cohortId) : null);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [title, setTitle] = useState('Untitled Lesson');
  const [media, setMedia] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);
  const richEditorRef = useRef<any>(null); // use any for editor ref to avoid strict typing issues
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!showControls) return;
    const timer = setTimeout(() => setShowControls(false), 4000);
    return () => clearTimeout(timer);
  }, [showControls]);

  // Handle auto-completion when video ends
  const { mutate: completeLesson } = useCompleteLesson();
  useEffect(() => {
    if (status?.isLoaded && status.didJustFinish && !status.isLooping && !isAlreadyCompleted && lessonId && cohortId) {
      console.log('🎥 Video finished! Marking lesson as complete...');
      completeLesson(
        { lessonId, cohort_id: cohortId },
        { onSuccess: () => setIsAlreadyCompleted(true) }
      );
    }
  }, [status, isAlreadyCompleted, lessonId, cohortId]);

  const togglePlayPause = () => {
    if (status?.isLoaded && status.isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  };

  console.log('media: ', media);

  const skip = (seconds: number) => {
    if (status?.isLoaded) {
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

  const duration = (status?.isLoaded && status.durationMillis) ? status.durationMillis : 0;
  const position = (status?.isLoaded && status.positionMillis) ? status.positionMillis : 0;



  // Fetch completion status from backend
  const { data: completionData, isLoading: isLoadingCompletion } = useGetLessonCompletion(lessonId, cohortId);

  useEffect(() => {
    if (completionData?.completed) {
      setIsAlreadyCompleted(true);
    }
  }, [completionData]);

  const { data: lessonData, isLoading: isLoadingLesson } = useGetLesson(String(lessonId || ''));

  useEffect(() => {
    if (lessonData) {
      setTitle(lessonData.name || 'Untitled Lesson');
      setMedia(lessonData.media || null);
      setText(lessonData.text || '<p>No content available</p>');

      // ✅ Update RichEditor content
      if (richEditorRef.current && lessonData.text) {
        richEditorRef.current.setContentHTML(lessonData.text);
      }
    }
  }, [lessonData]);

  const isLoading = isLoadingLesson || isLoadingCompletion;

  // Fetch all lessons in this module to find the next one
  const { data: siblingLessons = [] } = useGetPublishedLessons(
    lessonData?.module_id ? Number(lessonData.module_id) : null,
    cohortId
  );

  const nextLesson = siblingLessons.find((l: any) => l.order_number === (lessonData?.order_number + 1))
    || siblingLessons.find((l: any) => l.order_number > lessonData?.order_number);

  const goToNextLesson = () => {
    if (nextLesson) {
      router.push({
        pathname: '/student-screens/cohorts/module',
        params: {
          lessonId: nextLesson.id,
          cohortId: cohortId
        }
      });
    }
  };

  const { data: profile } = useGetProfile();
  const isLearner = profile?.user?.role === 'learner';

  // ✅ Safe RichEditor ref handler
  const handleEditorRef = (ref: any | null) => {
    if (ref) {
      richEditorRef.current = ref;
      // ✅ Set content if text is already loaded
      if (text && text !== '<p>No content available</p>') {
        ref.setContentHTML(text);
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
          {media.includes('iframe.mediadelivery.net') ? (
            <WebView
              source={{ uri: media }}
              style={styles.video}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
            />
          ) : (
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
          )}
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

        {/* Discussions Section */}
        {lessonId && (
          <LessonComments
            cohortId={cohortId || undefined}
            lessonId={lessonId}
          />
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {lessonId && cohortId && isLearner ? (
          <View style={{ flex: 1 }}>
            {isAlreadyCompleted && nextLesson ? (
              <TouchableOpacity
                onPress={goToNextLesson}
                style={[styles.button, styles.nextButton]}
              >
                <Text style={styles.nextButtonText}>Next Lesson</Text>
              </TouchableOpacity>
            ) : (
              <LessonCompletionButton
                lessonId={lessonId}
                cohortId={cohortId}
                isAlreadyCompleted={isAlreadyCompleted}
                onCompleted={() => setIsAlreadyCompleted(true)}
              />
            )}
          </View>
        ) : null}

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