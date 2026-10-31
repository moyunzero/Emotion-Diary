import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import PostSaveRitualOverlay from '../../components/rituals/PostSaveRitualOverlay';
import Record from '../../components/Record';
import { useStopAudioOnTabBlur } from '../../hooks/useStopAudioOnTabBlur';

export default function RecordTab() {
  useStopAudioOnTabBlur();
  const router = useRouter();
  const [ritualVisible, setRitualVisible] = useState(false);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Create success: stay on Write Tab; show post-save ritual (D-06 / D-12 / D-16).
  // Edit path never mounts this overlay (EditEntryModal elsewhere).
  const handleSuccess = useCallback(() => {
    setRitualVisible(true);
  }, []);

  const handleRitualDismiss = useCallback(() => {
    setRitualVisible(false);
  }, []);

  return (
    <>
      <Record onClose={handleClose} onSuccess={handleSuccess} />
      <PostSaveRitualOverlay
        visible={ritualVisible}
        onDismiss={handleRitualDismiss}
      />
    </>
  );
}
