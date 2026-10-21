import { viewRun } from '@/flow/runs';
import { currentStore } from '@/store/visitor';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = viewRun((await currentStore()).read(), id);
  return view ? Response.json(view) : Response.json({ error: 'Not found' }, { status: 404 });
}
