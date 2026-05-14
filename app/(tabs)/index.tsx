import Dashboard from '../../components/Dashboard';
import { useStopAudioOnTabBlur } from '../../hooks/useStopAudioOnTabBlur';

export default function DashboardTab() {
  useStopAudioOnTabBlur();
  return <Dashboard />;
}
