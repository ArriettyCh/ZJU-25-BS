import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import ImageEditor from '../components/ImageEditor';
import './ImageDetail.css';

interface ImageData {
  id: number;
  filename: string;
  originalName: string;
  width: number | null;
  height: number | null;
  size: string;
  exifData: any;
  customTags: string | null;
  createdAt: string;
}

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [image, setImage] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editMode, setEditMode] = useState<'crop' | 'adjust' | null>(null);

  useEffect(() => {
    fetchImage();
  }, [id, token]);

  const fetchImage = async () => {
    if (!token || !id) return;

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/images/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const img = response.data.data;
      setImage({
        ...img,
        size: formatFileSize(Number(img.size))
      });
    } catch (err: any) {
      setError('加载图片失败：' + (err.response?.data?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return <div className="image-detail-loading">加载中...</div>;
  }

  if (error || !image) {
    return (
      <div className="image-detail-error">
        {error || '图片不存在'}
        <button onClick={() => navigate('/')} className="back-button">返回</button>
      </div>
    );
  }

  return (
    <div className="image-detail">
      <div className="image-detail-header">
        <button className="back-button" onClick={() => navigate('/')}>← 返回</button>
        <h1>{image.originalName}</h1>
        <div className="image-detail-actions">
          <button 
            className="action-btn" 
            onClick={() => {
              setEditMode('crop');
              setShowEditor(true);
            }}
          >
            裁剪
          </button>
          <button 
            className="action-btn" 
            onClick={() => {
              setEditMode('adjust');
              setShowEditor(true);
            }}
          >
            调色
          </button>
        </div>
      </div>

      <div className="image-detail-content">
        <div className="image-display">
          <img
            src={`http://localhost:3001/uploads/${image.filename}`}
            alt={image.originalName}
            className="main-image"
          />
        </div>

        <div className="image-info-panel">
          <div className="info-section">
            <h3>基本信息</h3>
            <div className="info-item">
              <span className="info-label">文件名：</span>
              <span className="info-value">{image.originalName}</span>
            </div>
            {image.width && image.height && (
              <div className="info-item">
                <span className="info-label">尺寸：</span>
                <span className="info-value">{image.width} × {image.height} 像素</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">文件大小：</span>
              <span className="info-value">{image.size}</span>
            </div>
            <div className="info-item">
              <span className="info-label">上传时间：</span>
              <span className="info-value">{formatDate(image.createdAt)}</span>
            </div>
          </div>

          {image.exifData && (
            <div className="info-section">
              <h3>EXIF 信息</h3>
              {image.exifData.DateTimeOriginal && (
                <div className="info-item">
                  <span className="info-label">拍摄时间：</span>
                  <span className="info-value">
                    {new Date(image.exifData.DateTimeOriginal).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
              {image.exifData.Make && (
                <div className="info-item">
                  <span className="info-label">设备品牌：</span>
                  <span className="info-value">{image.exifData.Make}</span>
                </div>
              )}
              {image.exifData.Model && (
                <div className="info-item">
                  <span className="info-label">设备型号：</span>
                  <span className="info-value">{image.exifData.Model}</span>
                </div>
              )}
              {image.exifData.GPSLatitude && image.exifData.GPSLongitude && (
                <div className="info-item">
                  <span className="info-label">拍摄位置：</span>
                  <span className="info-value">
                    {image.exifData.GPSLatitude.toFixed(6)}, {image.exifData.GPSLongitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          )}

          {image.customTags && (
            <div className="info-section">
              <h3>自定义标签</h3>
              <div className="tags-display">
                {image.customTags.split(',').map((tag, index) => (
                  <span key={index} className="tag-item">{tag.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditor && image && (
        <ImageEditor
          imageUrl={`http://localhost:3001/uploads/${image.filename}`}
          imageId={image.id}
          mode={editMode!}
          onClose={() => {
            setShowEditor(false);
            setEditMode(null);
          }}
          onSave={() => {
            setShowEditor(false);
            setEditMode(null);
            fetchImage();
          }}
        />
      )}
    </div>
  );
}

