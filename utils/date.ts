export const formatJoinedDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const formatPostDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);

    // Time part: 4:38 PM
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    const time = date.toLocaleTimeString('en-US', timeOptions);

    // Date part: Sep 18, 2024
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    const dateFormatted = date.toLocaleDateString('en-US', dateOptions);

    return `${time} • ${dateFormatted}`;
  } catch (error) {
    console.error('Error formatting post date:', error);
    return dateString || '';
  }
};
