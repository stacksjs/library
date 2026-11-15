# Notes Changelog

## v0.1.0

## ✨ Features

- **cloud**: give the server sites the storage bucket settings ([523bfa9](https://github.com/stacksjs/library/commit/523bfa9)) _(by Chris <chrisbreuer93@gmail.com>)_
- **storage**: keep update files in a Hetzner Object Storage bucket ([bd40b76](https://github.com/stacksjs/library/commit/bd40b76)) _(by Chris <chrisbreuer93@gmail.com>)_
- **mac**: Settings on the stx Settings components, and in-app updates ([4d28439](https://github.com/stacksjs/library/commit/4d28439)) _(by Chris <chrisbreuer93@gmail.com>)_
- rename the app to Notes ([8b40da7](https://github.com/stacksjs/library/commit/8b40da7)) _(by Chris <chrisbreuer93@gmail.com>)_
- **release**: ship the Mac app to TestFlight with bun run release:testflight ([4fa378e](https://github.com/stacksjs/library/commit/4fa378e)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **account**: delete your account in the app, plus privacy, support and delete-account pages ([0782409](https://github.com/stacksjs/library/commit/0782409)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **deploy**: attach Library to the stacks box as a SQLite tenant at library.stacksjs.com ([7b3c6d2](https://github.com/stacksjs/library/commit/7b3c6d2)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **database**: SQLite migrations for Library's tables, and the query builder that quotes their reserved columns ([db7e19c](https://github.com/stacksjs/library/commit/db7e19c)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **ai**: complete as you type with Bedrock Nova Lite, on Stacks 0.75.397 ([f6e99ae](https://github.com/stacksjs/library/commit/f6e99ae)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **native**: plain labels in the note checklist strip; friction log for round three ([a92dd47](https://github.com/stacksjs/library/commit/a92dd47)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **native**: caret-aware formatting and completions, markdown editors, 24/15 sidebar, card shadow; sign in again after signing out ([1c99088](https://github.com/stacksjs/library/commit/1c99088)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **native**: Apple Notes style list and editor, saves stay with their note, ghost text shown with its joining space ([afe003f](https://github.com/stacksjs/library/commit/afe003f)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **desktop**: config/desktop.ts for the native Mac app, the app icon script and the Mac App Store notes ([83ff5fa](https://github.com/stacksjs/library/commit/83ff5fa)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **ai**: mount POST /api/complete for ghost-text completions; add the demo seed script ([3b93c44](https://github.com/stacksjs/library/commit/3b93c44)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **native**: Things-style to-do lists with in-place editor, Library brand, notes trash and tags, ghost text ([979a288](https://github.com/stacksjs/library/commit/979a288)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: server-side Recently Deleted for notes, Things reference polish, Quick Entry, folder rename and note sorting ([7f47f5d](https://github.com/stacksjs/library/commit/7f47f5d)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **api**: server-side Recently Deleted for notes with restore and purge ([c37ce7e](https://github.com/stacksjs/library/commit/c37ce7e)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: library icon and colour guards, fewer bindings per row, windowed lists, friction log ([619f59e](https://github.com/stacksjs/library/commit/619f59e)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **native**: Mac screens for to-dos, notes and prompt libraries ([b3954ae](https://github.com/stacksjs/library/commit/b3954ae)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: Things-style sidebar and inline to-do editor, notes tags and recently deleted, ghost-text overlay, brand now Library ([47b735e](https://github.com/stacksjs/library/commit/47b735e)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: prompt libraries with use, history and share sheets; neutralise mustaches in user text ([a586eb3](https://github.com/stacksjs/library/commit/a586eb3)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: notes list and editor with checklist preview and autosave ([55f3472](https://github.com/stacksjs/library/commit/55f3472)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: signed-in shell with sidebar, to-do list and detail panes ([42cd4d3](https://github.com/stacksjs/library/commit/42cd4d3)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: design tokens and layout, sign in and sign up, stores for tasks, notes and prompts ([71f9026](https://github.com/stacksjs/library/commit/71f9026)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: browser session and API client, proxy GET /me through the views server ([c8c0e38](https://github.com/stacksjs/library/commit/c8c0e38)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: pure logic for dates, to-do views, routes, markdown, notes and prompts ([92a90fd](https://github.com/stacksjs/library/commit/92a90fd)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- shared API client and types for the web and native apps ([fae9b47](https://github.com/stacksjs/library/commit/fae9b47)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- Kept data layer on MySQL - tasks, notes, prompt libraries and sharing ([0cb3d10](https://github.com/stacksjs/library/commit/0cb3d10)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## 🐛 Bug Fixes

- **test**: boot auto-imports in tests ([6c26f3a](https://github.com/stacksjs/library/commit/6c26f3a)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- make Library typecheck and lint clean so CI can gate the deploy ([73270ae](https://github.com/stacksjs/library/commit/73270ae)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: sheet focus on open, guard Use without a prompt, large empty-state art ([8b2af53](https://github.com/stacksjs/library/commit/8b2af53)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## ⚡ Performance Improvements

- **native**: draw list rows inline and the open to-do once, branch-free rows; friction log for round two ([2bd9833](https://github.com/stacksjs/library/commit/2bd9833)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## ♻️ Code Refactoring

- **web**: write the variable chip's braces as they are, stx keeps them in script strings ([8b55b66](https://github.com/stacksjs/library/commit/8b55b66)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: MoreMenu takes its icon as a prop, ts-css reads it from the attribute ([7fe1403](https://github.com/stacksjs/library/commit/7fe1403)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: search fields bind the store's signal directly with x-model ([c68e310](https://github.com/stacksjs/library/commit/c68e310)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: drop the component wrapper display:contents rule, stx ships it ([142dcdd](https://github.com/stacksjs/library/commit/142dcdd)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **web**: drop the {{ neutraliser, stx writes binding text as data now ([bbcea67](https://github.com/stacksjs/library/commit/bbcea67)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## 📝 Documentation

- **mac**: the Store profile and installer identity are in place, only the API key is missing ([f13941b](https://github.com/stacksjs/library/commit/f13941b)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- status of every stx friction entry after the fixes ([def14ea](https://github.com/stacksjs/library/commit/def14ea)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- the framework gaps the Mac app found and what landed for each ([b326e35](https://github.com/stacksjs/library/commit/b326e35)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## 💄 Styles

- **native**: Things vertical rhythm for list titles and block headings ([79ded36](https://github.com/stacksjs/library/commit/79ded36)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## ✅ Tests

- **ai**: pin the /api/complete route and the completion config ([2888bd8](https://github.com/stacksjs/library/commit/2888bd8)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## 💚 Continuous Integration

- run the test job on SQLite, the runner has no MySQL ([48ef048](https://github.com/stacksjs/library/commit/48ef048)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## 🔧 Chores

- record the app's name in bun.lock ([b7d3aa9](https://github.com/stacksjs/library/commit/b7d3aa9)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: bumpx 0.2.35, which the release action needs ([7ee1ac2](https://github.com/stacksjs/library/commit/7ee1ac2)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: stacks 0.75.599 ([3f589e1](https://github.com/stacksjs/library/commit/3f589e1)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: stacks 0.75.598, stx 0.2.893 and craft-native 0.0.505 ([0b682d1](https://github.com/stacksjs/library/commit/0b682d1)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: upgrade to stacks 0.75.593 and stx 0.2.889 ([e12bad7](https://github.com/stacksjs/library/commit/e12bad7)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: upgrade to stacks 0.75.439 for TestFlight releases ([38b3ff2](https://github.com/stacksjs/library/commit/38b3ff2)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- regenerate the auto-import manifests for the account action ([81e1749](https://github.com/stacksjs/library/commit/81e1749)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- upgrade stacks to 0.75.407 ([c385c8d](https://github.com/stacksjs/library/commit/c385c8d)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **release**: keep the App Store Connect key encrypted in .env.production ([74f0ecf](https://github.com/stacksjs/library/commit/74f0ecf)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- rename the app to Library ([bead590](https://github.com/stacksjs/library/commit/bead590)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **deps**: stx 0.2.769 ([e2b2953](https://github.com/stacksjs/library/commit/e2b2953)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- **deps**: stx 0.2.765, and declare the two icon sets the app draws from ([b04c0ec](https://github.com/stacksjs/library/commit/b04c0ec)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_
- keep local reference captures out of the repo ([2475223](https://github.com/stacksjs/library/commit/2475223)) _(by Chris Breuer <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _Chris Breuer <chrisbreuer93@gmail.com>_
