import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './TagModal.css';

interface TagModalProps {
  imageId: number;
  currentTags: string;
  onClose: () => void;
  onSave: () => void;
}

export default function TagModal({ imageId, currentTags, onClose, onSave }: TagModalProps) {
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    setTags(currentTags || '');
  }, [currentTags]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.patch(
        `http://localhost:3001/api/images/${imageId}/tags`,
        { customTags: tags.trim() || null },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      onSave();
    } catch (error: any) {
      alert('保存标签失败：' + (error.response?.data?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tag-modal-overlay" onClick={onClose}>
      <div className="tag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tag-modal-header">
          <h3>设置标签</h3>
          <button className="tag-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="tag-modal-body">
          <label>自定义标签（用逗号分隔）</label>
          <textarea
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：风景, 旅行, 2024"
            rows={4}
          />
        </div>
        <div className="tag-modal-footer">
          <button className="tag-button-cancel" onClick={onClose}>取消</button>
          <button className="tag-button-save" onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

