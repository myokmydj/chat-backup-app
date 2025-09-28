// 파일: src/components/CustomSlider.js (새 파일)

import React, { useRef, useEffect } from 'react';

const CustomSlider = ({ min, max, step, value, onChange, ...props }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const updateSliderProgress = () => {
      if (inputRef.current) {
        const range = parseFloat(max) - parseFloat(min);
        const progress = (parseFloat(value) - parseFloat(min)) / range;
        const percentage = progress * 100;
        inputRef.current.style.setProperty('--slider-progress', `${percentage}%`);
      }
    };
    updateSliderProgress();
  }, [value, min, max]);

  return (
    <input
      ref={inputRef}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

export default CustomSlider;