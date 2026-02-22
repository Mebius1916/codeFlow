export type AlgorithmOptions = {
  layoutGap: {
    override?: number;
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
    override?: number;
  };
};

const defaultOptions: AlgorithmOptions = {
  layoutGap: {
    override: undefined,
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
    override: undefined,
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
  };
}

export function getDefaultOptions(): AlgorithmOptions {
  return { ...defaultOptions };
}
