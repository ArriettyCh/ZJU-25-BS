import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './ImageEditor.css';

interface ImageEditorProps {
  imageUrl: string;
  imageId: number;
  mode: 'crop' | 'adjust';
  onClose: () => void;
  onSave: () => void;
}

export default function ImageEditor({ imageUrl, imageId, mode, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
  });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const { token } = useAuthStore();

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        drawImage();
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);

    if (mode === 'adjust') {
      applyAdjustments(ctx, canvas);
    } else if (mode === 'crop' && cropArea.width > 0 && cropArea.height > 0) {
      drawCropOverlay(ctx, canvas);
    }
  };

  const applyAdjustments = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Brightness
      data[i] = Math.min(255, data[i] * (adjustments.brightness / 100));
      data[i + 1] = Math.min(255, data[i + 1] * (adjustments.brightness / 100));
      data[i + 2] = Math.min(255, data[i + 2] * (adjustments.brightness / 100));

      // Contrast
      const factor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));

      // Saturation
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const sat = adjustments.saturation / 100;
      data[i] = Math.min(255, gray + sat * (data[i] - gray));
      data[i + 1] = Math.min(255, gray + sat * (data[i + 1] - gray));
      data[i + 2] = Math.min(255, gray + sat * (data[i + 2] - gray));
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const drawCropOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 清除裁剪区域
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(imageRef.current!, cropArea.x, cropArea.y, cropArea.width, cropArea.height, cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // 绘制裁剪框
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
  };

  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [imageLoaded, adjustments, cropArea, mode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'crop') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsCropping(true);
    setStartPos({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || mode !== 'crop') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropArea({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    setIsCropping(false);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('image', blob, `edited-${imageId}.png`);

        // 这里应该调用更新图片的API，暂时先提示
        alert('编辑功能已实现，保存功能需要后端支持图片更新API');
        onSave();
      }, 'image/png');
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleCrop = () => {
    if (!canvasRef.current || !imageRef.current || cropArea.width === 0 || cropArea.height === 0) {
      alert('请先选择裁剪区域');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 创建新canvas用于裁剪后的图片
    const newCanvas = document.createElement('canvas');
    newCanvas.width = cropArea.width;
    newCanvas.height = cropArea.height;
    const newCtx = newCanvas.getContext('2d');
    if (!newCtx) return;

    newCtx.drawImage(
      imageRef.current,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    // 更新主canvas
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    ctx.drawImage(newCanvas, 0, 0);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
  };

  return (
    <div className="image-editor-overlay">
      <div className="image-editor">
        <div className="editor-header">
          <h3>{mode === 'crop' ? '图片裁剪' : '图片调色'}</h3>
          <button className="editor-close" onClick={onClose}>×</button>
        </div>

        <div className="editor-content">
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ maxWidth: '100%', maxHeight: '70vh', cursor: mode === 'crop' ? 'crosshair' : 'default' }}
            />
          </div>

          {mode === 'adjust' && (
            <div className="adjust-controls">
              <div className="control-item">
                <label>亮度</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.brightness}
                  onChange={(e) => setAdjustments({ ...adjustments, brightness: parseInt(e.target.value) })}
                />
                <span>{adjustments.brightness}%</span>
              </div>
              <div className="control-item">
                <label>对比度</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.contrast}
                  onChange={(e) => setAdjustments({ ...adjustments, contrast: parseInt(e.target.value) })}
                />
                <span>{adjustments.contrast}%</span>
              </div>
              <div className="control-item">
                <label>饱和度</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.saturation}
                  onChange={(e) => setAdjustments({ ...adjustments, saturation: parseInt(e.target.value) })}
                />
                <span>{adjustments.saturation}%</span>
              </div>
              <button className="reset-button" onClick={() => setAdjustments({ brightness: 100, contrast: 100, saturation: 100, hue: 0 })}>
                重置
              </button>
            </div>
          )}

          {mode === 'crop' && (
            <div className="crop-controls">
              <button className="crop-button" onClick={handleCrop}>应用裁剪</button>
              <button className="reset-button" onClick={() => {
                setCropArea({ x: 0, y: 0, width: 0, height: 0 });
                if (imageRef.current && canvasRef.current) {
                  canvasRef.current.width = imageRef.current.width;
                  canvasRef.current.height = imageRef.current.height;
                  drawImage();
                }
              }}>重置</button>
            </div>
          )}
        </div>

        <div className="editor-footer">
          <button className="editor-button cancel" onClick={onClose}>取消</button>
          <button className="editor-button save" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}

