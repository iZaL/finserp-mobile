'use client';

import {useFormatter} from 'next-intl';

interface RelativeTimeProps {
  date: Date | string;
  className?: string;
}

/**
 * RelativeTime Component
 * Displays relative time (e.g., "2 hours ago", "3 days ago") for dates within 7 days
 * Falls back to full date/time for older dates
 * Supports both English and Arabic (and any locale supported by Intl.RelativeTimeFormat)
 */
export function RelativeTime({date, className}: RelativeTimeProps) {
  const format = useFormatter();

  // Parse the date string properly
  let targetDate: Date;
  if (typeof date === 'string') {
    // Try parsing with different methods
    targetDate = new Date(date);

    // If parsing failed, try replacing space with 'T'
    if (isNaN(targetDate.getTime())) {
      const isoDate = date.replace(' ', 'T');
      targetDate = new Date(isoDate);
    }
  } else {
    targetDate = date;
  }

  // Check if date is valid
  if (isNaN(targetDate.getTime())) {
    console.error('Invalid date after all parsing attempts:', date);
    return <span className={className}>Invalid date</span>;
  }

  const now = new Date();
  const diffInDays = Math.abs(
    Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // If more than 7 days old, show full date/time
  if (diffInDays > 7) {
    return (
      <span className={className}>
        {format.dateTime(targetDate, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })}
      </span>
    );
  }

  // Show relative time using next-intl's built-in formatter
  return (
    <span className={className}>{format.relativeTime(targetDate, {now})}</span>
  );
}
