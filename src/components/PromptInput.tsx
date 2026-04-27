import { useRef, useEffect, useState } from 'react';
import { Send, Bot } from 'lucide-react';
import type { ModelId, ModelInfo } from '../services/api';
import './PromptInput.css';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  docked: boolean;
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  models: ModelInfo[];
}

export function PromptInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled, 
  docked,
  selectedModel,
  onModelChange,
  models
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const baseHeightRef = useRef<number | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (baseHeightRef.current == null) {
      const styles = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      const paddingTop = Number.parseFloat(styles.paddingTop);
      const paddingBottom = Number.parseFloat(styles.paddingBottom);

      const safeLineHeight = Number.isFinite(lineHeight) ? lineHeight : 24;
      const safePaddingTop = Number.isFinite(paddingTop) ? paddingTop : 0;
      const safePaddingBottom = Number.isFinite(paddingBottom) ? paddingBottom : 0;

      baseHeightRef.current = safeLineHeight + safePaddingTop + safePaddingBottom;
    }

    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${nextHeight}px`;
    setIsExpanded(nextHeight > (baseHeightRef.current ?? 36) + 2);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  const showButton = value.trim().length > 0;

  return (
    <div className={`prompt-wrapper ${docked ? 'docked' : 'centered'}`}>
      <div className={`prompt-box ${isExpanded ? 'expanded' : ''}`}>
        {/* Model picker button */}
        <div className="model-picker-wrapper">
          <button
            className="model-btn"
            onClick={() => setShowModelPicker(v => !v)}
            aria-label="Select model"
          >
            <Bot size={20} />
          </button>
          {showModelPicker && (
            <div className="model-dropdown">
              {Object.entries(
                models.reduce((acc, model) => {
                  if (!acc[model.provider]) acc[model.provider] = [];
                  acc[model.provider].push(model);
                  return acc;
                }, {} as Record<string, ModelInfo[]>)
              ).map(([provider, providerModels]) => (
                <div key={provider} className="model-group">
                  <div className="model-group-label">{provider}</div>
                  {providerModels.map((model) => (
                    <button
                      key={model.id}
                      className={`model-option ${selectedModel === model.id ? 'active' : ''}`}
                      onClick={() => {
                        onModelChange(model.id);
                        setShowModelPicker(false);
                      }}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

        </div>

        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="design anything..."
          disabled={disabled}
          rows={1}
        />
        <button
          className={`send-btn ${showButton ? 'visible' : ''}`}
          onClick={onSubmit}
          disabled={disabled || !showButton}
          aria-label="Generate design"
        >
          <Send size={18} />
        </button>
      </div>
      {!docked && (
        <div className={`generate-hint ${showButton ? 'visible' : ''}`}>
          Press Enter or click send to generate
        </div>
      )}
    </div>
  );
}
