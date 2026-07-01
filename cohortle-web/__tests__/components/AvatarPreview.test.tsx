import { render, screen } from '@testing-library/react';
import AvatarPreview from '@/components/profile/AvatarPreview';

describe('AvatarPreview Component', () => {
  describe('Avatar Image Display', () => {
    it('should render avatar image with correct src when avatarUrl is provided', () => {
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';
      const userName = 'John Doe';

      render(<AvatarPreview avatarUrl={avatarUrl} userName={userName} />);

      const img = screen.getByRole('img', { name: /John Doe's profile avatar/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', avatarUrl);
    });

    it('should include title attribute for additional context', () => {
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';
      const userName = 'Jane Smith';

      render(<AvatarPreview avatarUrl={avatarUrl} userName={userName} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('title', "Jane Smith's profile picture");
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(<AvatarPreview userName="John Doe" isLoading={true} />);

      const loadingElement = screen.getByRole('status', { name: /loading avatar/i });
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveClass('animate-pulse');
    });

    it('should include screen reader text for loading state', () => {
      render(<AvatarPreview userName="John Doe" isLoading={true} />);

      const srText = screen.getByText('Loading avatar...');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });

    it('should not display avatar or initials when loading', () => {
      const { container } = render(
        <AvatarPreview 
          userName="John Doe" 
          avatarUrl="https://example.com/avatar.jpg"
          isLoading={true} 
        />
      );

      expect(screen.queryByRole('img', { name: /profile avatar/i })).not.toBeInTheDocument();
      expect(container.textContent).not.toContain('JD');
    });
  });

  describe('Fallback to Initials', () => {
    it('should display user initials when no avatarUrl is provided', () => {
      render(<AvatarPreview userName="John Doe" />);

      const initialsElement = screen.getByRole('img', { 
        name: /John Doe's profile avatar showing initials JD/i 
      });
      expect(initialsElement).toBeInTheDocument();
      expect(initialsElement).toHaveTextContent('JD');
    });

    it('should display single initial for single-word names', () => {
      render(<AvatarPreview userName="Madonna" />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toHaveTextContent('M');
    });

    it('should display first and last initials for multi-word names', () => {
      render(<AvatarPreview userName="Mary Jane Watson" />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toHaveTextContent('MW');
    });

    it('should handle names with extra whitespace', () => {
      render(<AvatarPreview userName="  John   Doe  " />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toHaveTextContent('JD');
    });

    it('should convert initials to uppercase', () => {
      render(<AvatarPreview userName="john doe" />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toHaveTextContent('JD');
    });
  });

  describe('Accessibility', () => {
    it('should include descriptive alt text for avatar images', () => {
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';
      const userName = 'Alice Johnson';

      render(<AvatarPreview avatarUrl={avatarUrl} userName={userName} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', "Alice Johnson's profile avatar");
    });

    it('should include aria-label for initials fallback', () => {
      render(<AvatarPreview userName="Bob Smith" />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toHaveAttribute(
        'aria-label',
        "Bob Smith's profile avatar showing initials BS"
      );
    });

    it('should use role="status" for loading state', () => {
      render(<AvatarPreview userName="John Doe" isLoading={true} />);

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should use role="img" for initials fallback', () => {
      render(<AvatarPreview userName="John Doe" />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toBeInTheDocument();
    });
  });

  describe('Responsive Sizing', () => {
    it('should apply small size classes when size="small"', () => {
      const { container } = render(
        <AvatarPreview userName="John Doe" size="small" />
      );

      const initialsElement = container.firstChild;
      expect(initialsElement).toHaveClass('w-10', 'h-10', 'text-sm');
    });

    it('should apply medium size classes when size="medium" (default)', () => {
      const { container } = render(
        <AvatarPreview userName="John Doe" size="medium" />
      );

      const initialsElement = container.firstChild;
      expect(initialsElement).toHaveClass('w-16', 'h-16');
    });

    it('should apply medium size classes when no size is specified', () => {
      const { container } = render(
        <AvatarPreview userName="John Doe" />
      );

      const initialsElement = container.firstChild;
      expect(initialsElement).toHaveClass('w-16', 'h-16');
    });

    it('should apply large size classes when size="large"', () => {
      const { container } = render(
        <AvatarPreview userName="John Doe" size="large" />
      );

      const initialsElement = container.firstChild;
      expect(initialsElement).toHaveClass('w-24', 'h-24');
    });

    it('should maintain rounded-full class for all sizes', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

      sizes.forEach((size) => {
        const { container } = render(
          <AvatarPreview userName="John Doe" size={size} />
        );

        const element = container.firstChild;
        expect(element).toHaveClass('rounded-full');
      });
    });

    it('should apply flex-shrink-0 to prevent squashing in flex containers', () => {
      const { container } = render(
        <AvatarPreview userName="John Doe" />
      );

      const element = container.firstChild;
      expect(element).toHaveClass('flex-shrink-0');
    });
  });

  describe('Visual Consistency', () => {
    it('should use consistent blue background for initials', () => {
      const { container } = render(
        <AvatarPreview userName="John Doe" />
      );

      const initialsElement = container.firstChild;
      expect(initialsElement).toHaveClass('bg-blue-500', 'text-white');
    });

    it('should apply object-cover to avatar images for consistent aspect ratio', () => {
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';

      render(<AvatarPreview avatarUrl={avatarUrl} userName="John Doe" />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('object-cover');
    });

    it('should apply rounded-full to all avatar types', () => {
      // Test with avatar URL
      const { container: container1 } = render(
        <AvatarPreview 
          avatarUrl="https://example.com/avatar.jpg" 
          userName="John Doe" 
        />
      );
      expect(container1.firstChild).toHaveClass('rounded-full');

      // Test with initials
      const { container: container2 } = render(
        <AvatarPreview userName="Jane Doe" />
      );
      expect(container2.firstChild).toHaveClass('rounded-full');

      // Test with loading
      const { container: container3 } = render(
        <AvatarPreview userName="Bob Smith" isLoading={true} />
      );
      expect(container3.firstChild).toHaveClass('rounded-full');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string avatarUrl by showing initials', () => {
      render(<AvatarPreview avatarUrl="" userName="John Doe" />);

      const initialsElement = screen.getByRole('img', { 
        name: /showing initials/i 
      });
      expect(initialsElement).toBeInTheDocument();
      expect(initialsElement).toHaveTextContent('JD');
    });

    it('should handle userName with special characters', () => {
      render(<AvatarPreview userName="O'Brien-Smith" />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toHaveTextContent('O');
    });

    it('should handle very long userNames gracefully', () => {
      const longName = 'Christopher Alexander Montgomery Wellington III';
      render(<AvatarPreview userName={longName} />);

      const initialsElement = screen.getByRole('img');
      expect(initialsElement).toHaveTextContent('CI');
    });
  });
});
