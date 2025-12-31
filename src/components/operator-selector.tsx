'use client';

import {useState, useMemo, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {Check, ChevronsUpDown, User, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import type {Operator} from '@/types/production-run';

interface OperatorSelectorProps {
  operators: Operator[];
  selectedOperatorId?: number | null;
  onSelect: (operator: Operator | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function OperatorSelector({
  operators,
  selectedOperatorId,
  onSelect,
  disabled = false,
  isLoading = false,
  placeholder,
  searchPlaceholder,
  emptyText,
}: OperatorSelectorProps) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter operators based on search query
  const filteredOperators = useMemo(() => {
    if (!searchQuery.trim()) return operators;

    const query = searchQuery.toLowerCase();
    return operators.filter(
      (op) =>
        op.name.toLowerCase().includes(query) ||
        (op.phone && op.phone.includes(query))
    );
  }, [operators, searchQuery]);

  const selectedOperator = useMemo(
    () => operators.find((op) => op.id === selectedOperatorId),
    [operators, selectedOperatorId]
  );

  // Clear search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : (
              <User className="text-muted-foreground size-4" />
            )}
            {selectedOperator ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedOperator.name}</span>
                {selectedOperator.phone && (
                  <span className="text-muted-foreground text-xs">
                    {selectedOperator.phone}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('selectOperator')}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder || t('searchOperator')}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {filteredOperators.length === 0 && (
              <CommandEmpty>
                <p className="text-muted-foreground p-4 text-center text-sm">
                  {emptyText || t('noOperatorsFound')}
                </p>
              </CommandEmpty>
            )}
            {filteredOperators.length > 0 && (
              <CommandGroup>
                {filteredOperators.map((operator) => (
                  <CommandItem
                    key={operator.id}
                    value={`${operator.name} ${operator.phone || ''}`}
                    onSelect={() => {
                      onSelect(
                        operator.id === selectedOperatorId ? null : operator
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        selectedOperatorId === operator.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{operator.name}</span>
                      {operator.phone && (
                        <span className="text-muted-foreground text-xs">
                          {operator.phone}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
