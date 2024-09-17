import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import RecipientsBadge from './RecipientsBadge';

interface RecipientsDisplayProps {
  recipients: string[];
}

interface RecipientsTooltipProps {
  recipients: string[];
  ref: React.RefObject<HTMLDialogElement>;
}

const RecipientsTooltip: React.FC<RecipientsTooltipProps> = ({ recipients, ref }) => {
  return createPortal(
    <dialog ref={ref} style={tooltipStyles}>
      {recipients.filter((_, index) => index > 0).join(', ')}
    </dialog>,
    document.body
  )
};

const RecipientsDisplay: React.FC<RecipientsDisplayProps> = ({ recipients }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDialogElement>(null);
  const [displayRecipients, setDisplayRecipients] = useState<string[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);

  useEffect(() => {
    const updateDisplayRecipients = () => {
      const container = containerRef.current;
      if (!container) return;

      let fittingRecipients: string[] = [];
      let hidden = 0;

      container.innerHTML = ''; // Clear content to measure
      let isClipped = false;

      // Special handling for the first recipient if it needs to be clipped
      const firstRecipientWidth = getTextWidth(recipients[0] + ',', container);
      if (firstRecipientWidth > container.clientWidth) {
        fittingRecipients = [recipients[0]];
        hidden = recipients.length - 1;
        setHiddenCount(hidden);
        setDisplayRecipients(fittingRecipients);
        return;
      }

      // Now handle fitting the rest of the recipients
      let accumulatedWidth = 0;
      for (let i = 0; i < recipients.length; i++) {
        const recipientText = i === 0 ? recipients[i] : `, ${recipients[i]}`;
        const textWidth = getTextWidth(recipientText, container);

        if (accumulatedWidth + textWidth > container.clientWidth) {
          isClipped = true;
          hidden = recipients.length - i;
          break;
        }

        accumulatedWidth += textWidth;
        fittingRecipients.push(recipients[i]);
      }

      setHiddenCount(isClipped ? hidden : 0);
      setDisplayRecipients(fittingRecipients);
    };

    updateDisplayRecipients();
    window.addEventListener('resize', updateDisplayRecipients);
    return () => window.removeEventListener('resize', updateDisplayRecipients);
  }, [recipients]);

  // Helper to calculate text width
  const getTextWidth = (text: string, container: HTMLElement) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const style = getComputedStyle(container);
    context.font = `${style.fontSize} ${style.fontFamily}`;
    return context.measureText(text).width;
  };

  // Handle tooltip display
  const showTooltip = () => {
    setIsTooltipVisible(true);
    tooltipRef.current?.showPopover();
  };

  const hideTooltip = () => {
    setIsTooltipVisible(false);
    tooltipRef.current?.close();
  };

  // Ensure the dialog element is correctly attached to the DOM
  useEffect(() => {
    if (!isTooltipVisible) return;
    if (tooltipRef.current) {
      document.body.appendChild(tooltipRef.current);
    }
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.close();
        document.body?.removeChild?.(tooltipRef.current);
      }
    };
  }, [isTooltipVisible]);

  return (
    <section style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <span>{displayRecipients.join(', ')}{hiddenCount > 0 && ', ...'}</span>
      <div style={{ display: 'flex', alignItems: 'center' }} ref={containerRef}>
        {hiddenCount > 0 && (
          <RecipientsBadge
            numTruncated={hiddenCount}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          />
        )}
        {isTooltipVisible && (
          <RecipientsTooltip recipients={recipients} ref={tooltipRef} />
        )}
      </div>
    </section>
  );
};

// Tooltip Styles
const tooltipStyles: React.CSSProperties = {
  position: 'fixed',
  top: '8px',
  right: '8px',
  left: 'unset',
  padding: '8px 16px',
  backgroundColor: '#666',
  color: '#f0f0f0',
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  zIndex: 1000,
  margin: 0, // Resets default dialog margins
};

export default RecipientsDisplay;
