/**
 * Lesson Unit Type Definitions
 * Defines all available lesson types and their configurations
 */

export type LessonUnitType =
  | 'text'
  | 'video'
  | 'pdf'
  | 'live_session'
  | 'link'
  | 'assignment'
  | 'quiz'
  | 'form'
  | 'reflection'
  | 'practical_task';

export interface UnitTypeConfig {
  type: LessonUnitType;
  label: string;
  icon: string; // Ionicons name
  defaultName: string;
  editorRoute: string;
  description?: string;
}

/**
 * Configuration for all lesson unit types
 * Priority types are listed first
 */
export const UNIT_TYPE_CONFIGS: UnitTypeConfig[] = [
  {
    type: 'text',
    label: 'Text lesson',
    icon: 'document-text-outline',
    defaultName: 'New Text Lesson',
    editorRoute: '/convener-screens/community/textLessonEditor',
    description: 'Rich text content with formatting',
  },
  {
    type: 'video',
    label: 'Video lesson',
    icon: 'videocam-outline',
    defaultName: 'New Video Lesson',
    editorRoute: '/convener-screens/community/uploadLesson',
    description: 'YouTube video with text content',
  },
  {
    type: 'pdf',
    label: 'Document (PDF)',
    icon: 'document-attach-outline',
    defaultName: 'New Document',
    editorRoute: '/convener-screens/community/pdfLessonEditor',
    description: 'PDF document upload',
  },
  {
    type: 'live_session',
    label: 'Live session',
    icon: 'videocam',
    defaultName: 'New Live Session',
    editorRoute: '/convener-screens/community/liveSessionEditor',
    description: 'Scheduled live video session',
  },
  {
    type: 'assignment',
    label: 'Assignment',
    icon: 'clipboard-outline',
    defaultName: 'New Assignment',
    editorRoute: '/convener-screens/assignment/[lessonId]',
    description: 'Student assignment with submissions',
  },
  {
    type: 'quiz',
    label: 'Quiz',
    icon: 'help-circle-outline',
    defaultName: 'New Quiz',
    editorRoute: '/convener-screens/community/quizEditor',
    description: 'Multiple choice quiz',
  },
  {
    type: 'form',
    label: 'Forms and survey',
    icon: 'list-outline',
    defaultName: 'New Form',
    editorRoute: '/convener-screens/community/formEditor',
    description: 'Custom form or survey',
  },
  {
    type: 'link',
    label: 'Link / External resource',
    icon: 'link-outline',
    defaultName: 'New Link',
    editorRoute: '/convener-screens/community/linkLessonEditor',
    description: 'External URL or resource',
  },
  {
    type: 'reflection',
    label: 'Reflection prompt',
    icon: 'bulb-outline',
    defaultName: 'New Reflection',
    editorRoute: '/convener-screens/community/reflectionEditor',
    description: 'Student reflection prompt',
  },
  {
    type: 'practical_task',
    label: 'Practical task ( with media submission)',
    icon: 'hammer-outline',
    defaultName: 'New Practical Task',
    editorRoute: '/convener-screens/community/practicalTaskEditor',
    description: 'Task with file submission',
  },
];

/**
 * Get default lesson name for a given type
 */
export const getDefaultLessonName = (type: LessonUnitType): string => {
  const config = UNIT_TYPE_CONFIGS.find((c) => c.type === type);
  return config?.defaultName || 'New Lesson';
};

/**
 * Get icon name for a given type
 */
export const getUnitTypeIcon = (type: LessonUnitType): string => {
  const config = UNIT_TYPE_CONFIGS.find((c) => c.type === type);
  return config?.icon || 'document-outline';
};

/**
 * Get editor route for a given type
 */
export const getEditorRoute = (type: LessonUnitType): string => {
  const config = UNIT_TYPE_CONFIGS.find((c) => c.type === type);
  return config?.editorRoute || '/convener-screens/community/uploadLesson';
};

/**
 * Get full configuration for a given type
 */
export const getUnitTypeConfig = (type: LessonUnitType): UnitTypeConfig | undefined => {
  return UNIT_TYPE_CONFIGS.find((c) => c.type === type);
};

/**
 * Check if a type is valid
 */
export const isValidLessonType = (type: string): type is LessonUnitType => {
  return UNIT_TYPE_CONFIGS.some((c) => c.type === type);
};
