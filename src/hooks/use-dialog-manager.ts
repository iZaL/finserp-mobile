import {useCallback, useState} from 'react';

/**
 * Generic dialog state manager hook
 * Consolidates multiple dialog state management into a single hook
 *
 * @example
 * const { openDialog, closeDialog, isOpen, selectedItem } = useDialogManager<VehicleBooking>()
 *
 * // Open a dialog with data
 * openDialog('receive', booking)
 *
 * // Check if dialog is open
 * <ReceiveDialog open={isOpen('receive')} booking={selectedItem} />
 *
 * // Close dialog
 * closeDialog()
 */
export function useDialogManager<T = unknown>() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  /**
   * Open a dialog with optional data
   * @param dialogName - Unique identifier for the dialog
   * @param item - Data to pass to the dialog
   */
  const openDialog = useCallback((dialogName: string, item?: T) => {
    setActiveDialog(dialogName);
    setSelectedItem(item ?? null);
  }, []);

  /**
   * Close the currently active dialog and clear selected item
   */
  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedItem(null);
  }, []);

  /**
   * Check if a specific dialog is currently open
   * @param dialogName - Dialog identifier to check
   * @returns true if the dialog is open
   */
  const isOpen = useCallback(
    (dialogName: string) => activeDialog === dialogName,
    [activeDialog]
  );

  return {
    openDialog,
    closeDialog,
    isOpen,
    selectedItem,
    activeDialog,
  };
}
