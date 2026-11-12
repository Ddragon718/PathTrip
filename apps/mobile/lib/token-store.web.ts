// Browser preview only: keep any signed-in token in memory, never persistent storage.
const tokens = new Map<string, string>();
export const getItemAsync = async (key: string) => tokens.get(key) ?? null;
export const setItemAsync = async (key: string, value: string) => {
  tokens.set(key, value);
};
export const deleteItemAsync = async (key: string) => {
  tokens.delete(key);
};
