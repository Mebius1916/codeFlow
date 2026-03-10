import { useState, useCallback } from 'react';
import { setOptions } from '@collaborative-editor/design2code';
import type { AlgorithmOptions } from '@collaborative-editor/design2code';
import { clearSessionAssetUrlMap, getSessionAssetUrlMap } from '../utils/figma/assets-map';
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

  const parse = useCallback(async (inputUrl: string, algorithmOptions?: Partial<AlgorithmOptions>) => {
    if (!inputUrl) {
      setState({ status: 'error', error: '请输入 figma url' });
      return null;
    }

    setState({ status: 'loading' });
    clearSessionAssetUrlMap();

    try {
      // 如果传入了算法配置，则更新引擎
      if (algorithmOptions) {
        setOptions(algorithmOptions);
      }
      const { fileKey, dataApiUrl } = parseFigmaUrl(inputUrl);

      // 获取 Token
      const token = import.meta.env.VITE_FIGMA_TOKEN;
      const figmaData = await fetchFigmaData(dataApiUrl, token || '');

      // 2. 调用 D2C Engine 进行转换
      const simplifiedDesign = await safeExtractDesign({ figmaData, fileKey, token: token || '' });
      if (!simplifiedDesign) {
        throw new Error('Figma 解析失败');
      }

      // 3. 调用 Codegen 生成代码
      const codegenResult = safeCodegen(simplifiedDesign);
      if (!codegenResult) {
        throw new Error('Codegen 失败');
      }

      const assetsPathMap = getSessionAssetUrlMap();

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
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => (prev.status === 'error' ? { status: 'idle' } : prev));
  }, []);

  return {
    url,
    setUrl,
    state,
    parse,
    clearError
  };
}
