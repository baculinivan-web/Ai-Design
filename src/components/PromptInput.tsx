import { useRef, useEffect, useState } from 'react';
import { Send, Bot } from 'lucide-react';
import type { ModelId } from '../services/api';
import { FREE_MODELS } from '../services/api';
import './PromptInput.css';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  docked: boolean;
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
}

export function PromptInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled, 
  docked,
  selectedModel,
  onModelChange 
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
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
      <div className="prompt-box">
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
              {FREE_MODELS.map((model) => (
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
