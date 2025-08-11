



export enum Force {
  BLUE = 'BLUE',
  RED = 'RED',
}

export enum EntityType {
  AIR = 'AIR',
  LAND = 'LAND',
  SEA = 'SEA',
  SPACE = 'SPACE',
  CYBER = 'CYBER',
  SAM = 'SAM', // Surface-to-Air Missile
}

// --- Units for Conversion ---
export type SpeedUnit = 'kmh' | 'kn';
export type DistanceUnit = 'km' | 'nm';
export type AltitudeUnit = 'ft' | 'm';
export type FrequencyUnit = 'MHz' | 'GHz';

// An object to hold a value and its associated unit for flexible input.
export interface SystemUnit<T extends string> {
  value?: number;
  unit: T;
}

// --- New Interfaces for Attachable Systems ---

export type SensorType = 'Radar' | 'Sonar' | 'IRST' | 'SIGINT' | 'ESM' | 'Other';
export const SENSOR_TYPES: SensorType[] = ['Radar', 'Sonar', 'IRST', 'SIGINT', 'ESM', 'Other'];

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  range: SystemUnit<DistanceUnit>;
  fieldOfView?: number; // In degrees, 360 for omni-directional
  requiresNetwork?: boolean;
  // Radar-specific
  frequency?: { min?: number, max?: number, unit: FrequencyUnit };
  powerWatts?: number;
  // IRST-specific
  sensitivity?: SystemUnit<'W/sr'>;
}

export type WeaponType = 'Missile' | 'Gun' | 'Torpedo' | 'Bomb' | 'Other';
export const WEAPON_TYPES: WeaponType[] = ['Missile', 'Gun', 'Torpedo', 'Bomb', 'Other'];

export type GuidanceType = 'Active Radar' | 'Semi-Active Radar' | 'Infrared' | 'GPS' | 'INS' | 'Laser' | 'Unguided' | 'Other';
export const GUIDANCE_TYPES: GuidanceType[] = ['Active Radar', 'Semi-Active Radar', 'Infrared', 'GPS', 'INS', 'Laser', 'Unguided', 'Other'];

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  maxQuantity?: number;
  range: SystemUnit<DistanceUnit>;
  guidance?: GuidanceType;
  probabilityOfHit?: number; // Value between 0.0 and 1.0
  requiresNetwork?: boolean;
}

export type EWType = 'Jammer' | 'Chaff/Flares' | 'Decoy' | 'Other';
export const EW_TYPES: EWType[] = ['Jammer', 'Chaff/Flares', 'Decoy', 'Other'];
export interface EWSystem {
    id: string;
    name: string;
    type: EWType;
    effectiveRange?: SystemUnit<DistanceUnit>;
}

export interface Datalink {
  id:string;
  name: string;
  range: number; // in km
}

export interface Signature {
    rcs?: number; // Radar Cross Section in m^2
    infrared?: number; // Infrared signature in W/sr
    acoustic?: number; // Acoustic signature in dB
}

// --- Refactored BaseEntity ---
export interface BaseEntity {
  name:string;
  force: Force;
  type: EntityType;
  icon: string;
  description?: string;
  
  // Datalinks this entity can provide.
  datalinks?: Datalink[];

  // Lists of attachable systems, allowing for complex loadouts.
  sensors: Sensor[];
  weapons: Weapon[];
  ewSystems?: EWSystem[];

  // Signature characteristics for detection modeling
  signature?: Signature;
  
  // --- Domain-Specific Platform Properties ---
  
  // Properties potentially shared across domains
  maxSpeed?: SystemUnit<SpeedUnit>;
  crew?: number;

  // Air-specific properties
  cruiseSpeed?: SystemUnit<SpeedUnit>;
  serviceCeiling?: SystemUnit<AltitudeUnit>;
  combatRadius?: SystemUnit<DistanceUnit>;
  
  // Land-specific properties
  operationalRange?: SystemUnit<DistanceUnit>;
  armorMm?: { front?: number; side?: number; rear?: number; top?: number };

  // Maritime-specific properties
  endurance?: SystemUnit<'days' | 'hours'>;
  maxDepth?: SystemUnit<AltitudeUnit>; // Primarily for submarines
  displacementTons?: number;
  
  // Space-specific properties
  orbitalAltitude?: SystemUnit<DistanceUnit>;

  // Cyber-specific properties
  bandwidth?: SystemUnit<'Mbps' | 'Gbps'>;
  effectiveRange?: SystemUnit<DistanceUnit>;
}


export interface LibraryEntity extends BaseEntity {
  id: string; // Unique ID in the library
}

export interface Group {
  id: string;
  entityIds: string[];
}

export interface PlacedEntity extends LibraryEntity {
  instanceId: string; // Unique ID on the map
  position: [number, number]; // [latitude, longitude]
  currentPosition?: [number, number];
  linkedTo?: {
    providerId: string;
    datalinkId: string;
  };
  isConnected?: boolean;
  waypoints?: [number, number][];
  movementTrail?: [number, number][];
  groupId?: string;
  movingState?: {
      path: [number, number][];
      progress: number;
      totalDistance: number;
      targetWaypointIndex: number;
      distanceTraveled?: number;
  } | null;
  isOutOfFuel?: boolean;
  systemsState: {
    weapons: {
      [id: string]: {
        currentQuantity: number;
      }
    }
  };
}

// --- Simulation Types ---

export interface TargetingState {
  launcherId: string;
  weapon: Weapon;
}

export interface Projectile {
  id: string;
  weapon: Weapon;
  launcherId: string;
  targetId?: string; // For homing on a moving target
  startPosition: [number, number];
  targetPosition: [number, number];
  currentPosition: [number, number];
  startTime: number;
  rotation: number;
  willHit: boolean;
  trail: [number, number][]; // For visualizing smoke trail
}

export interface ImpactEffect {
  type: 'impact';
  position: [number, number];
}

export interface FizzleEffect {
  type: 'fizzle';
  position: [number, number];
}

export interface TracerEffect {
    type: 'tracer';
    startPosition: [number, number];
    endPosition: [number, number];
}

export type Effect = {
  id: string;
  startTime: number;
} & (ImpactEffect | FizzleEffect | TracerEffect);

// --- Mission Engineering Types ---
export interface SystemInvolvement {
  entityId: string;
  entityName: string;
  systemId: string; // The unique ID of the sensor/weapon itself
  systemName: string;
  entityIcon: string;
  isCritical: boolean; // Is this a single point of failure for this step?
}

export type MissionStepStatus = 'PENDING' | 'SUCCESS' | 'FAIL' | 'UNAVAILABLE';

export interface MissionStep {
  type: 'DETECT' | 'TARGET' | 'ENGAGE';
  systems: SystemInvolvement[];
  status: MissionStepStatus;
  probabilityOfSuccess?: number; // For ENGAGE steps, a value from 0 to 1
  estimatedTimeSeconds?: number;
  resourcesExpended?: { name: string, quantity: number }[];
}

export interface MissionThread {
  id: string;
  name: string;
  threatId: string;
  threatName: string;
  threatIcon: string;
  steps: MissionStep[];
}
