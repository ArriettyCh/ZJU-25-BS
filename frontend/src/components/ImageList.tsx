import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import ImageCarousel from './ImageCarousel';
import TagModal from './TagModal';
import './ImageList.css';

interface Image {
  id: number;
  filename: string;
  originalName: string;
  width: number | null;
  height: number | null;
  size: string;
  createdAt: string;
  customTags?: string | null;
}

export default function ImageList() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [showCarousel, setShowCarousel] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagImageId, setTagImageId] = useState<number | null>(null);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const fetchImages = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.get('http://localhost:3001/api/images', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setImages(response.data.data.images.map((img: any) => ({
        ...img,
        size: formatFileSize(Number(img.size))
      })));
    } catch (err: any) {
      setError('加载图片列表失败：' + (err.response?.data?.message || '未知错误'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这张图片吗？')) return;

    try {
      await axios.delete(`http://localhost:3001/api/images/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchImages(); // 刷新列表
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err: any) {
      alert('删除失败：' + (err.response?.data?.message || '未知错误'));
    }
  };

  const handleToggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleViewDetail = (id: number) => {
    navigate(`/image/${id}`);
  };

  const handleCarousel = () => {
    if (selectedImages.size === 0) {
      alert('请先选择要轮播的图片');
      return;
    }
    setShowCarousel(true);
  };

  const handleSetTag = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagImageId(id);
    setShowTagModal(true);
  };

  const handleTagSaved = () => {
    fetchImages();
    setShowTagModal(false);
    setTagImageId(null);
  };

  if (loading) {
    return <div className="image-list-loading">加载中...</div>;
  }

  if (error) {
    return <div className="image-list-error">{error}</div>;
  }

  if (images.length === 0) {
    return <div className="image-list-empty">还没有上传任何图片，点击上方"上传图片"按钮开始上传</div>;
  }

  return (
    <>
      {selectedImages.size > 0 && (
        <div className="image-list-actions">
          <button className="action-button carousel-button" onClick={handleCarousel}>
            轮播查看 ({selectedImages.size})
          </button>
          <button 
            className="action-button clear-button" 
            onClick={() => setSelectedImages(new Set())}
          >
            取消选择
          </button>
        </div>
      )}
      
      <div className="image-list">
        {images.map(image => (
          <div 
            key={image.id} 
            className={`image-item ${selectedImages.has(image.id) ? 'selected' : ''}`}
            onClick={() => handleViewDetail(image.id)}
          >
            <div className="image-thumbnail">
              <img
                src={`http://localhost:3001/uploads/thumbnails/${image.filename}`}
                alt={image.originalName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `http://localhost:3001/uploads/${image.filename}`;
                }}
              />
              {selectedImages.has(image.id) && (
                <div className="select-indicator">✓</div>
              )}
            </div>
            <div className="image-actions">
              <button
                className="icon-button select-button"
                onClick={(e) => handleToggleSelect(image.id, e)}
                title={selectedImages.has(image.id) ? '取消选择' : '选择'}
              >
                {selectedImages.has(image.id) ? '✓' : '○'}
              </button>
              <button
                className="icon-button tag-button"
                onClick={(e) => handleSetTag(image.id, e)}
                title="设置标签"
              >
                🏷️
              </button>
              <button
                className="icon-button delete-button"
                onClick={(e) => handleDelete(image.id, e)}
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCarousel && (
        <ImageCarousel
          images={images.filter(img => selectedImages.has(img.id))}
          onClose={() => setShowCarousel(false)}
        />
      )}

      {showTagModal && tagImageId && (
        <TagModal
          imageId={tagImageId}
          currentTags={images.find(img => img.id === tagImageId)?.customTags || ''}
          onClose={() => {
            setShowTagModal(false);
            setTagImageId(null);
          }}
          onSave={handleTagSaved}
        />
      )}
    </>
  );
}

