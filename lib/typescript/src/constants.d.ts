export declare const TrackTypes: {
    readonly Default: "default";
    readonly Dash: "dash";
    readonly Hls: "hls";
    readonly SmoothStreaming: "smoothstreaming";
};
export type TrackType = (typeof TrackTypes)[keyof typeof TrackTypes];
export declare const PitchAlgorithms: {
    readonly Linear: "linear";
    readonly Music: "music";
    readonly Voice: "voice";
};
export type PitchAlgorithm = (typeof PitchAlgorithms)[keyof typeof PitchAlgorithms];
export declare const State: Record<string, string>;
export type StateType = (typeof State)[keyof typeof State];
export declare const RepeatModes: {
    readonly Off: "off";
    readonly Track: "track";
    readonly Queue: "queue";
    readonly LoopPortion: "loop_portion";
};
export type RepeatModeType = (typeof RepeatModes)[keyof typeof RepeatModes];
//# sourceMappingURL=constants.d.ts.map