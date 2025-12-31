'use client';

import * as React from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {DayPicker, getDefaultClassNames} from 'react-day-picker';

import {cn} from '@/lib/utils';
import {buttonVariants} from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 [--cell-size:3.5rem]', className)}
      classNames={{
        root: cn('w-full', defaultClassNames.root),
        months: cn('flex flex-col gap-4 w-full', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        month_caption: cn(
          'flex h-10 w-full items-center justify-between px-2 relative',
          defaultClassNames.month_caption
        ),
        button_previous: cn(
          buttonVariants({variant: 'outline'}),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({variant: 'outline'}),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          defaultClassNames.button_next
        ),
        caption_label: cn(
          'text-sm font-medium select-none',
          defaultClassNames.caption_label
        ),
        table: 'w-full border-collapse',
        weekdays: cn('grid grid-cols-7 w-full', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground flex items-center justify-center flex-1 h-9 text-[0.8rem] font-normal select-none',
          defaultClassNames.weekday
        ),
        week: cn('grid grid-cols-7 w-full mt-1', defaultClassNames.week),
        day: cn(
          'relative flex-1 h-14 text-center text-sm p-0',
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({variant: 'ghost'}),
          'h-full w-full p-0 font-normal aria-selected:opacity-100',
          defaultClassNames.day_button
        ),
        selected: cn(
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
          defaultClassNames.selected
        ),
        today: cn('bg-accent text-accent-foreground', defaultClassNames.today),
        outside: cn(
          'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
          defaultClassNames.outside
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled
        ),
        range_middle: cn(
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
          defaultClassNames.range_middle
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({...props}) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export {Calendar};
