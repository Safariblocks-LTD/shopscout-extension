import React from 'react';

interface ShopScoutLogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showText?: boolean;
}

const ShopScoutLogo: React.FC<ShopScoutLogoProps> = ({ 
  size = 'medium', 
  className = '', 
  showText = false 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-glow`}>
        <img 
          src="/assets/icons/shopscoutlogo128.png" 
          alt="ShopScout" 
          className="w-3/4 h-3/4 object-contain"
        />
      </div>
      {showText && (
        <div>
          <h1 className={`font-heading font-bold text-neutral-900 ${textSizeClasses[size]}`}>
            ShopScout
          </h1>
          <p className={`text-neutral-600 font-body ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            AI Shopping Assistant
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopScoutLogo;
