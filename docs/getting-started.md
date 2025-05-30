# Getting Started with nitro-quill

This document explains how to install and configure **nitro-quill** in a Nitro project.

## Installation

```bash
pnpm add nitro-quill
```

Add the plugin in your `nitro.config.ts`:

```ts
import nitroQuill from 'nitro-quill'

export default defineNitroConfig({
  plugins: [nitroQuill({
    directory: 'api',
    connection: { /* mssql connection options */ }
  })]
})
```

## Usage

Create `.sql` files under the configured directory. Each file becomes a route based on its path. See [SQL Directives](./sql-directives.md) for supported annotations.
