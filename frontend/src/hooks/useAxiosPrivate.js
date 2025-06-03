import useAuth from "./useAuth";
import { useEffect } from "react";
import { privateAxios } from "@/lib/axios";
import useRefreshToken from "./useRefreshToken";

const useAxiosPrivate = () => {
  const { auth } = useAuth();
  const refresh = useRefreshToken();

  useEffect(() => {
    const requestIntercept = privateAxios.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${auth?.accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = privateAxios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        if (
          (error?.response?.status === 401 ||
            error?.response?.status === 403) &&
          !prevRequest?.sent
        ) {
          prevRequest.sent = true;
          const newAccessToken = await refresh();
          prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return privateAxios(prevRequest);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      privateAxios.interceptors.request.eject(requestIntercept);
      privateAxios.interceptors.response.eject(responseIntercept);
    };
  }, [auth?.accessToken, refresh]);

  return privateAxios;
};

export default useAxiosPrivate;
