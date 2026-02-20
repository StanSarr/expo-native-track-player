# Types reference

This file documents the public TypeScript types exported by `expo-native-track-player`.

## Track types

```ts
export interface Track {
  id: string;
  url: string;
  title?: string;
  artist?: string;
  albumName?: string;
  artworkUri?: string;
  trackNumber?: number;
  composer?: string;
  conductor?: string;
  genre?: string;
  compilation?: string;
  subtitle?: string;
  description?: string;
  station?: string;
  mediaType?: number;
  type?: TrackType;
  userAgent?: string;
  contentType?: string;
  pitchAlgorithm?: PitchAlgorithm;
  headers?: { [key: string]: any };
  [key: string]: any;
}

export type AddTrack = Track & {
  url: string | ResourceObject;
  artwork?: string | ResourceObject;
};
```

## Playback snapshot

```ts
export interface PlaybackSnapshot {
  state: State;
  position: number;
  duration: number;
  trackIndex: number;
  trackId?: string;
  rate: number;
  volume: number;
  repeatMode: RepeatMode;
  savedAt: number;
}
```

## Constants

- `State` (string union):
  - `none`, `ready`, `playing`, `paused`, `stopped`, `loading`, `buffering`, `error`, `ended`
- `RepeatModes` (string union):
  - `off`, `track`, `queue`, `loop_portion`
- `TrackTypes` (string/number map depending on platform)
- `PitchAlgorithms` (iOS-only pitch algorithm map)

## Events

Events are exported from `events.ts`:

- `Event` (kebab-case event names)
- `TrackPlayerEvents` (queue-related events)
- `AudioEvents` (`NativeEventEmitter` wrapper)

## Resources

```ts
export interface ResourceObject {
  uri: string;
  headers?: { [key: string]: string };
}
```

