import { type State, type TrackMetadata } from './NativeExpoNativeTrackPlayer';
export interface PlaybackProgress {
    position: number;
    duration: number;
    trackIndex: number;
}
export declare function usePlaybackState(): State;
export declare function useProgress(intervalMs?: number): PlaybackProgress;
export declare function useQueue(): TrackMetadata[];
export declare function useCurrentTrack(): TrackMetadata | null;
export declare function useCurrentTrackIndex(): number;
//# sourceMappingURL=hooks.d.ts.map