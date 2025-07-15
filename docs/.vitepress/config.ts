import { defineConfig } from "vitepress";

export default defineConfig({
  title: "GPT Image 1 MCP",
  description:
    "AI-powered image generation and vision analysis MCP server documentation",
  head: [["link", { rel: "icon", href: "/images/logo.png" }]],

  themeConfig: {
    logo: "/images/logo.png",

    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API Reference", link: "/api/tools" },
      { text: "Examples", link: "/examples/basic-usage" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            {
              text: "What is GPT Image 1 MCP?",
              link: "/guide/what-is-mcp",
            },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Features",
          items: [
            { text: "Image Generation", link: "/guide/image-generation" },
            { text: "Vision Analysis", link: "/guide/vision-analysis" },
            {
              text: "Japanese Translation",
              link: "/guide/japanese-translation",
            },
          ],
        },
        {
          text: "Configuration",
          items: [
            {
              text: "Environment Variables",
              link: "/guide/environment-variables",
            },
            { text: "MCP Configuration", link: "/guide/mcp-configuration" },
          ],
        },
      ],

      "/api/": [
        {
          text: "MCP Tools",
          items: [
            { text: "Overview", link: "/api/tools" },
            { text: "generate-image", link: "/api/generate-image" },
            { text: "analyze-image", link: "/api/analyze-image" },
            { text: "translate-prompt", link: "/api/translate-prompt" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Error Handling", link: "/api/error-handling" },
            { text: "Rate Limiting", link: "/api/rate-limiting" },
          ],
        },
      ],

      "/examples/": [
        {
          text: "Usage Examples",
          items: [
            { text: "Basic Usage", link: "/examples/basic-usage" },
            {
              text: "Advanced Scenarios",
              link: "/examples/advanced-scenarios",
            },
            {
              text: "Integration Patterns",
              link: "/examples/integration-patterns",
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/naporin0624/gen-image-mcp" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025-present",
    },

    search: {
      provider: "local",
    },
  },
});
