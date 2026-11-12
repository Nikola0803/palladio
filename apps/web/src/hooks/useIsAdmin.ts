import { useAsync } from "./useAsync";

const WP_URL = (import.meta.env.VITE_WP_URL || "").replace(/\/+$/, "");

async function checkIsAdmin(): Promise<boolean> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return false;
    const user = (await res.json()) as { capabilities?: Record<string, boolean> };
    return user.capabilities?.administrator === true;
  } catch {
    return false;
  }
}

export function useIsAdmin(): boolean {
  const { data } = useAsync(() => checkIsAdmin(), []);
  return data ?? false;
}
