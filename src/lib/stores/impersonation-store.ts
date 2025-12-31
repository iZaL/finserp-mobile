import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {toast} from 'sonner';
import {
  impersonationService,
  type ImpersonationInfo,
} from '../services/impersonation';
import type {User} from '../services/auth';

interface ImpersonationState {
  // Original user state (before impersonation)
  originalUser: User | null;
  originalToken: string | null;

  // Impersonation info
  impersonation: ImpersonationInfo | null;
  isImpersonating: boolean;

  // Actions
  startImpersonation: (
    userId: number,
    onSuccess: (user: User, token: string) => void
  ) => Promise<void>;
  stopImpersonation: (
    onSuccess: (user: User, token: string) => void
  ) => Promise<void>;
  setOriginalState: (user: User, token: string) => void;
  clearImpersonation: () => void;
}

export const useImpersonationStore = create<ImpersonationState>()(
  persist(
    (set, get) => ({
      originalUser: null,
      originalToken: null,
      impersonation: null,
      isImpersonating: false,

      setOriginalState: (user, token) => {
        set({
          originalUser: user,
          originalToken: token,
        });
      },

      startImpersonation: async (userId, onSuccess) => {
        try {
          const response = await impersonationService.start(userId);

          set({
            impersonation: response.impersonation,
            isImpersonating: true,
          });

          // Call the success callback with the new user and token
          onSuccess(response.user, response.token);

          toast.success(`Now viewing as ${response.user.name}`);
        } catch (error) {
          console.error('Failed to start impersonation:', error);
          throw error;
        }
      },

      stopImpersonation: async (onSuccess) => {
        const {originalUser, originalToken} = get();

        if (!originalUser || !originalToken) {
          toast.error('No original session to restore');
          return;
        }

        try {
          // Try to revoke the impersonation token
          await impersonationService.stop();
        } catch (error) {
          // Even if the stop request fails, we should restore the original session
          console.error('Failed to stop impersonation on server:', error);
        }

        // Restore original user and token
        set({
          impersonation: null,
          isImpersonating: false,
          originalUser: null,
          originalToken: null,
        });

        // Call the success callback with the original user and token
        onSuccess(originalUser, originalToken);

        toast.success('You are now back as yourself');
      },

      clearImpersonation: () => {
        set({
          originalUser: null,
          originalToken: null,
          impersonation: null,
          isImpersonating: false,
        });
      },
    }),
    {
      name: 'impersonation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        originalUser: state.originalUser,
        originalToken: state.originalToken,
        impersonation: state.impersonation,
        isImpersonating: state.isImpersonating,
      }),
    }
  )
);
