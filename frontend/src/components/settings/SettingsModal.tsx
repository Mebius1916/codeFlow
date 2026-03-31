import settingIconUrl from '../../../assets/Setting.svg';
import { useEffect, useState } from 'react';
import { Link2, KeyRound, X } from 'lucide-react';
import { useUiStore } from '@collaborative-editor/shared';
import { getDefaultOptions, type AlgorithmOptions } from '@collaborative-editor/design2code';
import { Button } from '../ui/button';
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { AlgorithmOptionsForm } from './AlgorithmOptionsForm';

export function WorkspaceSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    modelApiEndpoint,
    modelApiKey,
    aiEnhance,
    figmaToken,
    algorithmOptions,
    setModelApiEndpoint,
    setModelApiKey,
    setAiEnhance,
    setFigmaToken,
    setAlgorithmOptions,
  } = useUiStore(
    (state) => ({
      modelApiEndpoint: state.modelApiEndpoint,
      modelApiKey: state.modelApiKey,
      aiEnhance: state.aiEnhance,
      figmaToken: state.figmaToken,
      algorithmOptions: state.algorithmOptions,
      setModelApiEndpoint: state.setModelApiEndpoint,
      setModelApiKey: state.setModelApiKey,
      setAiEnhance: state.setAiEnhance,
      setFigmaToken: state.setFigmaToken,
      setAlgorithmOptions: state.setAlgorithmOptions,
    }),
  );

  const [framework, setFramework] = useState('HTML + CSS');
  const [stylingSystem, setStylingSystem] = useState('CSS');
  const [apiEndpoint, setApiEndpoint] = useState(modelApiEndpoint);
  const [apiKey, setApiKey] = useState(modelApiKey);
  const [aiEnhanceDraft, setAiEnhanceDraft] = useState(aiEnhance);
  const [figmaTokenDraft, setFigmaTokenDraft] = useState(figmaToken);
  const [algorithmOptionsEnabled, setAlgorithmOptionsEnabled] = useState(false);
  const [algorithmOptionsDraft, setAlgorithmOptionsDraft] = useState<AlgorithmOptions>(() => {
    return Object.keys(algorithmOptions).length ? (algorithmOptions as unknown as AlgorithmOptions) : getDefaultOptions();
  });

  useEffect(() => {
    if (!open) return;
    setApiEndpoint(modelApiEndpoint);
    setApiKey(modelApiKey);
    setAiEnhanceDraft(aiEnhance);
    setFigmaTokenDraft(figmaToken);
    setAlgorithmOptionsEnabled(false);
    setAlgorithmOptionsDraft(
      Object.keys(algorithmOptions).length ? (algorithmOptions as unknown as AlgorithmOptions) : getDefaultOptions(),
    );
  }, [aiEnhance, algorithmOptions, figmaToken, modelApiEndpoint, modelApiKey, open]);

  const handleSave = () => {
    setModelApiEndpoint(apiEndpoint);
    setModelApiKey(apiKey);
    setAiEnhance(aiEnhanceDraft);
    setFigmaToken(figmaTokenDraft);
    setAlgorithmOptions(
      algorithmOptionsEnabled ? (algorithmOptionsDraft as unknown as Record<string, unknown>) : {},
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="h-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <img src={settingIconUrl} alt="" className="w-5 h-5" style={{ filter: 'brightness(0) invert(0.7)' }} />
            <DialogTitle>Workspace Settings</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4 text-[#9CA3AF]" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-3">
            <div className="text-[#E5E7EB] text-sm leading-5 font-medium uppercase tracking-[0.07em] font-['Inter']">
              Preset Options
            </div>
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label>Framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HTML + CSS">HTML + CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <Label>Styling System</Label>
                <Select value={stylingSystem} onValueChange={setStylingSystem}>
                  <SelectTrigger disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSS">CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-[#E5E7EB] text-sm leading-5 font-medium uppercase tracking-[0.07em] font-['Inter']">
              Figma
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Figma Token</Label>
              <Input
                type="password"
                value={figmaTokenDraft}
                onChange={(e) => setFigmaTokenDraft(e.target.value)}
                placeholder="figd_..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-[#E5E7EB] text-sm leading-5 font-medium uppercase tracking-[0.07em] font-['Inter']">
              Model API Configuration
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Model API Endpoint URL</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                  <Input
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="https://your-llm-api.example/v1"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Model API Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                  <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>
          </div>

          <AlgorithmOptionsForm
            value={algorithmOptionsDraft}
            enabled={algorithmOptionsEnabled}
            onEnabledChange={setAlgorithmOptionsEnabled}
            onChange={setAlgorithmOptionsDraft}
          />
          <div className="pt-4 border-t border-[#2A2F4C] flex flex-col gap-4">
            <div className="text-[#E5E7EB] text-sm leading-5 font-medium uppercase tracking-[0.07em] font-['Inter']">
              AI Features
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-[#D1D5DB] text-sm leading-5 font-medium font-['Inter']">AI Enhance</div>
                <div className="px-1.5 py-0.5 rounded bg-gradient-to-r from-[#9333EA] to-[#4F46E5] shadow-sm text-white text-[10px] leading-[15px] font-bold font-['Inter']">
                  BETA
                </div>
              </div>
              <Switch checked={aiEnhanceDraft} onCheckedChange={setAiEnhanceDraft} />
            </div>
            <div className="text-[#9CA3AF] text-[11px] leading-[16.5px] font-normal font-['Inter']">
              Automatically refactor and optimize generated code using our advanced AI models.
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
