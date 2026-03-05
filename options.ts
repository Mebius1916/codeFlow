export type AlgorithmOptions = {
  layoutGap: {
    minGap?: number;
  };
  reparenting: {
    partlyContainThreshold: number;
    absoluteOverlapThreshold: number;
  };
  spatialMerging: {
    threshold: number;
    distance: number;
  };
  listPattern: {
    maxGapStep: number;
  };
  adjacencyThreshold: {
    min?: number;
    max?: number;
  };
  iconDetection: {
    minSize: number;
    maxSize: number;
  };
};

const defaultOptions: AlgorithmOptions = {
  layoutGap: {
    minGap: 2,
  },
  reparenting: {
    partlyContainThreshold: 0.85,
    absoluteOverlapThreshold: -2,
  },
  spatialMerging: {
    threshold: 80,
    distance: 2,
  },
  listPattern: {
    maxGapStep: 4,
  },
  adjacencyThreshold: {
    min: 2,
    max: 24,
  },
  iconDetection: {
    minSize: 64,
    maxSize: 300,
  },
};

let currentOptions: AlgorithmOptions = { ...defaultOptions };

export function getOptions(): AlgorithmOptions {
  return currentOptions;
}

export function setOptions(next: Partial<AlgorithmOptions>): void {
  currentOptions = {
    ...currentOptions,
    layoutGap: {
      ...currentOptions.layoutGap,
      ...next.layoutGap,
    },
    reparenting: {
      ...currentOptions.reparenting,
      ...next.reparenting,
    },
    spatialMerging: {
      ...currentOptions.spatialMerging,
      ...next.spatialMerging,
    },
    listPattern: {
      ...currentOptions.listPattern,
      ...next.listPattern,
    },
    adjacencyThreshold: {
      ...currentOptions.adjacencyThreshold,
      ...next.adjacencyThreshold,
    },
    iconDetection: {
      ...currentOptions.iconDetection,
      ...next.iconDetection,
    },
  };
}

export function getDefaultOptions(): AlgorithmOptions {
  return { ...defaultOptions };
}
