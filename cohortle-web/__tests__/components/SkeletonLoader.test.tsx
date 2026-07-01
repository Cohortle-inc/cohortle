import { render, screen } from '@testing-library/react';
import { SkeletonLoader, SKELETON_PRESETS, SkeletonConfig } from '@/components/dashboard/SkeletonLoader';

describe('SkeletonLoader', () => {
  const defaultConfig: SkeletonConfig = {
    showHeader: true,
    showProgrammeCards: 3,
    showSidebar: true,
    animationSpeed: 'normal',
  };

  describe('Basic Rendering', () => {
    it('should render with default configuration', () => {
      render(<SkeletonLoader config={defaultConfig} />);
      
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-skeleton-class';
      const { container } = render(
        <SkeletonLoader config={defaultConfig} className={customClass} />
      );
      
      const skeletonContainer = container.firstChild as HTMLElement;
      expect(skeletonContainer).toHaveClass(customClass);
    });

    it('should have proper base structure', () => {
      const { container } = render(<SkeletonLoader config={defaultConfig} />);
      
      const skeletonContainer = container.firstChild as HTMLElement;
      expect(skeletonContainer).toHaveClass('space-y-6');
    });
  });

  describe('Header Configuration', () => {
    it('should render header when showHeader is true', () => {
      const config = { ...defaultConfig, showHeader: true };
      const { container } = render(<SkeletonLoader config={config} />);
      
      // Look for header skeleton elements
      const headerElements = container.querySelectorAll('.h-8.bg-gray-200');
      expect(headerElements.length).toBeGreaterThan(0);
    });

    it('should not render header when showHeader is false', () => {
      const config = { ...defaultConfig, showHeader: false };
      const { container } = render(<SkeletonLoader config={config} />);
      
      // Header should not be present - check for specific header pattern
      const headerPattern = container.querySelector('.h-8.bg-gray-200.rounded.w-1\\/3.mb-2');
      expect(headerPattern).not.toBeInTheDocument();
    });
  });

  describe('Programme Cards Configuration', () => {
    it('should render correct number of programme cards', () => {
      const config = { ...defaultConfig, showProgrammeCards: 4 };
      const { container } = render(<SkeletonLoader config={config} />);
      
      // Count programme card skeletons by looking for the grid container
      const programmeGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeGrid).toBeInTheDocument();
      
      const programmeCards = programmeGrid?.children;
      expect(programmeCards?.length).toBe(4);
    });

    it('should not render programme cards section when count is 0', () => {
      const config = { ...defaultConfig, showProgrammeCards: 0 };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const programmeGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeGrid).not.toBeInTheDocument();
    });

    it('should render programme card structure correctly', () => {
      const config = { ...defaultConfig, showProgrammeCards: 1 };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const programmeCard = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3 > div');
      expect(programmeCard).toBeInTheDocument();
      
      // Check for programme card elements
      const thumbnail = programmeCard?.querySelector('.h-32.bg-gray-200.rounded');
      const title = programmeCard?.querySelector('.h-5.bg-gray-200.rounded.w-3\\/4');
      const actionButton = programmeCard?.querySelector('.h-10.bg-gray-200.rounded.w-full');
      
      expect(thumbnail).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(actionButton).toBeInTheDocument();
    });
  });

  describe('Sidebar Configuration', () => {
    it('should render sidebar when showSidebar is true', () => {
      const config = { ...defaultConfig, showSidebar: true };
      const { container } = render(<SkeletonLoader config={config} />);
      
      // Check for grid layout with sidebar
      const gridLayout = container.querySelector('.grid.gap-6.grid-cols-1.lg\\:grid-cols-4');
      expect(gridLayout).toBeInTheDocument();
      
      // Check for sidebar column
      const sidebar = container.querySelector('.lg\\:col-span-1');
      expect(sidebar).toBeInTheDocument();
    });

    it('should not render sidebar when showSidebar is false', () => {
      const config = { ...defaultConfig, showSidebar: false };
      const { container } = render(<SkeletonLoader config={config} />);
      
      // Should use single column layout
      const gridLayout = container.querySelector('.grid.gap-6.grid-cols-1');
      expect(gridLayout).toBeInTheDocument();
      
      // Should not have sidebar column
      const sidebar = container.querySelector('.lg\\:col-span-1');
      expect(sidebar).not.toBeInTheDocument();
    });

    it('should adjust main content area when sidebar is present', () => {
      const config = { ...defaultConfig, showSidebar: true };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const mainContent = container.querySelector('.lg\\:col-span-3');
      expect(mainContent).toBeInTheDocument();
    });

    it('should use full width when sidebar is not present', () => {
      const config = { ...defaultConfig, showSidebar: false };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const mainContent = container.querySelector('.col-span-1');
      expect(mainContent).toBeInTheDocument();
      
      const sidebarContent = container.querySelector('.lg\\:col-span-3');
      expect(sidebarContent).not.toBeInTheDocument();
    });
  });

  describe('Animation Speed Configuration', () => {
    it('should apply normal animation speed class', () => {
      const config = { ...defaultConfig, animationSpeed: 'normal' as const };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const animatedElement = container.querySelector('.animate-pulse');
      expect(animatedElement).toBeInTheDocument();
      expect(animatedElement).not.toHaveClass('[animation-duration:2s]');
      expect(animatedElement).not.toHaveClass('[animation-duration:0.5s]');
    });

    it('should apply slow animation speed class', () => {
      const config = { ...defaultConfig, animationSpeed: 'slow' as const };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const animatedElement = container.querySelector('.animate-pulse.\\[animation-duration\\:2s\\]');
      expect(animatedElement).toBeInTheDocument();
    });

    it('should apply fast animation speed class', () => {
      const config = { ...defaultConfig, animationSpeed: 'fast' as const };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const animatedElement = container.querySelector('.animate-pulse.\\[animation-duration\\:0\\.5s\\]');
      expect(animatedElement).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper role and aria-label', () => {
      render(<SkeletonLoader config={defaultConfig} />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should include screen reader announcement', () => {
      render(<SkeletonLoader config={defaultConfig} />);
      
      const announcement = screen.getByText('Loading dashboard content, please wait...');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveClass('sr-only');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('should maintain accessibility with different configurations', () => {
      const minimalConfig = { ...defaultConfig, showHeader: false, showProgrammeCards: 0, showSidebar: false };
      render(<SkeletonLoader config={minimalConfig} />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Loading content');
      
      const announcement = screen.getByText('Loading dashboard content, please wait...');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Preset Configurations', () => {
    it('should render dashboard preset correctly', () => {
      const { container } = render(<SkeletonLoader config={SKELETON_PRESETS.dashboard} />);
      
      // Should have header
      const headerElement = container.querySelector('.h-8.bg-gray-200.rounded.w-1\\/3.mb-2');
      expect(headerElement).toBeInTheDocument();
      
      // Should have 3 programme cards
      const programmeGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeGrid?.children.length).toBe(3);
      
      // Should not have sidebar
      const sidebar = container.querySelector('.lg\\:col-span-1');
      expect(sidebar).not.toBeInTheDocument();
    });

    it('should render programmes preset correctly', () => {
      const { container } = render(<SkeletonLoader config={SKELETON_PRESETS.programmes} />);
      
      // Should not have header
      const headerElement = container.querySelector('.h-8.bg-gray-200.rounded.w-1\\/3.mb-2');
      expect(headerElement).not.toBeInTheDocument();
      
      // Should have 6 programme cards
      const programmeGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeGrid?.children.length).toBe(6);
    });

    it('should render minimal preset correctly', () => {
      const { container } = render(<SkeletonLoader config={SKELETON_PRESETS.minimal} />);
      
      // Should have header
      const headerElement = container.querySelector('.h-8.bg-gray-200.rounded.w-1\\/3.mb-2');
      expect(headerElement).toBeInTheDocument();
      
      // Should not have programme cards
      const programmeGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeGrid).not.toBeInTheDocument();
      
      // Should use fast animation
      const animatedElement = container.querySelector('.animate-pulse.\\[animation-duration\\:0\\.5s\\]');
      expect(animatedElement).toBeInTheDocument();
    });

    it('should render detailed preset correctly', () => {
      const { container } = render(<SkeletonLoader config={SKELETON_PRESETS.detailed} />);
      
      // Should have header
      const headerElement = container.querySelector('.h-8.bg-gray-200.rounded.w-1\\/3.mb-2');
      expect(headerElement).toBeInTheDocument();
      
      // Should have 4 programme cards
      const programmeGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeGrid?.children.length).toBe(4);
      
      // Should have sidebar
      const sidebar = container.querySelector('.lg\\:col-span-1');
      expect(sidebar).toBeInTheDocument();
      
      // Should use slow animation
      const animatedElement = container.querySelector('.animate-pulse.\\[animation-duration\\:2s\\]');
      expect(animatedElement).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('should render continue learning section skeleton', () => {
      const { container } = render(<SkeletonLoader config={defaultConfig} />);
      
      // Look for continue learning section structure
      const continueSection = container.querySelector('.bg-white.rounded-lg.border.border-gray-200.p-6');
      expect(continueSection).toBeInTheDocument();
      
      // Check for title and content skeletons
      const titleSkeleton = continueSection?.querySelector('.h-6.bg-gray-200.rounded.w-1\\/3.mb-4');
      const buttonSkeleton = continueSection?.querySelector('.h-10.bg-gray-200.rounded.w-1\\/4.mt-4');
      
      expect(titleSkeleton).toBeInTheDocument();
      expect(buttonSkeleton).toBeInTheDocument();
    });

    it('should render upcoming sessions and recent activity sections', () => {
      const { container } = render(<SkeletonLoader config={defaultConfig} />);
      
      // Look for two-column layout
      const twoColumnGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-6');
      expect(twoColumnGrid).toBeInTheDocument();
      
      // Should have two sections
      const sections = twoColumnGrid?.querySelectorAll('.bg-white.rounded-lg.border.border-gray-200.p-6');
      expect(sections?.length).toBe(2);
    });

    it('should render session items in upcoming sessions', () => {
      const { container } = render(<SkeletonLoader config={defaultConfig} />);
      
      const twoColumnGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-6');
      const firstSection = twoColumnGrid?.children[0];
      
      // Should have 3 session items
      const sessionItems = firstSection?.querySelectorAll('.flex.items-center.space-x-3.p-3.border.border-gray-100.rounded');
      expect(sessionItems?.length).toBe(3);
      
      // Each session should have icon and content
      const firstSession = sessionItems?.[0];
      const icon = firstSession?.querySelector('.w-10.h-10.bg-gray-200.rounded');
      const content = firstSession?.querySelector('.flex-1.space-y-2');
      
      expect(icon).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    it('should render activity items in recent activity', () => {
      const { container } = render(<SkeletonLoader config={defaultConfig} />);
      
      const twoColumnGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-6');
      const secondSection = twoColumnGrid?.children[1];
      
      // Should have 3 activity items
      const activityItems = secondSection?.querySelectorAll('.flex.items-start.space-x-3.p-3');
      expect(activityItems?.length).toBe(3);
      
      // Each activity should have avatar and content
      const firstActivity = activityItems?.[0];
      const avatar = firstActivity?.querySelector('.w-8.h-8.bg-gray-200.rounded-full.flex-shrink-0');
      const content = firstActivity?.querySelector('.flex-1.space-y-2');
      
      expect(avatar).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero programme cards gracefully', () => {
      const config = { ...defaultConfig, showProgrammeCards: 0 };
      const { container } = render(<SkeletonLoader config={config} />);
      
      // Should still render other sections
      const container_element = screen.getByRole('status');
      expect(container_element).toBeInTheDocument();
      
      // Should not have programme cards section
      const programmeSection = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeSection).not.toBeInTheDocument();
    });

    it('should handle large number of programme cards', () => {
      const config = { ...defaultConfig, showProgrammeCards: 12 };
      const { container } = render(<SkeletonLoader config={config} />);
      
      const programmeGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(programmeGrid?.children.length).toBe(12);
    });

    it('should maintain structure with all options disabled', () => {
      const minimalConfig: SkeletonConfig = {
        showHeader: false,
        showProgrammeCards: 0,
        showSidebar: false,
        animationSpeed: 'normal',
      };
      
      render(<SkeletonLoader config={minimalConfig} />);
      
      // Should still have basic structure and accessibility
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
      
      const announcement = screen.getByText('Loading dashboard content, please wait...');
      expect(announcement).toBeInTheDocument();
    });
  });
});