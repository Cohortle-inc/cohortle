import { render, screen, fireEvent } from '@testing-library/react';
import { LazyVideoEmbed } from '@/components/lessons/LazyVideoEmbed';

describe('LazyVideoEmbed', () => {
  const mockProps = {
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1',
    title: 'Test Video',
    platform: 'youtube' as const,
    hasCaptions: false,
  };

  it('should render placeholder facade initially', () => {
    render(<LazyVideoEmbed {...mockProps} />);
    
    // Should show play button, not iframe
    const playButton = screen.getByRole('button', { name: /load video/i });
    expect(playButton).toBeInTheDocument();
    
    // Should not have iframe yet
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeInTheDocument();
  });

  it('should load iframe when clicked', () => {
    render(<LazyVideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /load video/i });
    fireEvent.click(playButton);
    
    // Should now have iframe
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should load iframe when Enter key is pressed', () => {
    render(<LazyVideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /load video/i });
    fireEvent.keyDown(playButton, { key: 'Enter' });
    
    // Should now have iframe
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
  });

  it('should load iframe when Space key is pressed', () => {
    render(<LazyVideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /load video/i });
    fireEvent.keyDown(playButton, { key: ' ' });
    
    // Should now have iframe
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
  });

  it('should show YouTube badge for YouTube videos', () => {
    const { container } = render(<LazyVideoEmbed {...mockProps} />);
    
    const badge = container.querySelector('.bg-red-600');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('YouTube');
  });

  it('should show captions badge when hasCaptions is true', () => {
    const { container } = render(
      <LazyVideoEmbed {...mockProps} hasCaptions={true} />
    );
    
    const captionsBadge = container.querySelector('.bg-white.bg-opacity-90');
    expect(captionsBadge).toBeInTheDocument();
    expect(captionsBadge?.textContent).toContain('CC');
  });

  it('should generate YouTube thumbnail URL', () => {
    const { container } = render(<LazyVideoEmbed {...mockProps} />);
    
    const thumbnail = container.querySelector('img');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail?.src).toContain('i.ytimg.com/vi/dQw4w9WgXcQ');
  });

  it('should use custom thumbnail if provided', () => {
    const customThumbnail = 'https://example.com/custom-thumb.jpg';
    const { container } = render(
      <LazyVideoEmbed {...mockProps} thumbnailUrl={customThumbnail} />
    );
    
    const thumbnail = container.querySelector('img');
    expect(thumbnail?.src).toBe(customThumbnail);
  });

  it('should show fallback gradient for non-YouTube videos without thumbnail', () => {
    const { container } = render(
      <LazyVideoEmbed 
        {...mockProps} 
        platform="bunnystream"
        embedUrl="https://iframe.mediadelivery.net/embed/123/456"
      />
    );
    
    // Should have gradient background
    const gradient = container.querySelector('.bg-gradient-to-br');
    expect(gradient).toBeInTheDocument();
  });

  it('should call onError when iframe fails to load', () => {
    const onError = jest.fn();
    render(<LazyVideoEmbed {...mockProps} onError={onError} />);
    
    // Click to load iframe
    const playButton = screen.getByRole('button', { name: /load video/i });
    fireEvent.click(playButton);
    
    // Simulate iframe error
    const iframe = document.querySelector('iframe');
    fireEvent.error(iframe!);
    
    expect(onError).toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    render(<LazyVideoEmbed {...mockProps} hasCaptions={true} />);
    
    const playButton = screen.getByRole('button');
    expect(playButton).toHaveAttribute('aria-label');
    expect(playButton.getAttribute('aria-label')).toContain('Test Video');
    expect(playButton).toHaveAttribute('tabIndex', '0');
  });

  it('should maintain 16:9 aspect ratio', () => {
    const { container } = render(<LazyVideoEmbed {...mockProps} />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.paddingBottom).toBe('56.25%');
  });

  it('should show platform badge for BunnyStream', () => {
    const { container } = render(
      <LazyVideoEmbed 
        {...mockProps} 
        platform="bunnystream"
        embedUrl="https://iframe.mediadelivery.net/embed/123/456"
      />
    );
    
    const badge = container.querySelector('.bg-orange-500');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('Video');
  });

  it('should not show platform badge for unknown platform', () => {
    const { container } = render(
      <LazyVideoEmbed 
        {...mockProps} 
        platform="unknown"
        embedUrl="https://example.com/video"
      />
    );
    
    const youtubeBadge = container.querySelector('.bg-red-600');
    const bunnyBadge = container.querySelector('.bg-orange-500');
    expect(youtubeBadge).not.toBeInTheDocument();
    expect(bunnyBadge).not.toBeInTheDocument();
  });
});
