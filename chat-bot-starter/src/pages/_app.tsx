"use client";

import { type AppType } from "next/app";
import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
  return (
    // Provide the client to your App
    <Component {...pageProps} />
  );
};

export default MyApp;
