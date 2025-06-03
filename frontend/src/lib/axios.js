import axios from "axios";

const baseURL = "http://localhost:8080/api";

export const publicAxios = axios.create({
  baseURL,
});

export const privateAxios = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
