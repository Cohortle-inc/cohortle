import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import fc from 'fast-check';
import { VideoLessonContent } from '@/components/lessons/VideoLessonContent';

describe('Feature: student-lesson-viewer-web - VideoLessonContent Properties', () => {
  // Use a reliable alphanumeric generator
  const alphaStr = (len: number) =>
    fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: len, maxLength: len })
      .map(arr => arr.join(''));

  it('Property 4: YouTube video embedding', () => {
    fc.assert(
      fc.property(
        alphaStr(11),
        (videoId) => {
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const { container } = render(
            <VideoLessonContent
              title="TestTitle"
              videoUrl={videoUrl}
            />
          );

          const facade = screen.getByRole('button');
          fireEvent.click(facade);

          const iframe = container.querySelector('iframe');
          expect(iframe).toBeTruthy();
          expect(iframe?.src).toContain(videoId);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 5: BunnyStream video embedding', () => {
    fc.assert(
      fc.property(
        alphaStr(8),
        alphaStr(10),
        (libraryId, videoId) => {
          const videoUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
          const { container } = render(
            <VideoLessonContent
              title="BunnyTitle"
              videoUrl={videoUrl}
            />
          );

          const facade = screen.getByRole('button');
          fireEvent.click(facade);

          const iframe = container.querySelector('iframe');
          expect(iframe).toBeTruthy();
          expect(iframe?.src).toContain(videoId);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 6: Text content placement with media (video)', () => {
    fc.assert(
      fc.property(
        alphaStr(5),
        alphaStr(10),
        (titlePart, textPart) => {
          const title = `Title${titlePart}`;
          const textContent = `Content${textPart}`;
          const videoUrl = `https://www.youtube.com/watch?v=12345678901`;

          const { container } = render(
            <VideoLessonContent 
              title={title} 
              videoUrl={videoUrl}
              textContent={textContent}
            />
          );

          const h1 = container.querySelector('h1');
          expect(h1?.textContent).toBe(title);

          const prose = container.querySelector('.prose');
          expect(prose?.textContent).toBe(textContent);

          const videoSection = container.querySelector('.mb-8');

          expect(h1!.compareDocumentPosition(videoSection!) & 4).toBeTruthy();
          expect(videoSection!.compareDocumentPosition(prose!) & 4).toBeTruthy();
        }
      ),
      { numRuns: 20 }
    );
  });
});
