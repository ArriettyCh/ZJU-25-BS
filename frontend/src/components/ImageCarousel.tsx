import { useState, useEffect } from 'react';
import './ImageCarousel.css';

interface Image {
  id: number;
  filename: string;
  originalName: string;
}

interface ImageCarouselProps {
  images: Image[];
  onClose: () => void;
}

export default function ImageCarousel({ images, onClose }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div className="carousel-overlay" onClick={onClose}>
      <div className="carousel-container" onClick={(e) => e.stopPropagation()}>
        <button className="carousel-close" onClick={onClose}>×</button>
        <button className="carousel-nav carousel-prev" onClick={handlePrevious}>
          ‹
        </button>
        <div className="carousel-image-wrapper">
          <img
            src={`http://localhost:3001/uploads/${currentImage.filename}`}
            alt={currentImage.originalName}
            className="carousel-image"
          />
        </div>
        <button className="carousel-nav carousel-next" onClick={handleNext}>
          ›
        </button>
        <div className="carousel-info">
          <span>{currentIndex + 1} / {images.length}</span>
          <span className="carousel-filename">{currentImage.originalName}</span>
        </div>
      </div>
    </div>
  );
}

