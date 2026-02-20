import { type EmitterSubscription } from 'react-native';
import { type State, type TrackMetadata } from './NativeExpoNativeTrackPlayer';
export declare const Event: {
    readonly PlayerError: "player-error";
    readonly PlaybackState: "playback-state";
    readonly PlaybackError: "playback-error";
    readonly PlaybackQueueEnded: "playback-queue-ended";
    readonly PlaybackActiveTrackChanged: "playback-active-track-changed";
    readonly PlaybackPlayWhenReadyChanged: "playback-play-when-ready-changed";
    readonly PlaybackProgressUpdated: "playback-progress-updated";
    readonly PlaybackResume: "android-playback-resume";
    readonly RemotePlay: "remote-play";
    readonly RemotePlayPause: "remote-play-pause";
    readonly RemotePause: "remote-pause";
    readonly RemoteStop: "remote-stop";
    readonly RemoteNext: "remote-next";
    readonly RemotePrevious: "remote-previous";
    readonly RemoteJumpForward: "remote-jump-forward";
    readonly RemoteJumpBackward: "remote-jump-backward";
    readonly RemoteSeek: "remote-seek";
    readonly RemoteSetRating: "remote-set-rating";
    readonly RemoteDuck: "remote-duck";
    readonly RemoteLike: "remote-like";
    readonly RemoteDislike: "remote-dislike";
    readonly RemoteBookmark: "remote-bookmark";
    readonly RemotePlayId: "remote-play-id";
    readonly RemotePlaySearch: "remote-play-search";
    readonly RemoteSkip: "remote-skip";
    readonly MetadataChapterReceived: "metadata-chapter-received";
    readonly MetadataTimedReceived: "metadata-timed-received";
    readonly MetadataCommonReceived: "metadata-common-received";
    readonly AndroidConnectorConnected: "android-controller-connected";
    readonly AndroidConnectorDisconnected: "android-controller-disconnected";
};
export type EventName = (typeof Event)[keyof typeof Event];
export declare const TrackPlayerEvents: {
    readonly QueueUpdated: "queue-updated";
    readonly PlayerError: "player-error";
    readonly PlaybackState: "playback-state";
    readonly PlaybackError: "playback-error";
    readonly PlaybackQueueEnded: "playback-queue-ended";
    readonly PlaybackActiveTrackChanged: "playback-active-track-changed";
    readonly PlaybackPlayWhenReadyChanged: "playback-play-when-ready-changed";
    readonly PlaybackProgressUpdated: "playback-progress-updated";
    readonly PlaybackResume: "android-playback-resume";
    readonly RemotePlay: "remote-play";
    readonly RemotePlayPause: "remote-play-pause";
    readonly RemotePause: "remote-pause";
    readonly RemoteStop: "remote-stop";
    readonly RemoteNext: "remote-next";
    readonly RemotePrevious: "remote-previous";
    readonly RemoteJumpForward: "remote-jump-forward";
    readonly RemoteJumpBackward: "remote-jump-backward";
    readonly RemoteSeek: "remote-seek";
    readonly RemoteSetRating: "remote-set-rating";
    readonly RemoteDuck: "remote-duck";
    readonly RemoteLike: "remote-like";
    readonly RemoteDislike: "remote-dislike";
    readonly RemoteBookmark: "remote-bookmark";
    readonly RemotePlayId: "remote-play-id";
    readonly RemotePlaySearch: "remote-play-search";
    readonly RemoteSkip: "remote-skip";
    readonly MetadataChapterReceived: "metadata-chapter-received";
    readonly MetadataTimedReceived: "metadata-timed-received";
    readonly MetadataCommonReceived: "metadata-common-received";
    readonly AndroidConnectorConnected: "android-controller-connected";
    readonly AndroidConnectorDisconnected: "android-controller-disconnected";
};
export type TrackPlayerEventName = (typeof TrackPlayerEvents)[keyof typeof TrackPlayerEvents];
export interface PlaybackStateEvent {
    state: State;
}
export interface PlaybackPositionEvent {
    position: number;
    duration: number;
    trackIndex: number;
}
export interface TrackChangedEvent {
    trackIndex: number;
    track: TrackMetadata | null;
}
export interface QueueUpdatedEvent {
    count: number;
    trackIndex: number;
    queue: TrackMetadata[];
}
export interface PlaybackQueueEndedEvent {
    trackIndex: number;
    position: number;
}
export type EventPayloadMap = {
    [Event.PlayerError]: {
        message?: string;
    } | undefined;
    [Event.PlaybackState]: PlaybackStateEvent;
    [Event.PlaybackError]: {
        message?: string;
    } | undefined;
    [Event.PlaybackQueueEnded]: PlaybackQueueEndedEvent;
    [Event.PlaybackActiveTrackChanged]: TrackChangedEvent;
    [Event.PlaybackPlayWhenReadyChanged]: {
        playWhenReady: boolean;
    };
    [Event.PlaybackProgressUpdated]: PlaybackPositionEvent;
    [Event.PlaybackResume]: undefined;
    [Event.RemotePlay]: undefined;
    [Event.RemotePlayPause]: undefined;
    [Event.RemotePause]: undefined;
    [Event.RemoteStop]: undefined;
    [Event.RemoteNext]: undefined;
    [Event.RemotePrevious]: undefined;
    [Event.RemoteJumpForward]: {
        interval?: number;
    } | undefined;
    [Event.RemoteJumpBackward]: {
        interval?: number;
    } | undefined;
    [Event.RemoteSeek]: {
        position: number;
    };
    [Event.RemoteSetRating]: {
        rating: number;
    };
    [Event.RemoteDuck]: {
        paused: boolean;
        permanent: boolean;
    };
    [Event.RemoteLike]: undefined;
    [Event.RemoteDislike]: undefined;
    [Event.RemoteBookmark]: undefined;
    [Event.RemotePlayId]: {
        id: string;
    };
    [Event.RemotePlaySearch]: {
        query: string;
    };
    [Event.RemoteSkip]: {
        interval: number;
    };
    [Event.MetadataChapterReceived]: {
        title?: string;
        startTime?: number;
    };
    [Event.MetadataTimedReceived]: {
        value: string;
    };
    [Event.MetadataCommonReceived]: {
        title?: string;
        artist?: string;
    };
    [Event.AndroidConnectorConnected]: undefined;
    [Event.AndroidConnectorDisconnected]: undefined;
    [TrackPlayerEvents.QueueUpdated]: QueueUpdatedEvent;
};
export declare function addEventListener<T>(eventName: TrackPlayerEventName, listener: (event: T) => void): EmitterSubscription;
export declare function addTypedEventListener<E extends TrackPlayerEventName>(eventName: E, listener: (event: EventPayloadMap[E]) => void): EmitterSubscription;
export declare function removeAllEventListeners(eventName: TrackPlayerEventName): void;
export declare const AudioEvents: {
    addListener: typeof addEventListener;
    addTypedListener: typeof addTypedEventListener;
    removeAllListeners: typeof removeAllEventListeners;
};
//# sourceMappingURL=events.d.ts.map