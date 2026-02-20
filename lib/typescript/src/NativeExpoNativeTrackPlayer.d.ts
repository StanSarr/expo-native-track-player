import { type TurboModule } from 'react-native';
export interface TrackMetadata {
    id: string;
    url: string;
    title?: string;
    artist?: string;
    albumName?: string;
    artworkUri?: string;
    trackNumber?: number;
    duration?: number;
    composer?: string;
    conductor?: string;
    genre?: string;
    compilation?: string;
    subtitle?: string;
    description?: string;
    station?: string;
    mediaType?: number;
    type?: string;
    userAgent?: string;
    contentType?: string;
    pitchAlgorithm?: string;
}
export type RepeatMode = 'off' | 'track' | 'queue' | 'loop_portion';
export type State = 'none' | 'ready' | 'playing' | 'paused' | 'stopped' | 'loading' | 'buffering' | 'error' | 'ended';
export type PlaybackState = State;
export interface Spec extends TurboModule {
    addToQueue(track: TrackMetadata): void;
    addQueue(tracks: Array<TrackMetadata>): void;
    getQueue(): Array<TrackMetadata>;
    removeFromQueue(trackId: string): void;
    clearQueue(): void;
    play(index?: number | null): void;
    pause(): void;
    stop(): void;
    skipToNext(): void;
    skipToPrevious(): void;
    skipToIndex(index: number): void;
    seekTo(positionMs: number): void;
    reset(): void;
    setRepeatMode(mode: RepeatMode, startMs?: number | null, endMs?: number | null): void;
    getRepeatMode(): RepeatMode;
    getCurrentTrack(): TrackMetadata | null;
    getCurrentTrackIndex(): number;
    getPosition(): number;
    getDuration(): number;
    getPlaybackState(): State;
    setVolume(volume: number): void;
    getVolume(): number;
    setRate(rate: number): void;
    getRate(): number;
    addListener(eventName: string): void;
    removeListeners(count: number): void;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeExpoNativeTrackPlayer.d.ts.map