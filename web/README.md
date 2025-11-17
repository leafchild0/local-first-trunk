## Description

Web module for the local first application.
Servers as a single source of truth and makes merges per client.
Use TS, Vite, Vue, Tailwind. Simple and easy, just enought for proof of concept. 

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm dev

# preview
$ pnpm preview

# lint
$ pnpm lint
```

## Motivation
⚙️ Core Idea — What “Local-First” Actually Means

Local-first software flips the standard cloud-centric model on its head.

Traditional apps:
Data lives primarily on the server.
The client is a terminal that syncs back to the server.
Offline mode is an afterthought, often flaky or absent.

Local-first apps:
The source of truth is local — the user’s device holds an authoritative copy.
Sync happens asynchronously and peer-to-peer (if possible).
Users own their data, and collaboration happens via CRDTs or similar conflict-free mechanisms.
The app feels instantaneous because every operation happens locally, with sync being backgrounded and resilient.
You can think of it as:
“Offline-first on steroids” + collaborative sync + privacy-respecting data ownership.

So the idea was to explore that world. And boy, it's deep.

## Things unfinished
I've got the general idea, but there are some things that I intentionally skipped.
Like Security and privacy (encryption for the notes, for example, AES), maybe a cloud backup like S3 or a normal DB :)
There is a simple vector sync that is quite efficient if you work alone on that using just a few clients. 
For real-time collaboration approach like CRDTs is needed. 