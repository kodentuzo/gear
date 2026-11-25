# Kodentuzo Gear

> Build tools for web apps: app metadata, icons and container images.

Small tools for describing and building a web app. So far: `@kodentuzo/tape`, which reads,
checks and writes `tape.json` (an app's name, description and icon), web manifests and image
labels. Planned: sleeve (icons and theme colours) and recorder (builds an app into a container
image).

| Package                            | State   | What it does                                                                 |
| ---------------------------------- | ------- | ---------------------------------------------------------------------------- |
| [`@kodentuzo/tape`](packages/tape) | Built   | Reads, checks and writes `tape.json`, web manifests and image labels.        |
| `@kodentuzo/sleeve`                | Planned | Icons, theme colours and the web manifest file, written with `tape`.         |
| `@kodentuzo/recorder`              | Planned | Builds one commit of an app into a container image, labels it and pushes it. |
