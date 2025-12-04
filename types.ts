
export enum AppState {
  IDLE = 'IDLE',
  INCOMING_CALL = 'INCOMING_CALL',
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
  GAME = 'GAME' // State for when the game overlay is active
}

export interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number; // For petal orientation
}

export interface CallerIdentity {
  id: string;
  name: string;
  type: 'DOCTOR' | 'EARTH' | 'VIP' | 'VILLAIN' | 'LEGACY';
  voiceName: string;
  scenarios?: string[]; // Pool of possible plots
  currentScenario?: string; // The selected plot for this specific call
  adventure?: string; // Specific plot for Doctor or Weird Events
  initialImage?: string; // Base64 image data if the user initiated call with a photo
  customPersona?: string; // User-defined personality/context
}

export interface HistoryItem {
  role: 'user' | 'model';
  text: string;
}
