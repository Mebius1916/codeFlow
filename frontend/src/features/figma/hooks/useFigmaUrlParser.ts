import { useState } from 'react';
import type { AlgorithmOptions } from '@codify/design2code';
import { useUiStore } from '@/features/workspace/store/uiStore';
import { convertFigma } from '../services/figma';
import type { FigmaConvertResult } from '../interfaces/model';

type FigmaUrlParserState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: FigmaConvertResult }
  | { status: 'error'; error: string };

export function useFigmaUrlParser() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<FigmaUrlParserState>({ status: 'idle' });
  const { figmaToken, algorithmOptions: storedAlgorithmOptions } = useUiStore((s) => ({
    figmaToken: s.figmaToken,
    algorithmOptions: s.algorithmOptions,
  }));

  const parse = async (inputUrl: string, algorithmOptions?: Partial<AlgorithmOptions>) => {
    if (!inputUrl) {
      setState({ status: 'error', error: '请输入 figma url' });
      return null;
    }

    const token = figmaToken.trim();
    if (!token) {
      setState({ status: 'error', error: '请先在 Settings 填写 Figma Token' });
      return null;
    }

    setState({ status: 'loading' });

    try {
      const result = await convertFigma({
        figmaUrl: inputUrl,
        token,
        algorithmOptions: (algorithmOptions || storedAlgorithmOptions) as Partial<AlgorithmOptions> | undefined,
      });
      setState({ status: 'success', data: result });
      return result;
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : '链接格式无效，请输入完整的 Figma URL';
      setState({ status: 'error', error: errorMsg });
      return null;
    }
  };

  const clearError = () => {
    setState((prev) => (prev.status === 'error' ? { status: 'idle' } : prev));
  };

  return {
    url,
    setUrl,
    state,
    parse,
    clearError
  };
}
