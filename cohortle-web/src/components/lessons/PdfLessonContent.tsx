'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { isDriveUrl, getDriveEmbedUrl } from '@/lib/utils/driveUrlUtils';

interface PdfLessonContentProps {
  title: string;
  pdfUrl: string;
  textContent?: string;
}

export function PdfLessonContent({ 
  title, 
  pdfUrl, 
  textContent 
}: PdfLessonContentProps) {
  const [pdfError, setPdfError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when pdfUrl changes
    setPdfError(false);
    setIsLoading(true);
  }, [pdfUrl]);

  const handlePdfLoad = () => {
    setIsLoading(false);
  };

  const handlePdfError = () => {
    setIsLoading(false);
    setPdfError(true);
  };

  // Sanitize text content if present
  const sanitizedText = textContent ? DOMPurify.sanitize(textContent) : '';

  // Use Drive embed URL when the input is a Drive URL; otherwise use the raw URL
  const iframeSrc = isDriveUrl(pdfUrl) ? (getDriveEmbedUrl(pdfUrl) ?? pdfUrl) : pdfUrl;

  return (
    <div className="w-full" data-testid="pdf-lesson">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>

      {/* PDF Viewer */}
      <div className="mb-8">
        {pdfError ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-yellow-400 mr-3 mt-1 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-yellow-800 font-medium mb-2">
                  PDF could not be displayed
                </p>
                <p className="text-yellow-700 text-sm mb-4">
                  Your browser may not support embedded PDFs. You can download the file instead.
                </p>
                <a
                  href={pdfUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full bg-gray-100 rounded-lg shadow-lg overflow-hidden">
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 text-sm">Loading PDF...</p>
                </div>
              </div>
            )}
            
            {/* PDF Embed - Responsive sizing */}
            <div className="w-full" style={{ height: 'calc(100vh - 300px)', minHeight: '500px', maxHeight: '800px' }}>
              <iframe
                src={`${iframeSrc}#view=FitH`}
                className="w-full h-full border-0"
                onLoad={handlePdfLoad}
                onError={handlePdfError}
                title={title}
                loading="lazy"
              />
            </div>
            
            {/* Download Option - Always available */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Having trouble viewing? Try downloading the PDF.
              </p>
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Text Content (if present) */}
      {textContent && (
        <div 
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: sanitizedText }}
        />
      )}
    </div>
  );
}
