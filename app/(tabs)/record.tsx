import { useRouter } from 'expo-router';
import Record from '../../components/Record';
import { useStopAudioOnTabBlur } from '../../hooks/useStopAudioOnTabBlur';

export default function RecordTab() {
  useStopAudioOnTabBlur();
  const router = useRouter();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Plan 04: post-save ritual overlay hooks here (D-06 / D-12).
  // Create success stays on Write Tab — no Toast, no home replace.
  const handleSuccess = () => {};

  return <Record onClose={handleClose} onSuccess={handleSuccess} />;
}
