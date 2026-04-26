import { useState } from 'react';
import './ImageResult.css';

interface ImageResultProps {
  imageUrl: string;
  onDownload: (filename: string) => void;
}

export function ImageResult({ imageUrl, onDownload }: ImageResultProps) {
  const [filename, setFilename] = useState('graduation-invitation');

  const handleDownload = () => {
    onDownload(filename || 'design');
  };

  return (
    <div className="image-result">
      <img src={imageUrl} alt="Generated design" className="result-image" />
      <div className="download-section">
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Filename"
          className="filename-input"
        />
        <button className="download-button" onClick={handleDownload}>
          Download PNG
        </button>
      </div>
    </div>
  );
}
