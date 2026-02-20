export const TrackTypes = {
  Default: 'default',
  Dash: 'dash',
  Hls: 'hls',
  SmoothStreaming: 'smoothstreaming',
} as const;

export type TrackType = (typeof TrackTypes)[keyof typeof TrackTypes];

export const PitchAlgorithms = {
  Linear: 'linear',
  Music: 'music',
  Voice: 'voice',
} as const;

export type PitchAlgorithm =
  (typeof PitchAlgorithms)[keyof typeof PitchAlgorithms];

export const State: Record<string, string> = {
  None: 'none',
  Ready: 'ready',
  Playing: 'playing',
  Paused: 'paused',
  Stopped: 'stopped',
  Loading: 'loading',
  Buffering: 'buffering',
  Error: 'error',
  Ended: 'ended',
} as const;

export type StateType = (typeof State)[keyof typeof State];

export const RepeatModes = {
  Off: 'off',
  Track: 'track',
  Queue: 'queue',
  LoopPortion: 'loop_portion',
} as const;

export type RepeatModeType = (typeof RepeatModes)[keyof typeof RepeatModes];
