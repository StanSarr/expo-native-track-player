# expo-native-track-player

TurboModule track player for React Native New Architecture (iOS + Android).

## Docs

- [Full documentation](docs/README.md)
- [Types reference](docs/types.md)

## Features

- Native queue management (no JS-side queue required)
- Repeat modes: `off`, `track`, `queue`, `loop_portion`
- Full track metadata + custom fields
- Background playback with lock-screen / notification controls
- iOS: MPRemoteCommandCenter + Now Playing info
- Android: MediaSession + foreground service + notification
- Playback snapshots (native) for recovery after background/kill
- Typed events + hooks (`useProgress`, `useQueue`, etc.)

## Installation (outside this repo)

```sh
npm install expo-native-track-player
```

## Requirements

- React Native New Architecture enabled
- Android: minSdk 24+
- iOS: Background audio capability for long playback

## Expo usage

This library requires native code (TurboModule + Media3). It is **not** usable in
Expo Go. Use one of these:

- **Expo prebuild (recommended)**: `npx expo prebuild` and run native builds.
- **Expo bare workflow**: use the generated `ios/` and `android/` projects.

### Expo prebuild steps

1. Install the package:
   ```sh
   npm install expo-native-track-player
   ```
2. Generate native projects:
   ```sh
   npx expo prebuild
   ```
3. Run the app:
   ```sh
   npx expo run:ios
   npx expo run:android
   ```

### Expo config notes

- iOS: add background audio mode in `app.json`:
  ```json
  {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    }
  }
  ```
- Android: the required permissions are declared in the library manifest,
  but Android 13+ still needs runtime notification permission.

### iOS

```sh
cd ios
pod install
```

Ensure New Architecture is enabled in your app (RCT_NEW_ARCH_ENABLED=1).

Enable background audio in your app target:
- `UIBackgroundModes` includes `audio`

### Android

This module uses a foreground media service for reliable background playback.
Ensure your app has these permissions (app manifest):

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

On Android 13+ you must request notification permission at runtime for the
media notification to appear.

Make sure you test background playback on a real device.

## Quick start

```tsx
import TrackPlayer, {
  type PlaybackState,
  type RepeatMode,
  type TrackMetadata,
} from 'expo-native-track-player';

const track: TrackMetadata = {
  id: '001',
  url: 'https://example.com/audio.mp3',
  title: 'Example Track',
  artist: 'Artist Name',
};

await TrackPlayer.reset();
await TrackPlayer.addToQueue(track);
await TrackPlayer.play(null);
```

## API (summary)

All time values are milliseconds unless stated otherwise.

See [Types reference](docs/types.md) for the full list.

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

### State

- `getCurrentTrack(): Promise<TrackMetadata | null>`
- `getCurrentTrackIndex(): Promise<number>`
- `getPosition(): Promise<number>`
- `getDuration(): Promise<number>`
- `getPlaybackState(): Promise<PlaybackState>`

### Audio Controls

- `setVolume(volume: number): Promise<void>` (0.0 to 1.0)
- `getVolume(): Promise<number>`
- `setRate(rate: number): Promise<void>` (0.5 to 2.0 recommended)
- `getRate(): Promise<number>`

## Background playback

### Android

- Foreground service keeps playback alive in background.
- Media notification is required for long playback.
- Audio focus is enabled; playback may pause on focus loss.

### iOS

- Enable `audio` under `UIBackgroundModes`.
- Keep the app audio session active.

## Troubleshooting

### Android: audio plays but no sound

- URL must be ASCII-safe. If it contains non-ASCII characters, URL-encode it.
- Ensure device volume and notification permission are enabled.
- Test on a real device; emulators are not reliable for audio focus/Doze.

### iOS: snapshot crash on load/reset

- Snapshots are saved natively and must be valid property list values.
- If you changed native code recently, delete the app to clear old snapshots.
- Avoid `NaN`/`Infinity` positions; use `0` when duration is unknown.

### Android: queue empty after add

- The example app sets a local queue immediately and then syncs from native.

### iOS: background audio stops

- Confirm background audio capability is enabled in Xcode.

## Example app (this repo)

```sh
cd example
yarn install

# iOS
cd ios
pod install
cd ..
yarn ios

# Android
yarn android
```

The example app should boot and load the sample queue on startup.

## Example usage patterns

### Add multiple tracks and play

```ts
await TrackPlayer.reset();
await TrackPlayer.addQueue(tracks);
await TrackPlayer.play(null);
```

### Loop a portion of a track

```ts
await TrackPlayer.setRepeatMode('loop_portion', 2000, 10000);
```

### Jump to a specific track

```ts
await TrackPlayer.skipToIndex(3);
```


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
