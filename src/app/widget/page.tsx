"use client";

import ChatBot from "@/components/ChatBot";

// This page is designed to be embedded as an iframe on WordPress.
// It renders ONLY the chatbot widget with no nav, footer, or background clutter.
export default function WidgetPage() {
  return (
    <div
      style={{
        // Transparent so the WordPress site background shows through
        background: "transparent",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        // No margin or padding — the iframe handles sizing
        margin: 0,
        padding: 0,
      }}
    >
      <ChatBot />
    </div>
  );
}
