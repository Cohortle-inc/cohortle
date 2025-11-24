import * as DocumentPicker from 'expo-document-picker';
import { Back } from '@/assets/icons';
import { SafeAreaWrapper } from '@/HOC';

import {
  Link,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { Button } from '@rneui/themed';
import { colors } from '@/utils/color';
import { SlideModal } from '@/components/Modal';
import { OptionModal } from '@/components/optionModal';
import { DropdownInput } from '@/components/Form';
import Dropdown from '@/components/dropdown';
import { NavHead } from '@/components/HeadRoute';
import useGetCommunity from '@/api/communities/getCommunity';
import { usePostModule } from '@/api/communities/modules/postModule';
import useGetModules from '@/api/communities/modules/getModules';
import {
  LessonProp,
  usePostLesson,
} from '@/api/communities/lessons/postLessons';
import { useGetLessons } from '@/api/communities/lessons/getLessons';
import { useDeleteLesson } from '@/api/communities/lessons/deleteLesson';
import { useEditLesson } from '@/api/communities/lessons/updateLesson';

type Props = {};

const Index = (props: Props) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numeric = Number(id);
  const community = useGetCommunity(5, id);
  const { mutate } = usePostModule(numeric);
  const { data: modules = [] } = useGetModules(numeric);

  console.log(id);
  // Utility to display file size in MB
  const formatSize = (size: number) => {
    if (!size) return '';
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCreateModule = () => {
    const newModule = {
      community_id: numeric,
      title: 'Intro to BB-Gun',
      order_number: modules.length + 1,
    };
    mutate(newModule, {
      onSuccess: (response) => {
        console.log('SUccessful!: ', response);
      },
      onError: (error) => {
        console.log('Failed to Create: ', error);
      },
    });
  };

  return (
    <SafeAreaWrapper>
      <NavHead text="kkk" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Modules</Text>
          <Text style={styles.courseType}>
            Course type: <Text style={styles.link}>Self-paced</Text>
          </Text>
        </View>

        {/* Top info bar */}
        <View style={styles.topInfo}>
          <Text style={styles.topInfoText}>
            <Text style={styles.bold}>{modules.length}</Text> Modules •{' '}
            <Text style={styles.bold}>0</Text> contents
          </Text>
          <TouchableOpacity
            onPress={handleCreateModule}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add module</Text>
          </TouchableOpacity>
        </View>

        {/* Modules list */}
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>MODULES</Text>

          {/* Module */}
          {modules.length > 0 ? (
            <View>
              {modules.map((module: ModuleType) => (
                <Module {...module} />
              ))}
            </View>
          ) : (
            <Text>kkk</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default Index;

interface ModuleType {
  id: number;
  community_id: number;
  title: string;
  order_number: number;
  status: string;
}

export const Module = ({ id, community_id, title }: ModuleType) => {
  const [selectedLesson, setSelectedLesson] = useState<LessonProp | null>(null);
  const [optionModal, setOptionModal] = useState(0);

  const [moduleOptionModal, setModuleOptionModal] = useState(false);
  const [lessonOptionModal, setLessonOptionModal] = useState(false);

  const { data: lessons = [], refetch } = useGetLessons(id);
  const { mutate: editLesson } = useEditLesson();
  const { mutateAsync: deleteLesson } = useDeleteLesson(id);
  const { mutate: CreateLesson } = usePostLesson(id);

  const [newLessonName, setNewLessonName] = useState('');

  const handleRenameLesson = () => {
    if (!selectedLesson?.id) return;
    if (!newLessonName.trim()) return;

    editLesson(
      {
        module_id: id,
        lesson_id: selectedLesson.id,
        data: { name: newLessonName },
      },
      {
        onSuccess: () => {
          console.log('Lesson renamed successfully');
          refetch?.(); // safe optional chaining
          setOptionModal(0);
        },
        onError: (err) => {
          console.error('Error renaming lesson:', err.response?.data || err);
        },
      },
    );
  };

  const openLessonModal = (lesson: LessonProp) => {
    setSelectedLesson(lesson);
    setLessonOptionModal(true);
  };

  const closeLessonModal = () => {
    setSelectedLesson(null);
    setLessonOptionModal(false);
  };

  const openOptionModal = (modal: number) => {
    setOptionModal(modal);
    setLessonOptionModal(false);
  };

  // -------------------- CREATE LESSON --------------------
  const handleCreateLesson = () => {
    const newLesson = {
      module_id: id,
      name: 'New Lesson',
      description: '',
      url: '',
      order_number: lessons.length + 1,
    };
    CreateLesson(newLesson, {
      onSuccess: (res) => {
        console.log('Lesson created:', res);
      },
      onError: (err) => console.log('Lesson creation failed:', err),
    });
  };

  // -------------------- STATUS CHANGE --------------------
  const handleStatusChange = (
    lessonId: number,
    newStatus: 'published' | 'draft',
  ) => {
    editLesson(
      {
        module_id: id,
        lesson_id: lessonId,
        data: { status: newStatus },
      },
      {
        onSuccess: () => {
          console.log(`Lesson ${lessonId} updated to ${newStatus}`);
          refetch();
        },
        onError: (err) => {
          console.error('Error updating status:', err);
        },
      },
    );
  };

  // -------------------- DELETE --------------------
  const handleDeleteLesson = async () => {
    if (!selectedLesson?.id) return;
    try {
      await deleteLesson(selectedLesson.id);
      console.log('Lesson deleted:', selectedLesson.id);
      refetch();
      setOptionModal(0);
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  // -------------------- UI --------------------
  return (
    <View style={styles.moduleItem} key={id}>
      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <Ionicons name="menu-outline" size={14} color="#000" />
        <Text style={styles.moduleName}>{title}</Text>
        <TouchableOpacity onPress={handleCreateLesson} style={styles.addNew}>
          <Text style={styles.addNewText}>Add lesson</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="ellipsis-vertical" size={18} color="#8E8E8E" />
        </TouchableOpacity>
      </View>

      {/* Lessons List */}
      <View style={styles.lessonContainer}>
        {lessons.length > 0 ? (
          lessons.map((lesson: LessonProp) => (
            <View key={lesson.id} style={styles.lessonRow}>
              <Ionicons name="menu-outline" size={16} color="#8E8E8E" />
              <Text style={styles.lessonText}>{lesson.name}</Text>
              <TouchableOpacity onPress={() => openLessonModal(lesson)}>
                <Ionicons name="ellipsis-vertical" size={16} color="#8E8E8E" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={{ color: '#888', marginLeft: 10 }}>No lessons yet.</Text>
        )}
      </View>

      {/* LESSON OPTIONS MODAL */}
      <OptionModal
        isVisible={lessonOptionModal}
        onBackdropPress={closeLessonModal}
      >
        <SafeAreaView
          style={{
            backgroundColor: 'white',
            padding: 20,
            paddingTop: 40,
            borderTopEndRadius: 20,
            borderTopLeftRadius: 20,
            gap: 10,
          }}
        >
          {selectedLesson ? (
            <>
              <View>
                <Dropdown
                  value={selectedLesson.status ?? 'draft'}
                  onChange={(newStatus) =>
                    handleStatusChange(selectedLesson.id!, newStatus)
                  }
                />
              </View>

              <Link
                href={{
                  pathname: '/convener-screens/community/uploadLesson',
                  params: {
                    lessonId: selectedLesson.id,
                    moduleId: id,
                    moduleTitle: title,
                  },
                }}
              >
                Upload
              </Link>

              <Text onPress={() => openOptionModal(4)}>
                Rename "{selectedLesson.name}"
              </Text>
              <Text onPress={() => openOptionModal(5)}>
                Delete "{selectedLesson.name}"
              </Text>
            </>
          ) : (
            <Text>No lesson selected</Text>
          )}
        </SafeAreaView>
      </OptionModal>

      {/* SLIDE MODALS */}
      <SlideModal
        isVisible={optionModal !== 0}
        onBackdropPress={() => setOptionModal(0)}
      >
        {/* RENAME LESSON */}
        {optionModal === 4 && selectedLesson && (
          <View
            style={{
              width: '100%',
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 8,
              paddingVertical: 30,
              gap: 32,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}
            >
              Rename Lesson
            </Text>
            <View style={{ gap: 5 }}>
              <Text style={{ fontWeight: 600 }}>Title</Text>
              <TextInput
                placeholder={selectedLesson.name}
                value={newLessonName}
                onChangeText={setNewLessonName}
                style={{
                  borderWidth: 1,
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderColor: 'grey',
                }}
              />
            </View>
            <TouchableOpacity
              style={{
                borderRadius: 50,
                padding: 12,
                backgroundColor: colors.primary,
              }}
              onPress={handleRenameLesson}
            >
              <Text style={{ color: colors.white, textAlign: 'center' }}>
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DELETE LESSON */}
        {optionModal === 5 && selectedLesson && (
          <View
            style={{
              width: '100%',
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 8,
              paddingVertical: 30,
              gap: 32,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}
            >
              Delete Lesson
            </Text>
            <View style={{ gap: 5, marginBottom: 20 }}>
              <Text>
                Are you sure you want to delete "{selectedLesson.name}" from
                this module?
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={{
                  borderRadius: 50,
                  padding: 12,
                  backgroundColor: colors.red,
                }}
                onPress={handleDeleteLesson}
              >
                <Text style={{ color: colors.white, textAlign: 'center' }}>
                  Confirm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderRadius: 50,
                  padding: 12,
                  borderColor: colors.primary,
                  borderWidth: 1,
                }}
                onPress={() => setOptionModal(0)}
              >
                <Text style={{ textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SlideModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },

  modal: {
    justifyContent: 'flex-end',
    margin: 0,
    backgroundColor: 'transparent',
    height: '100%',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  courseType: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#000',
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topInfoText: {
    fontSize: 15,
    color: '#000',
  },
  bold: {
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#4B2E83',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modulesContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E8E',
    marginBottom: 12,
  },
  moduleItem: {
    marginBottom: 20,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleName: {
    flex: 1,
    fontWeight: '700',
    marginLeft: 8,
  },
  addNew: {
    backgroundColor: '#F5F2FB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  addNewText: {
    color: '#6B4AB0',
    fontSize: 13,
  },
  lessonContainer: {
    marginTop: 12,
    marginLeft: 28,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  lessonText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
});
