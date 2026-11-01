import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * System Reduce Motion (D-14): canonical AccessibilityInfo listener for decorative gates.
 * No in-app toggle — follows iOS/Android accessibility setting only.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        /* ignore */
      });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
