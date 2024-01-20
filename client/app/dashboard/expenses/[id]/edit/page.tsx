import Form from '@/app/ui/expenses/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchExpenseById, getSessionUser } from '@/app/lib/data';
import { notFound } from 'next/navigation'
 
export default async function Page({ params }: { params: { id: string } }) {
    const id = params.id;
    const expense = await fetchExpenseById(id);
    const user = await getSessionUser();

      if ( !expense) {
        notFound();
      }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Expenses', href: '/dashboard/expenses' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/expenses/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form expense={expense} user_id={user?.rows[0].id} />
    </main>
  );
}