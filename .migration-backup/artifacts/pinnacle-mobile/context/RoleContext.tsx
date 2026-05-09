import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Role = "student" | "parent" | "teacher" | "admin" | null;

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => Promise<void>;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  setRole: async () => {},
  loading: true,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("pinnacle_role").then((stored) => {
      if (stored) setRoleState(stored as Role);
      setLoading(false);
    });
  }, []);

  const setRole = async (newRole: Role) => {
    if (newRole) {
      await AsyncStorage.setItem("pinnacle_role", newRole);
    } else {
      await AsyncStorage.removeItem("pinnacle_role");
    }
    setRoleState(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
