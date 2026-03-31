import { useState } from 'react';
import { getDefaultOptions, setOptions } from '@collaborative-editor/design2code';
import type { AlgorithmOptions } from '@collaborative-editor/design2code';
import { useUiStore } from '@collaborative-editor/shared';
import { clearSessionAssetPathMap, getSessionAssetPathMap } from '../utils/figma/assets-map';
import { fetchFigmaData, parseFigmaUrl, safeCodegen, safeExtractDesign } from '../utils/figma/url';

export interface FigmaParseResult {
  assets_path_map: Map<string, string>;
  codegen_result: {
    html: string;
    body: string;
    css: string;
    size?: { width: number; height: number };
  } | null;
}

export type FigmaUrlParserState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: FigmaParseResult }
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
    clearSessionAssetPathMap();

    try {
      setOptions(getDefaultOptions());
      if (storedAlgorithmOptions && Object.keys(storedAlgorithmOptions).length) {
        setOptions(storedAlgorithmOptions as Partial<AlgorithmOptions>);
      }
      if (algorithmOptions) {
        setOptions(algorithmOptions);
      }
      const { fileKey, dataApiUrl } = parseFigmaUrl(inputUrl);

      const figmaData = await fetchFigmaData(dataApiUrl, token);

      // 2. 调用 D2C Engine 进行转换
      const simplifiedDesign = await safeExtractDesign({ figmaData, fileKey, token });
      if (!simplifiedDesign) {
        throw new Error('Figma 解析失败');
      }

      // 3. 调用 Codegen 生成代码
      const codegenResult = safeCodegen(simplifiedDesign);
      if (!codegenResult) {
        throw new Error('Codegen 失败');
      }

      const assetsPathMap = getSessionAssetPathMap();

      const result: FigmaParseResult = {
        assets_path_map: assetsPathMap,
        codegen_result: codegenResult
      };

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
