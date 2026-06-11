import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitHomework } from './homeworkApi';

// Сдача ДЗ. После успеха обновляем списки и счётчики:
// задание уходит из «надо сделать» в «на проверке».
export function useSubmitHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitHomework,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['homework'] });
    },
  });
}
