# Documentation

This is the full documentation for `expo-native-track-player`. It mirrors the structure of
React Native Track Player while reflecting the actual API surface in this package.

## Contents

- [Getting started](#getting-started)
- [API groups](#api-groups)
- [Events](#events)
- [Hooks](#hooks)
- [Snapshots](#snapshots)
- [Background playback](#background-playback)
- [Lock screen + notification controls](#lock-screen--notification-controls)
- [Troubleshooting](#troubleshooting)
- [Types reference](./types.md)

## Getting started

### Install

```sh
npm install expo-native-track-player
```

### React Native New Architecture

This library uses TurboModules. Ensure New Architecture is enabled for your app:

- iOS: `RCT_NEW_ARCH_ENABLED=1`
- Android: `newArchEnabled=true` in `android/gradle.properties`

### iOS background audio

Enable background audio in your app:

- In Xcode: enable **Background Modes** → **Audio, AirPlay, and Picture in Picture**.
- Or in Expo config:

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["audio"]
    }
  }
}
```

### Android permissions

Add these permissions to the **app** manifest (Android 13+ needs runtime permission):

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## API groups

All time values are milliseconds unless stated otherwise.

### Queue

- `addToQueue(track: TrackMetadata): Promise<void>`
- `addQueue(tracks: TrackMetadata[]): Promise<void>`
- `getQueue(): Promise<TrackMetadata[]>`
- `removeFromQueue(trackId: string): Promise<void>`
- `clearQueue(): Promise<void>`

### Playback

- `play(index?: number | null): Promise<void>`
- `pause(): Promise<void>`
- `stop(): Promise<void>`
- `skipToNext(): Promise<void>`
- `skipToPrevious(): Promise<void>`
- `skipToIndex(index: number): Promise<void>`
- `seekTo(positionMs: number): Promise<void>`
- `reset(): Promise<void>`

### Repeat

- `setRepeatMode(mode: RepeatMode, startMs?: number | null, endMs?: number | null): Promise<void>`
- `getRepeatMode(): Promise<RepeatMode>`

`loop_portion` repeats between `startMs` and `endMs`.

### State and info

- `getCurrentTrack(): Promise<TrackMetadata | null>`
- `getCurrentTrackIndex(): Promise<number>`
- `getPosition(): Promise<number>`
- `getDuration(): Promise<number>`
- `getPlaybackState(): Promise<PlaybackState>`

### Audio controls

- `setVolume(volume: number): Promise<void>` (0.0 to 1.0)
- `getVolume(): Promise<number>`
- `setRate(rate: number): Promise<void>` (0.5 to 2.0 recommended)
- `getRate(): Promise<number>`

### Snapshots

- `getLastPlaybackSnapshot(): Promise<PlaybackSnapshot | null>`

## Events

Use `AudioEvents.addListener` or `AudioEvents.addTypedListener`.

### Core events

- `Event.PlaybackState`
- `Event.PlaybackProgressUpdated`
- `Event.PlaybackActiveTrackChanged`
- `Event.PlaybackQueueEnded`
- `TrackPlayerEvents.QueueUpdated`

### Event payloads (selected)

```ts
Event.PlaybackState: { state: State }
Event.PlaybackProgressUpdated: { position, duration, trackIndex }
Event.PlaybackActiveTrackChanged: { trackIndex, track }
Event.PlaybackQueueEnded: { trackIndex, position }
TrackPlayerEvents.QueueUpdated: { count, trackIndex, queue }
```

## Hooks

- `usePlaybackState()`
- `useProgress(intervalMs = 100)`
- `useQueue()`
- `useCurrentTrack()`
- `useCurrentTrackIndex()`

Example:

```ts
const { position, duration } = useProgress(100);
```

## Snapshots

Snapshots are persisted natively for recovery after background/kill. A snapshot includes:

- `state`, `position`, `duration`
- `trackIndex`, `trackId`
- `rate`, `volume`, `repeatMode`
- `savedAt` (epoch ms)

Use the snapshot to restore UI and resume logic.

## Background playback

### iOS

- `UIBackgroundModes: ["audio"]` required.
- Uses `AVAudioSession` + `MPNowPlayingInfoCenter`.

### Android

- Uses a foreground `MediaSessionService`.
- Notification permission required on Android 13+.

## Lock screen + notification controls

### iOS

- `MPRemoteCommandCenter` handles play/pause/next/previous/seek.
- `MPNowPlayingInfoCenter` displays metadata + artwork.

### Android

- `MediaSession` + `PlayerNotificationManager`.
- Next/previous/seek via media session callbacks and player seek increments.

## Troubleshooting

### iOS: background audio stops

- Check `UIBackgroundModes` includes `audio`.
- Ensure audio session is active.

### iOS: lock screen not updating

- Verify `artworkUri`, `title`, `artist`, `albumName` are present.
- Remote controls require a running audio session.

### Android: no notification or no background playback

- Ensure `POST_NOTIFICATIONS` permission is granted (Android 13+).
- Foreground service must be running during playback.

### Android: autolinking failures in example

- Confirm the example is in the workspace and `yarn install` ran at repo root.

