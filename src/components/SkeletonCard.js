import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image pulse"></div>
      <div className="skeleton-title pulse"></div>
      <div className="skeleton-text pulse"></div>
      <div className="skeleton-price-row">
        <div className="skeleton-price pulse"></div>
        <div className="skeleton-btn pulse"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;