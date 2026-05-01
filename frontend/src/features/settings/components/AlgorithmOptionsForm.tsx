import type { AlgorithmOptions } from '@collaborative-editor/design2code'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'

export function AlgorithmOptionsForm({
  value,
  enabled,
  onEnabledChange,
  onChange,
}: {
  value: AlgorithmOptions
  enabled: boolean
  onEnabledChange: (next: boolean) => void
  onChange: (next: AlgorithmOptions) => void
}) {
  return (
    <div className="pt-4 border-t border-[#2A2F4C] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-[#E5E7EB] text-sm leading-5 font-medium uppercase tracking-[0.07em] font-['Inter']">
          Algorithm Options
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>layoutGap.minGap</Label>
          <Input
            type="number"
            value={value.layoutGap.minGap ?? ''}
            disabled={!enabled}
            onChange={(e) => {
              const next = e.target.value === '' ? undefined : Number(e.target.value)
              onChange({ ...value, layoutGap: { ...value.layoutGap, minGap: next } })
            }}
          />
        </div>

      <div className="flex flex-col gap-1.5">
        <Label>listPattern.maxGapStep</Label>
        <Input
          type="number"
          value={value.listPattern.maxGapStep}
          disabled={!enabled}
          onChange={(e) => {
            if (e.target.value === '') return
            onChange({ ...value, listPattern: { ...value.listPattern, maxGapStep: Number(e.target.value) } })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>reparenting.partlyContainThreshold</Label>
        <Input
          type="number"
          step="0.01"
          value={value.reparenting.partlyContainThreshold}
          disabled={!enabled}
          onChange={(e) => {
            if (e.target.value === '') return
            onChange({
              ...value,
              reparenting: { ...value.reparenting, partlyContainThreshold: Number(e.target.value) },
            })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>reparenting.absoluteOverlapThreshold</Label>
        <Input
          type="number"
          value={value.reparenting.absoluteOverlapThreshold}
          disabled={!enabled}
          onChange={(e) => {
            if (e.target.value === '') return
            onChange({
              ...value,
              reparenting: { ...value.reparenting, absoluteOverlapThreshold: Number(e.target.value) },
            })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>spatialMerging.threshold</Label>
        <Input
          type="number"
          value={value.spatialMerging.threshold}
          disabled={!enabled}
          onChange={(e) => {
            if (e.target.value === '') return
            onChange({ ...value, spatialMerging: { ...value.spatialMerging, threshold: Number(e.target.value) } })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>spatialMerging.distance</Label>
        <Input
          type="number"
          value={value.spatialMerging.distance}
          disabled={!enabled}
          onChange={(e) => {
            if (e.target.value === '') return
            onChange({ ...value, spatialMerging: { ...value.spatialMerging, distance: Number(e.target.value) } })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>adjacencyThreshold.min</Label>
        <Input
          type="number"
          value={value.adjacencyThreshold.min ?? ''}
          disabled={!enabled}
          onChange={(e) => {
            const next = e.target.value === '' ? undefined : Number(e.target.value)
            onChange({ ...value, adjacencyThreshold: { ...value.adjacencyThreshold, min: next } })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>adjacencyThreshold.max</Label>
        <Input
          type="number"
          value={value.adjacencyThreshold.max ?? ''}
          disabled={!enabled}
          onChange={(e) => {
            const next = e.target.value === '' ? undefined : Number(e.target.value)
            onChange({ ...value, adjacencyThreshold: { ...value.adjacencyThreshold, max: next } })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>iconDetection.minSize</Label>
        <Input
          type="number"
          value={value.iconDetection.minSize}
          disabled={!enabled}
          onChange={(e) => {
            if (e.target.value === '') return
            onChange({ ...value, iconDetection: { ...value.iconDetection, minSize: Number(e.target.value) } })
          }}
        />
      </div>

        <div className="flex flex-col gap-1.5">
          <Label>iconDetection.maxSize</Label>
          <Input
            type="number"
            value={value.iconDetection.maxSize}
            disabled={!enabled}
            onChange={(e) => {
              if (e.target.value === '') return
              onChange({ ...value, iconDetection: { ...value.iconDetection, maxSize: Number(e.target.value) } })
            }}
          />
        </div>
      </div>
    </div>
  )
}
