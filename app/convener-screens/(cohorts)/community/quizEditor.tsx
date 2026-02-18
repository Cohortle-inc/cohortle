import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';
import { Ionicons } from '@expo/vector-icons';

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

interface QuizData {
  questions: QuizQuestion[];
}

const QuizEditor = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleTitle = (useLocalSearchParams().moduleTitle as string) || 'Module';
  const { data: lessonData, isLoading } = useGetLesson(lessonID);

  useEffect(() => {
    if (lessonData && !isLoading) {
      console.log('📥 Loading quiz lesson data');

      // Try to parse existing quiz data from description field
      if (lessonData.description) {
        try {
          const quizData: QuizData = JSON.parse(lessonData.description);
          if (quizData.questions && Array.isArray(quizData.questions)) {
            setQuestions(quizData.questions);
          }
        } catch (error) {
          console.log('Could not parse quiz data, starting fresh');
        }
      }
    }
  }, [lessonData, isLoading]);

  const generateId = () => {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: generateId(),
      question: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: string, questionText: string) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId ? { ...q, question: questionText } : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(
      questions.map(q => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = { ...newOptions[optionIndex], text };
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const setCorrectAnswer = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map(q => {
        if (q.id === questionId) {
          const newOptions = q.options.map((opt, idx) => ({
            ...opt,
            isCorrect: idx === optionIndex,
          }));
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const validateQuiz = (): string | null => {
    if (questions.length === 0) {
      return 'Please add at least one question';
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.question.trim()) {
        return `Question ${i + 1} is empty`;
      }

      const filledOptions = q.options.filter(opt => opt.text.trim());
      if (filledOptions.length < 2) {
        return `Question ${i + 1} needs at least 2 options`;
      }

      const hasCorrectAnswer = q.options.some(opt => opt.isCorrect && opt.text.trim());
      if (!hasCorrectAnswer) {
        return `Question ${i + 1} needs a correct answer`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateQuiz();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setLoading(true);
    try {
      const quizData: QuizData = { questions };
      const quizDataJson = JSON.stringify(quizData);
      console.log('💾 Saving quiz lesson data');

      await uploadLessonMedia(lessonID, '', quizDataJson);

      setLoading(false);
      Alert.alert('Success', 'Quiz saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Save Error:', error);
      setLoading(false);

      const errorMessage = error?.message || 'Could not save quiz. Please try again.';
      Alert.alert('Save Failed', errorMessage, [
        { text: 'OK', style: 'default' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavHead text={moduleTitle} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="help-circle-outline" size={32} color={colors.primary} />
          <Text style={styles.headerTitle}>
            {isLoading ? '...' : lessonData?.name || 'Quiz'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Create multiple choice questions for students
          </Text>
        </View>

        {questions.map((question, qIndex) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
              <TouchableOpacity
                onPress={() => removeQuestion(question.id)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.questionInput}
              placeholder="Enter your question..."
              value={question.question}
              onChangeText={text => updateQuestion(question.id, text)}
              multiline
            />

            <Text style={styles.optionsLabel}>Options (select the correct answer)</Text>

            {question.options.map((option, oIndex) => (
              <View key={oIndex} style={styles.optionRow}>
                <TouchableOpacity
                  onPress={() => setCorrectAnswer(question.id, oIndex)}
                  style={styles.radioButton}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      option.isCorrect && styles.radioOuterSelected,
                    ]}
                  >
                    {option.isCorrect && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.optionInput,
                    option.isCorrect && styles.optionInputSelected,
                  ]}
                  placeholder={`Option ${oIndex + 1}`}
                  value={option.text}
                  onChangeText={text => updateOption(question.id, oIndex, text)}
                />
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity onPress={addQuestion} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Question</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || questions.length === 0}
          style={[
            styles.saveButton,
            (loading || questions.length === 0) && styles.saveButtonDisabled,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Quiz'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 25, flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20, gap: 20 },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  removeButton: {
    padding: 4,
  },
  questionInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    padding: 4,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  optionInputSelected: {
    borderColor: colors.primary,
    backgroundColor: '#f0f9ff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButton: {
    marginTop: 30,
    width: '100%',
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizEditor;
