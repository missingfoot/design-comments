// Anonymous user management - stored in localStorage

const STORAGE_KEY = "design-comments-user";

export interface User {
  id: string;
  name: string;
  color: string;
}

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

function generateId(): string {
  return crypto.randomUUID();
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function getUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function createUser(name: string): User {
  const user: User = {
    id: generateId(),
    name,
    color: randomColor(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function updateUserName(name: string): User | null {
  const user = getUser();
  if (user) {
    user.name = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }
  return createUser(name);
}
