export async function runWithPendingState<T>(
  operation: () => Promise<T>,
  setPending: (pending: boolean) => void,
): Promise<T> {
  try {
    setPending(true);
    return await operation();
  } finally {
    setPending(false);
  }
}
