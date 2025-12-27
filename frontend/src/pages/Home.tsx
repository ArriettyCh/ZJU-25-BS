import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import ImageUpload from '../components/ImageUpload';
import ImageList from '../components/ImageList';

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // 检查认证状态
    const { checkAuth } = useAuthStore.getState();
    checkAuth();
  }, []);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1); // 触发ImageList刷新
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>欢迎, {user?.username}!</h1>
      
      <div style={{ marginTop: '20px' }}>
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
        <ImageList key={refreshKey} />
      </div>
    </div>
  );
}

