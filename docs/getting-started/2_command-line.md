---
title: Command line usage
---

These examples assume that you have installed lume as the `lume` executable:

```sh
# Show the version
lume --version

# Create a _config.js file
lume --init

# Build the site in the current directory
lume

# Build the site and boot up a web server
# that refresh automatically for every change
lume --serve

# Change the web server port to localhost:8000
lume --serve --port=8000

# Run in development mode
lume --dev
```
