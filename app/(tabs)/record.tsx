import { useRouter } from 'expo-router';
import { useState } from 'react';
import Record from '../../components/Record';
import { ToastManager } from '../../components/Toast';
import { useStopAudioOnTabBlur } from '../../hooks/useStopAudioOnTabBlur';
import { i18n } from '../../i18n';

export default function RecordTab() {
  useStopAudioOnTabBlur();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  const handleClose = () => {
    router.back();
  };

  const handleSuccess = () => {
    setToast({
      message: i18n.t('toasts.submitSuccess', { ns: 'record' }),
      type: 'success',
    });
  };

  return (
    <>
      <Record onClose={handleClose} onSuccess={handleSuccess} />
      <ToastManager toast={toast} onHide={() => setToast(null)} />
    </>
  );
}
