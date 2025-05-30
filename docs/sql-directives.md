# SQL Directives

nitro-quill supports a simple directive system to customize route behaviour. Directives are placed in comments starting with `-- @` within your `.sql` files.

## Supported Directives

- `-- @param name: type = default` – Declare parameter type and optional default.
- `-- @auth <anon|basic|bearer token1,token2>` – Control authentication requirement.
- `-- @method <GET|POST>` – Restrict the HTTP method for the route.
- `-- @countQuery` – Marks the following SQL statement as a count query for pagination metadata.

Placeholders like `@param` or `:param` in your SQL are bound from request parameters. See examples in the repository README for typical usage.
