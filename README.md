# \# SKS Player

# 

# SKS Player is a browser-based local music player for folder-based audio libraries. It scans a selected music source, builds albums/folders/tracks automatically, and provides a compact playback UI with favorites, search, sorting, and persistent user settings.

# 

# \## Status

# 

# \*\*Work in progress (WIP).\*\*

# 

# \## Use Case

# 

# Designed for playing and organizing a local music collection directly in the browser without a backend.

# 

# \## Preview

# 

# > The preview images below assume the `README.md` is placed in the project root and the images are stored in `assets/preview/`.

# 

# !\[Preview 1](assets/preview/prev1.png)

# !\[Preview 2](assets/preview/prev2.png)

# !\[Preview 3](assets/preview/prev3.png)

# !\[Preview 4](assets/preview/prev4.png)

# 

# \## Main Features

# 

# \- Folder scan via modern browser directory picker

# \- Alternative file import via file list / relative folder structure

# \- Automatic library build for:

# &#x20; - Home overview

# &#x20; - Albums

# &#x20; - Tracks

# &#x20; - Folders

# &#x20; - Favorites

# \- Playback controls:

# &#x20; - Play / pause

# &#x20; - Previous / next

# &#x20; - Shuffle

# &#x20; - Repeat

# &#x20; - Seek and volume control

# &#x20; - Mute

# &#x20; - Fullscreen

# \- Search across tracks, albums, and folders

# \- Favorites with local persistence

# \- Sort modes:

# &#x20; - A → Z

# &#x20; - Z → A

# &#x20; - Oldest → newest

# &#x20; - Newest → oldest

# \- Album/folder cover detection from cover image files

# \- Saved settings via `localStorage`

# \- Saved folder handles via `IndexedDB`

# \- Optional auto-scan on startup

# \- Optional player state restore

# \- Keyboard shortcuts for basic playback control

# 

# \## Supported Audio Formats

# 

# \- `.mp3`

# \- `.ogg`

# \- `.aac`

# \- `.m4a`

# \- `.wav`

# 

# \## Requirements / Notes

# 

# \- Best used in \*\*Chrome or Edge\*\* because modern folder access relies on the File System Access API.

# \- Uses \*\*IndexedDB\*\* to store folder handles.

# \- Uses \*\*localStorage\*\* for settings, favorites, and player state.

# \- Cover detection currently looks for `.jpg` / `.jpeg` files containing `cover` or `cov` in the filename.

# \- Track metadata is mainly derived from filenames and folder names.

# \- No backend is required.

# 

# \## Current Scope

# 

# The player is focused on local library browsing and playback, not on advanced metadata parsing, streaming services, or server-side media management.

# 

# \## WIP Notes

# 

# This project is still under active development. Behavior, UI details, scan logic, and feature set may still change.

