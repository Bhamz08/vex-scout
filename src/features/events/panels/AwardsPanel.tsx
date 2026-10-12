import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { useEventAwards } from '@/data/queries';
import type { VexEvent } from '@/data/types';
import { AwardsList } from '@/features/awards/AwardsList';

export function AwardsPanel({ event }: { event: VexEvent }) {
  const awardsQ = useEventAwards(event.id);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LastUpdated result={awardsQ.data} onRefresh={() => void awardsQ.refetch()} isFetching={awardsQ.isFetching} />
      </div>
      <QueryView query={awardsQ}>{(awards) => <AwardsList awards={awards} showTeams />}</QueryView>
    </div>
  );
}
