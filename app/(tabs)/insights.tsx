import Insights from '../../components/Insights';
import { useStopAudioOnTabBlur } from '../../hooks/useStopAudioOnTabBlur';

export default function InsightsTab() {
  useStopAudioOnTabBlur();
  return <Insights />;
}
