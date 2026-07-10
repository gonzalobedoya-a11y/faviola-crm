import { redirect } from 'next/navigation';

/** Visitas se fusionó con la Agenda: un solo calendario. */
export default function VisitsRedirect(): never {
  redirect('/agenda');
}
