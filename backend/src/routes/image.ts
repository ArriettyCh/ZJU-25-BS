import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImage, getImages, getImage, deleteImage, updateImageTags } from '../controllers/imageController.js';
import { upload } from '../middleware/upload.js';

export const imageRouter = Router();

// 所有图片路由都需要认证
imageRouter.use(authenticateToken);

// 上传图片
imageRouter.post('/upload', upload.single('image'), uploadImage);

// 获取图片列表
imageRouter.get('/', getImages);

// 更新图片标签
imageRouter.patch('/:id/tags', updateImageTags);

// 获取单张图片信息
imageRouter.get('/:id', getImage);

// 删除图片
imageRouter.delete('/:id', deleteImage);

