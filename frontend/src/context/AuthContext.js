"use client";

import { privateAxios } from "@/lib/axios";
import React, { createContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const refreshRes = await privateAxios.get("/auth/refresh-token");
        const accessToken = refreshRes.data.accessToken;

        const userRes = await privateAxios.get("/auth/profile-details", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setAuth({ user: userRes.data.user, accessToken });
      } catch (err) {
        console.log("AuthContext: Failed to fetch user", err);
        setAuth({});
      }
    };

    fetchUserDetails();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
