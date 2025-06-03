import useAuth from "./useAuth";
import { publicAxios } from "@/lib/axios";

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = async () => {
    try {
      const res = await publicAxios.get("/auth/refresh-token", {
        withCredentials: true,
      });

      setAuth((prev) => {
        return { ...prev, accessToken: res.data.accessToken };
      });

      return res.data.accessToken;
    } catch (error) {
      setAuth({});
      throw error;
    }
  };

  return refresh;
};

export default useRefreshToken;
