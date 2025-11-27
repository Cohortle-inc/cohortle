import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '@/HOC';
import { NavHead } from '@/components/HeadRoute';
import { SlideModal } from '@/components/Modal';
import { OptionModal } from '@/components/optionModal';
import { Link, useLocalSearchParams } from 'expo-router';
import { colors } from '@/utils/color';
import Dropdown from '@/components/dropdown'; // Your custom dropdown

import useGetModules from '@/api/communities/modules/getModules';
import { usePostModule } from '@/api/communities/modules/postModule';
import { useEditModule } from '@/api/communities/modules/updateModule';
import { useDeleteModule } from '@/api/communities/modules/deleteModule';
import { useGetLessons } from '@/api/communities/lessons/getLessons';
import { usePostLesson } from '@/api/communities/lessons/postLessons';
import { useEditLesson } from '@/api/communities/lessons/updateLesson';
import { useDeleteLesson } from '@/api/communities/lessons/deleteLesson';

interface ModuleType {
  id: number;
  community_id: number;
  title: string;
  order_number: number;
  status: string;
}

interface LessonProp {
  id: number;
  name: string;
  status: 'published' | 'draft';
}

const Index = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { name } = useLocalSearchParams<{ name: string }>();
  const numeric = Number(id);

  const { mutate } = usePostModule(numeric);
  const { data: modules = [], isLoading: modulesLoading } =
    useGetModules(numeric);

  console.log(modules);
  const handleCreateModule = () => {
    const newModule = {
      community_id: numeric,
      title: 'New Module',
      order_number: modules.length + 1,
    };
    mutate(newModule, {
      onSuccess: () => console.log('Module created!'),
      onError: (err) => console.log('Failed:', err),
    });
  };

  return (
    <SafeAreaWrapper>
      <NavHead text={name} />

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Modules</Text>
          <Text style={styles.courseType}>
            Course type: <Text style={styles.link}>Self-paced</Text>
          </Text>
        </View>

        <View style={styles.topInfo}>
          <Text style={styles.topInfoText}>
            <Text style={styles.bold}>{modules.length}</Text> Modules
          </Text>
          {modules.length < 15 && (
            <TouchableOpacity
              onPress={handleCreateModule}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add module</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>MODULES</Text>
          {modulesLoading ? (
            // Loading State
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <ActivityIndicator size="large" color="#391D65" />
              <Text
                style={{
                  color: '#666',
                  fontSize: 16,
                  fontFamily: 'DMSansMedium',
                }}
              >
                Loading modules...
              </Text>
            </View>
          ) : modules.length > 0 ? (
            // Has Modules – sorted by id (oldest first)
            <>
              {modules
                .slice()
                .sort((a: ModuleType, b: ModuleType) => a.id - b.id)
                .map((module: ModuleType) => (
                  <Module key={module.id} {...module} />
                ))}
            </>
          ) : (
            // Empty State
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={styles.emptyText}>No modules yet</Text>
              <Text
                style={{ color: '#888', marginTop: 8, textAlign: 'center' }}
              >
                Create your first module to start building your course
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export const Module = ({
  id,
  community_id,
  title: initialTitle,
}: ModuleType) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<LessonProp | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [optionModal, setOptionModal] = useState(0); // 4 = rename, 5 = delete
  const [newLessonName, setNewLessonName] = useState('');

  const { data: lessons = [], refetch } = useGetLessons(id);
  const { mutate: editModule } = useEditModule();
  const { mutate: CreateLesson } = usePostLesson(id);
  const { mutate: editLesson } = useEditLesson();
  const { mutateAsync: deleteLesson } = useDeleteLesson(id);
  const { mutate: deleteModule, isPending: deletingModule } = useDeleteModule();

  const saveModuleTitle = () => {
    if (title.trim() && title !== initialTitle) {
      editModule({
        community_id,
        module_id: id,
        data: { title: title.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleCreateLesson = () => {
    const newLesson = {
      module_id: id,
      name: 'New Lesson',
      description: '',
      url: '',
      order_number: lessons.length + 1,
    };
    CreateLesson(newLesson, { onSuccess: () => refetch() });
  };

  const handleStatusChange = (
    lessonId: number,
    status: 'published' | 'draft',
  ) => {
    editLesson(
      { module_id: id, lesson_id: lessonId, data: { status } },
      { onSuccess: () => refetch() },
    );
    setLessonModalOpen(false);
  };

  const handleRenameLesson = () => {
    if (!selectedLesson || !newLessonName.trim()) return;
    editLesson(
      {
        module_id: id,
        lesson_id: selectedLesson.id,
        data: { name: newLessonName.trim() },
      },
      {
        onSuccess: () => {
          refetch();
          setOptionModal(0);
        },
      },
    );
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;
    await deleteLesson(selectedLesson.id);
    refetch();
    setOptionModal(0);
  };

  const handleDeleteModule = () => {
    deleteModule(
      { community_id, module_id: id },
      { onSuccess: () => setShowDeleteConfirm(false) },
    );
  };

  return (
    <View style={styles.moduleItem}>
      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <Ionicons name="menu-outline" size={18} color="#666" />

        {isEditing ? (
          <TextInput
            value={title}
            onChangeText={setTitle}
            onBlur={saveModuleTitle}
            onSubmitEditing={saveModuleTitle}
            style={styles.titleInput}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <Text style={styles.moduleTitle}>{title}</Text>
        )}

        {lessons.length < 30 && (
          <TouchableOpacity onPress={handleCreateLesson} style={styles.addNew}>
            <Text style={styles.addNewText}>Add lesson</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setMenuOpen(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Lessons */}
      <View style={styles.lessonContainer}>
        {lessons
          .slice() // safe copy — no mutation
          .sort((a: LessonProp, b: LessonProp) => a.id - b.id) // oldest first
          .map((lesson: LessonProp) => (
            <View key={lesson.id} style={styles.lessonRow}>
              <Ionicons name="play-circle-outline" size={18} color="#8E8E8E" />
              <Text style={styles.lessonText}>{lesson.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedLesson(lesson);
                  setLessonModalOpen(true);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#8E8E8E" />
              </TouchableOpacity>
            </View>
          ))}
        {lessons.length === 0 && (
          <Text style={styles.noLessons}>No lessons yet</Text>
        )}
      </View>

      {/* Module Menu */}
      <OptionModal
        isVisible={menuOpen}
        onBackdropPress={() => setMenuOpen(false)}
      >
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>{title}</Text>
          <TouchableOpacity
            onPress={() => {
              setIsEditing(true);
              setMenuOpen(false);
            }}
          >
            <Text style={styles.menuItemText}>Rename Module</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              setShowDeleteConfirm(true);
            }}
          >
            <Text style={[styles.menuItemText, { color: '#EE3D3E' }]}>
              Delete Module
            </Text>
          </TouchableOpacity>
        </View>
      </OptionModal>

      {/* Lesson Options Modal */}
      <OptionModal
        isVisible={lessonModalOpen}
        onBackdropPress={() => setLessonModalOpen(false)}
      >
        <View style={styles.lessonMenu}>
          {selectedLesson && (
            <>
              <Text style={styles.lessonMenuTitle}>{selectedLesson.name}</Text>

              <Dropdown
                value={selectedLesson.status}
                onChange={(val) =>
                  handleStatusChange(selectedLesson.id, val as any)
                }
              />

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
                <Text>Upload Content</Text>
              </Link>

              <TouchableOpacity
                onPress={() => {
                  setOptionModal(4);
                  setLessonModalOpen(false);
                }}
              >
                <Text>Rename Lesson</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setOptionModal(5);
                  setLessonModalOpen(false);
                }}
              >
                <Text>Delete Lesson</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </OptionModal>

      {/* Rename / Delete Lesson Modal */}
      <SlideModal
        isVisible={optionModal !== 0}
        onBackdropPress={() => setOptionModal(0)}
      >
        {optionModal === 4 && selectedLesson && (
          <View style={styles.formModal}>
            <Text style={styles.formTitle}>Rename Lesson</Text>
            <TextInput
              style={styles.input}
              value={newLessonName}
              onChangeText={setNewLessonName}
              placeholder={selectedLesson.name}
              autoFocus
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRenameLesson}
            >
              <Text style={styles.btnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {optionModal === 5 && selectedLesson && (
          <View style={styles.formModal}>
            <Text style={styles.formTitle}>Delete Lesson?</Text>
            <Text style={styles.formMessage}>
              "{selectedLesson.name}" will be permanently deleted.
            </Text>
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={handleDeleteLesson}
            >
              <Text style={styles.btnText}>Delete Lesson</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setOptionModal(0)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </SlideModal>

      {/* Delete Module Confirm */}
      <SlideModal
        isVisible={showDeleteConfirm}
        onBackdropPress={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteModal}>
          <Ionicons name="trash-bin" size={40} color="#EE3D3E" />
          <Text style={styles.deleteTitle}>Delete "{title}"?</Text>
          <Text style={styles.deleteMessage}>
            This module and all its lessons will be permanently deleted.
          </Text>
          <TouchableOpacity
            style={[styles.dangerBtn, deletingModule && { opacity: 0.7 }]}
            onPress={handleDeleteModule}
            disabled={deletingModule}
          >
            <Text style={styles.btnText}>
              {deletingModule ? 'Deleting...' : 'Delete Module'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowDeleteConfirm(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SlideModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700' },
  courseType: { fontSize: 14, color: '#666', marginTop: 4 },
  link: { color: '#391D65', textDecorationLine: 'underline' },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  topInfoText: { fontSize: 16 },
  bold: { fontWeight: '700' },
  addButton: {
    backgroundColor: '#4B2E83',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  modulesContainer: { marginTop: 10 },
  sectionTitle: {
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 40 },

  moduleItem: { marginBottom: 32 },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  moduleTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  addNew: {
    backgroundColor: '#F5F2FB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addNewText: { color: '#6B4AB0', fontSize: 13, fontWeight: '600' },

  lessonContainer: { marginLeft: 30, gap: 8 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonText: { flex: 1, fontSize: 15, marginLeft: 8 },
  noLessons: { color: '#999', fontStyle: 'italic', marginTop: 8 },

  menu: {
    backgroundColor: 'white',
    padding: 28,
    borderTopEndRadius: 16,
    borderTopStartRadius: 16,
    gap: 20,
  },
  menuTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  menuItemText: { fontSize: 16, textAlign: 'center' },

  lessonMenu: {
    backgroundColor: 'white',
    padding: 24,
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    gap: 20,
  },
  lessonMenuTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  lessonMenuItem: { paddingVertical: 12 },
  lessonMenuLink: { fontSize: 16, color: '#391D65', textAlign: 'center' },
  lessonMenuItemText: { fontSize: 16, textAlign: 'center' },

  formModal: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 20,
    marginHorizontal: 20,
    gap: 20,
  },
  formTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  formMessage: { fontSize: 15, color: '#666', textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },

  primaryBtn: { backgroundColor: '#4B2E83', padding: 16, borderRadius: 50 },
  dangerBtn: { backgroundColor: '#EE3D3E', padding: 16, borderRadius: 50 },
  cancelBtn: { marginTop: 10 },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelText: {
    color: '#391D65',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },

  deleteModal: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: 16,
  },
});

export default Index;
