# Getting Started with nitro-quill

This document explains how to install and configure **nitro-quill** in a Nitro project.

## Installation

```bash
pnpm add nitro-quill
```

`nitro-quill` exports a Nitro module that automatically registers the runtime plugin.
Add it in your `nitro.config.ts`:

```ts
import nitroQuill from 'nitro-quill'

export default defineNitroConfig({
  modules: [nitroQuill({
    directory: 'api',
    connection: { /* mssql connection options */ }
  })]
})
```

## Usage

Create `.sql` files under the configured directory. Each file becomes a route based on its path. See [SQL Directives](./sql-directives.md) for supported annotations.

## SQLite Configuration

`nitro-quill` can run against SQLite for quick local development or light-weight deployments. This uses Node's experimental `node:sqlite` module which is only available in **Node 22 or later**.

Configure the plugin with an SQLite connection:

```ts
export default defineNitroConfig({
  plugins: [nitroQuill({
    directory: 'api',
    connection: { driver: 'sqlite', filename: 'path/to/db.sqlite' }
  })]
})
```

Ensure your runtime uses Node 22+ when enabling this driver.
