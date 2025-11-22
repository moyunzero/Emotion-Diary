import { useRouter } from 'expo-router';
import Record from '../../components/Record';

export default function RecordTab() {
  const router = useRouter();

  const handleClose = () => {
    router.replace('/(tabs)/');
  };

  return <Record onClose={handleClose} />;
}
