

import type { PlacedEntity, SystemUnit, DistanceUnit, MissionThread, MissionStep, SystemInvolvement, Weapon, SpeedUnit } from '../types';
import { Force } from '../types';
import { calculateDistance, isEntityConnected } from './entityUtils';

const convertSystemUnitToKm = (unit: SystemUnit<DistanceUnit> | undefined): number => {
    if (!unit?.value) return 0;
    if (unit.unit === 'nm') return unit.value * 1.852;
    return unit.value;
}

const WEAPON_SPEEDS_KPS: Record<string, number> = {
    'Missile': 1, // 1 km/s = Mach ~3
    'Torpedo': 0.1, // 100 m/s
    'Bomb': 0.3, // airdropped
    'Gun': 1.5, // Muzzle velocity
    'Default': 1,
};

// Generates a unique ID for a system on a placed entity.
const getSystemInstanceId = (entityId: string, systemId: string) => `${entityId}::${systemId}`;

// --- CORE ANALYSIS LOGIC ---
export function analyzeScenario(entities: PlacedEntity[], disabledSystemIds: Set<string>): MissionThread[] {
    const missionThreads: MissionThread[] = [];
    const blueForces = entities.filter(e => e.force === Force.BLUE);
    const redForces = entities.filter(e => e.force === Force.RED);
    const entityMap = new Map(entities.map(e => [e.instanceId, e]));

    for (const threat of redForces) {
        const threatPosition = threat.currentPosition || threat.position;

        // 1. Find all potential detectors, targeters, and engagers
        const potentialDetectors: SystemInvolvement[] = [];
        for (const blue of blueForces) {
            const bluePosition = blue.currentPosition || blue.position;
            for (const sensor of blue.sensors) {
                const sensorRangeKm = convertSystemUnitToKm(sensor.range);
                // A sensor that requires a network cannot be a primary detector for other units.
                if (!sensor.requiresNetwork && sensorRangeKm > 0 && calculateDistance(bluePosition, threatPosition) <= sensorRangeKm) {
                    potentialDetectors.push({
                        entityId: blue.instanceId,
                        entityName: blue.name,
                        systemId: getSystemInstanceId(blue.instanceId, sensor.id),
                        systemName: sensor.name,
                        entityIcon: blue.icon,
                        isCritical: false, // will be determined later
                    });
                }
            }
        }
        
        // This is the new logic: create a thread even if only detection is possible.
        if (potentialDetectors.length === 0) continue;
        
        const uniqueKey = (sys: SystemInvolvement) => sys.systemId;
        const uniqueDetectors = [...new Map(potentialDetectors.map(item => [uniqueKey(item), item])).values()];
        
        const activeDetectors = uniqueDetectors.filter(s => !disabledSystemIds.has(s.systemId));
        if (potentialDetectors.length === 1 && activeDetectors.length === 1) activeDetectors[0].isCritical = true;

        const detectStep: MissionStep = { type: 'DETECT', systems: activeDetectors, status: 'PENDING' };
        if (activeDetectors.length === 0) detectStep.status = 'FAIL';


        // 2. Find targeters and engagers based on the potential detectors
        const potentialEngagers: { system: SystemInvolvement; weapon: Weapon, distance: number }[] = [];
        const potentialTargeters: SystemInvolvement[] = [];

        for (const shooter of blueForces) {
            const shooterPosition = shooter.currentPosition || shooter.position;
            for (const weapon of shooter.weapons) {
                const ammoState = shooter.systemsState?.weapons?.[weapon.id];
                if (!ammoState || ammoState.currentQuantity <= 0) {
                    continue; // Out of ammo
                }

                const distanceToTarget = calculateDistance(shooterPosition, threatPosition);
                const weaponRangeKm = convertSystemUnitToKm(weapon.range);
                if (distanceToTarget > weaponRangeKm) continue;

                let hasTargetingSolution = false;
                
                // Option A: Self-target (only if weapon does NOT require network)
                if (!weapon.requiresNetwork) {
                    const selfSensors = shooter.sensors.filter(s => {
                        if (disabledSystemIds.has(getSystemInstanceId(shooter.instanceId, s.id))) return false;
                        return calculateDistance(shooterPosition, threatPosition) <= convertSystemUnitToKm(s.range);
                    });

                    if (selfSensors.length > 0) {
                        hasTargetingSolution = true;
                        selfSensors.forEach(s => potentialTargeters.push({
                            entityId: shooter.instanceId, entityName: shooter.name, systemName: s.name, entityIcon: shooter.icon,
                            systemId: getSystemInstanceId(shooter.instanceId, s.id), isCritical: false
                        }));
                    }
                }

                // Option B: Datalinked target
                const activeDetectorProviders = activeDetectors
                    .map(d => entityMap.get(d.entityId))
                    .filter((p): p is PlacedEntity => !!p && p.instanceId !== shooter.instanceId);
                
                for (const provider of activeDetectorProviders) {
                    if (isEntityConnected(shooter, provider, disabledSystemIds)) {
                         hasTargetingSolution = true;
                         // Find sensors on the provider that are active and can see the target
                         const providerSensors = provider.sensors.filter(s => {
                            if(disabledSystemIds.has(getSystemInstanceId(provider.instanceId, s.id))) return false;
                            // A sensor that requires a network can only consume data, not provide it.
                            if (s.requiresNetwork) return false;
                            const sensorRangeKm = convertSystemUnitToKm(s.range);
                            return sensorRangeKm > 0 && calculateDistance(provider.currentPosition || provider.position, threatPosition) <= sensorRangeKm;
                         });

                         providerSensors.forEach(s => potentialTargeters.push({
                             entityId: provider.instanceId, entityName: provider.name, systemName: s.name, entityIcon: provider.icon,
                             systemId: getSystemInstanceId(provider.instanceId, s.id), isCritical: false
                         }));
                    }
                }

                if (hasTargetingSolution) {
                    potentialEngagers.push({
                        distance: distanceToTarget,
                        weapon,
                        system: {
                            entityId: shooter.instanceId, entityName: shooter.name, systemName: weapon.name, entityIcon: shooter.icon,
                            systemId: getSystemInstanceId(shooter.instanceId, weapon.id), isCritical: false
                        },
                    });
                }
            }
        }
        
        const uniqueTargeters = [...new Map(potentialTargeters.map(item => [uniqueKey(item), item])).values()];
        const uniqueEngagers = [...new Map(potentialEngagers.map(item => [uniqueKey(item.system), item])).values()];

        const activeTargeters = uniqueTargeters.filter(s => !disabledSystemIds.has(s.systemId));
        if (potentialTargeters.length === 1 && activeTargeters.length === 1) activeTargeters[0].isCritical = true;

        const activeEngagers = uniqueEngagers.filter(s => !disabledSystemIds.has(s.system.systemId));
        if (potentialEngagers.length === 1 && activeEngagers.length === 1) activeEngagers[0].system.isCritical = true;


        const targetStep: MissionStep = { type: 'TARGET', systems: activeTargeters, status: 'PENDING' };
        const engageStep: MissionStep = { type: 'ENGAGE', systems: activeEngagers.map(e => e.system), status: 'PENDING' };
        
        if (detectStep.status === 'FAIL' || activeTargeters.length === 0) {
            targetStep.status = 'UNAVAILABLE';
        }
        if (targetStep.status !== 'PENDING' || activeEngagers.length === 0) {
            engageStep.status = 'UNAVAILABLE';
        }

        // 5. Calculate success probability and other metrics
        if (engageStep.status === 'PENDING') {
            const probabilitiesOfMissing = activeEngagers.map(e => 1 - (e.weapon.probabilityOfHit || 0));
            const combinedProbabilityOfMissing = probabilitiesOfMissing.reduce((acc, p) => acc * p, 1);
            engageStep.probabilityOfSuccess = 1 - combinedProbabilityOfMissing;

            const fastestWeapon = activeEngagers.reduce((fastest, current) => {
                const fastestSpeed = WEAPON_SPEEDS_KPS[fastest.weapon.type] || WEAPON_SPEEDS_KPS.Default;
                const currentSpeed = WEAPON_SPEEDS_KPS[current.weapon.type] || WEAPON_SPEEDS_KPS.Default;
                return currentSpeed > fastestSpeed ? current : fastest;
            });
            const speedKps = WEAPON_SPEEDS_KPS[fastestWeapon.weapon.type] || WEAPON_SPEEDS_KPS.Default;
            engageStep.estimatedTimeSeconds = fastestWeapon.distance / speedKps;
            
            engageStep.resourcesExpended = activeEngagers.map(e => ({ name: e.weapon.name, quantity: 1 }));
        }

        missionThreads.push({
            id: `thread-${threat.instanceId}`,
            name: `Intercept ${threat.name}`,
            threatId: threat.instanceId,
            threatName: threat.name,
            threatIcon: threat.icon,
            steps: [detectStep, targetStep, engageStep],
        });
    }

    return missionThreads;
}
