"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface AssetWeightInputProps {
  ticker: string;
  name?: string;
  assetClass?: string;
  weight: number;
  onChange: (weight: number) => void;
  onRemove: () => void;
}

export function AssetWeightInput({ ticker, name, assetClass, weight, onChange, onRemove }: AssetWeightInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 100) val = 100;
    onChange(val);
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border border-border bg-muted/20 rounded-xl relative group hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold">{ticker}</span>
          {assetClass && <Badge variant="outline" className="text-xs text-muted-foreground">{assetClass}</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {name && <span className="text-xs text-muted-foreground -mt-3 block">{name}</span>}
      
      <div className="flex items-center gap-4">
        <Slider 
          value={[weight]} 
          max={100} 
          step={1} 
          onValueChange={(vals) => onChange(vals[0])}
          className="flex-1"
        />
        <div className="relative w-20">
          <Input 
            type="number" 
            value={weight} 
            onChange={handleInputChange} 
            className="pr-6 bg-transparent border-border text-right font-bold"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">%</span>
        </div>
      </div>
    </div>
  );
}
