import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore } from "../lib/api";

const AuthContext = createContext(null);

const isStaff = (u) => u && (u.role === "trainer" || u.role === "admin");

// Fetches which dashboard modules the signed-in staff member can see (see
// backend's GET /role-matrix/my-access). Fails closed on error — an empty
// list plus the admin bypass in `can()` below means a network hiccup never
// accidentally reveals a section a trainer shouldn't have.
async function fetchModules() {
  try {
    const { data } = await api.get("/role-matrix/my-access");
    return data.modules || [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.access) {
      setUser(null);
      setModules([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      if (isStaff(data)) {
        setUser(data);
        setModules(await fetchModules());
      } else {
        tokenStore.clear();
        setUser(null);
        setModules([]);
      }
    } catch {
      tokenStore.clear();
      setUser(null);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    tokenStore.set(data);
    const me = await api.get("/auth/me");
    if (!isStaff(me.data)) {
      tokenStore.clear();
      throw new Error("This dashboard is for coaches and admins only.");
    }
    setUser(me.data);
    setModules(await fetchModules());
    return me.data;
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    setModules([]);
  };

  // Admins always have full access (see require_module on the backend) —
  // there's no admin row in the permission matrix to check against, so the
  // Super Admin account can never lock itself out of its own console.
  const can = (moduleKey) => user?.role === "admin" || modules.includes(moduleKey);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, modules, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}