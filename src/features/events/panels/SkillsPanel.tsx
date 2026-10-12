import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { useEventSkills } from '@/data/queries';
import type { VexEvent } from '@/data/types';
import { EventSkillsTable } from '../EventSkillsTable';

export function SkillsPanel({ event }: { event: VexEvent }) {
  const skillsQ = useEventSkills(event.id);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LastUpdated result={skillsQ.data} onRefresh={() => void skillsQ.refetch()} isFetching={skillsQ.isFetching} />
      </div>
      <QueryView query={skillsQ}>{(skills) => <EventSkillsTable skills={skills} />}</QueryView>
    </div>
  );
}
