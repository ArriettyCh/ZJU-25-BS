import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import exifr from 'exifr';

// 上传图片
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    const userId = req.userId!;
    const file = req.file;

    // 获取图片尺寸
    let width: number | null = null;
    let height: number | null = null;
    try {
      const metadata = await sharp(file.path).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
    } catch (error) {
      console.error('获取图片尺寸失败:', error);
    }

    // 提取EXIF信息
    let exifData = null;
    try {
      exifData = await exifr.parse(file.path, {
        pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model', 'Orientation']
      });
    } catch (error) {
      console.log('EXIF提取失败（可能图片没有EXIF信息）');
    }

    // 生成缩略图
    const thumbnailPath = path.join(path.dirname(file.path), 'thumbnails', file.filename);
    try {
      await sharp(file.path)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .toFile(thumbnailPath);
    } catch (error) {
      console.error('缩略图生成失败:', error);
    }

    // 保存到数据库
    const image = await prisma.image.create({
      data: {
        userId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        width,
        height,
        exifData: exifData ? JSON.parse(JSON.stringify(exifData)) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '图片上传成功',
      data: image
    });
  } catch (error: any) {
    console.error('上传错误:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败：' + error.message
    });
  }
};

// 获取图片列表
export const getImages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          exifData: true,
          customTags: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.image.count({ where: { userId } })
    ]);

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('获取图片列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取图片列表失败'
    });
  }
};

// 获取单张图片信息
export const getImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const imageId = parseInt(req.params.id);

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        userId
      }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    res.json({
      success: true,
      data: image
    });
  } catch (error: any) {
    console.error('获取图片错误:', error);
    res.status(500).json({
      success: false,
      message: '获取图片失败'
    });
  }
};

// 删除图片
export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const imageId = parseInt(req.params.id);

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        userId
      }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 删除文件
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, image.filename);
    const thumbnailPath = path.join(uploadDir, 'thumbnails', image.filename);

    [filePath, thumbnailPath].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (error) {
          console.error('删除文件失败:', file, error);
        }
      }
    });

    // 删除数据库记录
    await prisma.image.delete({
      where: { id: imageId }
    });

    res.json({
      success: true,
      message: '图片删除成功'
    });
  } catch (error: any) {
    console.error('删除图片错误:', error);
    res.status(500).json({
      success: false,
      message: '删除图片失败'
    });
  }
};

// 更新图片标签
export const updateImageTags = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const imageId = parseInt(req.params.id);
    const { customTags } = req.body;

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        userId
      }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: {
        customTags: customTags || null
      }
    });

    res.json({
      success: true,
      message: '标签更新成功',
      data: updatedImage
    });
  } catch (error: any) {
    console.error('更新标签错误:', error);
    res.status(500).json({
      success: false,
      message: '更新标签失败'
    });
  }
};

