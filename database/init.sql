-- 数据库初始化脚本
-- 如果使用docker-compose，这个脚本会自动执行

CREATE DATABASE IF NOT EXISTS image_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE image_manager;

-- Prisma会自动管理表结构，这里只创建数据库

