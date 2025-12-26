import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // 检查认证状态
    const { checkAuth } = useAuthStore.getState();
    checkAuth();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>欢迎, {user?.username}!</h1>
      <p>这是图片管理网站的主页。后续功能将在这里实现。</p>
      <div style={{ marginTop: '20px', padding: '20px', background: '#fff', borderRadius: '8px' }}>
        <h2>待实现功能：</h2>
        <ul style={{ marginTop: '10px', lineHeight: '1.8' }}>
          <li>图片上传</li>
          <li>EXIF信息提取</li>
          <li>图片标签管理</li>
          <li>图片查询和展示</li>
          <li>图片编辑功能</li>
          <li>AI图片分析</li>
        </ul>
      </div>
    </div>
  );
}

