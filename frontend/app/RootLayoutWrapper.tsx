"use client";

import React from "react";
import ToastContainer from "@/components/Toast/ToastContainer";

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
