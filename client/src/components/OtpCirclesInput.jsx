import React, { useRef, useEffect } from 'react';

/**
 * OtpCirclesInput
 * Renders 4-6 distinct round circular inputs, each holding exactly one digit.
 * Supports auto-advance, backspace navigation, arrow keys, and clipboard pasting.
 *
 * @param {Object} props
 * @param {number} props.length - Total circles (default: 6)
 * @param {string} props.value - Current combined string (e.g. "123456")
 * @param {Function} props.onChange - Called with updated string on any digit change
 * @param {Function} props.onComplete - Optional callback when all digits are filled
 * @param {boolean} props.disabled - Disables inputs
 * @param {boolean} props.autoFocus - Auto-focuses the first circle on mount
 * @param {boolean} props.hasError - Shows error state
 */
export function OtpCirclesInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  hasError = false,
}) {
  const inputRefs = useRef([]);

  // Ensure digits array matches length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleInputChange = (e, index) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleanDigit = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    const combined = newDigits.join('');

    if (onChange) {
      onChange(combined);
    }

    // Auto-advance to next circle if a digit was entered
    if (cleanDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    // Fire onComplete if all circles filled
    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current is already empty, jump to previous circle and clear it
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        const combined = newDigits.join('');
        if (onChange) onChange(combined);
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index]) {
        // Clear current circle
        const newDigits = [...digits];
        newDigits[index] = '';
        const combined = newDigits.join('');
        if (onChange) onChange(combined);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numericDigits = pastedText.replace(/\D/g, '').slice(0, length);
    if (!numericDigits) return;

    if (onChange) {
      onChange(numericDigits);
    }

    // Focus the appropriate circle (either next unfilled or the last filled)
    const nextIndex = Math.min(numericDigits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    if (numericDigits.length === length && onComplete) {
      onComplete(numericDigits);
    }
  };

  const filledCount = digits.filter(Boolean).length;
  const isComplete = filledCount === length;

  return (
    <div className="otp-circles-wrapper" style={{ margin: '14px 0 20px 0' }}>
      <div
        className="otp-circles-row"
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}
      >
        {Array.from({ length }).map((_, index) => {
          const isFilled = Boolean(digits[index]);
          return (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              value={digits[index]}
              disabled={disabled}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${index + 1} of ${length}`}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%', // Round circle shape
                textAlign: 'center',
                fontSize: '19px',
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', 'Inter', monospace",
                border: hasError
                  ? '2px solid #EF4444'
                  : isFilled
                  ? '2px solid #10B981'
                  : '2px solid #CBD5E1',
                backgroundColor: hasError
                  ? '#FEF2F2'
                  : isFilled
                  ? '#ECFDF5'
                  : '#FFFFFF',
                color: hasError ? '#B91C1C' : isFilled ? '#065F46' : '#0F172A',
                boxShadow: isFilled
                  ? '0 3px 10px rgba(16, 185, 129, 0.2), inset 0 1px 2px rgba(16, 185, 129, 0.1)'
                  : '0 2px 5px rgba(0, 0, 0, 0.04)',
                outline: 'none',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: disabled ? 'not-allowed' : 'text',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isFilled) {
                  e.currentTarget.style.borderColor = '#0D9488';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && document.activeElement !== e.currentTarget && !isFilled) {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0D9488';
                e.currentTarget.style.boxShadow =
                  '0 0 0 4px rgba(13, 148, 136, 0.2), 0 4px 12px rgba(13, 148, 136, 0.15)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                if (isFilled) {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.2)';
                } else {
                  e.currentTarget.style.borderColor = hasError ? '#EF4444' : '#CBD5E1';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.04)';
                }
              }}
            />
          );
        })}
      </div>

      {/* Subtle indicator under the circles */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 10,
          minHeight: 18,
          fontSize: 11,
          fontWeight: 600,
          color: isComplete ? '#059669' : '#64748B',
        }}
      >
        {isComplete ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            Code complete
          </span>
        ) : filledCount > 0 ? (
          <span>{`${filledCount} of ${length} digits entered`}</span>
        ) : null}
      </div>
    </div>
  );
}

export default OtpCirclesInput;
