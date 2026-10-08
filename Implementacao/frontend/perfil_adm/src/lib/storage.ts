export const readJsonFromStorage = <T,>(key: string): T | null => {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.error(`Não foi possível ler os dados locais "${key}".`, error);
    localStorage.removeItem(key);
    return null;
  }
};
