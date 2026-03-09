import { useState, useCallback } from 'react';
import { extractFigmaAsJSON, setOptions, codegen } from '@collaborative-editor/design2code';
import type { SimplifiedDesign, AlgorithmOptions } from '@collaborative-editor/design2code';
import { frontendFetcher } from '../utils/url-cache';
import { clearSessionPathMap, getSessionPathMap } from '../utils/path-map';
import type { GetFileResponse, GetFileNodesResponse } from '@figma/rest-api-spec';

export interface FigmaParseResult {
  data_api_url: string;
  image_api_url: string;
  figma_data: GetFileResponse | GetFileNodesResponse; // 原始 API 响应
  simplified_design: SimplifiedDesign | null; // D2C 解析后的简化结构
  assets_path_map: Map<string, string>;
  codegen_result: {
    html: string;
    css: string;
    assets: Map<string, string>;
    size?: { width: number; height: number };
  } | null;
}

export function useFigmaUrlParser() {
  const [url, setUrl] = useState('');
  const [parseResult, setParseResult] = useState<FigmaParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parse = useCallback(async (inputUrl: string, algorithmOptions?: Partial<AlgorithmOptions>) => {
    if (!inputUrl) {
      setError('请输入 figma url');
      return null;
    }

    setIsLoading(true);
    setError(null);
    clearSessionPathMap();

    try {
      // 如果传入了算法配置，则更新引擎
      if (algorithmOptions) {
        setOptions(algorithmOptions);
      }
      
      const parsed = new URL(inputUrl);
      
      // 提取 File Key
      const pathMatch = parsed.pathname.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
      if (!pathMatch) {
        throw new Error('无法从链接中提取 File Key，请检查链接格式');
      }
      const fileKey = pathMatch[1];

      // 提取并处理 Node ID
      const nodeId = parsed.searchParams.get('node-id');
      if (!nodeId) {
        throw new Error('链接中缺少 node-id 参数，请选中一个 Frame 后再复制链接');
      }

      // 格式标准化：横杠转冒号
      const realNodeId = nodeId.replace(/-/g, ':');
      
      // URL 编码
      const encodedNodeId = encodeURIComponent(realNodeId);

      // 组装 API 地址
      const dataApiUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodedNodeId}`;
      const imageApiUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${encodedNodeId}&scale=2&format=png`;

      // 获取 Token
      const token = import.meta.env.VITE_FIGMA_TOKEN;
      if (!token || token === 'your_token_here') {
        console.warn('Figma Token 未设置，请在 .env 文件中配置 VITE_FIGMA_TOKEN');
      }

      // 1. 发起原始数据请求 (使用缓存层)
      // 注意：虽然 jsonCache.get(inputUrl) 没命中，但 dataApiUrl 可能命中
      const resp = await fetch(dataApiUrl, {
        headers: { 'X-Figma-Token': token || '' }
      });
      
      if (!resp.ok) {
        throw new Error(`Failed to fetch Figma data: ${resp.status} ${resp.statusText}`);
      }
      
    const figmaData = await resp.json() as GetFileResponse | GetFileNodesResponse;
      // 要提取 body
      console.log('Figma Raw Data:', figmaData);

      // 2. 调用 D2C Engine 进行转换
      let simplifiedDesign: SimplifiedDesign | null = null;
      try {
        simplifiedDesign = await extractFigmaAsJSON(figmaData, {
          fileKey,
          token: token || '',
          scale: 2,
          format: 'png',
          fetcher: frontendFetcher
        });
        console.log('D2C Simplified Design:', simplifiedDesign);
      } catch (extractErr) {
        console.error('D2C Extraction Failed:', extractErr);
      }

      // 3. 调用 Codegen 生成代码
      let codegenResult = null;
      if (simplifiedDesign) {
        try {
          const res = codegen(simplifiedDesign);
          codegenResult = {
            html: res.html,
            css: res.css,
            assets: res.assets,
            size: res.size
          };
          console.log('Codegen Success:', codegenResult);
        } catch (codegenErr) {
          console.error('Codegen Failed:', codegenErr);
        }
      }

      const assetsPathMap = getSessionPathMap();

      const result: FigmaParseResult = {
        data_api_url: dataApiUrl,
        image_api_url: imageApiUrl,
        figma_data: figmaData,
        simplified_design: simplifiedDesign,
        assets_path_map: assetsPathMap,
        codegen_result: codegenResult
      };

      setParseResult(result);
      return result;
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : '链接格式无效，请输入完整的 Figma URL';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    url,
    setUrl,
    parseResult,
    error,
    isLoading,
    parse,
    clearError
  };
}
