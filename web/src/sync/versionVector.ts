export type VersionVector = Record<string, number>;

export function incrementVector(
    vector: VersionVector | undefined,
    deviceId: string
): VersionVector {
    const v = { ...(vector ?? {}) };
    v[deviceId] = (v[deviceId] ?? 0) + 1;
    return v;
}

export type VectorComparison = "local-dominates" | "remote-dominates" | "concurrent" | "equal";

// Compare two version vectors
export function compareVectors(local: VersionVector, remote: VersionVector): VectorComparison {
    let localGreater = false;
    let remoteGreater = false;

    const allDevices = new Set([...Object.keys(local), ...Object.keys(remote)]);
    for (const d of allDevices) {
        const lv = local[d] ?? 0;
        const rv = remote[d] ?? 0;

        if (lv > rv) localGreater = true;
        if (rv > lv) remoteGreater = true;
    }

    if (!localGreater && !remoteGreater) return "equal";
    if (localGreater && !remoteGreater) return "local-dominates";
    if (remoteGreater && !localGreater) return "remote-dominates";

    return "concurrent";
}
