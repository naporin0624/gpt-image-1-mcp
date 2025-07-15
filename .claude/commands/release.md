---
description: Create a GitHub release for the ChatGPT image generation MCP server
---

# Release Command

Create a new GitHub release for the chatgpt-image-gen-mcp project with comprehensive release notes.

## Usage

`/project:release <version> [release_notes]`

Examples:

- `/project:release v0.1.0`
- `/project:release v0.2.0 "Added batch image editing capabilities"`
- `/project:release v1.0.0 "First stable release with English-only validation"`

## Parameters

1. **version**: Version tag (format: "vX.Y.Z")
2. **(optional) release_notes**: Additional release notes (auto-generated if not provided)

## Task

This command will:

1. **Pre-release checks**:
   - Verify working directory is clean
   - Check that built distribution exists
   - Validate version format
   - Update package.json version if needed

2. **Build for release**:
   - `pnpm build` to create distribution
   - `pnpm typecheck` to verify types
   - `pnpm lint` to check code quality
   - `pnpm test` to run tests

3. **Publish to npm**:
   - `pnpm publish` to publish package to npm registry
   - Verify package is available on npmjs.com

4. **Create git tag**:
   - Create annotated tag with version
   - Push tag to remote repository

5. **Create GitHub release**:
   - Generate comprehensive release notes including:
     - New features and improvements
     - MCP tool enhancements
     - Bug fixes
     - Breaking changes (if any)
     - Installation instructions
   - Upload distribution assets:
     - `dist/` directory as archive
     - Source code archive
   - Mark as latest release

6. **Generate release notes template**:

   ````markdown
   ## 🖼️ ChatGPT Image Gen MCP v{version}

   A TypeScript MCP server for DALL-E 3 image generation with GPT-4o vision analysis.

   ### ✨ New Features

   - [Auto-generated from commit messages since last release]

   ### 🔧 MCP Tool Improvements

   - [Auto-generated from MCP-related commits]

   ### 🐛 Bug Fixes

   - [Auto-generated from fix commits]

   ### 📦 Installation

   #### Using with Claude Desktop (npm package)

   ```bash
   npm install -g chatgpt-image-gen-mcp
   ```
   ````

   Add to your MCP configuration:

   ```json
   {
     "mcpServers": {
       "chatgpt-image-gen": {
         "command": "chatgpt-image-gen-mcp",
         "env": {
           "OPENAI_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

   #### Using with Claude Desktop (from source)

   Add to your MCP configuration:

   ```json
   {
     "mcpServers": {
       "chatgpt-image-gen": {
         "command": "node",
         "args": ["path/to/dist/index.js"],
         "env": {
           "OPENAI_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

   #### Development Setup

   ```bash
   git clone <repo-url>
   cd chatgpt-image-gen-mcp
   pnpm install
   pnpm build
   ```

   ### 🔄 What's Changed

   [Full changelog with commit details]

   ### 🌏 Language Support

   English-only prompts required. Use your LLM to translate non-English prompts first.

   ### 🙏 Acknowledgments

   Built with OpenAI DALL-E 3 and GPT-4o APIs.

   ```

   ```

## Available Commands Reference

### NPM Publishing (pnpm)

- `pnpm publish`: Publish package to npm registry
- `pnpm publish --dry-run`: Test publish without actually publishing
- `pnpm version <version>`: Update package.json version and create git tag
- `pnpm version patch|minor|major`: Auto-increment version

### Release Management (gh)

- `gh release create <tag>`: Create a new release
- `gh release upload <tag> <files>`: Upload files to existing release
- `gh release edit <tag>`: Edit an existing release
- `gh release list`: List all releases
- `gh release view <tag>`: View release details

### Tag Management

- `git tag -a <tag> -m "message"`: Create annotated tag
- `git push origin <tag>`: Push tag to remote
- `git tag -l`: List existing tags

### Asset Upload Options

- Support for distribution archives
- Source code automatic inclusion
- MCP server configuration examples

## Prerequisites

- Clean git working directory
- Built distribution in `dist/` directory
- npm registry authentication (`npm login` or `pnpm login`)
- GitHub CLI (gh) authenticated
- Proper repository permissions
- All tests passing

## Error Handling

- Validate distribution exists before release
- Check for duplicate version tags
- Verify GitHub authentication
- Ensure all quality checks pass
- Rollback on partial failures

The command will provide detailed output showing each step and final release URL for easy access.
